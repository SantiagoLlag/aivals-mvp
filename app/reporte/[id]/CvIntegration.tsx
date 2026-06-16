"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CvIntegratedEval } from "@/lib/cv/types";

export default function CvIntegration({
  candidateId, initial, canIntegrate, aiEnabled,
}: { candidateId: string; initial: CvIntegratedEval | null; canIntegrate: boolean; aiEnabled: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<CvIntegratedEval | null>(initial);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await fetch(`/api/reporte/${candidateId}/cv`, { method: "POST" });
    if (res.ok) { setData(await res.json()); router.refresh(); }
    setBusy(false);
  }

  if (!canIntegrate) {
    return <p className="text-xs text-neutral-500">La integración con HUMAN estará disponible cuando el candidato complete la prueba HUMAN.</p>;
  }
  if (!data || data.source !== "ai") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-600">Cruza la evidencia del CV con los rasgos de HUMAN para detectar congruencias y discrepancias.</p>
        <button className="btn-primary text-sm" disabled={busy || !aiEnabled} onClick={run}>
          {busy ? "Integrando…" : "Evaluar CV + HUMAN en conjunto"}
        </button>
        {!aiEnabled && <p className="text-xs text-amber-600">Requiere la capa de IA.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Gauge value={data.compatibilidad.score} />
        <div>
          <div className="text-xs text-neutral-500">Compatibilidad integral (CV + HUMAN)</div>
          <p className="text-sm text-neutral-700">{data.compatibilidad.rationale}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Block title="✓ Congruencias" color="text-S" items={data.congruencias} />
        <Block title="⚠ Discrepancias" color="text-amber-600" items={data.discrepancias} />
      </div>

      {data.explorarEnEntrevista.length > 0 && (
        <div>
          <div className="label">Explorar en entrevista</div>
          <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-0.5">
            {data.explorarEnEntrevista.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}
      {data.summary && <p className="text-sm text-neutral-700 border-t border-line pt-2">{data.summary}</p>}

      <button className="text-xs text-accent" disabled={busy} onClick={run}>{busy ? "Regenerando…" : "↻ Regenerar integración"}</button>
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
