// Tipos del Big Five (IPIP-50). El motor es determinista (suma con reverse-key), análogo a HUMAN.
export type BigFiveFactor = "E" | "A" | "C" | "ES" | "O";

export interface BigFiveItem {
  id: string;
  factor: BigFiveFactor;
  key: number; // +1 = directo, -1 = inverso (se invierte: 6 - valor)
  en: string;
  es: string;
}

// Respuestas crudas del candidato: id de ítem -> valor 1..5.
export type BigFiveInput = Record<string, number>;

export interface BigFiveResult {
  raw: Record<BigFiveFactor, number>;          // suma con reverse-key por factor
  scores: Record<BigFiveFactor, number>;       // 0..100 por factor (media normalizada)
  answered: number;                            // ítems respondidos (máx 50)
  perFactorCount: Record<BigFiveFactor, number>;
}

// Lo que se guarda en candidates.bigfive (jsonb).
export interface BigFiveCapture {
  input: BigFiveInput;
  result: BigFiveResult;
  completedAt: string;
}

export const BIGFIVE_FACTORS: BigFiveFactor[] = ["E", "A", "C", "ES", "O"];

export const BIGFIVE_FACTOR_LABELS: Record<BigFiveFactor, { es: string; en: string }> = {
  E: { es: "Extraversión", en: "Extraversion" },
  A: { es: "Amabilidad", en: "Agreeableness" },
  C: { es: "Responsabilidad", en: "Conscientiousness" },
  ES: { es: "Estabilidad emocional", en: "Emotional stability" },
  O: { es: "Apertura (intelecto)", en: "Openness (intellect)" },
};
