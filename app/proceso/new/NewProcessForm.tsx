"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/components/LangProvider";

export default function NewProcessForm({ linkedinImport }: { linkedinImport?: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [puestoText, setPuesto] = useState("");
  const [empresaText, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- importar de LinkedIn ----
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function reasonMsg(reason?: string): string {
    switch (reason) {
      case "invalid_url":
        return t("Ese link no parece una vacante de LinkedIn.", "That link doesn't look like a LinkedIn job.");
      case "blocked":
        return t("LinkedIn bloqueó la importación automática. Pega la descripción manualmente abajo.", "LinkedIn blocked the automatic import. Paste the description manually below.");
      case "not_found":
        return t("No se encontró la vacante (puede requerir sesión en LinkedIn).", "The job wasn't found (it may require signing in to LinkedIn).");
      default:
        return t("No se pudo importar. Intenta de nuevo o pega la descripción manualmente.", "Could not import. Try again or paste the description manually.");
    }
  }

  async function doImport() {
    setImporting(true);
    setImportNote(null);
    try {
      const res = await fetch("/api/import/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportNote({ kind: "error", text: reasonMsg(data?.reason) });
        return;
      }
      const title: string | undefined = data.title;
      const company: string | undefined = data.company;
      const location: string | undefined = data.location;
      const description: string | undefined = data.description;
      if (title || company) setName([title, company].filter(Boolean).join(" — ").slice(0, 120));
      if (description || title) setPuesto(description || title || "");
      if (company || location) setEmpresa([company, location].filter(Boolean).join(" · "));
      setImportNote({ kind: "ok", text: t("Vacante importada. Revisa y ajusta antes de crear.", "Job imported. Review and adjust before creating.") });
    } catch {
      setImportNote({ kind: "error", text: reasonMsg() });
    } finally {
      setImporting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, puestoText, empresaText }),
      });
      if (!res.ok) throw new Error(t("No se pudo crear el proceso", "Could not create the process"));
      const { id } = await res.json();
      router.push(`/proceso/${id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/" className="text-sm text-accent">{t("← Procesos", "← Processes")}</Link>
      <h1 className="text-2xl font-bold tracking-tight">{t("Nuevo proceso", "New process")}</h1>
      <p className="text-sm text-neutral-500">
        {t("Pega la descripción del puesto y de la empresa. Si la IA está activa, el Evaluador UNO generará el perfil de referencia ideal (ancla de compatibilidad).", "Paste the job and company description. If the AI is active, the UNO Evaluator will generate the ideal reference profile (compatibility anchor).")}
      </p>

      {linkedinImport && (
        <div className="card space-y-2">
          <label className="label">{t("Importar de LinkedIn (opcional)", "Import from LinkedIn (optional)")}</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="https://www.linkedin.com/jobs/view/…"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />
            <button type="button" className="btn-ghost whitespace-nowrap" disabled={importing || !importUrl.trim()} onClick={doImport}>
              {importing ? t("Importando…", "Importing…") : t("Importar", "Import")}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            {t("Pega el link de una vacante de LinkedIn para prellenar el formulario. Si LinkedIn bloquea la importación, pega la descripción a mano.", "Paste a LinkedIn job link to prefill the form. If LinkedIn blocks the import, paste the description by hand.")}
          </p>
          {importNote && (
            <p className={`text-xs ${importNote.kind === "error" ? "text-amber-600" : "text-success"}`}>{importNote.text}</p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">{t("Nombre del proceso", "Process name")}</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t("Ej. Gerente de Operaciones — Hotel X", "e.g. Operations Manager — Hotel X")} />
        </div>
        <div>
          <label className="label">{t("Descripción del puesto", "Job description")}</label>
          <textarea className="input min-h-[120px]" value={puestoText} onChange={(e) => setPuesto(e.target.value)}
            placeholder={t("Responsabilidades, requisitos, competencias esperadas...", "Responsibilities, requirements, expected competencies...")} />
        </div>
        <div>
          <label className="label">{t("Perfil de la empresa", "Company profile")}</label>
          <textarea className="input min-h-[100px]" value={empresaText} onChange={(e) => setEmpresa(e.target.value)}
            placeholder={t("Sector, cultura, valores, estilo de liderazgo...", "Industry, culture, values, leadership style...")} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? t("Creando…", "Creating…") : t("Crear proceso", "Create process")}
        </button>
      </form>
    </div>
  );
}
