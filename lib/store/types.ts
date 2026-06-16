// Contrato del store. Ambas implementaciones (archivo y Supabase) deben cumplirlo,
// de modo que migrar sea solo cambiar cuál se selecciona en index.ts.
import type { Process, Candidate, ReferenceProfile, DosReport } from "../types";
import type { HumanInput, HumanResult } from "../human/types";
import type { AcBlueprint, AcResult } from "../ac/types";
import type { CvData } from "../cv/types";
import type { VoiceBlueprint, VoiceResult } from "../voice/types";

export interface StoreApi {
  listProcesses(): Promise<Process[]>;
  getProcess(id: string): Promise<Process | undefined>;
  createProcess(input: {
    name: string;
    puestoText: string;
    empresaText: string;
    reference?: ReferenceProfile;
  }): Promise<Process>;
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
}
