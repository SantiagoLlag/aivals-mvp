// Modelo de dominio de la app (procesos, candidatos, reportes).
import type { HumanInput, HumanResult, Factor } from "./human/types";
import type { AcBlueprint, AcResult } from "./ac/types";
import type { CvData } from "./cv/types";
import type { VoiceBlueprint, VoiceResult } from "./voice/types";

export interface ReferenceProfile {
  source: "ai" | "none";
  resumen?: string;
  discIdeal?: Partial<Record<Factor, number>>;
  valoresDeseados?: string[];
  estiloPensamiento?: string;
  notas?: string;
  raw?: string; // texto completo del Evaluador UNO
}

export interface DosReport {
  source: "ai" | "deterministic";
  generatedAt: string;
  markdown: string;
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
  candidates: Candidate[];
}

export interface DB {
  processes: Process[];
}
