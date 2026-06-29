// Selector de store. Si hay credenciales de Supabase, usa Supabase; si no, el archivo local.
// Migrar de uno a otro = solo definir (o quitar) las variables de entorno. La app
// siempre importa desde "@/lib/store" sin saber cuál implementación hay debajo.
import type { StoreApi } from "./types";
import * as fileStore from "./file";
import * as supabaseStore from "./supabase";

const useSupabase = !!(
  process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
);

const impl: StoreApi = useSupabase ? supabaseStore : fileStore;

export const backend: "supabase" | "file" = useSupabase ? "supabase" : "file";

export const listProcesses = impl.listProcesses;
export const getProcess = impl.getProcess;
export const createProcess = impl.createProcess;
export const saveReference = impl.saveReference;
export const reopenCandidate = impl.reopenCandidate;
export const clearReopened = impl.clearReopened;
export const addCandidate = impl.addCandidate;
export const getCandidateByToken = impl.getCandidateByToken;
export const getCandidate = impl.getCandidate;
export const saveResult = impl.saveResult;
export const saveDosReport = impl.saveDosReport;
export const saveAcBlueprint = impl.saveAcBlueprint;
export const saveAcResult = impl.saveAcResult;
export const saveCv = impl.saveCv;
export const saveVoiceBlueprint = impl.saveVoiceBlueprint;
export const saveVoiceResult = impl.saveVoiceResult;
export const saveBigFive = impl.saveBigFive;
export const saveProcessTests = impl.saveProcessTests;
