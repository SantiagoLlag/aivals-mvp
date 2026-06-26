"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";
import type { VoiceBlueprint } from "@/lib/voice/types";

export default function VoiceBlueprintPanel({
  processId, blueprint, aiEnabled, voiceConfigured,
}: { processId: string; blueprint: VoiceBlueprint | null; aiEnabled: boolean; voiceConfigured: boolean }) {
  const { t } = useT();
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
      setError(t("No se pudo generar el caso. Suele ser temporal; intenta de nuevo.", "The case could not be generated. This is usually temporary; please try again."));
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
      setError(t("No se pudo activar. Intenta de nuevo.", "Could not activate. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  const ready = !!blueprint && blueprint.generatedBy === "ai" && !!blueprint.scenario.historial_desempeno;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("Role-play por voz", "Voice role-play")} <span className="text-xs font-normal text-neutral-400">{t("· conversación de desempeño", "· performance conversation")}</span></h2>
        {blueprint?.approved && ready && <span className="text-xs text-S font-medium">{t("● Activo para candidatos", "● Active for candidates")}</span>}
      </div>

      {!voiceConfigured && (
        <p className="text-xs text-amber-600">{t("⚠️ Falta configurar ElevenLabs (ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID) para que los candidatos puedan hacer la llamada.", "⚠️ ElevenLabs is not yet configured (ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID) so candidates can make the call.")}</p>
      )}

      {!ready ? (
        <>
          <p className="text-sm text-neutral-600">{t("Genera el caso (colaborador, historial de bajo desempeño y causa de fondo) calibrado al puesto. La IA lo construye; tú lo revisas y apruebas.", "Generate the case (team member, low-performance history, and underlying cause) calibrated to the role. The AI builds it; you review and approve it.")}</p>
          <button className="btn-primary text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
            {busy === "gen" ? t("Generando…", "Generating…") : t("Generar caso", "Generate case")}
          </button>
        </>
      ) : (
        <>
          <div className="text-sm space-y-1">
            <div><b>{t("Colaborador:", "Team member:")}</b> {blueprint!.scenario.nombre_colaborador} · {blueprint!.scenario.puesto_colaborador}</div>
          </div>
          <button className="text-xs text-accent" onClick={() => setOpen((o) => !o)}>{open ? t("▼ Ocultar", "▼ Hide") : t("▸ Ver el caso", "▸ View the case")}</button>
          {open && (
            <div className="space-y-2 border-t border-line pt-3 text-xs text-neutral-700">
              <p>{blueprint!.contexto}</p>
              <p><b>{t("Historial:", "History:")}</b> {blueprint!.scenario.historial_desempeno}</p>
              <p><b>{t("Causa de fondo (oculta al candidato):", "Underlying cause (hidden from the candidate):")}</b> {blueprint!.scenario.causa_legitima}</p>
              <p className="text-neutral-500">{t(`${blueprint!.competencyKeys.length} competencias`, `${blueprint!.competencyKeys.length} competencies`)} · {t("agente", "agent")} {blueprint!.agentId ? "✓" : "—"}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {!blueprint!.approved ? (
              <button className="btn-primary text-sm" disabled={busy === "approve"} onClick={approve}>
                {busy === "approve" ? t("Activando…", "Activating…") : t("Aprobar y activar", "Approve and activate")}
              </button>
            ) : (
              <span className="text-sm text-S">{t("✓ Aprobado — los candidatos ya pueden hacer la llamada.", "✓ Approved — candidates can now make the call.")}</span>
            )}
            <button className="btn-ghost text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
              {busy === "gen" ? t("Regenerando…", "Regenerating…") : t("Regenerar", "Regenerate")}
            </button>
          </div>
        </>
      )}

      {busy === "gen" && (
        <p className="text-xs text-neutral-500">{t("La IA está construyendo el caso; puede tardar hasta un minuto. No cierres esta pestaña.", "The AI is building the case; it may take up to a minute. Do not close this tab.")}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
