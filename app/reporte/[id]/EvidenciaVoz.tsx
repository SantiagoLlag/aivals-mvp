import EvidenceBand from "./EvidenceBand";
import { vozStats } from "@/lib/insights/voice";
import type { Candidate } from "@/lib/types";
import { getServerT } from "@/lib/i18n-server";

export default function EvidenciaVoz({ candidate }: { candidate: Candidate }) {
  const { t } = getServerT();
  const captura = candidate.voiceResult?.captura;
  if (!captura?.transcript?.length) return null;
  const s = vozStats(captura);

  return (
    <EvidenceBand fuente="candidate.voiceResult.captura.transcript (ASR de ElevenLabs)">
      <div>
        <div className="label mb-2">{t("Balance de la conversación", "Conversation balance")}</div>
        <div className="h-2.5 rounded-full overflow-hidden flex border border-line">
          <div style={{ width: `${s.pctUser}%`, background: "#1d4e57" }} />
          <div style={{ width: `${s.pctAgent}%`, background: "#d8d6cf" }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text2 tabular-nums">
          <span><b className="text-ink">{s.pctUser}%</b> {t(`candidato · ${s.pctAgent}% colaborador (palabras)`, `candidate · ${s.pctAgent}% collaborator (words)`)}</span>
          <span>{t(`${s.turnosUser} turnos · prom. ${s.palabrasPromedioUser} palabras/turno`, `${s.turnosUser} turns · avg. ${s.palabrasPromedioUser} words/turn`)}</span>
          <span>{t(`turno más largo: ${s.turnoMasLargo} palabras`, `longest turn: ${s.turnoMasLargo} words`)}</span>
          <span>{t(`${s.preguntas} preguntas (“?”)`, `${s.preguntas} questions (“?”)`)}</span>
          {s.durationSecs != null && <span>{t(`${Math.round(s.durationSecs)}s de llamada`, `${Math.round(s.durationSecs)}s of call`)}</span>}
        </div>
        <p className="text-[11px] text-text3 mt-1.5">{t("Cuánto habló cada quién, no calidad de escucha; en un feedback se espera que el jefe lidere.", "How much each person spoke, not listening quality; in a feedback session the manager is expected to lead.")}</p>
      </div>

      <div>
        <div className="label mb-2">{t("Transcripción de la llamada", "Call transcript")}</div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto rounded-lg border border-line bg-white p-3">
          {captura.transcript.map((turn, i) => (
            <p key={i} className={`text-xs ${turn.role === "user" ? "text-ink" : "text-text2"}`}>
              <b className="font-mono text-[10px] uppercase mr-1.5">{turn.role === "user" ? candidate.name : t("Colaborador", "Collaborator")}:</b>{turn.text}
            </p>
          ))}
        </div>
        <p className="text-[11px] text-text3 mt-1.5">{t("Transcripción automática (ASR) · puede contener errores de reconocimiento de voz.", "Automatic transcription (ASR) · may contain speech-recognition errors.")}</p>
      </div>
    </EvidenceBand>
  );
}
