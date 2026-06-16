// Evaluador de Evidencias (CV): evaluación AISLADA y evaluación INTEGRADA con HUMAN.
import { ask, aiEnabled } from "@/lib/ai";
import { CV_DIMENSIONS } from "./rubric";
import { factsBlock } from "@/lib/human/interpret";
import type { HumanResult } from "@/lib/human/types";
import type { CvIsolatedEval, CvIntegratedEval } from "./types";

// Parser tolerante: el modelo a veces deja saltos de línea sin escapar dentro de los strings.
export function extractJson(s: string): any | null {
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  const slice = s.slice(a, b + 1);
  try { return JSON.parse(slice); } catch { /* reintenta limpiando control chars */ }
  let cleaned = "";
  for (let i = 0; i < slice.length; i++) {
    cleaned += slice.charCodeAt(i) < 32 ? " " : slice[i];
  }
  try { return JSON.parse(cleaned); } catch { return null; }
}

function weightedOverall(dims: { key: string; score: number }[]): number {
  let total = 0;
  for (const d of CV_DIMENSIONS) {
    const s = dims.find((x) => x.key === d.key)?.score ?? 3;
    total += (Math.max(1, Math.min(5, s)) / 5) * 100 * (d.weight / 100);
  }
  return Math.round(total);
}

// ----------------------------------------------------------------- AISLADA
const ISO_SYSTEM = `Eres un evaluador de evidencias senior (psicólogo organizacional / reclutador). Evalúas un CV
SIEMPRE en relación con el puesto y la empresa de referencia. Usas una rúbrica de 6 dimensiones, cada una
de 1 a 5. Citas evidencia textual del CV. No inventas: si un dato no está, dilo y baja el puntaje; marca
faltantes vs. requisitos en "flags". Eres insumo para el psicólogo, no un veredicto.
Responde SOLO con JSON válido (sin fences, sin saltos de línea dentro de los valores de texto):
{
  "dimensions": [ { "key": "<key>", "score": 1-5, "evidence": ["cita",...], "note": "" } ],
  "strengths": ["..."],
  "gaps": ["..."],
  "flags": ["faltantes o señales de alerta vs el puesto"],
  "summary": "3-5 líneas"
}`;

export async function evaluateCvIsolated(
  cvText: string, puestoText: string, empresaText: string, referenceRaw?: string
): Promise<CvIsolatedEval> {
  const now = new Date().toISOString();
  if (!aiEnabled()) {
    return { source: "pending", generatedAt: now, overall: 0, dimensions: [], strengths: [], gaps: [], flags: [], summary: "Evaluación pendiente: requiere la capa de IA." };
  }
  const rubric = CV_DIMENSIONS.map((d) => `- ${d.key} (${d.name}, peso ${d.weight}%): ${d.desc}`).join("\n");
  const user = [
    `RÚBRICA (evalúa cada dimensión 1-5):\n${rubric}`,
    `PUESTO:\n${puestoText || "(no especificado)"}`,
    `EMPRESA:\n${empresaText || "(no especificado)"}`,
    referenceRaw ? `PERFIL DE REFERENCIA (Evaluador UNO):\n${referenceRaw}` : "",
    `CV DEL CANDIDATO:\n${cvText.slice(0, 12000)}`,
  ].filter(Boolean).join("\n\n");
  try {
    const raw = await ask(ISO_SYSTEM, user, 4000);
    const j = extractJson(raw);
    if (!j) throw new Error("no json");
    const dimensions = (j.dimensions ?? []).map((d: any) => ({
      key: d.key, score: Math.max(1, Math.min(5, Number(d.score) || 3)),
      evidence: Array.isArray(d.evidence) ? d.evidence : [], note: d.note ?? "",
    }));
    return {
      source: "ai", generatedAt: now, overall: weightedOverall(dimensions), dimensions,
      strengths: j.strengths ?? [], gaps: j.gaps ?? [], flags: j.flags ?? [], summary: j.summary ?? "",
    };
  } catch (e) {
    console.error("[CV] evaluateCvIsolated:", e);
    return { source: "pending", generatedAt: now, overall: 0, dimensions: [], strengths: [], gaps: [], flags: [], summary: "No se pudo evaluar el CV (error de IA)." };
  }
}

// ----------------------------------------------------------------- INTEGRADA (CV + HUMAN)
const INT_SYSTEM = `Eres el Evaluador Central. Integras la evidencia del CV (ya evaluada) con los resultados de la
prueba HUMAN (rasgos: DISC, Valores de Spranger, Proceso Pensante) de un mismo candidato. Tu valor está en
la TRIANGULACIÓN: cruzar lo que la persona DICE/ha hecho (CV) con lo que ES (HUMAN), contra el perfil de
referencia del puesto. Señala CONGRUENCIAS (se refuerzan) y DISCREPANCIAS (en conflicto, a explorar) — las
discrepancias son la señal más valiosa. Eres insumo para el psicólogo, nunca un veredicto de contratación.
Responde SOLO con JSON válido (sin fences, sin saltos de línea dentro de los valores de texto):
{
  "congruencias": ["rasgo HUMAN <-> evidencia CV que coinciden"],
  "discrepancias": ["señales en conflicto a explorar"],
  "compatibilidad": { "score": 0-100, "rationale": "" },
  "explorarEnEntrevista": ["preguntas/temas a profundizar"],
  "summary": "3-5 líneas"
}`;

export async function evaluateCvWithHuman(
  cvIsolated: CvIsolatedEval, human: HumanResult, referenceRaw?: string
): Promise<CvIntegratedEval> {
  const now = new Date().toISOString();
  if (!aiEnabled()) {
    return { source: "pending", generatedAt: now, congruencias: [], discrepancias: [], compatibilidad: { score: 0, rationale: "Pendiente de IA." }, explorarEnEntrevista: [], summary: "" };
  }
  const cvBlock = [
    `CV — global ${cvIsolated.overall}/100. Dimensiones: ${cvIsolated.dimensions.map((d) => `${d.key}=${d.score}`).join(", ")}.`,
    `Fortalezas: ${cvIsolated.strengths.join("; ")}`,
    `Brechas: ${cvIsolated.gaps.join("; ")}`,
    `Banderas: ${cvIsolated.flags.join("; ")}`,
    `Resumen CV: ${cvIsolated.summary}`,
  ].join("\n");
  const user = [
    "RESULTADOS HUMAN (rasgos, deterministas):", factsBlock(human),
    "\nEVALUACIÓN DEL CV (evidencia):", cvBlock,
    referenceRaw ? `\nPERFIL DE REFERENCIA:\n${referenceRaw}` : "",
  ].join("\n");
  try {
    const raw = await ask(INT_SYSTEM, user, 2200);
    const j = extractJson(raw);
    if (!j) throw new Error("no json");
    return {
      source: "ai", generatedAt: now,
      congruencias: j.congruencias ?? [], discrepancias: j.discrepancias ?? [],
      compatibilidad: { score: Math.max(0, Math.min(100, Number(j.compatibilidad?.score) || 0)), rationale: j.compatibilidad?.rationale ?? "" },
      explorarEnEntrevista: j.explorarEnEntrevista ?? [], summary: j.summary ?? "",
    };
  } catch (e) {
    console.error("[CV] evaluateCvWithHuman:", e);
    return { source: "pending", generatedAt: now, congruencias: [], discrepancias: [], compatibilidad: { score: 0, rationale: "Error de IA." }, explorarEnEntrevista: [], summary: "" };
  }
}
