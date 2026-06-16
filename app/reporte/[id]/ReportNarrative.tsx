"use client";
import { useState } from "react";
import Markdown from "@/components/Markdown";

export default function ReportNarrative({
  candidateId, initialMarkdown, aiEnabled,
}: { candidateId: string; initialMarkdown: string | null; aiEnabled: boolean }) {
  const [markdown, setMarkdown] = useState<string | null>(initialMarkdown);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reporte/${candidateId}`, { method: "POST" });
      if (!res.ok) throw new Error("No se pudo generar la interpretación.");
      const data = await res.json();
      setMarkdown(data.markdown);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (markdown) {
    return (
      <div>
        <Markdown>{markdown}</Markdown>
        <button onClick={generate} disabled={loading} className="btn-ghost text-xs mt-3">
          {loading ? "Regenerando…" : "Regenerar"}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <p className="text-sm text-neutral-500 mb-3">
        {aiEnabled
          ? "Genera la interpretación integrada del perfil (Evaluador DOS, Claude)."
          : "Genera la interpretación basada en el manual (sin IA). Añade ANTHROPIC_API_KEY para la versión con IA."}
      </p>
      <button onClick={generate} disabled={loading} className="btn-primary">
        {loading ? "Generando…" : "Generar interpretación"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
