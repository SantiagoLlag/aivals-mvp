"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";
import type { AcBlueprint, AcCustomization } from "@/lib/ac/types";
import { AC_QUESTIONS, AC_NOTES_MAX } from "@/lib/ac/customize";

export default function AcBlueprintPanel({
  processId, blueprint, aiEnabled, customize = true,
}: { processId: string; blueprint: AcBlueprint | null; aiEnabled: boolean; customize?: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<"gen" | "approve" | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- personalización ----
  const [customOpen, setCustomOpen] = useState(false);
  const [cust, setCust] = useState<Record<string, string>>(() => {
    const c = blueprint?.customization ?? {};
    const o: Record<string, string> = {};
    for (const q of AC_QUESTIONS) { const v = (c as Record<string, string>)[q.id]; if (v) o[q.id] = v; }
    return o;
  });
  const [notas, setNotas] = useState<string>(blueprint?.customization?.notas ?? "");

  async function generate(customization?: AcCustomization) {
    setBusy("gen"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/ac`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customization ? { customization } : {}),
      });
      if (!res.ok) throw new Error();
      setCustomOpen(false);
      router.refresh();
    } catch {
      setError(t("No se pudo generar el ejercicio. Suele ser temporal; intenta de nuevo.", "The exercise could not be generated. This is usually temporary; please try again."));
    } finally {
      setBusy(null);
    }
  }
  function generateCustom() {
    const customization: AcCustomization = {};
    for (const q of AC_QUESTIONS) { const v = cust[q.id]; if (v) (customization as Record<string, string>)[q.id] = v; }
    if (notas.trim()) customization.notas = notas.trim().slice(0, AC_NOTES_MAX);
    generate(customization);
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
  const isCustomized = !!blueprint?.customization && Object.values(blueprint.customization).some(Boolean);

  const customForm = customize && customOpen && (
    <div className="border-t border-line pt-3 space-y-3">
      <p className="text-xs text-neutral-500">
        {t("Elige las opciones que apliquen (puedes dejar algunas en blanco) y la IA construirá el ejercicio a tu medida.", "Choose the options that apply (you can leave some blank) and the AI will build the exercise to your specification.")}
      </p>
      {AC_QUESTIONS.map((q) => (
        <div key={q.id}>
          <div className="text-xs font-medium text-neutral-700 mb-1">{lang === "en" ? q.labelEn : q.labelEs}</div>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((o) => {
              const on = cust[q.id] === o.value;
              return (
                <button key={o.value} type="button"
                  onClick={() => setCust((c) => ({ ...c, [q.id]: on ? "" : o.value }))}
                  className={`text-xs rounded-md border px-2 py-1 transition ${on ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                  {lang === "en" ? o.en : o.es}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-neutral-700">{t("Indicaciones adicionales (opcional)", "Additional instructions (optional)")}</span>
          <span className="text-[10px] text-neutral-400 tabular-nums">{notas.length}/{AC_NOTES_MAX}</span>
        </div>
        <textarea value={notas} maxLength={AC_NOTES_MAX} rows={2}
          onChange={(e) => setNotas(e.target.value.slice(0, AC_NOTES_MAX))}
          className="input w-full text-sm"
          placeholder={t("Ej.: incluye un conflicto con un proveedor y una urgencia de seguridad.", "E.g.: include a conflict with a supplier and a safety emergency.")} />
      </div>
      <div className="flex gap-2">
        <button className="btn-primary text-sm" disabled={busy === "gen" || !aiEnabled} onClick={generateCustom}>
          {busy === "gen" ? t("Generando…", "Generating…") : t("Generar personalizado", "Generate customized")}
        </button>
        <button className="btn-ghost text-sm" disabled={busy === "gen"} onClick={() => setCustomOpen(false)}>{t("Cancelar", "Cancel")}</button>
      </div>
    </div>
  );

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
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary text-sm" disabled={busy === "gen" || !aiEnabled} onClick={() => generate()}>
              {busy === "gen" && !customOpen ? t("Generando… (~1 min)", "Generating… (~1 min)") : t("Generar con IA", "Generate with AI")}
            </button>
            {customize && (
              <button className="btn-ghost text-sm" disabled={!aiEnabled || busy === "gen"} onClick={() => setCustomOpen((o) => !o)}>
                {customOpen ? t("▾ Personalizar", "▾ Customize") : t("Personalizar", "Customize")}
              </button>
            )}
          </div>
          {customForm}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-paper border border-line px-2 py-1">📥 {t(`${blueprint.charola.items.length} mensajes`, `${blueprint.charola.items.length} messages`)}</span>
            <span className="rounded-md bg-paper border border-line px-2 py-1">🎯 {t(`${blueprint.sjt.escenarios.length} situaciones`, `${blueprint.sjt.escenarios.length} situations`)}</span>
            <span className="rounded-md bg-paper border border-line px-2 py-1">{t(`${blueprint.competencyKeys.length} competencias`, `${blueprint.competencyKeys.length} competencies`)}</span>
            {isCustomized && <span className="chip">{t("Personalizado", "Customized")}</span>}
            {!blueprint.gentzaFiel && <span title={t("GENTZA: método de evaluación por competencias con conductas ancla 1–5. 'Provisional' = las anclas aún no son las del catálogo oficial GENTZA.", "GENTZA: competency-based evaluation method with anchor behaviors 1–5. 'Provisional' = the anchors are not yet those of the official GENTZA catalog.")} className="rounded-md bg-amber-50 text-amber-700 px-2 py-1 cursor-help">{t("rúbrica provisional (formato GENTZA)", "provisional rubric (GENTZA format)")}</span>}
          </div>

          <button className="text-xs text-accent" onClick={() => setOpen((o) => !o)}>
            {open ? t("▼ Ocultar el ejercicio", "▼ Hide the exercise") : t("▸ Previsualizar el ejercicio", "▸ Preview the exercise")}
          </button>
          {open && (
            <div className="space-y-2 max-h-80 overflow-y-auto border-t border-line pt-3">
              <p className="text-xs text-neutral-500 italic">{blueprint.contextoPuesto}</p>
              {blueprint.charola.items.map((it) => (
                <div key={it.id} className="text-xs border border-line rounded-lg px-3 py-2">
                  <div className="font-medium">📥 {it.asunto}</div>
                  <div className="text-neutral-500">{t("de", "from")} {it.de} · {it.competencias.join(", ")}</div>
                </div>
              ))}
              {blueprint.sjt.escenarios.map((es) => (
                <div key={es.id} className="text-xs border border-line rounded-lg px-3 py-2">
                  <div className="font-medium">🎯 {es.pregunta}</div>
                  <div className="text-neutral-500">{es.competencia}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1 flex-wrap">
            {!blueprint.approved ? (
              <button className="btn-primary text-sm" disabled={busy === "approve"} onClick={approve}>
                {busy === "approve" ? t("Activando…", "Activating…") : t("Aprobar y activar", "Approve and activate")}
              </button>
            ) : (
              <span className="text-sm text-S self-center">{t("✓ Aprobado — los candidatos ya pueden resolverlo.", "✓ Approved — candidates can now complete it.")}</span>
            )}
            <button className="btn-ghost text-sm" disabled={busy === "gen" || !aiEnabled} onClick={() => generate()}>
              {busy === "gen" && !customOpen ? t("Regenerando…", "Regenerating…") : t("Regenerar con IA", "Regenerate with AI")}
            </button>
            {customize && (
              <button className="btn-ghost text-sm" disabled={busy === "gen" || !aiEnabled} onClick={() => setCustomOpen((o) => !o)}>
                {customOpen ? t("▾ Personalizar", "▾ Customize") : t("Personalizar", "Customize")}
              </button>
            )}
          </div>
          {customForm}
        </>
      )}

      {busy === "gen" && (
        <p className="text-xs text-neutral-500">{t("La IA está construyendo el ejercicio; puede tardar hasta un minuto. No cierres esta pestaña.", "The AI is building the exercise; it may take up to a minute. Do not close this tab.")}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
