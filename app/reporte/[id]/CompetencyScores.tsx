"use client";
import { useState } from "react";
import { useT } from "@/components/LangProvider";

export type ScoreRow = {
  competency: string; name: string; score: number;
  edited?: boolean; rationale?: string; evidence?: string[]; exercise?: string;
};

// Puntajes 1-5 editables por el psicólogo (human-in-the-loop). Al hacer clic se guarda el
// override (PATCH) y se marca "ajustado por ti"; si falla, revierte. El valor IA original
// queda en el rationale/evidencia que se siguen mostrando como contexto.
export default function CompetencyScores({
  candidateId, target, rows: initial,
}: { candidateId: string; target: "ac" | "voz"; rows: ScoreRow[] }) {
  const { t } = useT();
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function setScore(competency: string, score: number) {
    const prev = rows;
    setSaving(competency);
    setRows((rs) => rs.map((r) => (r.competency === competency ? { ...r, score, edited: true } : r)));
    try {
      const res = await fetch(`/api/reporte/${candidateId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, competency, score }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(prev); // revertir si no se pudo guardar
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-2">
      {rows.map((p) => (
        <div key={p.competency} className="border border-line rounded-lg px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {p.name}
              {p.exercise && <span className="text-[10px] text-neutral-400 ml-1.5 uppercase">{p.exercise}</span>}
              {p.edited && <span className="text-[10px] text-accent ml-1.5">{t("· ajustado por ti", "· adjusted by you")}</span>}
            </span>
            <span className="inline-flex gap-0.5" title={t("Haz clic para ajustar el puntaje 1–5", "Click to adjust the score 1–5")}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" disabled={saving === p.competency}
                  onClick={() => setScore(p.competency, n)}
                  className={`h-5 w-5 rounded-sm text-[9px] grid place-items-center transition disabled:opacity-50 ${n <= p.score ? "bg-accent text-white" : "bg-paper border border-line text-neutral-300 hover:border-accent"}`}>
                  {n}
                </button>
              ))}
            </span>
          </div>
          {p.rationale && <p className="text-xs text-neutral-600 mt-1">{p.rationale}</p>}
          {p.evidence && p.evidence.length > 0 && (
            <p className="text-[11px] text-neutral-400 mt-1 italic">“{p.evidence.join("” · “")}”</p>
          )}
        </div>
      ))}
    </div>
  );
}
