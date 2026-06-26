import type { ReactNode } from "react";
import { getServerT } from "@/lib/i18n-server";

// Banda de EVIDENCIA (sin IA): espejo del .ai-surface pero en hueso-papel, con glifo de regla
// (no la chispa de IA). Todo lo que va dentro es computado del instrumento, sin modelo de lenguaje.
export default function EvidenceBand({ fuente, children }: { fuente?: string; children: ReactNode }) {
  const { t } = getServerT();
  return (
    <div className="rounded-xl border border-line bg-paper overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        {t("Evidencia · computado sin IA · determinista", "Evidence · computed without AI · deterministic")}
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[11px] text-text3">{t("Dato computado del instrumento, sin modelo de lenguaje.", "Data computed from the instrument, without a language model.")} <b className="text-text2 font-medium">{t("Tú interpretas.", "You interpret.")}</b></p>
        {children}
        {fuente && <div className="font-mono text-[10px] text-text3 pt-2 border-t border-line/60">{t("fuente:", "source:")} {fuente}</div>}
      </div>
    </div>
  );
}

// Divisor entre la evidencia (arriba) y la interpretación de IA (abajo).
export function EvidenceDivider() {
  const { t } = getServerT();
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-text3 uppercase tracking-wide">
      <span className="h-px flex-1 bg-line" />
      {t("↓ interpretación · IA · valida antes de decidir", "↓ interpretation · AI · validate before deciding")}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
