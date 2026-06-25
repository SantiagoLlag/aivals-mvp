// Evidencia determinista del role-play por voz (sin IA). Conteos sobre el transcript (ASR).
import type { VoiceCapture } from "@/lib/voice/types";
import { wordCount, countQuestions } from "./text";

export type VozStats = {
  turnosUser: number; turnosAgent: number;
  palabrasUser: number; palabrasAgent: number;
  pctUser: number; pctAgent: number;
  palabrasPromedioUser: number;
  turnoMasLargo: number;
  preguntas: number;
  durationSecs?: number;
};

// Balance conversacional: cuánto habló cada quién y marcadores DUROS (preguntas).
// OJO: durationSecs es el wall-clock total de la llamada (incluye al agente y los silencios),
// por eso NO se calcula "velocidad de habla" — sería engañoso para quien escuchó mucho.
export function vozStats(captura: VoiceCapture): VozStats {
  const turns = captura.transcript ?? [];
  const user = turns.filter((t) => t.role === "user");
  const agent = turns.filter((t) => t.role === "agent");
  const uw = user.reduce((n, t) => n + wordCount(t.text), 0);
  const aw = agent.reduce((n, t) => n + wordCount(t.text), 0);
  const totalW = uw + aw || 1;
  return {
    turnosUser: user.length,
    turnosAgent: agent.length,
    palabrasUser: uw,
    palabrasAgent: aw,
    pctUser: Math.round((uw / totalW) * 100),
    pctAgent: Math.round((aw / totalW) * 100),
    palabrasPromedioUser: user.length ? Math.round(uw / user.length) : 0,
    turnoMasLargo: user.reduce((m, t) => Math.max(m, wordCount(t.text)), 0),
    preguntas: user.reduce((n, t) => n + countQuestions(t.text), 0),
    durationSecs: captura.durationSecs,
  };
}
