// IA de la vertical de voz: GENERA el escenario (Evaluador UNO) y CALIFICA el transcript (ORCSE).
import { ask, aiEnabled } from "@/lib/ai";
import { VOICE_COMPETENCIES } from "./rubric";
import type { VoiceBlueprint, VoiceCapture, VoiceScoring } from "./types";

export function extractJson(s: string): any | null {
  const a = s.indexOf("{"); const b = s.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  const slice = s.slice(a, b + 1);
  try { return JSON.parse(slice); } catch { /* reintenta limpiando control chars */ }
  let cleaned = "";
  for (let i = 0; i < slice.length; i++) cleaned += slice.charCodeAt(i) < 32 ? " " : slice[i];
  try { return JSON.parse(cleaned); } catch { return null; }
}

// ----------------------------------------------------------------- Generación (UNO)
const GEN_SYSTEM = `Eres un psicólogo organizacional experto. Diseñas el caso de un EJERCICIO DE ROLE-PLAY POR VOZ:
una conversación de desempeño 1:1 donde el candidato (jefe) debe dar feedback a un colaborador de bajo
rendimiento que llega a la defensiva. Calibra el caso al puesto y empresa. El "colaborador" lo interpretará
un agente de voz; tú generas los datos del caso. Realista, específico, español de México.
Responde SOLO con JSON válido (sin fences, sin saltos de línea dentro de los valores):
{
  "contexto": "2-3 líneas: el rol de jefe que asume el candidato y el caso",
  "instrucciones": "qué se espera que logre en la llamada (confrontar con hechos, explorar causa, cerrar con plan)",
  "scenario": {
    "nombre_colaborador": "nombre del colaborador",
    "puesto_colaborador": "su puesto",
    "historial_desempeno": "3-4 hechos CONCRETOS y documentados del bajo desempeño (no etiquetas)",
    "causa_legitima": "una causa de fondo legítima que el candidato debe descubrir (sobrecarga, instrucciones poco claras, falta de recursos)"
  }
}`;

export async function generateVoiceBlueprint(
  puestoText: string, empresaText: string, referenceRaw?: string, agentId?: string
): Promise<VoiceBlueprint> {
  const now = new Date().toISOString();
  const competencyKeys = VOICE_COMPETENCIES.map((c) => c.key);
  const base = (extra: Partial<VoiceBlueprint> = {}): VoiceBlueprint => ({
    generatedBy: "template", generatedAt: now, agentId,
    contexto: "", instrucciones: "",
    scenario: { nombre_colaborador: "", puesto_colaborador: "", historial_desempeno: "", causa_legitima: "" },
    competencyKeys, approved: false, gentzaFiel: false, ...extra,
  });
  if (!aiEnabled()) return base();
  const user = [
    `PUESTO (del candidato/jefe):\n${puestoText || "(no especificado)"}`,
    `EMPRESA:\n${empresaText || "(no especificado)"}`,
    referenceRaw ? `PERFIL DE REFERENCIA (Evaluador UNO):\n${referenceRaw}` : "",
  ].filter(Boolean).join("\n\n");
  try {
    const raw = await ask(GEN_SYSTEM, user, 1500);
    const j = extractJson(raw);
    if (!j) throw new Error("no json");
    return base({
      generatedBy: "ai",
      contexto: j.contexto ?? "", instrucciones: j.instrucciones ?? "",
      scenario: {
        nombre_colaborador: j.scenario?.nombre_colaborador ?? "Andrés",
        puesto_colaborador: j.scenario?.puesto_colaborador ?? "",
        historial_desempeno: j.scenario?.historial_desempeno ?? "",
        causa_legitima: j.scenario?.causa_legitima ?? "",
      },
    });
  } catch (e) {
    console.error("[VOICE] generateVoiceBlueprint:", e);
    return base();
  }
}

// ----------------------------------------------------------------- Calificación (DOS, ORCSE)
const SCORE_SYSTEM = `Eres un asesor de assessment center entrenado en el modelo ORCSE de GENTZA. Te entrego el
TRANSCRIPT de una conversación de desempeño por voz entre el CANDIDATO (jefe, turnos "user") y un
colaborador defensivo interpretado por una IA (turnos "agent"). Calificas SOLO la conducta del CANDIDATO.
Pasos: Clasificar evidencia -> Resumir -> Evaluar 1-5 con las anclas de la rúbrica (NO inventes anclas).
Cita SIEMPRE evidencia verbatim de los turnos "user". Si la evidencia es insuficiente, baja el score y dilo.
No penalices disfluencias, acento ni errores de transcripción; evalúa el CONTENIDO conductual.
Eres insumo para el psicólogo, nunca un veredicto.
Responde SOLO con JSON válido (sin fences, sin saltos de línea dentro de los valores):
{
  "porCompetencia": [ { "competency":"key", "score":1-5, "evidence":["cita del candidato",...], "rationale":"" } ],
  "resumen": "3-5 líneas integrando el desempeño conductual del candidato",
  "semaforo": [ { "competency":"key", "color":"verde|amarillo|rojo" } ]
}`;

export async function scoreVoice(blueprint: VoiceBlueprint, capture: VoiceCapture): Promise<VoiceScoring> {
  const now = new Date().toISOString();
  if (!aiEnabled()) {
    return { source: "pending", generatedAt: now, porCompetencia: [], resumen: "Calificación pendiente: requiere IA.", semaforo: [] };
  }
  const used = new Set(blueprint.competencyKeys);
  const rubric = VOICE_COMPETENCIES.filter((c) => used.has(c.key)).map((c) =>
    `### ${c.key} — ${c.name}\n${c.definition}\n` +
    c.indicators.map((i) => `  ${i.name}: 5=${i.anchors[5]} | 4=${i.anchors[4]} | 3=${i.anchors[3]} | 2=${i.anchors[2]} | 1=${i.anchors[1]}`).join("\n")
  ).join("\n\n");
  const conv = capture.transcript.map((t) => `${t.role === "user" ? "CANDIDATO" : "Colaborador"}: ${t.text}`).join("\n");
  const user = `CASO: ${blueprint.contexto}\nColaborador: ${blueprint.scenario.nombre_colaborador} (${blueprint.scenario.puesto_colaborador}). Historial: ${blueprint.scenario.historial_desempeno}. Causa de fondo: ${blueprint.scenario.causa_legitima}.\n\nRÚBRICA (formato GENTZA):\n${rubric}\n\nTRANSCRIPT:\n${conv}`;
  try {
    const raw = await ask(SCORE_SYSTEM, user, 3000);
    const j = extractJson(raw);
    if (!j) throw new Error("no json");
    return {
      source: "ai", generatedAt: now,
      porCompetencia: (j.porCompetencia ?? []).map((p: any) => ({
        competency: p.competency, score: Math.max(1, Math.min(5, Number(p.score) || 3)),
        evidence: Array.isArray(p.evidence) ? p.evidence : [], rationale: p.rationale ?? "",
      })),
      resumen: j.resumen ?? "",
      semaforo: (j.semaforo ?? []).map((s: any) => ({
        competency: s.competency, color: ["verde", "amarillo", "rojo"].includes(s.color) ? s.color : "amarillo",
      })),
    };
  } catch (e) {
    console.error("[VOICE] scoreVoice:", e);
    return { source: "pending", generatedAt: now, porCompetencia: [], resumen: "No se pudo calificar (error de IA).", semaforo: [] };
  }
}
