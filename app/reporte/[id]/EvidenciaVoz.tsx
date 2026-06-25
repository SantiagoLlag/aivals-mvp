import EvidenceBand from "./EvidenceBand";
import { vozStats } from "@/lib/insights/voice";
import type { Candidate } from "@/lib/types";

export default function EvidenciaVoz({ candidate }: { candidate: Candidate }) {
  const captura = candidate.voiceResult?.captura;
  if (!captura?.transcript?.length) return null;
  const s = vozStats(captura);

  return (
    <EvidenceBand fuente="candidate.voiceResult.captura.transcript (ASR de ElevenLabs)">
      <div>
        <div className="label mb-2">Balance de la conversación</div>
        <div className="h-2.5 rounded-full overflow-hidden flex border border-line">
          <div style={{ width: `${s.pctUser}%`, background: "#1d4e57" }} />
          <div style={{ width: `${s.pctAgent}%`, background: "#d8d6cf" }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text2 tabular-nums">
          <span><b className="text-ink">{s.pctUser}%</b> candidato · {s.pctAgent}% colaborador (palabras)</span>
          <span>{s.turnosUser} turnos · prom. {s.palabrasPromedioUser} palabras/turno</span>
          <span>turno más largo: {s.turnoMasLargo} palabras</span>
          <span>{s.preguntas} preguntas (“?”)</span>
          {s.durationSecs != null && <span>{Math.round(s.durationSecs)}s de llamada</span>}
        </div>
        <p className="text-[11px] text-text3 mt-1.5">Cuánto habló cada quién, no calidad de escucha; en un feedback se espera que el jefe lidere.</p>
      </div>

      <div>
        <div className="label mb-2">Transcripción de la llamada</div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto rounded-lg border border-line bg-white p-3">
          {captura.transcript.map((t, i) => (
            <p key={i} className={`text-xs ${t.role === "user" ? "text-ink" : "text-text2"}`}>
              <b className="font-mono text-[10px] uppercase mr-1.5">{t.role === "user" ? candidate.name : "Colaborador"}:</b>{t.text}
            </p>
          ))}
        </div>
        <p className="text-[11px] text-text3 mt-1.5">Transcripción automática (ASR) · puede contener errores de reconocimiento de voz.</p>
      </div>
    </EvidenceBand>
  );
}
