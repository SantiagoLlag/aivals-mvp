// Implementación del store en archivo local (.data/db.json). Cero setup externo.
// Útil para desarrollo sin Supabase. Cumple StoreApi.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { DB, Process, Candidate, ReferenceProfile, DosReport } from "../types";
import type { ReopenVertical } from "./types";
import type { HumanInput, HumanResult } from "../human/types";
import type { AcBlueprint, AcResult } from "../ac/types";
import type { CvData } from "../cv/types";
import type { VoiceBlueprint, VoiceResult } from "../voice/types";
import type { BigFiveInput, BigFiveResult } from "../bigfive/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

async function readDB(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf-8")) as DB;
  } catch {
    return { processes: [] };
  }
}
async function writeDB(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}
const token = () => randomUUID().replace(/-/g, "").slice(0, 12);

export async function listProcesses(): Promise<Process[]> {
  const db = await readDB();
  return db.processes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProcess(id: string): Promise<Process | undefined> {
  const db = await readDB();
  return db.processes.find((p) => p.id === id);
}

export async function createProcess(input: {
  name: string; puestoText: string; empresaText: string; reference?: ReferenceProfile;
}): Promise<Process> {
  const db = await readDB();
  const proc: Process = {
    id: randomUUID(),
    name: input.name,
    createdAt: new Date().toISOString(),
    puestoText: input.puestoText,
    empresaText: input.empresaText,
    reference: input.reference,
    candidates: [],
  };
  db.processes.push(proc);
  await writeDB(db);
  return proc;
}

export async function saveReference(processId: string, reference: ReferenceProfile) {
  const db = await readDB();
  const p = db.processes.find((p) => p.id === processId);
  if (!p) throw new Error("Proceso no encontrado");
  p.reference = reference;
  await writeDB(db);
}

export async function reopenCandidate(candidateId: string, verticals: ReopenVertical[]) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (!c) continue;
    const reopened = { ...(c.reopened ?? {}) };
    for (const v of verticals) {
      if (v === "human") {
        // Snapshot de HUMAN antes de limpiar, para comparar al reenviar.
        if (c.input || c.result || c.dosReport) reopened.human = { input: c.input, result: c.result, dosReport: c.dosReport };
        c.result = undefined; c.input = undefined; c.dosReport = undefined; c.status = "pendiente"; c.completedAt = undefined;
      }
      else if (v === "cv") c.cv = undefined;
      else if (v === "ac") c.acResult = undefined;
      else if (v === "voz") c.voiceResult = undefined;
    }
    c.reopened = Object.keys(reopened).length ? reopened : undefined;
    await writeDB(db);
    return;
  }
  throw new Error("Candidato no encontrado");
}

export async function clearReopened(candidateId: string, vertical: ReopenVertical) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (!c) continue;
    if (c.reopened) {
      const next = { ...c.reopened };
      delete (next as Record<string, unknown>)[vertical];
      c.reopened = Object.keys(next).length ? next : undefined;
      await writeDB(db);
    }
    return;
  }
}

export async function addCandidate(processId: string, name: string): Promise<Candidate> {
  const db = await readDB();
  const proc = db.processes.find((p) => p.id === processId);
  if (!proc) throw new Error("Proceso no encontrado");
  const cand: Candidate = {
    id: randomUUID(), processId, name, token: token(),
    status: "pendiente", createdAt: new Date().toISOString(),
  };
  proc.candidates.push(cand);
  await writeDB(db);
  return cand;
}

export async function getCandidateByToken(tok: string) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.token === tok);
    if (c) return { process: p, candidate: c };
  }
  return undefined;
}

export async function getCandidate(id: string) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === id);
    if (c) return { process: p, candidate: c };
  }
  return undefined;
}

export async function saveResult(candidateId: string, input: HumanInput, result: HumanResult) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (c) {
      c.input = input; c.result = result; c.status = "completado";
      c.completedAt = new Date().toISOString();
      await writeDB(db);
      return;
    }
  }
  throw new Error("Candidato no encontrado");
}

export async function saveDosReport(candidateId: string, report: DosReport) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (c) { c.dosReport = report; await writeDB(db); return; }
  }
  throw new Error("Candidato no encontrado");
}

export async function saveAcBlueprint(processId: string, blueprint: AcBlueprint) {
  const db = await readDB();
  const p = db.processes.find((p) => p.id === processId);
  if (!p) throw new Error("Proceso no encontrado");
  p.acBlueprint = blueprint;
  await writeDB(db);
}

export async function saveAcResult(candidateId: string, result: AcResult) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (c) { c.acResult = result; await writeDB(db); return; }
  }
  throw new Error("Candidato no encontrado");
}

export async function saveCv(candidateId: string, cv: CvData) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (c) { c.cv = cv; await writeDB(db); return; }
  }
  throw new Error("Candidato no encontrado");
}

export async function saveVoiceBlueprint(processId: string, blueprint: VoiceBlueprint) {
  const db = await readDB();
  const p = db.processes.find((p) => p.id === processId);
  if (!p) throw new Error("Proceso no encontrado");
  p.voiceBlueprint = blueprint;
  await writeDB(db);
}

export async function saveVoiceResult(candidateId: string, result: VoiceResult) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (c) { c.voiceResult = result; await writeDB(db); return; }
  }
  throw new Error("Candidato no encontrado");
}

export async function saveBigFive(candidateId: string, input: BigFiveInput, result: BigFiveResult) {
  const db = await readDB();
  for (const p of db.processes) {
    const c = p.candidates.find((c) => c.id === candidateId);
    if (c) { c.bigFive = { input, result, completedAt: new Date().toISOString() }; await writeDB(db); return; }
  }
  throw new Error("Candidato no encontrado");
}

export async function saveProcessTests(processId: string, tests: Record<string, boolean>) {
  const db = await readDB();
  const p = db.processes.find((p) => p.id === processId);
  if (!p) throw new Error("Proceso no encontrado");
  p.tests = tests;
  await writeDB(db);
}
