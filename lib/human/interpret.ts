// Ensambla una interpretación DETERMINISTA del resultado HUMAN usando los textos
// canónicos del manual. Se usa (a) como reporte cuando no hay IA y (b) como contexto
// factual para el Evaluador DOS (IA), de modo que la IA no invente descripciones.
import valoresData from "./data/valores.json";
import pensanteData from "./data/pensante.json";
import type { HumanResult, ValueCode, Style } from "./types";

const VAL_NAMES = valoresData.values as Record<string, string>;
const STYLE_NAMES = pensanteData.styles as Record<string, string>;
const VAL_DESC = (valoresData as any).descriptions as Record<string, { ALTO: string; BAJO: string }>;
const PEN_DESC = (pensanteData as any).descriptions as {
  quadrants: Record<string, { ALTO: string; MEDIO: string; BAJO: string }>;
  axes: Record<string, string>;
  cerebroTotal: string;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function interpretDeterministic(res: HumanResult): string {
  const L: string[] = [];

  // -------- DISC --------
  L.push("## Comportamiento (DISC)");
  const prof = res.disc.profiles[res.disc.interpretedProfile];
  L.push(
    `Perfil interpretado: **${res.disc.interpretedProfile === "bajoPresion" ? "Bajo Presión" : "Motivado"}** · ` +
      `D ${r1(prof.D)} · I ${r1(prof.I)} · S ${r1(prof.S)} · C ${r1(prof.C)} (escala 0–100, media 50).`
  );
  if (res.disc.notInterpretable) {
    L.push(`> ⚠️ ${res.disc.notInterpretableReason}`);
  }
  if (res.disc.combinations.length) {
    L.push("\n**Combinaciones:**");
    for (const c of res.disc.combinations) {
      L.push(`- **${c.pair} (${c.nivel}).** ${c.text}`);
    }
  }

  // -------- VALORES --------
  L.push("\n## Motivadores (Valores de Spranger)");
  const pred = res.valores.predominant.map((v) => VAL_NAMES[v]).join(", ");
  L.push(`Valores predominantes (ALTO ≥ 49): **${pred || "ninguno marcado ALTO"}**.`);
  const ordered = (Object.keys(res.valores.scores) as ValueCode[]).sort(
    (a, b) => res.valores.scores[b] - res.valores.scores[a]
  );
  for (const v of ordered) {
    const lvl = res.valores.levels[v];
    const desc = VAL_DESC?.[v]?.[lvl] ?? "";
    L.push(`- **${VAL_NAMES[v]} — ${lvl} (${r1(res.valores.scores[v])}).** ${desc}`);
  }

  // -------- PROCESO PENSANTE --------
  L.push("\n## Estilo de pensamiento (Proceso Pensante)");
  L.push(
    `Ejes: **${res.pensante.axes.conceptualVsEspecifico}** · **${res.pensante.axes.izquierdoVsDerecho}**` +
      (res.pensante.cerebroTotal ? " · **Cerebro Total**" : "") + "."
  );
  const axisText =
    res.pensante.axes.conceptualVsEspecifico === "CONCEPTUAL"
      ? PEN_DESC?.axes?.conceptual
      : res.pensante.axes.conceptualVsEspecifico === "ESPECIFICO"
      ? PEN_DESC?.axes?.especifico
      : PEN_DESC?.axes?.balanceCE;
  if (axisText) L.push(`> ${axisText}`);
  if (res.pensante.cerebroTotal && PEN_DESC?.cerebroTotal) L.push(`> ${PEN_DESC.cerebroTotal}`);
  const orderedS = (Object.keys(res.pensante.scores) as Style[]).sort(
    (a, b) => res.pensante.scores[b] - res.pensante.scores[a]
  );
  for (const s of orderedS) {
    const lvl = res.pensante.levels[s];
    const desc = PEN_DESC?.quadrants?.[s]?.[lvl] ?? "";
    L.push(`- **${STYLE_NAMES[s]} — ${lvl} (${r1(res.pensante.scores[s])}).** ${desc}`);
  }

  return L.join("\n");
}

// Resumen compacto de números (para alimentar a la IA como hechos duros).
export function factsBlock(res: HumanResult): string {
  const prof = res.disc.profiles[res.disc.interpretedProfile];
  const v = res.valores.scores;
  const p = res.pensante.scores;
  return [
    `DISC (perfil ${res.disc.interpretedProfile}): D=${r1(prof.D)} I=${r1(prof.I)} S=${r1(prof.S)} C=${r1(prof.C)}`,
    `DISC combinaciones: ${res.disc.combinations.map((c) => `${c.pair}=${c.nivel}`).join(", ") || "—"}`,
    `Valores: T=${r1(v.T)} E=${r1(v.E)} A=${r1(v.A)} S=${r1(v.S)} P=${r1(v.P)} R=${r1(v.R)} | predominantes: ${res.valores.predominant.join(", ")}`,
    `Proceso Pensante: A=${r1(p.A)} V=${r1(p.V)} I=${r1(p.I)} L=${r1(p.L)} | ejes: ${res.pensante.axes.conceptualVsEspecifico}, ${res.pensante.axes.izquierdoVsDerecho}${res.pensante.cerebroTotal ? ", Cerebro Total" : ""}`,
  ].join("\n");
}
