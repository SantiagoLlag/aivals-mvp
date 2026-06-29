"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LangProvider";

export type TestRow = {
  key: string; nameEs: string; nameEn: string; descEs: string; descEn: string;
  selected: boolean; ready: boolean; blueprint?: boolean; newish?: boolean;
};

export default function TestsPanel({ processId, tests }: { processId: string; tests: TestRow[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, boolean>>(
    Object.fromEntries(tests.map((x) => [x.key, x.selected]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: Record<string, boolean>) {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/processes/${processId}/tests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tests: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(t("No se pudo guardar. Intenta de nuevo.", "Could not save. Try again."));
    } finally {
      setBusy(false);
    }
  }

  function toggle(key: string) {
    const next = { ...sel, [key]: !sel[key] };
    setSel(next);
    save(next);
  }

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-semibold">{t("Batería de tests", "Test battery")}</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {t("Elige qué pruebas aplicar en este proceso. Cada candidato verá solo las que actives.", "Choose which tests to apply in this process. Each candidate sees only the ones you enable.")}
        </p>
      </div>
      <div className="grid gap-2">
        {tests.map((x) => {
          const on = !!sel[x.key];
          return (
            <label key={x.key} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition ${on ? "border-accent bg-accentSoft" : "border-line hover:border-accent"}`}>
              <input type="checkbox" checked={on} disabled={busy} onChange={() => toggle(x.key)} className="mt-1 accent-[#1d4e57]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lang === "en" ? x.nameEn : x.nameEs}</span>
                  {x.newish && <span className="chip">{t("Nuevo", "New")}</span>}
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">{lang === "en" ? x.descEn : x.descEs}</p>
                {on && x.blueprint && !x.ready && (
                  <p className="text-[11px] text-amber-600 mt-1">⚠️ {t("Configura su escenario más abajo para que el candidato pueda hacerla.", "Configure its scenario below so the candidate can take it.")}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
