import EvidenceBand from "./EvidenceBand";
import { accionDistribution, accionIcon, rationaleWords } from "@/lib/insights/ac";
import type { Candidate, Process } from "@/lib/types";
import { getServerT } from "@/lib/i18n-server";

export default function EvidenciaAc({ candidate, proc }: { candidate: Candidate; proc: Process }) {
  const { t } = getServerT();
  const captura = candidate.acResult?.captura;
  if (!captura) return null;
  const dist = accionDistribution(captura);
  const itemById = new Map((proc.acBlueprint?.charola.items ?? []).map((it) => [it.id, it]));
  const escById = new Map((proc.acBlueprint?.sjt.escenarios ?? []).map((e) => [e.id, e]));

  return (
    <EvidenceBand fuente="candidate.acResult.captura (verbatim del candidato)">
      <div>
        <div className="label mb-2">{t("Distribución de acciones · charola", "Action distribution · in-tray")}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {dist.counts.map((c) => (
            <span key={c.accion} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 tabular-nums">
              <span>{c.icon}</span><span className="text-text2">{c.accion}</span><b className="text-ink">{c.n}</b>
            </span>
          ))}
          {dist.sinResponder > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line2 bg-paper px-2 py-1 tabular-nums text-text3">
              {t("Sin responder", "Unanswered")} <b>{dist.sinResponder}</b>
            </span>
          )}
        </div>
        <p className="text-[11px] text-text3 mt-1.5">
          {t(`Conteo crudo sobre ${dist.contestados} de ${dist.total} ítems contestados. Es ipsativo: con N pequeño no es una distribución estable.`, `Raw count over ${dist.contestados} of ${dist.total} items answered. It is ipsative: with a small N it is not a stable distribution.`)}
        </p>
      </div>

      <div>
        <div className="label mb-2">{t("Captura verbatim · correo → acción → motivo", "Verbatim capture · email → action → reason")}</div>
        <div className="space-y-2">
          {captura.charola.map((r, i) => {
            const it = itemById.get(r.itemId);
            return (
              <details key={i} className="rounded-lg border border-line bg-white">
                <summary className="cursor-pointer px-3 py-2 text-xs flex items-center gap-2">
                  <span className="font-medium text-ink truncate">{it?.asunto ?? r.itemId}</span>
                  {it?.de && <span className="text-text3 whitespace-nowrap">{t("· de", "· from")} {it.de}</span>}
                  <span className="ml-auto inline-flex items-center gap-1 text-text2 whitespace-nowrap">{accionIcon(r.accion)} {r.accion || t("Sin acción", "No action")}</span>
                </summary>
                <div className="px-3 pb-3 space-y-2">
                  {it?.cuerpo && <p className="text-xs text-text2 whitespace-pre-line border-l-2 border-line pl-2">{it.cuerpo}</p>}
                  {r.rationale
                    ? <blockquote className="font-serif italic text-sm text-ink border-l-2 border-accent/40 pl-3">“{r.rationale}” <span className="not-italic font-mono text-[10px] text-text3">· {t(`${rationaleWords(r.rationale)} palabras`, `${rationaleWords(r.rationale)} words`)}</span></blockquote>
                    : <p className="text-xs text-text3">{t("Sin motivo escrito.", "No reason written.")}</p>}
                </div>
              </details>
            );
          })}
          {captura.sjt.map((r, i) => {
            const es = escById.get(r.scenarioId);
            return (
              <details key={`s${i}`} className="rounded-lg border border-line bg-white">
                <summary className="cursor-pointer px-3 py-2 text-xs flex items-center gap-2">
                  <span className="chip">SJT</span>
                  <span className="font-medium text-ink truncate">{es?.pregunta ?? r.scenarioId}</span>
                </summary>
                <div className="px-3 pb-3 space-y-2">
                  {es?.situacion && <p className="text-xs text-text2">{es.situacion}</p>}
                  {r.respuesta
                    ? <blockquote className="font-serif italic text-sm text-ink border-l-2 border-accent/40 pl-3">“{r.respuesta}”</blockquote>
                    : <p className="text-xs text-text3">{t("Sin respuesta.", "No answer.")}</p>}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </EvidenceBand>
  );
}
