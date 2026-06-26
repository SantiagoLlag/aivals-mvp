import EvidenceBand from "./EvidenceBand";
import { completitud } from "@/lib/insights/human";
import type { Candidate } from "@/lib/types";
import { getServerT } from "@/lib/i18n-server";

export default function EvidenciaHuman({ candidate }: { candidate: Candidate }) {
  const { t } = getServerT();
  const comp = completitud(candidate.input);
  const disc = candidate.result?.disc;
  return (
    <EvidenceBand fuente="candidate.input · candidate.result.disc (motor determinista)">
      <div>
        <div className="label mb-2">{t("Completitud del protocolo", "Protocol completeness")}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge">DISC {comp.disc[0]}/{comp.disc[1]}</span>
          <span className="badge">Valores {comp.valores[0]}/{comp.valores[1]}</span>
          <span className="badge">Pensante {comp.pensante[0]}/{comp.pensante[1]}</span>
        </div>
        {!comp.full && (
          <p className="text-[11px] text-text3 mt-1.5">
            {t("Protocolo parcial: el motor omite en silencio los ítems sin responder, así que las gráficas pueden verse completas aunque falten respuestas.", "Partial protocol: the engine silently skips unanswered items, so the charts may look complete even when responses are missing.")}
          </p>
        )}
      </div>
      {disc?.notInterpretable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wide">{t("Patrón de validez del instrumento (DISC)", "Instrument validity pattern (DISC)")}</span>
          <p className="mt-0.5">
            {disc.notInterpretableReason ?? t("Patrón no interpretable.", "Pattern not interpretable.")}{" "}
            <span className="text-amber-700/80">{t("— patrón de los puntajes del perfil interpretado, independiente de cuántas series se respondieron.", "— pattern of the scores in the interpreted profile, independent of how many series were answered.")}</span>
          </p>
        </div>
      )}
    </EvidenceBand>
  );
}
