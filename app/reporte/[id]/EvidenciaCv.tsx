import EvidenceBand from "./EvidenceBand";
import { cvMetrics } from "@/lib/insights/cv";
import type { Candidate } from "@/lib/types";
import { getServerT } from "@/lib/i18n-server";

export default function EvidenciaCv({ candidate }: { candidate: Candidate }) {
  const { t } = getServerT();
  const cv = candidate.cv;
  if (!cv?.text) return null;
  const m = cvMetrics(cv);

  return (
    <EvidenceBand fuente="candidate.cv.text (extracción unpdf, determinista)">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="badge">{t(`${m.palabras} palabras`, `${m.palabras} words`)}</span>
        <span className="badge">{t(`${m.chars} caracteres`, `${m.chars} characters`)}</span>
      </div>

      <div>
        <div className="label mb-1.5">{t("Secciones detectadas (por patrón)", "Detected sections (by pattern)")}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {m.secciones.map((s) => (
            <span key={s.label} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${s.presente ? "border-line bg-white text-ink" : "border-dashed border-line2 bg-paper text-text3"}`}>
              {s.presente ? "✓" : "—"} {s.label}
            </span>
          ))}
        </div>
      </div>

      {(m.anios.length > 0 || m.emails.length > 0 || m.urls.length > 0) && (
        <div className="text-xs space-y-1">
          {m.anios.length > 0 && (
            <div>
              <span className="text-text3 font-mono text-[10px] uppercase">{t("años hallados", "years found")}</span>{" "}
              <span className="tabular-nums text-text2">{m.anios.join(" · ")}</span>{" "}
              <span className="text-text3">{t("(incluye titulación y fechas no laborales)", "(includes graduation and non-work dates)")}</span>
            </div>
          )}
          {m.emails.length > 0 && <div><span className="text-text3 font-mono text-[10px] uppercase">{t("correos", "emails")}</span> <span className="text-text2">{m.emails.join(" · ")}</span></div>}
          {m.urls.length > 0 && <div><span className="text-text3 font-mono text-[10px] uppercase">{t("enlaces", "links")}</span> <span className="text-text2 break-all">{m.urls.join(" · ")}</span></div>}
        </div>
      )}

      <details className="rounded-lg border border-line bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium">{t("Texto extraído del CV (léelo y juzga)", "Text extracted from the CV (read it and judge)")}</summary>
        <div className="px-3 pb-3">
          <p className="font-serif text-sm text-ink whitespace-pre-line max-h-96 overflow-y-auto">{cv.text}</p>
        </div>
      </details>
      <p className="text-[11px] text-text3">{t("Detección de patrones, no evaluación de contenido.", "Pattern detection, not content evaluation.")}</p>
    </EvidenceBand>
  );
}
