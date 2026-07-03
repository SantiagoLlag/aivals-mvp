// Síntesis de triangulación multi-método (determinista, SIN IA — nunca importa lib/ai).
//
// Principio: solo se agrega a 0-100 donde la escala lo permite —
//   · AC  = media de sus calificaciones porCompetencia (1-5 → (m-1)/4*100), "media de competencias"
//   · Voz = ídem
//   · CV  = cv.isolated.overall (ya viene 0-100)
// HUMAN y Big Five NO tienen un agregado único defendible: entran como filas DESCRIPTIVAS
// (HUMAN: perfil interpretado + valores predominantes; Big Five: rasgo más alto / más bajo).
//
// A nivel competencia SOLO se comparan keys EXACTAMENTE compartidas entre las calificaciones
// de AC y Voz. Verificado en las rúbricas (lib/ac/rubric.ts vs lib/voice/rubric.ts): hoy NO
// comparten ninguna key (p. ej. "manejo_conflicto" ≠ "manejo_conflicto_ie"), así que ese nivel
// queda vacío hasta que las rúbricas converjan. NO se inventan mapeos entre constructos.

import type { Candidate } from "@/lib/types";
import type { ValueCode } from "@/lib/human/types";
import { BIGFIVE_FACTORS, type BigFiveFactor } from "@/lib/bigfive/types";
import { competencyByKey } from "@/lib/ac/rubric";
import { voiceCompetencyByKey } from "@/lib/voice/rubric";
import type { T } from "@/lib/i18n";

export type MetodoKey = "human" | "bigfive" | "ac" | "cv" | "voz";
export type MetodoEscalable = "ac" | "cv" | "voz";

// Umbrales de comparación (documentados aquí para que el criterio sea auditable).
export const DIV_GLOBAL_MIN = 25; // 0-100: diferencia >= 25 entre dos agregados → divergencia
export const CONV_GLOBAL_MAX = 15; // 0-100: con >= 2 agregados, (max - min) <= 15 → convergencia global
export const DIV_COMP_MIN = 2; // 1-5: diferencia >= 2 en competencia compartida → divergencia
export const CONV_COMP_MAX = 1; // 1-5: diferencia <= 1 en competencia compartida → convergencia

// Una fila por método presente. "escalable" trae agregado 0-100 legítimo; "descriptivo" no.
export type ResumenFila =
  | { metodo: "ac" | "voz"; tipo: "escalable"; score: number; media: number; n: number }
  | { metodo: "cv"; tipo: "escalable"; score: number }
  | {
      metodo: "human";
      tipo: "descriptivo";
      perfil: "bajoPresion" | "proyectado";
      notInterpretable: boolean;
      predominantes: ValueCode[];
    }
  | {
      metodo: "bigfive";
      tipo: "descriptivo";
      alto: { factor: BigFiveFactor; score: number };
      bajo: { factor: BigFiveFactor; score: number };
    };

export type FilaEscalable = Extract<ResumenFila, { tipo: "escalable" }>;

export interface DivergenciaGlobal {
  a: MetodoEscalable;
  b: MetodoEscalable;
  scoreA: number;
  scoreB: number;
  diff: number;
}

export interface ConvergenciaGlobal {
  metodos: { metodo: MetodoEscalable; score: number }[];
  rango: number; // max - min
}

// Comparación 1-5 de una competency key compartida entre AC y Voz.
export interface CompetenciaComparada {
  competency: string;
  ac: number; // media 1-5 (el AC puede calificar la misma key en charola y SJT)
  voz: number; // media 1-5
  diff: number;
}

export interface Triangulacion {
  resumen: ResumenFila[];
  presentes: MetodoKey[];
  escalables: { metodo: MetodoEscalable; score: number }[];
  divergenciasGlobales: DivergenciaGlobal[];
  convergenciaGlobal: ConvergenciaGlobal | null;
  convergenciasCompetencia: CompetenciaComparada[];
  divergenciasCompetencia: CompetenciaComparada[];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const to100 = (media15: number) => Math.round(((media15 - 1) / 4) * 100);
const round1 = (v: number) => Math.round(v * 10) / 10;

// Media 1-5 por competency key (colapsa filas repetidas de la misma key, p. ej. charola + SJT).
function mediaPorKey(rows: { competency: string; score: number }[]): Map<string, number> {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const cur = acc.get(r.competency) ?? { sum: 0, n: 0 };
    cur.sum += r.score;
    cur.n += 1;
    acc.set(r.competency, cur);
  }
  const out = new Map<string, number>();
  for (const [k, v] of acc) out.set(k, v.sum / v.n);
  return out;
}

// Una fila por método con datos utilizables, en el orden de las secciones del reporte.
export function resumenMetodos(candidate: Candidate): ResumenFila[] {
  const filas: ResumenFila[] = [];

  const r = candidate.result;
  if (r) {
    filas.push({
      metodo: "human",
      tipo: "descriptivo",
      perfil: r.disc.interpretedProfile,
      notInterpretable: r.disc.notInterpretable,
      predominantes: r.valores.predominant,
    });
  }

  const bf = candidate.bigFive?.result;
  if (bf && bf.answered > 0) {
    let alto: BigFiveFactor = BIGFIVE_FACTORS[0];
    let bajo: BigFiveFactor = BIGFIVE_FACTORS[0];
    for (const f of BIGFIVE_FACTORS) {
      if (bf.scores[f] > bf.scores[alto]) alto = f;
      if (bf.scores[f] < bf.scores[bajo]) bajo = f;
    }
    filas.push({
      metodo: "bigfive",
      tipo: "descriptivo",
      alto: { factor: alto, score: bf.scores[alto] },
      bajo: { factor: bajo, score: bf.scores[bajo] },
    });
  }

  const ac = candidate.acResult?.calificacion;
  if (ac && ac.porCompetencia.length > 0) {
    const m = mean(ac.porCompetencia.map((p) => p.score));
    filas.push({ metodo: "ac", tipo: "escalable", score: to100(m), media: round1(m), n: ac.porCompetencia.length });
  }

  const cv = candidate.cv?.isolated;
  if (cv && Number.isFinite(cv.overall)) {
    filas.push({ metodo: "cv", tipo: "escalable", score: Math.round(cv.overall) });
  }

  const voz = candidate.voiceResult?.calificacion;
  if (voz && voz.porCompetencia.length > 0) {
    const m = mean(voz.porCompetencia.map((p) => p.score));
    filas.push({ metodo: "voz", tipo: "escalable", score: to100(m), media: round1(m), n: voz.porCompetencia.length });
  }

  return filas;
}

// Cálculo completo: resumen + convergencias/divergencias en ambos niveles.
export function triangular(candidate: Candidate): Triangulacion {
  const resumen = resumenMetodos(candidate);
  const presentes = resumen.map((f) => f.metodo);
  const escalables = resumen
    .filter((f): f is FilaEscalable => f.tipo === "escalable")
    .map((f) => ({ metodo: f.metodo, score: f.score }));

  // Nivel global (0-100): pares con brecha grande, y convergencia si todo el rango es angosto.
  const divergenciasGlobales: DivergenciaGlobal[] = [];
  for (let i = 0; i < escalables.length; i++) {
    for (let j = i + 1; j < escalables.length; j++) {
      const a = escalables[i];
      const b = escalables[j];
      const diff = Math.abs(a.score - b.score);
      if (diff >= DIV_GLOBAL_MIN) {
        divergenciasGlobales.push({ a: a.metodo, b: b.metodo, scoreA: a.score, scoreB: b.score, diff });
      }
    }
  }
  let convergenciaGlobal: ConvergenciaGlobal | null = null;
  if (escalables.length >= 2) {
    const scores = escalables.map((e) => e.score);
    const rango = Math.max(...scores) - Math.min(...scores);
    if (rango <= CONV_GLOBAL_MAX) convergenciaGlobal = { metodos: escalables, rango };
  }

  // Nivel competencia (1-5): SOLO keys idénticas presentes en ambas calificaciones.
  const convergenciasCompetencia: CompetenciaComparada[] = [];
  const divergenciasCompetencia: CompetenciaComparada[] = [];
  const acCal = candidate.acResult?.calificacion;
  const vozCal = candidate.voiceResult?.calificacion;
  if (acCal && vozCal) {
    const acMap = mediaPorKey(acCal.porCompetencia);
    const vozMap = mediaPorKey(vozCal.porCompetencia);
    for (const [key, acScore] of acMap) {
      const vozScore = vozMap.get(key);
      if (vozScore === undefined) continue;
      const diff = Math.abs(acScore - vozScore);
      const row: CompetenciaComparada = {
        competency: key,
        ac: round1(acScore),
        voz: round1(vozScore),
        diff: round1(diff),
      };
      if (diff >= DIV_COMP_MIN) divergenciasCompetencia.push(row);
      else if (diff <= CONV_COMP_MAX) convergenciasCompetencia.push(row);
      // 1 < diff < 2: zona intermedia, ni convergencia ni divergencia.
    }
  }

  return {
    resumen,
    presentes,
    escalables,
    divergenciasGlobales,
    convergenciaGlobal,
    convergenciasCompetencia,
    divergenciasCompetencia,
  };
}

// Nombre corto del método para UI (recibe el traductor: la vista decide el idioma).
export function metodoNombre(metodo: MetodoKey, t: T): string {
  switch (metodo) {
    case "human":
      return "HUMAN";
    case "bigfive":
      return "Big Five";
    case "ac":
      return "Assessment Center";
    case "cv":
      return "CV";
    case "voz":
      return t("Role-play por voz", "Voice role-play");
  }
}

// Nombre humano de una competency key (busca en ambas rúbricas; cae al key crudo).
export function competencyNombre(key: string): string {
  return competencyByKey(key)?.name ?? voiceCompetencyByKey(key)?.name ?? key;
}

const fmt15 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Preguntas plantilla DETERMINISTAS derivadas de cada divergencia (una por divergencia,
// en el mismo orden). Sin modelo de lenguaje: texto fijo + datos del cálculo.
export function preguntasExploracion(tri: Triangulacion, t: T): string[] {
  const qs: string[] = [];

  for (const d of tri.divergenciasGlobales) {
    const aEsAlto = d.scoreA >= d.scoreB;
    const alto = metodoNombre(aEsAlto ? d.a : d.b, t);
    const bajo = metodoNombre(aEsAlto ? d.b : d.a, t);
    const sAlto = aEsAlto ? d.scoreA : d.scoreB;
    const sBajo = aEsAlto ? d.scoreB : d.scoreA;
    qs.push(
      t(
        `En ${alto} su agregado fue alto (${sAlto}/100) pero en ${bajo} fue bajo (${sBajo}/100): explora con ejemplos conductuales qué explica la brecha (contexto, formato de cada prueba o una competencia que no se sostiene entre métodos).`,
        `Their aggregate was high in ${alto} (${sAlto}/100) but low in ${bajo} (${sBajo}/100): explore with behavioral examples what explains the gap (context, format of each test, or a competency that does not hold across methods).`,
      ),
    );
  }

  for (const d of tri.divergenciasCompetencia) {
    const nombre = competencyNombre(d.competency);
    if (d.ac >= d.voz) {
      qs.push(
        t(
          `En el AC su media en ${nombre} fue alta (${fmt15(d.ac)}/5) pero en la llamada fue baja (${fmt15(d.voz)}/5): explora con ejemplos conductuales recientes por qué la conducta escrita no apareció en la conversación en vivo.`,
          `In the AC their mean for ${nombre} was high (${fmt15(d.ac)}/5) but in the call it was low (${fmt15(d.voz)}/5): explore with recent behavioral examples why the written behavior did not show up in the live conversation.`,
        ),
      );
    } else {
      qs.push(
        t(
          `En la llamada su ${nombre} fue alta (${fmt15(d.voz)}/5) pero en el AC su media fue baja (${fmt15(d.ac)}/5): explora con ejemplos conductuales recientes si esa competencia depende del formato (en vivo vs. escrito).`,
          `In the call their ${nombre} was high (${fmt15(d.voz)}/5) but in the AC their mean was low (${fmt15(d.ac)}/5): explore with recent behavioral examples whether that competency depends on format (live vs. written).`,
        ),
      );
    }
  }

  return qs;
}
