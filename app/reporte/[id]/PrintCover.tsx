import { getServerT } from "@/lib/i18n-server";

// Portada del reporte SOLO para impresión/PDF (FLAGS.reportNav): oculta en pantalla
// (hidden) y visible al imprimir (print:block), con salto de página después para que
// el contenido del reporte empiece en la página siguiente.
export default function PrintCover({
  candidateName,
  processName,
  verticals,
}: {
  candidateName: string;
  processName: string;
  verticals: { label: string; on: boolean }[];
}) {
  const { t, lang } = getServerT();
  const completed = verticals.filter((v) => v.on);
  const dateStr = new Date().toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="hidden print:block" style={{ breakAfter: "page" }}>
      <div className="min-h-[85vh] flex flex-col">
        {/* Marca Aivals (mismo logo que SiteHeader) */}
        <div className="flex items-center gap-2 font-semibold text-accent900">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 L20 19 H15.2 L12 11.6 L8.8 19 H4 Z" fill="#11303a" />
            <circle cx="12" cy="15.4" r="1.5" fill="#2b7a83" />
          </svg>
          <span className="text-lg">Aivals</span>
        </div>

        {/* Identidad del reporte */}
        <div className="flex-1 flex flex-col justify-center py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-text3">
            {t("Reporte de evaluación", "Evaluation report")}
          </p>
          <h1 className="text-4xl font-bold tracking-tight mt-2">{candidateName}</h1>
          <p className="text-sm text-neutral-500 mt-3">
            {t("Proceso:", "Process:")} <span className="text-ink font-medium">{processName}</span>
          </p>
          <p className="text-sm text-neutral-500 mt-1">{dateStr}</p>

          <div className="mt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-text3 mb-2">
              {t("Actividades completadas", "Completed activities")}
            </p>
            {completed.length ? (
              <div className="flex flex-wrap gap-1.5">
                {completed.map((v) => (
                  <span
                    key={v.label}
                    className="text-[11px] rounded-full px-2.5 py-1 font-medium bg-accentSoft text-accent border border-line"
                  >
                    ✓ {v.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">{t("Aún sin actividades completadas.", "No activities completed yet.")}</p>
            )}
          </div>
        </div>

        {/* Disclaimer + línea de firma */}
        <div className="space-y-12">
          <p className="text-[11px] text-neutral-500 border-t border-line pt-3 leading-relaxed">
            {t(
              "La IA es un insumo para el psicólogo, no un veredicto: la interpretación y la decisión finales sobre este reporte son profesionales y humanas.",
              "AI is an input for the psychologist, not a verdict: the final interpretation and decision on this report are professional and human."
            )}
          </p>
          <div className="w-80 border-t border-ink pt-2">
            <p className="text-sm">{t("Nombre y firma del psicólogo responsable", "Name and signature of the responsible psychologist")}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{t("Cédula profesional:", "Professional license no.:")} _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
