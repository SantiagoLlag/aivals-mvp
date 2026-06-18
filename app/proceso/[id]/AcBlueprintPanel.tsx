"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AcBlueprint } from "@/lib/ac/types";

export default function AcBlueprintPanel({
  processId, blueprint, aiEnabled,
}: { processId: string; blueprint: AcBlueprint | null; aiEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"gen" | "approve" | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy("gen"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/ac`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo generar el ejercicio. Suele ser temporal; intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }
  async function approve() {
    setBusy("approve"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/ac`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo activar. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  const hasItems = !!blueprint && blueprint.charola.items.length > 0;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Assessment Center <span className="text-xs font-normal text-neutral-400">· 5ª vertical</span></h2>
        {blueprint?.approved && hasItems && <span className="text-xs text-S font-medium">● Activo para candidatos</span>}
      </div>

      {!blueprint || !hasItems ? (
        <>
          <p className="text-sm text-neutral-600">
            Genera un ejercicio (bandeja de entrada + situaciones) calibrado al puesto. La IA lo construye;
            tú lo revisas y apruebas antes de activarlo.
          </p>
          {!aiEnabled && <p className="text-xs text-amber-600">Requiere la capa de IA (ANTHROPIC_API_KEY) para generar el ejercicio.</p>}
          <button className="btn-primary text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
            {busy === "gen" ? "Generando… (~1 min)" : "Generar ejercicio AC"}
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-paper border border-line px-2 py-1">📥 {blueprint.charola.items.length} mensajes</span>
            <span className="rounded-md bg-paper border border-line px-2 py-1">🎯 {blueprint.sjt.escenarios.length} situaciones</span>
            <span className="rounded-md bg-paper border border-line px-2 py-1">{blueprint.competencyKeys.length} competencias</span>
            {!blueprint.gentzaFiel && <span title="GENTZA: método de evaluación por competencias con conductas ancla 1–5. 'Provisional' = las anclas aún no son las del catálogo oficial GENTZA." className="rounded-md bg-amber-50 text-amber-700 px-2 py-1 cursor-help">rúbrica provisional (formato GENTZA)</span>}
          </div>

          <button className="text-xs text-accent" onClick={() => setOpen((o) => !o)}>
            {open ? "▼ Ocultar" : "▸ Previsualizar"} el ejercicio
          </button>
          {open && (
            <div className="space-y-2 max-h-80 overflow-y-auto border-t border-line pt-3">
              <p className="text-xs text-neutral-500 italic">{blueprint.contextoPuesto}</p>
              {blueprint.charola.items.map((it, i) => (
                <div key={it.id} className="text-xs border border-line rounded-lg px-3 py-2">
                  <div className="font-medium">📥 {it.asunto}</div>
                  <div className="text-neutral-500">de {it.de} · {it.competencias.join(", ")}</div>
                </div>
              ))}
              {blueprint.sjt.escenarios.map((es, i) => (
                <div key={es.id} className="text-xs border border-line rounded-lg px-3 py-2">
                  <div className="font-medium">🎯 {es.pregunta}</div>
                  <div className="text-neutral-500">{es.competencia}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {!blueprint.approved ? (
              <button className="btn-primary text-sm" disabled={busy === "approve"} onClick={approve}>
                {busy === "approve" ? "Activando…" : "Aprobar y activar"}
              </button>
            ) : (
              <span className="text-sm text-S">✓ Aprobado — los candidatos ya pueden resolverlo.</span>
            )}
            <button className="btn-ghost text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
              {busy === "gen" ? "Regenerando…" : "Regenerar"}
            </button>
          </div>
        </>
      )}

      {busy === "gen" && (
        <p className="text-xs text-neutral-500">La IA está construyendo el ejercicio; puede tardar hasta un minuto. No cierres esta pestaña.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
