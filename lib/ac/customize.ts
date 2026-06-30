// Catálogo de personalización del ejercicio AC: 5 preguntas de opción múltiple + nota libre.
// Lo usan el panel (UI) y el generador (prompt) para coincidir en las opciones.
import type { AcCustomization } from "./types";

export const AC_NOTES_MAX = 300;

export interface AcOption { value: string; es: string; en: string }
export type AcQuestionId = "nivel" | "enfoque" | "sector" | "dificultad" | "tono";
export interface AcQuestion { id: AcQuestionId; labelEs: string; labelEn: string; options: AcOption[] }

export const AC_QUESTIONS: AcQuestion[] = [
  {
    id: "nivel", labelEs: "Nivel del puesto", labelEn: "Role level",
    options: [
      { value: "operativo", es: "Operativo", en: "Operational" },
      { value: "mando_medio", es: "Mando medio (supervisión)", en: "Middle management (supervisory)" },
      { value: "gerencial", es: "Gerencial", en: "Managerial" },
      { value: "direccion", es: "Dirección", en: "Executive" },
    ],
  },
  {
    id: "enfoque", labelEs: "Enfoque principal", labelEn: "Primary focus",
    options: [
      { value: "liderazgo", es: "Liderazgo y manejo de equipo", en: "Leadership and team management" },
      { value: "decisiones", es: "Toma de decisiones y priorización", en: "Decision-making and prioritization" },
      { value: "cliente", es: "Servicio y relación con el cliente", en: "Service and client relationships" },
      { value: "analisis", es: "Análisis y planeación", en: "Analysis and planning" },
      { value: "conflicto", es: "Manejo de conflicto y negociación", en: "Conflict management and negotiation" },
    ],
  },
  {
    id: "sector", labelEs: "Sector / contexto", labelEn: "Sector / context",
    options: [
      { value: "comercial", es: "Comercial / ventas", en: "Sales / commercial" },
      { value: "operaciones", es: "Operaciones / logística", en: "Operations / logistics" },
      { value: "corporativo", es: "Corporativo / administrativo", en: "Corporate / administrative" },
      { value: "atencion", es: "Atención a clientes", en: "Customer support" },
      { value: "tecnologia", es: "Tecnología", en: "Technology" },
      { value: "salud", es: "Salud", en: "Healthcare" },
    ],
  },
  {
    id: "dificultad", labelEs: "Carga y dificultad", labelEn: "Load and difficulty",
    options: [
      { value: "ligera", es: "Ligera (4–5 asuntos)", en: "Light (4–5 items)" },
      { value: "estandar", es: "Estándar (5–7 asuntos)", en: "Standard (5–7 items)" },
      { value: "exigente", es: "Exigente (7+ asuntos, decisiones en conflicto)", en: "Demanding (7+ items, conflicting decisions)" },
    ],
  },
  {
    id: "tono", labelEs: "Tono de los escenarios", labelEn: "Tone of the scenarios",
    options: [
      { value: "realista", es: "Realista y neutro", en: "Realistic and neutral" },
      { value: "presion", es: "Alta presión y urgencias", en: "High pressure and urgency" },
      { value: "politico", es: "Político y relacional (stakeholders difíciles)", en: "Political and relational (difficult stakeholders)" },
      { value: "etico", es: "Ético y de integridad", en: "Ethics and integrity" },
    ],
  },
];

const Q_BY_ID = Object.fromEntries(AC_QUESTIONS.map((q) => [q.id, q])) as Record<AcQuestionId, AcQuestion>;

// Valida la entrada del cliente: solo conserva valores de opción reales + recorta la nota a 300.
export function sanitizeCustomization(raw: unknown): AcCustomization {
  const out: AcCustomization = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  for (const q of AC_QUESTIONS) {
    const v = r[q.id];
    if (typeof v === "string" && q.options.some((o) => o.value === v)) out[q.id] = v;
  }
  if (typeof r.notas === "string" && r.notas.trim()) out.notas = r.notas.trim().slice(0, AC_NOTES_MAX);
  return out;
}

export function hasCustomization(c?: AcCustomization | null): boolean {
  return !!c && (!!c.nivel || !!c.enfoque || !!c.sector || !!c.dificultad || !!c.tono || !!c.notas);
}

// Convierte la personalización en un bloque de instrucciones (español) para el prompt de generación.
export function customizationToPrompt(c: AcCustomization): string {
  if (!hasCustomization(c)) return "";
  const lines: string[] = [];
  for (const q of AC_QUESTIONS) {
    const v = c[q.id];
    if (!v) continue;
    const opt = Q_BY_ID[q.id].options.find((o) => o.value === v);
    if (opt) lines.push(`- ${q.labelEs}: ${opt.es}`);
  }
  if (c.notas) lines.push(`- Indicaciones adicionales del psicólogo: "${c.notas}"`);
  if (!lines.length) return "";
  return [
    "PERSONALIZACIÓN SOLICITADA POR EL PSICÓLOGO (respétala al diseñar el ejercicio;",
    "si se indica una carga/dificultad, ajusta el número de ítems en consecuencia):",
    lines.join("\n"),
  ].join("\n");
}
