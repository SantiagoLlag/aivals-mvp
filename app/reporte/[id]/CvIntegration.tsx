"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";
import type { CvIntegratedEval } from "@/lib/cv/types";

export default function CvIntegration({
  candidateId, initial, canIntegrate, aiEnabled,
}: { candidateId: string; initial: CvIntegratedEval | null; canIntegrate: boolean; aiEnabled: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [data, setData] = useState<CvIntegratedEval | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/reporte/${candidateId}/cv`, { method: "POST" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      router.refresh();
    } catch {
      setError(t("No se pudo integrar. Suele ser temporal; intenta de nuevo.", "Could not integrate. This is usually temporary; please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (!canIntegrate) {
    return <p className="text-xs text-neutral-500">{t("La integración con HUMAN estará disponible cuando el candidato complete la prueba HUMAN.", "HUMAN integration will be available once the candidate completes the HUMAN assessment.")}</p>;
  }
  if (!data || data.source !== "ai") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-600">{t("Cruza la evidencia del CV con los rasgos de HUMAN para detectar congruencias y discrepancias.", "Cross-reference the CV evidence with the HUMAN traits to detect congruences and discrepancies.")}</p>
        <button className="btn-primary text-sm" disabled={busy || !aiEnabled} onClick={run}>
          {busy ? t("Integrando…", "Integrating…") : t("Evaluar CV + HUMAN en conjunto", "Evaluate CV + HUMAN together")}
        </button>
        {!aiEnabled && <p className="text-xs text-amber-600">{t("Requiere la capa de IA.", "Requires the AI layer.")}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Gauge value={data.compatibilidad.score} />
        <div>
          <div className="text-xs text-neutral-500">{t("Compatibilidad integral (CV + HUMAN)", "Overall compatibility (CV + HUMAN)")}</div>
          <p className="text-sm text-neutral-700">{data.compatibilidad.rationale}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Block title={t("✓ Congruencias", "✓ Congruences")} color="text-S" items={data.congruencias} />
        <Block title={t("⚠ Discrepancias", "⚠ Discrepancies")} color="text-amber-600" items={data.discrepancias} />
      </div>

      {data.explorarEnEntrevista.length > 0 && (
        <div>
          <div className="label">{t("Explorar en entrevista", "Explore in the interview")}</div>
          <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-0.5">
            {data.explorarEnEntrevista.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}
      {data.summary && <p className="text-sm text-neutral-700 border-t border-line pt-2">{data.summary}</p>}

      <button className="text-xs text-accent" disabled={busy} onClick={run}>{busy ? t("Regenerando…", "Regenerating…") : t("↻ Regenerar integración", "↻ Regenerate integration")}</button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Block({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className={`text-xs font-semibold ${color} mb-1`}>{title}</div>
      {items.length ? (
        <ul className="text-sm text-neutral-700 space-y-1">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
      ) : <p className="text-xs text-neutral-400">—</p>}
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const color = value >= 70 ? "#2f7d52" : value >= 45 ? "#9a7b1f" : "#b4533a";
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e3e1da" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${value} 100`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-bold">{value}</span>
    </div>
  );
}
