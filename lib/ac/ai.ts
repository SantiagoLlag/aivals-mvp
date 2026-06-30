// IA del Assessment Center: GENERA el ejercicio (Evaluador estilo UNO) y lo CALIFICA con
// ORCSE (Evaluador estilo DOS). Funciones que se llaman con contexto, no agentes.
import { randomUUID } from "crypto";
import { ask, aiEnabled } from "@/lib/ai";
import { COMPETENCIES, charolaCompetencies, sjtCompetencies, competencyByKey } from "./rubric";
import { customizationToPrompt, hasCustomization } from "./customize";
import type { AcBlueprint, AcCapture, AcScoring, AcCustomization } from "./types";

function extractJson(s: string): any | null {
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  const slice = s.slice(a, b + 1);
  try { return JSON.parse(slice); } catch { /* reintenta limpiando control chars */ }
  let cleaned = "";
  for (let i = 0; i < slice.length; i++) cleaned += slice.charCodeAt(i) < 32 ? " " : slice[i];
  try { return JSON.parse(cleaned); } catch { return null; }
}
const id = () => randomUUID().slice(0, 8);

// ----------------------------------------------------------------- Generación (UNO)
const GEN_SYSTEM = `Eres un psicólogo organizacional experto en assessment centers. Diseñas DOS ejercicios
situacionales calibrados a un puesto, para aplicarse por web de forma asíncrona a un candidato:
1) CHAROLA (in-basket): una bandeja de 5-7 correos/memos realistas con tareas y problemas en conflicto,
   del nivel del puesto, que obliguen a priorizar, delegar, decidir y planear. Cada ítem debe poder
   estresar 1-3 de las competencias dadas.
2) SJT: 5-7 micro-escenarios situacionales cortos, cada uno con una pregunta de respuesta abierta breve,
   cada uno apuntando a UNA competencia interpersonal/ética dada.
Calibra TODO al puesto y empresa del perfil de referencia. Realista, específico, en español.
Responde SOLO con JSON válido (sin fences), con esta forma EXACTA:
{
  "contextoPuesto": "2-3 líneas: el rol que asume el candidato y el escenario",
  "charola": { "instrucciones": "...", "items": [ { "asunto":"", "de":"", "cuerpo":"", "competencias":["key",...] } ] },
  "sjt": { "instrucciones": "...", "escenarios": [ { "situacion":"", "pregunta":"", "competencia":"key" } ] }
}`;

export async function generateAcBlueprint(
  puestoText: string,
  empresaText: string,
  referenceRaw?: string,
  customization?: AcCustomization
): Promise<AcBlueprint> {
  const competencyKeys = COMPETENCIES.map((c) => c.key);
  const now = new Date().toISOString();
  const custom = hasCustomization(customization) ? customization : undefined;
  if (!aiEnabled()) {
    return {
      generatedBy: "template", generatedAt: now,
      contextoPuesto: "Asumes un rol en la organización descrita. Resuelve la bandeja y los escenarios.",
      charola: { instrucciones: "Para cada asunto, indica tu ACCIÓN y un rationale breve (2-4 líneas).", items: [] },
      sjt: { instrucciones: "Responde brevemente cada escenario.", escenarios: [] },
      competencyKeys, approved: false, gentzaFiel: false, customization: custom,
    };
  }
  const compList = (list = COMPETENCIES) =>
    list.map((c) => `- ${c.key} (${c.name}): ${c.definition}`).join("\n");
  const user = [
    `PUESTO:\n${puestoText || "(no especificado)"}`,
    `EMPRESA:\n${empresaText || "(no especificado)"}`,
    referenceRaw ? `PERFIL DE REFERENCIA (Evaluador UNO):\n${referenceRaw}` : "",
    `COMPETENCIAS DE LA CHAROLA (usa estas keys):\n${compList(charolaCompetencies())}`,
    `COMPETENCIAS DEL SJT (usa estas keys):\n${compList(sjtCompetencies())}`,
    custom ? customizationToPrompt(custom) : "",
  ].filter(Boolean).join("\n\n");
  try {
    const raw = await ask(GEN_SYSTEM, user, 8000);
    const j = extractJson(raw);
    if (!j) throw new Error("no json en respuesta de generación");
    return {
      generatedBy: "ai", generatedAt: now,
      contextoPuesto: j.contextoPuesto ?? "",
      charola: {
        instrucciones: j.charola?.instrucciones ?? "",
        items: (j.charola?.items ?? []).map((it: any) => ({
          id: id(), asunto: it.asunto ?? "", de: it.de ?? "", cuerpo: it.cuerpo ?? "",
          competencias: Array.isArray(it.competencias) ? it.competencias : [],
        })),
      },
      sjt: {
        instrucciones: j.sjt?.instrucciones ?? "",
        escenarios: (j.sjt?.escenarios ?? []).map((es: any) => ({
          id: id(), situacion: es.situacion ?? "", pregunta: es.pregunta ?? "",
          competencia: es.competencia ?? "",
        })),
      },
      competencyKeys, approved: false, gentzaFiel: false, customization: custom,
    };
  } catch (e) {
    console.error("[AC] generateAcBlueprint:", e);
    return {
      generatedBy: "template", generatedAt: now,
      contextoPuesto: "", charola: { instrucciones: "", items: [] },
      sjt: { instrucciones: "", escenarios: [] }, competencyKeys, approved: false, gentzaFiel: false, customization: custom,
    };
  }
}

// ----------------------------------------------------------------- Calificación (DOS, ORCSE)
const SCORE_SYSTEM = `Eres un asesor de assessment center entrenado en el modelo ORCSE de GENTZA.
Te entrego (a) el ejercicio (charola + SJT), (b) la CAPTURA verbatim de las respuestas del candidato,
y (c) la RÚBRICA de competencias en formato GENTZA (cada competencia tiene indicadores anclados 1-5).
Tu tarea (Clasificar -> Resumir -> Evaluar):
- CLASIFICA cada pieza de evidencia (cita textual del candidato) a una competencia.
- EVALÚA cada competencia con la escala conductual 1-5 usando las anclas de la rúbrica. NO inventes anclas.
- Cita SIEMPRE la evidencia verbatim que justifica el puntaje.
- Eres INSUMO para el psicólogo: no decides contratación. Si la evidencia es insuficiente, dilo y baja la confianza.
Responde SOLO con JSON válido (sin fences):
{
  "porCompetencia": [ { "competency":"key", "exercise":"charola|sjt", "score":1-5, "evidence":["cita",...], "rationale":"" } ],
  "resumen": "3-5 líneas integrando el desempeño conductual",
  "semaforo": [ { "competency":"key", "color":"verde|amarillo|rojo" } ]
}`;

export async function scoreAc(blueprint: AcBlueprint, capture: AcCapture): Promise<AcScoring> {
  const now = new Date().toISOString();
  if (!aiEnabled()) {
    return { source: "pending", generatedAt: now, porCompetencia: [], resumen: "Calificación pendiente: requiere la capa de IA (ANTHROPIC_API_KEY).", semaforo: [] };
  }
  const usedKeys = new Set(blueprint.competencyKeys);
  const rubric = COMPETENCIES.filter((c) => usedKeys.has(c.key)).map((c) =>
    `### ${c.key} — ${c.name}\n${c.definition}\n` +
    c.indicators.map((i) => `  Indicador "${i.name}": 5=${i.anchors[5]} | 4=${i.anchors[4]} | 3=${i.anchors[3]} | 2=${i.anchors[2]} | 1=${i.anchors[1]}`).join("\n")
  ).join("\n\n");
  const itemsById = Object.fromEntries(blueprint.charola.items.map((i) => [i.id, i]));
  const scenById = Object.fromEntries(blueprint.sjt.escenarios.map((s) => [s.id, s]));
  const capturaTxt = [
    "CHAROLA:",
    ...capture.charola.map((r) => `[${itemsById[r.itemId]?.asunto ?? r.itemId}] acción: ${r.accion} | rationale: ${r.rationale}`),
    "\nSJT:",
    ...capture.sjt.map((r) => `[${scenById[r.scenarioId]?.competencia ?? r.scenarioId}] ${scenById[r.scenarioId]?.situacion ?? ""} -> ${r.respuesta}`),
  ].join("\n");
  const user = `RÚBRICA (formato GENTZA):\n${rubric}\n\nCAPTURA DEL CANDIDATO (verbatim):\n${capturaTxt}`;
  try {
    const raw = await ask(SCORE_SYSTEM, user, 4000);
    const j = extractJson(raw);
    if (!j) throw new Error("no json en respuesta de calificación");
    return {
      source: "ai", generatedAt: now,
      porCompetencia: (j.porCompetencia ?? []).map((p: any) => ({
        competency: p.competency, exercise: p.exercise === "sjt" ? "sjt" : "charola",
        score: Math.max(1, Math.min(5, Number(p.score) || 3)),
        evidence: Array.isArray(p.evidence) ? p.evidence : [], rationale: p.rationale ?? "",
      })),
      resumen: j.resumen ?? "",
      semaforo: (j.semaforo ?? []).map((s: any) => ({
        competency: s.competency,
        color: ["verde", "amarillo", "rojo"].includes(s.color) ? s.color : "amarillo",
      })),
    };
  } catch (e) {
    console.error("[AC] scoreAc:", e);
    return { source: "pending", generatedAt: now, porCompetencia: [], resumen: "No se pudo calificar (error de IA).", semaforo: [] };
  }
}

export { competencyByKey };
