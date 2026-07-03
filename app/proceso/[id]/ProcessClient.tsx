"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";

type Cand = { id: string; name: string; token: string; status: string; human: boolean; cv: boolean; ac: boolean; voice: boolean; bigfive: boolean };

export default function ProcessClient({ processId, candidates, reabrir, bigfive }: { processId: string; candidates: Cand[]; reabrir?: boolean; bigfive?: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reopenFor, setReopenFor] = useState<string | null>(null);
  const [reopenSel, setReopenSel] = useState<Record<string, boolean>>({});
  const [reopenBusy, setReopenBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setName(""); // solo se limpia el input si de verdad se agregó
      router.refresh();
    } catch {
      setError(t("No se pudo agregar el candidato. Intenta de nuevo.", "Could not add the candidate. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/test/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Sin acceso al portapapeles (contexto no seguro / permiso denegado): copia manual.
      window.prompt(t("Copia el link del candidato:", "Copy the candidate's link:"), url);
    }
  }

  const VERTS = [
    { key: "human" as const, label: "HUMAN", has: (c: Cand) => c.human },
    ...(bigfive ? [{ key: "bigfive" as const, label: "Big Five", has: (c: Cand) => c.bigfive }] : []),
    { key: "cv" as const, label: "CV", has: (c: Cand) => c.cv },
    { key: "ac" as const, label: "AC", has: (c: Cand) => c.ac },
    { key: "voz" as const, label: t("Voz", "Voice"), has: (c: Cand) => c.voice },
  ];
  async function doReopen(c: Cand) {
    const verticals = VERTS.filter((v) => reopenSel[v.key] && v.has(c)).map((v) => v.key);
    if (!verticals.length) { setError(t("Elige al menos una actividad para reabrir.", "Choose at least one activity to reopen.")); return; }
    if (!window.confirm(t(`Vas a reabrir ${verticals.length} actividad(es) de ${c.name} para que las rehaga. Al reenviar se comparan sus respuestas y solo se recalcula lo que cambió. ¿Continuar?`, `You are going to reopen ${verticals.length} activity(ies) for ${c.name} so they can redo them. When resubmitted, their answers are compared and only what changed is recalculated. Continue?`))) return;
    setReopenBusy(true); setError(null);
    try {
      const res = await fetch(`/api/candidates/${c.id}/reopen`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verticals }),
      });
      if (!res.ok) throw new Error();
      setReopenFor(null); setReopenSel({});
      router.refresh();
    } catch {
      setError(t("No se pudo reabrir. Intenta de nuevo.", "Could not reopen. Please try again."));
    } finally {
      setReopenBusy(false);
    }
  }

  const withData = candidates.filter((c) => c.human || c.cv || c.ac || c.voice || (!!bigfive && c.bigfive)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("Candidatos", "Candidates")}</h2>
        {withData >= 2 && (
          <Link href={`/comparar/${processId}`} className="text-sm text-accent hover:underline">
            {t("📊 Comparar candidatos →", "📊 Compare candidates →")}
          </Link>
        )}
      </div>

      <form onSubmit={add} className="flex gap-2">
        <input className="input" placeholder={t("Nombre del candidato", "Candidate name")} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary whitespace-nowrap" disabled={loading}>{t("+ Agregar", "+ Add")}</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {candidates.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("Agrega un candidato para generar su link del test.", "Add a candidate to generate their test link.")}</p>
      ) : (
        <div className="grid gap-2">
          {candidates.map((c) => {
            const hasData = c.human || c.cv || c.ac || c.voice || (!!bigfive && c.bigfive);
            return (
              <div key={c.id} className="card py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="flex gap-1 mt-1">
                      <Mini on={c.human} label="HUMAN" />
                      {bigfive && <Mini on={c.bigfive} label="Big Five" />}
                      <Mini on={c.cv} label="CV" />
                      <Mini on={c.ac} label="AC" />
                      <Mini on={c.voice} label={t("Voz", "Voice")} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {hasData && <Link href={`/reporte/${c.id}`} className="btn-primary text-xs">{t("Ver reporte", "View report")}</Link>}
                    <button onClick={() => copyLink(c.token)} className="btn-ghost text-xs">
                      {copied === c.token ? t("¡Copiado!", "Copied!") : t("Copiar link", "Copy link")}
                    </button>
                    <a href={`/test/${c.token}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs" title={t("Abrir el test del candidato en otra pestaña", "Open the candidate's test in another tab")}>
                      {t("Abrir ↗", "Open ↗")}
                    </a>
                    {reabrir && hasData && (
                      <button onClick={() => { setReopenFor((f) => (f === c.id ? null : c.id)); setReopenSel({}); setError(null); }} className="btn-ghost text-xs">
                        {reopenFor === c.id ? t("Cancelar", "Cancel") : t("Reabrir", "Reopen")}
                      </button>
                    )}
                  </div>
                </div>
                {reabrir && reopenFor === c.id && (
                  <div className="mt-3 border-t border-line pt-3">
                    <div className="text-xs text-neutral-600 mb-2">{t("Reabrir actividades de ", "Reopen activities for ")}<b>{c.name}</b>{t(" — se reabre para que la rehaga; al reenviar se compara con sus respuestas previas y solo se recalcula lo que cambió:", " — it is reopened so they can redo it; when resubmitted it is compared with their previous answers and only what changed is recalculated:")}</div>
                    <div className="flex flex-wrap gap-2">
                      {VERTS.filter((v) => v.has(c)).map((v) => (
                        <label key={v.key} className="inline-flex items-center gap-1.5 text-xs rounded-md border border-line px-2 py-1 cursor-pointer">
                          <input type="checkbox" checked={!!reopenSel[v.key]} onChange={(e) => setReopenSel((s) => ({ ...s, [v.key]: e.target.checked }))} className="accent-[#1d4e57]" />
                          {v.label}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => doReopen(c)} disabled={reopenBusy} className="btn-primary text-xs">{reopenBusy ? t("Reabriendo…", "Reopening…") : t("Reabrir seleccionadas", "Reopen selected")}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${on ? "bg-accentSoft text-accent" : "bg-neutral-100 text-neutral-400"}`}>
      {on ? "✓ " : ""}{label}
    </span>
  );
}
