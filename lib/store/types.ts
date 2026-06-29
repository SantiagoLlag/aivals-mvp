// Contrato del store. Ambas implementaciones (archivo y Supabase) deben cumplirlo,
// de modo que migrar sea solo cambiar cuál se selecciona en index.ts.
import type { Process, Candidate, ReferenceProfile, DosReport } from "../types";
import type { HumanInput, HumanResult } from "../human/types";
import type { AcBlueprint, AcResult } from "../ac/types";
import type { CvData } from "../cv/types";
import type { VoiceBlueprint, VoiceResult } from "../voice/types";
import type { BigFiveInput, BigFiveResult } from "../bigfive/types";

export type ReopenVertical = "human" | "cv" | "ac" | "voz";

export interface StoreApi {
  listProcesses(): Promise<Process[]>;
  getProcess(id: string): Promise<Process | undefined>;
  createProcess(input: {
    name: string;
    puestoText: string;
    empresaText: string;
    reference?: ReferenceProfile;
  }): Promise<Process>;
  saveReference(processId: string, reference: ReferenceProfile): Promise<void>;
  // Reabre la captura de una o más verticales de un candidato para que las rehaga.
  // Guarda un snapshot de los datos previos (al menos HUMAN) para poder comparar al reenviar.
  reopenCandidate(candidateId: string, verticals: ReopenVertical[]): Promise<void>;
  // Borra el snapshot de reapertura de una vertical (tras resolver la comparación al reenviar).
  clearReopened(candidateId: string, vertical: ReopenVertical): Promise<void>;
  addCandidate(processId: string, name: string): Promise<Candidate>;
  getCandidateByToken(tok: string): Promise<{ process: Process; candidate: Candidate } | undefined>;
  getCandidate(id: string): Promise<{ process: Process; candidate: Candidate } | undefined>;
  saveResult(candidateId: string, input: HumanInput, result: HumanResult): Promise<void>;
  saveDosReport(candidateId: string, report: DosReport): Promise<void>;
  saveAcBlueprint(processId: string, blueprint: AcBlueprint): Promise<void>;
  saveAcResult(candidateId: string, result: AcResult): Promise<void>;
  saveCv(candidateId: string, cv: CvData): Promise<void>;
  saveVoiceBlueprint(processId: string, blueprint: VoiceBlueprint): Promise<void>;
  saveVoiceResult(candidateId: string, result: VoiceResult): Promise<void>;
  saveBigFive(candidateId: string, input: BigFiveInput, result: BigFiveResult): Promise<void>;
  // Guarda qué tests aplica el proceso (mapa key del catálogo -> on/off).
  saveProcessTests(processId: string, tests: Record<string, boolean>): Promise<void>;
}
