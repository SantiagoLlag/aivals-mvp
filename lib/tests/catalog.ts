// Catálogo de instrumentos (la "batería") + qué tests aplica cada proceso.
// El aplicador elige por proceso; los defaults preservan el comportamiento anterior.
import type { Process } from "@/lib/types";

export type TestKey = "human" | "bigfive" | "cv" | "ac" | "voz";

export interface TestMeta {
  key: TestKey;
  nameEs: string; nameEn: string;
  descEs: string; descEn: string;
  blueprint?: boolean; // requiere configurar un escenario (AC/Voz) para poder aplicarse
  newish?: boolean;    // se muestra como "Nuevo"
}

export const TEST_CATALOG: TestMeta[] = [
  { key: "human", nameEs: "Prueba HUMAN", nameEn: "HUMAN test",
    descEs: "Comportamiento (DISC), motivadores (Valores) y estilo de pensamiento.", descEn: "Behavior (DISC), motivators (Values) and thinking style." },
  { key: "bigfive", nameEs: "Big Five (IPIP-50)", nameEn: "Big Five (IPIP-50)", newish: true,
    descEs: "Los cinco grandes rasgos de personalidad. 50 ítems autodescriptivos, ~7 min.", descEn: "The five broad personality traits. 50 self-descriptive items, ~7 min." },
  { key: "cv", nameEs: "CV / Evidencias", nameEn: "Résumé / Evidence",
    descEs: "El candidato sube su CV en PDF; se analiza contra el puesto.", descEn: "The candidate uploads their résumé (PDF); it is analyzed against the role." },
  { key: "ac", nameEs: "Assessment Center", nameEn: "Assessment Center", blueprint: true,
    descEs: "Bandeja de entrada + situaciones calibradas al puesto.", descEn: "Inbox + situations calibrated to the role." },
  { key: "voz", nameEs: "Role-play por voz", nameEn: "Voice role-play", blueprint: true,
    descEs: "Llamada en vivo con un colaborador interpretado por IA.", descEn: "Live call with an AI-played team member." },
];

// ¿El aplicador eligió aplicar este test? (default: nuevos = opt-in; el resto on, por compatibilidad)
export function testSelected(proc: Pick<Process, "tests">, key: TestKey): boolean {
  const cfg = proc.tests;
  if (cfg && typeof cfg[key] === "boolean") return cfg[key] as boolean;
  return key === "bigfive" ? false : true;
}

// ¿Está listo para aplicarse? (AC/Voz necesitan blueprint aprobado; el resto siempre)
export function testReady(proc: Process, key: TestKey): boolean {
  if (key === "ac") return !!proc.acBlueprint?.approved && (proc.acBlueprint.charola?.items?.length ?? 0) > 0;
  if (key === "voz") return !!proc.voiceBlueprint?.approved;
  return true;
}

// Se le muestra al candidato sólo si lo eligieron Y está listo.
export function testActive(proc: Process, key: TestKey): boolean {
  return testSelected(proc, key) && testReady(proc, key);
}
