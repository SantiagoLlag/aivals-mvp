"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VoiceBlueprint } from "@/lib/voice/types";

export default function VoiceBlueprintPanel({
  processId, blueprint, aiEnabled, voiceConfigured,
}: { processId: string; blueprint: VoiceBlueprint | null; aiEnabled: boolean; voiceConfigured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"gen" | "approve" | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy("gen"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/voice`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo generar el caso. Suele ser temporal; intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }
  async function approve() {
    setBusy("approve"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/voice`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo activar. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  const ready = !!blueprint && blueprint.generatedBy === "ai" && !!blueprint.scenario.historial_desempeno;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Role-play por voz <span className="text-xs font-normal text-neutral-400">· conversación de desempeño</span></h2>
        {blueprint?.approved && ready && <span className="text-xs text-S font-medium">● Activo para candidatos</span>}
      </div>

      {!voiceConfigured && (
        <p className="text-xs text-amber-600">⚠️ Falta configurar ElevenLabs (ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID) para que los candidatos puedan hacer la llamada.</p>
      )}

      {!ready ? (
        <>
          <p className="text-sm text-neutral-600">Genera el caso (colaborador, historial de bajo desempeño y causa de fondo) calibrado al puesto. La IA lo construye; tú lo revisas y apruebas.</p>
          <button className="btn-primary text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
            {busy === "gen" ? "Generando…" : "Generar caso"}
          </button>
        </>
      ) : (
        <>
          <div className="text-sm space-y-1">
            <div><b>Colaborador:</b> {blueprint!.scenario.nombre_colaborador} · {blueprint!.scenario.puesto_colaborador}</div>
          </div>
          <button className="text-xs text-accent" onClick={() => setOpen((o) => !o)}>{open ? "▼ Ocultar" : "▸ Ver el caso"}</button>
          {open && (
            <div className="space-y-2 border-t border-line pt-3 text-xs text-neutral-700">
              <p>{blueprint!.contexto}</p>
              <p><b>Historial:</b> {blueprint!.scenario.historial_desempeno}</p>
              <p><b>Causa de fondo (oculta al candidato):</b> {blueprint!.scenario.causa_legitima}</p>
              <p className="text-neutral-500">{blueprint!.competencyKeys.length} competencias · agente {blueprint!.agentId ? "✓" : "—"}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {!blueprint!.approved ? (
              <button className="btn-primary text-sm" disabled={busy === "approve"} onClick={approve}>
                {busy === "approve" ? "Activando…" : "Aprobar y activar"}
              </button>
            ) : (
              <span className="text-sm text-S">✓ Aprobado — los candidatos ya pueden hacer la llamada.</span>
            )}
            <button className="btn-ghost text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
              {busy === "gen" ? "Regenerando…" : "Regenerar"}
            </button>
          </div>
        </>
      )}

      {busy === "gen" && (
        <p className="text-xs text-neutral-500">La IA está construyendo el caso; puede tardar hasta un minuto. No cierres esta pestaña.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
