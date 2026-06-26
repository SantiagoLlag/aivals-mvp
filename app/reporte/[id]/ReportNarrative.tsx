"use client";
import { useState } from "react";
import Markdown from "@/components/Markdown";
import { useT } from "@/components/LangProvider";

export default function ReportNarrative({
  candidateId, initialMarkdown, aiEnabled,
}: { candidateId: string; initialMarkdown: string | null; aiEnabled: boolean }) {
  const { t } = useT();
  const [markdown, setMarkdown] = useState<string | null>(initialMarkdown);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reporte/${candidateId}`, { method: "POST" });
      if (!res.ok) throw new Error(t("No se pudo generar la interpretación.", "The interpretation could not be generated."));
      const data = await res.json();
      setMarkdown(data.markdown);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/reporte/${candidateId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "narrative", markdown: draft }),
      });
      if (!res.ok) throw new Error(t("No se pudo guardar.", "Could not save."));
      setMarkdown(draft);
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (markdown && editing) {
    return (
      <div className="no-print">
        <textarea className="textarea min-h-[280px] font-mono text-xs" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs">{saving ? t("Guardando…", "Saving…") : t("Guardar", "Save")}</button>
          <button onClick={() => { setEditing(false); setError(null); }} disabled={saving} className="btn-ghost text-xs">{t("Cancelar", "Cancel")}</button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  if (markdown) {
    return (
      <div>
        <Markdown>{markdown}</Markdown>
        <div className="flex gap-2 mt-3 no-print">
          <button onClick={() => { setDraft(markdown); setEditing(true); }} className="btn-ghost text-xs">{t("Editar", "Edit")}</button>
          <button onClick={generate} disabled={loading} className="btn-ghost text-xs">
            {loading ? t("Regenerando…", "Regenerating…") : t("Regenerar", "Regenerate")}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <p className="text-sm text-neutral-500 mb-3">
        {aiEnabled
          ? t("Genera la interpretación integrada del perfil (Evaluador DOS, Claude).", "Generate the integrated profile interpretation (DOS Evaluator, Claude).")
          : t("Genera la interpretación basada en el manual (sin IA). Añade ANTHROPIC_API_KEY para la versión con IA.", "Generate the manual-based interpretation (no AI). Add ANTHROPIC_API_KEY for the AI version.")}
      </p>
      <button onClick={generate} disabled={loading} className="btn-primary">
        {loading ? t("Generando…", "Generating…") : t("Generar interpretación", "Generate interpretation")}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
