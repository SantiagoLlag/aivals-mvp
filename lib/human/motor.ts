// ============================================================================
// MOTOR HUMAN — scoring determinista (el IP).
// Reconstruido y validado contra el caso cacheado del "Procesamiento Human.xlsm".
// Sin estado, sin IA, sin dependencias. Constantes en ./data/*.json.
// ============================================================================
import discData from "./data/disc.json";
import valoresData from "./data/valores.json";
import pensanteData from "./data/pensante.json";
import type {
  Factor, FactorScores, ValueCode, ValueScores, Style, StyleScores,
  Nivel, ComboNivel, HumanInput, DiscResult, ValoresResult, PensanteResult, HumanResult,
} from "./types";

const FACTORS: Factor[] = ["D", "I", "S", "C"];
const VALUES: ValueCode[] = ["T", "E", "A", "S", "P", "R"];
const STYLES: Style[] = ["A", "V", "I", "L"];

// Excel VLOOKUP aproximado: mayor umbral <= x
function baremo(points: number[][], x: number): number {
  let res = points[0][1];
  for (const [thr, p] of points) {
    if (x >= thr) res = p;
    else break;
  }
  return res;
}

// ---------------------------------------------------------------- DISC
function scoreDisc(input: HumanInput["disc"]): DiscResult {
  const most: FactorScores = { D: 0, I: 0, S: 0, C: 0 };
  const least: FactorScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const serie of discData.series) {
    const ans = input[String(serie.n)];
    if (!ans) continue;
    const masWord = serie.words.find((w) => w.pos === ans.mas);
    const menWord = serie.words.find((w) => w.pos === ans.menos);
    if (masWord?.factorMas) most[masWord.factorMas as Factor]++;
    if (menWord?.factorMenos) least[menWord.factorMenos as Factor]++;
  }

  const b = discData.baremos as Record<string, Record<string, number[][]>>;
  const convert = (prof: string, raw: FactorScores): FactorScores => {
    const out = {} as FactorScores;
    for (const f of FACTORS) out[f] = baremo(b[prof][f], raw[f]);
    return out;
  };

  const observado = convert("observado", {
    D: most.D - least.D, I: most.I - least.I, S: most.S - least.S, C: most.C - least.C,
  });
  const proyectado = convert("proyectado", most);
  const bajoPresion = convert("bajoPresion", least);

  // Selección del perfil clínico: Bajo Presión, salvo que sus 4 factores caigan
  // dentro de 40-60 (confusión), en cuyo caso se interpreta Motivado (Proyectado).
  const inBand = (s: FactorScores) => FACTORS.every((f) => s[f] >= 40 && s[f] <= 60);
  const interpretedProfile: "bajoPresion" | "proyectado" =
    inBand(bajoPresion) ? "proyectado" : "bajoPresion";
  const prof = interpretedProfile === "bajoPresion" ? bajoPresion : proyectado;

  // Casos globales no interpretables (manual)
  let notInterpretable = false;
  let notInterpretableReason: string | null = null;
  const allBand = FACTORS.every((f) => bajoPresion[f] >= 40 && bajoPresion[f] <= 60)
    && FACTORS.every((f) => observado[f] >= 40 && observado[f] <= 60)
    && FACTORS.every((f) => proyectado[f] >= 40 && proyectado[f] <= 60);
  const allAbove50 = FACTORS.every((f) => prof[f] > 50);
  const allBelow50 = FACTORS.every((f) => prof[f] < 50);
  if (allBand) { notInterpretable = true; notInterpretableReason = "Todos los puntos en 40-60 en las 3 gráficas: confusión."; }
  else if (allAbove50) { notInterpretable = true; notInterpretableReason = "Los 4 factores por encima de 50: presión personal, repetir prueba."; }
  else if (allBelow50) { notInterpretable = true; notInterpretableReason = "Los 4 factores por debajo de 50."; }

  // Combinaciones par-a-par
  const sameAxis = new Set(discData.combos.sameAxis);
  const texts = discData.combos.texts as Record<string, Record<string, string>>;
  const combinations: DiscResult["combinations"] = [];
  for (const pair of discData.combos.order) {
    const [pivote, noPivote] = pair.split("/") as Factor[];
    const p = prof[pivote];
    const n = prof[noPivote];
    const d = p - n;
    let nivel: ComboNivel;
    if (sameAxis.has(pair)) {
      if (d < 0) nivel = "NO INTERPRETABLE";
      else if (d < 10) nivel = "IGUALDAD";
      else if (d >= 40 && p > 50) nivel = "INTENSO";
      else if (p > 50 && n > 50 && d > 9) nivel = "ALTO";
      else if (d < 40 && p > 50) nivel = "MEDIO";
      else nivel = "BAJO";
    } else {
      if (d < 10) nivel = "NO INTERPRETABLE";
      else if (d >= 40 && p > 50) nivel = "INTENSO";
      else if (p > 50 && n > 50 && d > 9) nivel = "ALTO";
      else if (d < 40 && p > 50) nivel = "MEDIO";
      else nivel = "BAJO";
    }
    const text = texts[pair]?.[nivel] ?? "";
    if (nivel !== "NO INTERPRETABLE" && text) {
      combinations.push({ pair, nivel, text });
    }
  }

  return {
    profiles: { observado, proyectado, bajoPresion },
    interpretedProfile, notInterpretable, notInterpretableReason, combinations,
  };
}

// ---------------------------------------------------------------- VALORES
function scoreValores(input: HumanInput["valores"]): ValoresResult {
  const raw: ValueScores = { T: 0, E: 0, A: 0, S: 0, P: 0, R: 0 };
  for (const serie of valoresData.series) {
    for (const c of serie.concepts) {
      const rank = input[c.id];
      if (typeof rank === "number" && c.value) raw[c.value as ValueCode] += rank;
    }
  }
  const scores = {} as ValueScores;
  const levels = {} as Record<ValueCode, "ALTO" | "BAJO">;
  for (const v of VALUES) {
    scores[v] = (raw[v] / 60) * 100;
    levels[v] = scores[v] >= valoresData.cutoff ? "ALTO" : "BAJO";
  }
  const predominant = VALUES
    .filter((v) => levels[v] === "ALTO")
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 3);
  return { scores, levels, predominant };
}

// ---------------------------------------------------------------- PROCESO PENSANTE
function scorePensante(input: HumanInput["pensante"]): PensanteResult {
  const sums: Record<Style, { I: number; II: number; III: number }> = {
    A: { I: 0, II: 0, III: 0 }, V: { I: 0, II: 0, III: 0 },
    I: { I: 0, II: 0, III: 0 }, L: { I: 0, II: 0, III: 0 },
  };
  const addGroup = (items: { id: string; style: string }[], group: "I" | "II" | "III") => {
    for (const it of items) {
      const val = input[it.id];
      if (typeof val === "number" && it.style) sums[it.style as Style][group] += val;
    }
  };
  const gI = pensanteData.groupI.questions.flatMap((q) => q.options);
  addGroup(gI, "I");
  addGroup(pensanteData.groupII.questions, "II");
  addGroup(pensanteData.groupIII.questions, "III");

  const w = pensanteData.weights;
  const scores = {} as StyleScores;
  const levels = {} as Record<Style, Nivel>;
  for (const s of STYLES) {
    const weighted = (sums[s].I * w.I + sums[s].II * w.II + sums[s].III * w.III) / 10;
    scores[s] = (weighted - 5) * 5;
    levels[s] = scores[s] <= 44 ? "BAJO" : scores[s] <= 69 ? "MEDIO" : "ALTO";
  }
  const conceptual = scores.A + scores.V;
  const especifico = scores.L + scores.I;
  const izquierdo = scores.A + scores.L;
  const derecho = scores.V + scores.I;
  return {
    scores, levels,
    axes: {
      conceptualVsEspecifico:
        conceptual > especifico ? "CONCEPTUAL" : conceptual === especifico ? "BALANCE" : "ESPECIFICO",
      izquierdoVsDerecho:
        izquierdo > derecho ? "DOMINANTE IZQUIERDO" : izquierdo === derecho ? "BALANCE" : "DOMINANTE DERECHO",
    },
    cerebroTotal: STYLES.every((s) => scores[s] > pensanteData.cerebroTotalThreshold),
  };
}

// ---------------------------------------------------------------- PUBLIC
export function scoreHuman(input: HumanInput): HumanResult {
  return {
    disc: scoreDisc(input.disc),
    valores: scoreValores(input.valores),
    pensante: scorePensante(input.pensante),
  };
}
