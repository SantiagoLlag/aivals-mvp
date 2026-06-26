"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";
import type { AcBlueprint } from "@/lib/ac/types";

export default function AcBlueprintPanel({
  processId, blueprint, aiEnabled,
}: { processId: string; blueprint: AcBlueprint | null; aiEnabled: boolean }) {
  const { t } = useT();
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
      setError(t("No se pudo generar el ejercicio. Suele ser temporal; intenta de nuevo.", "The exercise could not be generated. This is usually temporary; please try again."));
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
      setError(t("No se pudo activar. Intenta de nuevo.", "Could not activate. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  const hasItems = !!blueprint && blueprint.charola.items.length > 0;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Assessment Center <span className="text-xs font-normal text-neutral-400">{t("· 5ª vertical", "· 5th track")}</span></h2>
        {blueprint?.approved && hasItems && <span className="text-xs text-S font-medium">{t("● Activo para candidatos", "● Active for candidates")}</span>}
      </div>

      {!blueprint || !hasItems ? (
        <>
          <p className="text-sm text-neutral-600">
            {t(
              "Genera un ejercicio (bandeja de entrada + situaciones) calibrado al puesto. La IA lo construye; tú lo revisas y apruebas antes de activarlo.",
              "Generate an exercise (inbox + situations) calibrated to the role. The AI builds it; you review and approve it before activating it."
            )}
          </p>
          {!aiEnabled && <p className="text-xs text-amber-600">{t("Requiere la capa de IA (ANTHROPIC_API_KEY) para generar el ejercicio.", "Requires the AI layer (ANTHROPIC_API_KEY) to generate the exercise.")}</p>}
          <button className="btn-primary text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
            {busy === "gen" ? t("Generando… (~1 min)", "Generating… (~1 min)") : t("Generar ejercicio AC", "Generate AC exercise")}
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-paper border border-line px-2 py-1">📥 {t(`${blueprint.charola.items.length} mensajes`, `${blueprint.charola.items.length} messages`)}</span>
            <span className="rounded-md bg-paper border border-line px-2 py-1">🎯 {t(`${blueprint.sjt.escenarios.length} situaciones`, `${blueprint.sjt.escenarios.length} situations`)}</span>
            <span className="rounded-md bg-paper border border-line px-2 py-1">{t(`${blueprint.competencyKeys.length} competencias`, `${blueprint.competencyKeys.length} competencies`)}</span>
            {!blueprint.gentzaFiel && <span title={t("GENTZA: método de evaluación por competencias con conductas ancla 1–5. 'Provisional' = las anclas aún no son las del catálogo oficial GENTZA.", "GENTZA: competency-based evaluation method with anchor behaviors 1–5. 'Provisional' = the anchors are not yet those of the official GENTZA catalog.")} className="rounded-md bg-amber-50 text-amber-700 px-2 py-1 cursor-help">{t("rúbrica provisional (formato GENTZA)", "provisional rubric (GENTZA format)")}</span>}
          </div>

          <button className="text-xs text-accent" onClick={() => setOpen((o) => !o)}>
            {open ? t("▼ Ocultar el ejercicio", "▼ Hide the exercise") : t("▸ Previsualizar el ejercicio", "▸ Preview the exercise")}
          </button>
          {open && (
            <div className="space-y-2 max-h-80 overflow-y-auto border-t border-line pt-3">
              <p className="text-xs text-neutral-500 italic">{blueprint.contextoPuesto}</p>
              {blueprint.charola.items.map((it, i) => (
                <div key={it.id} className="text-xs border border-line rounded-lg px-3 py-2">
                  <div className="font-medium">📥 {it.asunto}</div>
                  <div className="text-neutral-500">{t("de", "from")} {it.de} · {it.competencias.join(", ")}</div>
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
                {busy === "approve" ? t("Activando…", "Activating…") : t("Aprobar y activar", "Approve and activate")}
              </button>
            ) : (
              <span className="text-sm text-S">{t("✓ Aprobado — los candidatos ya pueden resolverlo.", "✓ Approved — candidates can now complete it.")}</span>
            )}
            <button className="btn-ghost text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generate}>
              {busy === "gen" ? t("Regenerando…", "Regenerating…") : t("Regenerar", "Regenerate")}
            </button>
          </div>
        </>
      )}

      {busy === "gen" && (
        <p className="text-xs text-neutral-500">{t("La IA está construyendo el ejercicio; puede tardar hasta un minuto. No cierres esta pestaña.", "The AI is building the exercise; it may take up to a minute. Do not close this tab.")}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
