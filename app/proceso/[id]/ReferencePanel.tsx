"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";
import type { ReferenceProfile } from "@/lib/types";

const VALORES = ["Teórico", "Económico", "Estético", "Social", "Político", "Regulatorio"];
const FACTORS: Array<"D" | "I" | "S" | "C"> = ["D", "I", "S", "C"];

export default function ReferencePanel({
  processId, reference, aiEnabled,
}: { processId: string; reference: ReferenceProfile; aiEnabled: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"save" | "regen" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [resumen, setResumen] = useState(reference.resumen ?? "");
  const [estilo, setEstilo] = useState(reference.estiloPensamiento ?? "");
  const [disc, setDisc] = useState<Record<string, number>>({
    D: reference.discIdeal?.D ?? 50, I: reference.discIdeal?.I ?? 50,
    S: reference.discIdeal?.S ?? 50, C: reference.discIdeal?.C ?? 50,
  });
  const [valores, setValores] = useState<string[]>(reference.valoresDeseados ?? []);

  function cancel() {
    setResumen(reference.resumen ?? "");
    setEstilo(reference.estiloPensamiento ?? "");
    setDisc({ D: reference.discIdeal?.D ?? 50, I: reference.discIdeal?.I ?? 50, S: reference.discIdeal?.S ?? 50, C: reference.discIdeal?.C ?? 50 });
    setValores(reference.valoresDeseados ?? []);
    setError(null);
    setEditing(false);
  }

  async function save() {
    setBusy("save"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/reference`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumen, estiloPensamiento: estilo, discIdeal: disc, valoresDeseados: valores }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch { setError(t("No se pudo guardar. Intenta de nuevo.", "Could not save. Please try again.")); }
    finally { setBusy(null); }
  }

  async function regenerate() {
    if (!window.confirm(t("Regenerar reemplaza el perfil actual (incluidos tus ajustes) por uno nuevo de la IA. ¿Continuar?", "Regenerating replaces the current profile (including your edits) with a new one from the AI. Continue?"))) return;
    setBusy("regen"); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/reference`, { method: "POST" });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch { setError(t("No se pudo regenerar. Intenta de nuevo.", "Could not regenerate. Please try again.")); }
    finally { setBusy(null); }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold">
          {t("Perfil de referencia", "Reference profile")} <span className="text-xs font-normal text-neutral-400">{t("· Evaluador UNO — el perfil ideal del puesto", "· Evaluator ONE — the ideal profile for the role")}</span>
        </h2>
        <span className="text-[11px] text-neutral-400">{reference.edited ? t("ajustado por ti", "adjusted by you") : t("propuesto por la IA", "proposed by the AI")}</span>
      </div>
      <p className="text-[11px] text-neutral-500 mt-0.5">{t("Es el ancla contra la que se mide el encaje de cada candidato. Puedes ajustarlo.", "It is the anchor against which each candidate's fit is measured. You can adjust it.")}</p>

      {!editing ? (
        <>
          {reference.resumen && <p className="text-sm text-neutral-700 mt-3">{reference.resumen}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {reference.discIdeal && (
              <span className="rounded-md bg-paper border border-line px-2 py-1">
                {t("DISC ideal", "Ideal DISC")} · D{reference.discIdeal.D} I{reference.discIdeal.I} S{reference.discIdeal.S} C{reference.discIdeal.C}
              </span>
            )}
            {reference.valoresDeseados?.map((v) => (
              <span key={v} className="rounded-md bg-accentSoft text-accent px-2 py-1">{v}</span>
            ))}
          </div>
          {reference.estiloPensamiento && <p className="text-xs text-neutral-500 mt-2">{t("Pensamiento:", "Thinking:")} {reference.estiloPensamiento}</p>}
          <div className="flex gap-2 mt-3">
            <button className="btn-ghost text-sm" onClick={() => setEditing(true)}>{t("Editar", "Edit")}</button>
            <button className="btn-ghost text-sm" disabled={busy === "regen" || !aiEnabled} onClick={regenerate}>
              {busy === "regen" ? t("Regenerando…", "Regenerating…") : t("Regenerar con IA", "Regenerate with AI")}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <div className="label">{t("Resumen del perfil ideal", "Ideal profile summary")}</div>
            <textarea className="textarea" value={resumen} onChange={(e) => setResumen(e.target.value)} />
          </div>
          <div>
            <div className="label">{t("DISC ideal (0–100)", "Ideal DISC (0–100)")}</div>
            <div className="grid grid-cols-4 gap-2">
              {FACTORS.map((f) => (
                <label key={f} className="text-xs">
                  <span className="block text-neutral-500 mb-0.5">{f}</span>
                  <input type="number" min={0} max={100} className="input" value={disc[f]}
                    onChange={(e) => setDisc((d) => ({ ...d, [f]: Math.max(0, Math.min(100, Math.round(Number(e.target.value)) || 0)) }))} />
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="label">{t("Valores deseados", "Desired values")}</div>
            <div className="flex flex-wrap gap-1.5">
              {VALORES.map((v) => {
                const on = valores.includes(v);
                return (
                  <button key={v} type="button"
                    onClick={() => setValores((cur) => on ? cur.filter((x) => x !== v) : [...cur, v])}
                    className={`text-xs rounded-lg border px-2.5 py-1.5 transition ${on ? "bg-accent text-white border-accent" : "border-line hover:border-accent"}`}>
                    {on ? "✓ " : ""}{v}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="label">{t("Estilo de pensamiento ideal", "Ideal thinking style")}</div>
            <input className="input" value={estilo} onChange={(e) => setEstilo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm" disabled={busy === "save"} onClick={save}>
              {busy === "save" ? t("Guardando…", "Saving…") : t("Guardar", "Save")}
            </button>
            <button className="btn-ghost text-sm" disabled={busy === "save"} onClick={cancel}>{t("Cancelar", "Cancel")}</button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
