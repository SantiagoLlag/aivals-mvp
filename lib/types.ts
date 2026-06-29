// Modelo de dominio de la app (procesos, candidatos, reportes).
import type { HumanInput, HumanResult, Factor } from "./human/types";
import type { AcBlueprint, AcResult } from "./ac/types";
import type { CvData } from "./cv/types";
import type { VoiceBlueprint, VoiceResult } from "./voice/types";
import type { BigFiveCapture } from "./bigfive/types";

export interface ReferenceProfile {
  source: "ai" | "none";
  resumen?: string;
  discIdeal?: Partial<Record<Factor, number>>;
  valoresDeseados?: string[];
  estiloPensamiento?: string;
  notas?: string;
  raw?: string; // texto completo del Evaluador UNO
  edited?: boolean; // el psicólogo ajustó el perfil a mano (source se mantiene "ai" para no romper los gates)
}

export interface DosReport {
  source: "ai" | "deterministic";
  generatedAt: string;
  markdown: string;
  edited?: boolean; // el psicólogo editó la interpretación
}

export type CandidateStatus = "pendiente" | "completado";

export interface Candidate {
  id: string;
  processId: string;
  name: string;
  token: string;
  status: CandidateStatus;
  createdAt: string;
  completedAt?: string;
  input?: HumanInput;
  result?: HumanResult;
  dosReport?: DosReport;
  acResult?: AcResult;
  cv?: CvData;
  voiceResult?: VoiceResult;
  bigFive?: BigFiveCapture;
  // Snapshot de los datos previos cuando se reabre una vertical, para comparar al rehacer
  // y solo recalcular lo que cambió (de momento solo HUMAN).
  reopened?: ReopenSnapshot;
}

export interface ReopenSnapshot {
  human?: { input?: HumanInput; result?: HumanResult; dosReport?: DosReport };
}

export interface Process {
  id: string;
  name: string;
  createdAt: string;
  puestoText: string;
  empresaText: string;
  reference?: ReferenceProfile;
  acBlueprint?: AcBlueprint;
  voiceBlueprint?: VoiceBlueprint;
  // Batería: qué tests aplica este proceso (key del catálogo -> on/off). Ausente = defaults.
  tests?: Record<string, boolean>;
  candidates: Candidate[];
}

export interface DB {
  processes: Process[];
}
