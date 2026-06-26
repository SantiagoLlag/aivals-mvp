"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/components/LangProvider";

export default function NewProcess() {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [puestoText, setPuesto] = useState("");
  const [empresaText, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
