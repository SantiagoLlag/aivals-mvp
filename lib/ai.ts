// Capa de IA: Evaluador UNO (perfil de referencia) y DOS (interpretación HUMAN).
// La IA es una FUNCIÓN que se llama con contexto, no un agente.
// Sin ANTHROPIC_API_KEY, todo degrada con elegancia: UNO se omite y DOS usa el
// reporte determinista del manual.
import Anthropic from "@anthropic-ai/sdk";
import type { HumanResult } from "./human/types";
import type { BigFiveResult } from "./bigfive/types";
import type { ReferenceProfile, DosReport } from "./types";
import { interpretDeterministic, factsBlock } from "./human/interpret";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function apiKey(): string {
  return (process.env.ANTHROPIC_API_KEY ?? "").trim();
}

export function aiEnabled(): boolean {
  return apiKey().length > 0;
}

function client(): Anthropic {
  return new Anthropic({ apiKey: apiKey() });
}

export async function ask(system: string, user: string, maxTokens = 1600): Promise<string> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// ----------------------------------------------------------------- Evaluador UNO
const UNO_SYSTEM = `Eres un psicólogo organizacional senior, experto en análisis de puestos y cultura institucional.
A partir de la descripción de un PUESTO y de la EMPRESA, construyes el PERFIL DE REFERENCIA ideal del candidato.
Reglas: no inventes datos; lo que infieras va marcado con confianza. Responde SOLO con un objeto JSON válido,
sin texto adicional ni fences, con esta forma:
{
  "resumen": "2-3 líneas del rol y el tipo de persona ideal",
  "discIdeal": { "D": 0-100, "I": 0-100, "S": 0-100, "C": 0-100 },
  "valoresDeseados": ["Teórico|Económico|Estético|Social|Político|Regulatorio", ...],
  "estiloPensamiento": "una frase sobre el estilo de pensamiento ideal (Análisis/Visión/Intuición/Lógica)",
  "notas": "riesgos o consideraciones para la selección"
}`;

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

export async function evaluadorUno(
  puestoText: string,
  empresaText: string
): Promise<ReferenceProfile> {
  if (!aiEnabled()) return { source: "none" };
  try {
    const raw = await ask(
      UNO_SYSTEM,
      `PUESTO:\n${puestoText || "(no especificado)"}\n\nEMPRESA:\n${empresaText || "(no especificado)"}`,
      1200
    );
    const j = extractJson(raw);
    if (!j) return { source: "ai", raw };
    return {
      source: "ai",
      resumen: j.resumen,
      discIdeal: j.discIdeal,
      valoresDeseados: j.valoresDeseados,
      estiloPensamiento: j.estiloPensamiento,
      notas: j.notas,
      raw,
    };
  } catch (e) {
    return { source: "none" };
  }
}

// ----------------------------------------------------------------- Evaluador DOS
const DOS_SYSTEM = `Eres un psicólogo organizacional senior. Interpretas resultados de la prueba HUMAN
(DISC + Valores de Spranger + Proceso Pensante). Te entrego los puntajes y niveles YA CALCULADOS
(deterministas) y las descripciones canónicas del manual: NO recalculas ni inventas descripciones,
las INTEGRAS y SINTETIZAS.

Produce un reporte profesional en Markdown con estas secciones:
1. **Síntesis del perfil** (3-4 líneas)
2. **Comportamiento (DISC)** — lectura integrada de los 4 factores y sus combinaciones
3. **Motivadores (Valores)** — incluye un análisis de la COMBINACIÓN de los valores predominantes
   (cómo se refuerzan o tensionan, qué entorno favorece, cómo influye en sus decisiones)
4. **Estilo de pensamiento (Proceso Pensante)**
5. **Triangulación** — congruencias y discrepancias entre los tres instrumentos
6. **Compatibilidad con el puesto** — solo si se entrega un perfil de referencia
7. **Riesgos / áreas de desarrollo**
8. **Implicaciones para selección y desarrollo**

Eres INSUMO para el psicólogo, no un veredicto: nunca recomiendas contratar o rechazar.`;

export async function evaluadorDos(
  candidateName: string,
  result: HumanResult,
  reference?: ReferenceProfile,
  // Opcional (gated por FLAGS.bigFive en el caller): puntajes Big Five como insumo
  // adicional. Si es undefined, el prompt queda byte-idéntico al anterior.
  bigFive?: BigFiveResult
): Promise<DosReport> {
  const deterministic = interpretDeterministic(result);
  if (!aiEnabled()) {
    return { source: "deterministic", generatedAt: new Date().toISOString(), markdown: deterministic };
  }
  try {
    const refBlock =
      reference && reference.source === "ai"
        ? `PERFIL DE REFERENCIA DEL PUESTO (Evaluador UNO):\n${reference.raw ?? JSON.stringify(reference)}`
        : "PERFIL DE REFERENCIA: no disponible (omite la sección 6).";
    const bigFiveBlock = bigFive
      ? `BIG FIVE (IPIP-50, autorreporte, 0-100 por rasgo): Extraversión ${Math.round(bigFive.scores.E)}, Amabilidad ${Math.round(bigFive.scores.A)}, Responsabilidad ${Math.round(bigFive.scores.C)}, Estabilidad emocional ${Math.round(bigFive.scores.ES)}, Apertura ${Math.round(bigFive.scores.O)}. Intégralo con los demás instrumentos SOLO donde aporte convergencia o matiz; no lo trates como veredicto ni inventes baremos.`
      : null;
    const user = [
      `CANDIDATO: ${candidateName}`,
      "",
      "HECHOS DUROS (puntajes del motor):",
      factsBlock(result),
      "",
      "DESCRIPCIONES CANÓNICAS DEL MANUAL (úsalas como base, no inventes otras):",
      deterministic,
      "",
      refBlock,
      ...(bigFiveBlock ? ["", bigFiveBlock] : []),
    ].join("\n");
    const markdown = await ask(DOS_SYSTEM, user, 2400);
    return { source: "ai", generatedAt: new Date().toISOString(), markdown };
  } catch (e) {
    return { source: "deterministic", generatedAt: new Date().toISOString(), markdown: deterministic };
  }
}
