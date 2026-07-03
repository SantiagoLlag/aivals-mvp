// Sección colapsable que agrupa los paneles de configuración del proceso.
// <details> nativo (sin JS): el navegador maneja abierto/cerrado; el resumen de una
// línea se calcula en page.tsx y llega como prop.
import { getServerT } from "@/lib/i18n-server";
import type { ReactNode } from "react";

export default function ConfigSection({
  summary,
  defaultOpen,
  children,
}: {
  summary: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const { t } = getServerT();
  return (
    <details className="group" open={defaultOpen}>
      <summary className="card block cursor-pointer select-none py-3 list-none [&::-webkit-details-marker]:hidden hover:border-line2 transition">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
              {t("Configuración del proceso", "Process setup")}
            </div>
            <div className="text-sm text-neutral-600 truncate mt-0.5">{summary}</div>
          </div>
          <span aria-hidden className="text-text3 text-sm shrink-0 transition-transform group-open:rotate-180">
            ▾
          </span>
        </div>
      </summary>
      <div className="mt-4 space-y-6">{children}</div>
    </details>
  );
}
