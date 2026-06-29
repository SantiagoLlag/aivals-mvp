// Implementación del store sobre Supabase (Postgres). Cumple StoreApi.
// Acceso SOLO server-side con la clave service_role (omite RLS). El navegador
// nunca usa estas credenciales.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Process, Candidate, ReferenceProfile, DosReport } from "../types";
import type { ReopenVertical } from "./types";
import type { HumanInput, HumanResult } from "../human/types";
import type { AcBlueprint, AcResult } from "../ac/types";
import type { CvData } from "../cv/types";
import type { VoiceBlueprint, VoiceResult } from "../voice/types";
import type { BigFiveInput, BigFiveResult } from "../bigfive/types";

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  _sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Evita el Data Cache de Next.js App Router: cada lectura va fresca a Postgres.
    global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return _sb;
}

const newToken = () => randomUUID().replace(/-/g, "").slice(0, 12);

// ---- mapeos fila <-> dominio ----
/* eslint-disable @typescript-eslint/no-explicit-any */
function toCandidate(r: any): Candidate {
  return {
    id: r.id,
    processId: r.process_id,
    name: r.name,
    token: r.token,
    status: r.status,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
    input: r.input ?? undefined,
    result: r.result ?? undefined,
    dosReport: r.dos_report ?? undefined,
    acResult: r.ac_result ?? undefined,
    cv: r.cv ?? undefined,
    voiceResult: r.voice_result ?? undefined,
    bigFive: r.bigfive ?? undefined,
    reopened: r.reopened ?? undefined,
  };
}
function toProcess(r: any, candidates: Candidate[]): Process {
  return {
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    puestoText: r.puesto_text,
    empresaText: r.empresa_text,
    reference: r.reference ?? undefined,
    acBlueprint: r.ac_blueprint ?? undefined,
    voiceBlueprint: r.voice_blueprint ?? undefined,
    tests: r.tests ?? undefined,
    candidates,
  };
}

export async function listProcesses(): Promise<Process[]> {
  const { data: procs, error } = await sb().from("processes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  if (!procs?.length) return [];
  const { data: cands } = await sb().from("candidates").select("*").in("process_id", procs.map((p: any) => p.id));
  const byPid: Record<string, any[]> = {};
  for (const c of cands ?? []) (byPid[c.process_id] ??= []).push(c);
  return procs.map((p: any) => toProcess(p, (byPid[p.id] ?? []).map(toCandidate)));
}

export async function getProcess(id: string): Promise<Process | undefined> {
  const { data: p } = await sb().from("processes").select("*").eq("id", id).maybeSingle();
  if (!p) return undefined;
  const { data: cands } = await sb().from("candidates").select("*").eq("process_id", id).order("created_at");
  return toProcess(p, (cands ?? []).map(toCandidate));
}

export async function createProcess(input: {
  name: string; puestoText: string; empresaText: string; reference?: ReferenceProfile;
}): Promise<Process> {
  const { data, error } = await sb().from("processes").insert({
    name: input.name,
    puesto_text: input.puestoText,
    empresa_text: input.empresaText,
    reference: input.reference ?? null,
  }).select().single();
  if (error) throw error;
  return toProcess(data, []);
}

export async function saveReference(processId: string, reference: ReferenceProfile) {
  const { error } = await sb().from("processes").update({ reference }).eq("id", processId);
  if (error) throw error;
}

export async function reopenCandidate(candidateId: string, verticals: ReopenVertical[]) {
  // Leemos la fila para conservar un snapshot de HUMAN (input/result/dos) antes de limpiar,
  // y poder comparar al reenviar. AC/CV/Voz se limpian sin snapshot (recalculan al rehacer).
  const { data: row } = await sb().from("candidates").select("*").eq("id", candidateId).maybeSingle();
  if (!row) throw new Error("Candidato no encontrado");
  const reopened: Record<string, unknown> = { ...(row.reopened ?? {}) };
  const patch: Record<string, unknown> = {};
  for (const v of verticals) {
    if (v === "human") {
      if (row.input || row.result || row.dos_report) {
        reopened.human = { input: row.input ?? null, result: row.result ?? null, dosReport: row.dos_report ?? null };
      }
      patch.result = null; patch.input = null; patch.dos_report = null; patch.status = "pendiente"; patch.completed_at = null;
    } else if (v === "cv") patch.cv = null;
    else if (v === "ac") patch.ac_result = null;
    else if (v === "voz") patch.voice_result = null;
  }
  if (Object.keys(patch).length === 0) return;
  patch.reopened = Object.keys(reopened).length ? reopened : null;
  const { error } = await sb().from("candidates").update(patch).eq("id", candidateId);
  if (error) throw error;
}

export async function clearReopened(candidateId: string, vertical: ReopenVertical) {
  const { data: row } = await sb().from("candidates").select("reopened").eq("id", candidateId).maybeSingle();
  if (!row?.reopened) return;
  const reopened: Record<string, unknown> = { ...row.reopened };
  delete reopened[vertical];
  const next = Object.keys(reopened).length ? reopened : null;
  const { error } = await sb().from("candidates").update({ reopened: next }).eq("id", candidateId);
  if (error) throw error;
}

export async function addCandidate(processId: string, name: string): Promise<Candidate> {
  const { data, error } = await sb().from("candidates").insert({
    process_id: processId, name, token: newToken(), status: "pendiente",
  }).select().single();
  if (error) throw error;
  return toCandidate(data);
}

export async function getCandidateByToken(tok: string) {
  const { data: c } = await sb().from("candidates").select("*").eq("token", tok).maybeSingle();
  if (!c) return undefined;
  const process = await getProcess(c.process_id);
  if (!process) return undefined;
  return { process, candidate: toCandidate(c) };
}

export async function getCandidate(id: string) {
  const { data: c } = await sb().from("candidates").select("*").eq("id", id).maybeSingle();
  if (!c) return undefined;
  const process = await getProcess(c.process_id);
  if (!process) return undefined;
  return { process, candidate: toCandidate(c) };
}

export async function saveResult(candidateId: string, input: HumanInput, result: HumanResult) {
  const { error } = await sb().from("candidates").update({
    input, result, status: "completado", completed_at: new Date().toISOString(),
  }).eq("id", candidateId);
  if (error) throw error;
}

export async function saveDosReport(candidateId: string, report: DosReport) {
  const { error } = await sb().from("candidates").update({ dos_report: report }).eq("id", candidateId);
  if (error) throw error;
}

export async function saveAcBlueprint(processId: string, blueprint: AcBlueprint) {
  const { error } = await sb().from("processes").update({ ac_blueprint: blueprint }).eq("id", processId);
  if (error) throw error;
}

export async function saveAcResult(candidateId: string, result: AcResult) {
  const { error } = await sb().from("candidates").update({ ac_result: result }).eq("id", candidateId);
  if (error) throw error;
}

export async function saveCv(candidateId: string, cv: CvData) {
  const { error } = await sb().from("candidates").update({ cv }).eq("id", candidateId);
  if (error) throw error;
}

export async function saveVoiceBlueprint(processId: string, blueprint: VoiceBlueprint) {
  const { error } = await sb().from("processes").update({ voice_blueprint: blueprint }).eq("id", processId);
  if (error) throw error;
}

export async function saveVoiceResult(candidateId: string, result: VoiceResult) {
  const { error } = await sb().from("candidates").update({ voice_result: result }).eq("id", candidateId);
  if (error) throw error;
}

export async function saveBigFive(candidateId: string, input: BigFiveInput, result: BigFiveResult) {
  const bigfive = { input, result, completedAt: new Date().toISOString() };
  const { error } = await sb().from("candidates").update({ bigfive }).eq("id", candidateId);
  if (error) throw error;
}

export async function saveProcessTests(processId: string, tests: Record<string, boolean>) {
  const { error } = await sb().from("processes").update({ tests }).eq("id", processId);
  if (error) throw error;
}
