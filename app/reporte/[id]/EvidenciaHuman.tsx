import EvidenceBand from "./EvidenceBand";
import { completitud } from "@/lib/insights/human";
import type { Candidate } from "@/lib/types";

export default function EvidenciaHuman({ candidate }: { candidate: Candidate }) {
  const comp = completitud(candidate.input);
  const disc = candidate.result?.disc;
  return (
    <EvidenceBand fuente="candidate.input · candidate.result.disc (motor determinista)">
      <div>
        <div className="label mb-2">Completitud del protocolo</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge">DISC {comp.disc[0]}/{comp.disc[1]}</span>
          <span className="badge">Valores {comp.valores[0]}/{comp.valores[1]}</span>
          <span className="badge">Pensante {comp.pensante[0]}/{comp.pensante[1]}</span>
        </div>
        {!comp.full && (
          <p className="text-[11px] text-text3 mt-1.5">
            Protocolo parcial: el motor omite en silencio los ítems sin responder, así que las gráficas pueden verse completas aunque falten respuestas.
          </p>
        )}
      </div>
      {disc?.notInterpretable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wide">Patrón de validez del instrumento (DISC)</span>
          <p className="mt-0.5">
            {disc.notInterpretableReason ?? "Patrón no interpretable."}{" "}
            <span className="text-amber-700/80">— patrón de los puntajes del perfil interpretado, independiente de cuántas series se respondieron.</span>
          </p>
        </div>
      )}
    </EvidenceBand>
  );
}
