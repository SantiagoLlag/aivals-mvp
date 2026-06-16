// Tipos del motor HUMAN (DISC + Valores + Proceso Pensante)

export type Factor = "D" | "I" | "S" | "C";
export type FactorScores = Record<Factor, number>;

export type ValueCode = "T" | "E" | "A" | "S" | "P" | "R";
export type ValueScores = Record<ValueCode, number>;

export type Style = "A" | "V" | "I" | "L";
export type StyleScores = Record<Style, number>;

export type Nivel = "BAJO" | "MEDIO" | "ALTO";
export type ComboNivel =
  | "ALTO" | "BAJO" | "MEDIO" | "INTENSO" | "IGUALDAD" | "NO INTERPRETABLE";

// ---- Entrada cruda (lo que responde el candidato) ----
export interface HumanInput {
  // 24 series; por serie la posición (1-4) elegida como "Más" y como "Menos"
  disc: Record<string, { mas: number; menos: number }>;
  // 60 conceptos; id (columna Hoja1) -> ranking 1-6 dentro de su serie
  valores: Record<string, number>;
  // 60 ítems; id (columna Hoja1) -> valor Likert
  pensante: Record<string, number>;
}

// ---- Salida (puntajes + niveles, deterministas) ----
export interface DiscResult {
  profiles: {
    observado: FactorScores;
    proyectado: FactorScores;
    bajoPresion: FactorScores;
  };
  interpretedProfile: "bajoPresion" | "proyectado";
  notInterpretable: boolean;
  notInterpretableReason: string | null;
  combinations: { pair: string; nivel: ComboNivel; text: string }[];
}

export interface ValoresResult {
  scores: ValueScores;
  levels: Record<ValueCode, "ALTO" | "BAJO">;
  predominant: ValueCode[]; // ALTO, ordenados desc, hasta 3
}

export interface PensanteResult {
  scores: StyleScores;
  levels: Record<Style, Nivel>;
  axes: {
    conceptualVsEspecifico: "CONCEPTUAL" | "BALANCE" | "ESPECIFICO";
    izquierdoVsDerecho: "DOMINANTE IZQUIERDO" | "BALANCE" | "DOMINANTE DERECHO";
  };
  cerebroTotal: boolean;
}

export interface HumanResult {
  disc: DiscResult;
  valores: ValoresResult;
  pensante: PensanteResult;
}
