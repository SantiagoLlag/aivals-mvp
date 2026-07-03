// Tipos del comparador de candidatos (tablero del panel del psicólogo).
// El cálculo de encaje es DETERMINISTA y vive en score.ts; aquí solo las formas.
import type { HumanResult } from "@/lib/human/types";

export type VerticalKey = "human" | "ac" | "cv" | "voz";
export type Sem = "verde" | "amarillo" | "rojo" | "gris";

// Una celda de detalle (competencia / dimensión / sub-encaje), nivel 2 del tablero.
export interface CompetencyCell {
  key: string;
  name: string;
  score: number;            // valor en su escala original
  scale: "1-5" | "0-100";
  pct: number;              // normalizado 0-100 (para color y barra)
  color: Sem;
  evidence?: string[];      // citas verbatim cuando existan
  note?: string;            // racional o detalle textual
}

// Resumen por vertical (nivel 1 del tablero) + su detalle expandible (nivel 2).
export interface VerticalScore {
  key: VerticalKey;
  label: string;
  available: boolean;       // el candidato completó esta vertical (haya o no encaje medible)
  pct: number | null;       // encaje 0-100 de la vertical; null = no medible (p. ej. sin perfil ideal)
  color: Sem;
  detail: CompetencyCell[];
  note?: string;
}

// Una fila del comparador: un candidato con sus 4 verticales ya calculadas.
export interface CandidateComparison {
  id: string;
  name: string;
  token: string;
  status: "pendiente" | "completado";
  verticals: Record<VerticalKey, VerticalScore>;
  completeness: number;     // # de verticales con encaje medible (0-4)
  human: HumanResult | null; // crudo, para dibujar los charts HUMAN en el detalle
  // Big Five (IPIP-50) 0-100 por rasgo. DESCRIPTIVO: se muestra en el detalle,
  // NO entra al encaje ni al ranking. Solo se puebla con FLAGS.bigFive prendido.
  bigFive?: { scores: Record<string, number> } | null;
}

// Resumen del perfil ideal del puesto (Evaluador UNO), para mostrar el "contra qué" se compara.
export interface ReferenceMini {
  hasReference: boolean;
  discIdeal?: Partial<Record<"D" | "I" | "S" | "C", number>>;
  valoresDeseados?: string[];
  estiloPensamiento?: string;
  resumen?: string;
}
