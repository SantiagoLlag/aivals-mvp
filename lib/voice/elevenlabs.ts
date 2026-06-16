// Cliente server-side de ElevenLabs Conversational AI (signed URL + transcript).
import type { TranscriptTurn, ElevenAnalysis } from "./types";

const BASE = "https://api.elevenlabs.io";
const key = () => (process.env.ELEVENLABS_API_KEY ?? "").trim();
export const agentId = () => (process.env.ELEVENLABS_AGENT_ID ?? "").trim();
export const voiceEnabled = () => !!key() && !!agentId();

// Firma una URL de sesión para que el candidato hable con el agente (agente privado).
export async function getSignedUrl(): Promise<string> {
  const res = await fetch(`${BASE}/v1/convai/conversation/get-signed-url?agent_id=${agentId()}`, {
    headers: { "xi-api-key": key() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`get-signed-url ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.signed_url as string;
}

// Recupera el transcript tras la llamada (con reintento: tarda unos segundos en procesarse).
function parseAnalysis(j: any): ElevenAnalysis | undefined {
  const a = j?.analysis;
  if (!a) return undefined;
  const criteria = Object.entries(a.evaluation_criteria_results ?? {}).map(([id, v]: [string, any]) => ({
    id, result: v?.result ?? "unknown", rationale: v?.rationale ?? "",
  }));
  const dataCollection = Object.entries(a.data_collection_results ?? {}).map(([key, v]: [string, any]) => ({
    key, value: v?.value, rationale: v?.rationale ?? "",
  }));
  return { criteria, dataCollection, summary: a.transcript_summary ?? "" };
}

export async function getTranscript(
  conversationId: string
): Promise<{ transcript: TranscriptTurn[]; durationSecs?: number; analysis?: ElevenAnalysis }> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(`${BASE}/v1/convai/conversations/${conversationId}`, {
      headers: { "xi-api-key": key() },
      cache: "no-store",
    });
    if (res.ok) {
      const j = await res.json();
      const raw: any[] = j.transcript ?? [];
      const ready = j.status === "done" || j.status === "completed";
      if (raw.length > 0 && ready) {
        const transcript: TranscriptTurn[] = raw
          .map((t) => ({ role: t.role === "user" ? "user" : "agent", text: (t.message ?? t.text ?? "").trim() }))
          .filter((t) => t.text) as TranscriptTurn[];
        return { transcript, durationSecs: j.metadata?.call_duration_secs, analysis: parseAnalysis(j) };
      }
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return { transcript: [] };
}
