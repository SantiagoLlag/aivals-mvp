// Cálculo DETERMINISTA del encaje de cada candidato con el puesto, vertical por vertical.
// Sin IA: solo reordena y normaliza puntajes ya producidos (motor HUMAN, IA de AC/CV/Voz).
// El score global se calcula en el cliente con pesos ajustables -> ver globalEncaje().
import type { Process, Candidate } from "@/lib/types";
import type { Factor, FactorScores, ValueCode } from "@/lib/human/types";
import { competencyByKey } from "@/lib/ac/rubric";
import { voiceCompetencyByKey } from "@/lib/voice/rubric";
import { cvDimensionByKey } from "@/lib/cv/rubric";
import type {
  CandidateComparison, VerticalScore, CompetencyCell, Sem, VerticalKey, ReferenceMini,
} from "./types";

// ---- escalas / semáforo (una sola regla para todo el tablero) ----
// verde ≥ 70 · amarillo 45–69 · rojo < 45  (consistente con los charts del reporte)
export function semFromPct(p: number | null): Sem {
  if (p == null || Number.isNaN(p)) return "gris";
  if (p >= 70) return "verde";
  if (p >= 45) return "amarillo";
  return "rojo";
}
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const pct5 = (s: number) => ((Math.max(1, Math.min(5, s)) - 1) / 4) * 100; // 1-5 -> 0-100
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// ---- valores: el motor da códigos (T/E/A/S/P/R), el perfil ideal puede dar nombres ----
const VALUE_LABEL: Record<ValueCode, string> = {
  T: "Teórico", E: "Económico", A: "Estético", S: "Social", P: "Político", R: "Regulatorio",
};
const NAME_TO_CODE: Record<string, ValueCode> = {
  teorico: "T", "teórico": "T",
  economico: "E", "económico": "E",
  estetico: "A", "estético": "A",
  social: "S",
  politico: "P", "político": "P",
  regulatorio: "R",
};
function valueToCode(s: string): ValueCode | null {
  const n = s.toLowerCase().trim();
  if (["t", "e", "a", "s", "p", "r"].includes(n)) return n.toUpperCase() as ValueCode;
  return NAME_TO_CODE[n] ?? null;
}

// ---- HUMAN: encaje = (encaje DISC vs ideal + valores deseados presentes) / 2 ----
function humanVertical(cand: Candidate, ref?: Process["reference"]): VerticalScore {
  const base: VerticalScore = {
    key: "human", label: "HUMAN", available: false, pct: null, color: "gris", detail: [],
  };
  const r = cand.result;
  if (!r) return base;
  base.available = true;

  const detail: CompetencyCell[] = [];
  const parts: number[] = [];

  // 1) Encaje DISC vs perfil ideal del puesto
  const ideal = ref?.discIdeal;
  const candDisc: FactorScores = r.disc.profiles[r.disc.interpretedProfile];
  if (ideal) {
    const factors: Factor[] = ["D", "I", "S", "C"];
    const fits: number[] = [];
    const labels: string[] = [];
    for (const f of factors) {
      const iv = ideal[f];
      if (iv == null) continue;
      const cv = candDisc[f];
      fits.push(clamp(100 - Math.abs(cv - iv)));
      labels.push(`${f}: ${Math.round(cv)} vs ${Math.round(iv)}`);
    }
    if (fits.length) {
      const discFit = avg(fits);
      parts.push(discFit);
      detail.push({
        key: "disc_fit", name: "Encaje DISC vs. ideal", score: discFit, scale: "0-100",
        pct: discFit, color: semFromPct(discFit),
        note: `Perfil interpretado (${r.disc.interpretedProfile}) · ${labels.join(" · ")}`,
      });
    }
  }

  // 2) Valores deseados que el candidato tiene en nivel ALTO (≥ corte), deduplicados.
  // OJO: se mide contra el nivel ALTO real (valores.levels), no contra predominant —
  // predominant recorta a los 3 más altos y dejaría fuera valores ALTO genuinos.
  const desired = [...new Set((ref?.valoresDeseados ?? []).map(valueToCode).filter(Boolean) as ValueCode[])];
  if (desired.length) {
    const have = new Set((Object.keys(r.valores.levels) as ValueCode[]).filter((v) => r.valores.levels[v] === "ALTO"));
    const matched = desired.filter((c) => have.has(c));
    const valFit = (matched.length / desired.length) * 100;
    parts.push(valFit);
    detail.push({
      key: "valores_fit", name: "Valores deseados en nivel ALTO", score: valFit, scale: "0-100",
      pct: valFit, color: semFromPct(valFit),
      note: desired.map((c) => `${VALUE_LABEL[c]} ${have.has(c) ? "✓" : "—"}`).join(" · "),
    });
  }

  base.detail = detail;
  if (parts.length) {
    base.pct = avg(parts);
    base.color = semFromPct(base.pct);
  } else {
    base.note = "Test HUMAN completado, pero el puesto no tiene perfil de referencia: genera el Evaluador UNO para medir encaje.";
  }
  if (r.disc.notInterpretable) {
    base.note = `${base.note ? base.note + " " : ""}DISC no interpretable${r.disc.notInterpretableReason ? `: ${r.disc.notInterpretableReason}` : ""}.`;
  }
  return base;
}

// ---- AC / Voz: promedio de competencias 1-5 -> 0-100 ----
function rubricVertical(
  key: "ac" | "voz", label: string,
  scoring: { porCompetencia: { competency: string; score: number; evidence: string[]; rationale: string }[] } | undefined,
  nameOf: (k: string) => string,
): VerticalScore {
  const base: VerticalScore = { key, label, available: false, pct: null, color: "gris", detail: [] };
  if (!scoring?.porCompetencia?.length) return base;
  base.available = true;
  base.detail = scoring.porCompetencia.map((c) => ({
    key: c.competency, name: nameOf(c.competency), score: c.score, scale: "1-5" as const,
    pct: pct5(c.score), color: semFromPct(pct5(c.score)), evidence: c.evidence, note: c.rationale,
  }));
  base.pct = pct5(avg(scoring.porCompetencia.map((c) => c.score)));
  base.color = semFromPct(base.pct);
  return base;
}

// ---- CV: encaje = compatibilidad integrada con HUMAN (preferida) o evaluación aislada ----
function cvVertical(cand: Candidate): VerticalScore {
  const base: VerticalScore = { key: "cv", label: "CV / Evidencias", available: false, pct: null, color: "gris", detail: [] };
  const cv = cand.cv;
  if (!cv) return base;
  const iso = cv.isolated;
  const integ = cv.integrated;
  if (!iso && !integ) return base;
  base.available = true;
  base.detail = (iso?.dimensions ?? []).map((d) => ({
    key: d.key, name: cvDimensionByKey(d.key)?.name ?? d.key, score: d.score, scale: "1-5" as const,
    pct: pct5(d.score), color: semFromPct(pct5(d.score)), evidence: d.evidence, note: d.note,
  }));
  const pct = integ?.compatibilidad?.score ?? iso?.overall ?? null;
  base.pct = pct == null ? null : clamp(pct);
  base.color = semFromPct(base.pct);
  base.note = integ
    ? `Compatibilidad integrada con HUMAN: ${Math.round(integ.compatibilidad.score)}/100`
    : iso ? `Evaluación aislada (aún sin triangular con HUMAN): ${Math.round(iso.overall)}/100` : undefined;
  return base;
}

// ---- entrada principal: una fila por candidato ----
export function compareCandidates(process: Process): CandidateComparison[] {
  return process.candidates.map((c) => {
    const verticals: Record<VerticalKey, VerticalScore> = {
      human: humanVertical(c, process.reference),
      ac: rubricVertical("ac", "Assessment Center", c.acResult?.calificacion, (k) => competencyByKey(k)?.name ?? k),
      cv: cvVertical(c),
      voz: rubricVertical("voz", "Role-play por voz", c.voiceResult?.calificacion, (k) => voiceCompetencyByKey(k)?.name ?? k),
    };
    const completeness = (Object.values(verticals) as VerticalScore[]).filter((v) => v.pct != null).length;
    return { id: c.id, name: c.name, token: c.token, status: c.status, verticals, completeness, human: c.result ?? null };
  });
}

export function referenceMini(process: Process): ReferenceMini {
  const ref = process.reference;
  if (!ref || ref.source !== "ai") return { hasReference: false };
  return {
    hasReference: true,
    discIdeal: ref.discIdeal, valoresDeseados: ref.valoresDeseados,
    estiloPensamiento: ref.estiloPensamiento, resumen: ref.resumen,
  };
}

// ---- score global ponderado (se usa en el cliente; pesos ajustables) ----
export const VERTICAL_KEYS: VerticalKey[] = ["human", "ac", "cv", "voz"];
export const DEFAULT_WEIGHTS: Record<VerticalKey, number> = { human: 25, ac: 25, cv: 25, voz: 25 };

// Promedia las verticales con encaje medible, ponderando por los pesos del psicólogo y
// renormalizando sobre lo disponible (no penaliza con 0 una vertical que el candidato no hizo).
export function globalEncaje(c: CandidateComparison, weights: Record<VerticalKey, number>): number | null {
  let num = 0, den = 0;
  for (const k of VERTICAL_KEYS) {
    const v = c.verticals[k];
    if (v.pct == null) continue;
    const w = weights[k] ?? 0;
    num += w * v.pct;
    den += w;
  }
  return den === 0 ? null : num / den;
}
