"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProcess() {
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
      if (!res.ok) throw new Error("No se pudo crear el proceso");
      const { id } = await res.json();
      router.push(`/proceso/${id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/" className="text-sm text-accent">← Procesos</Link>
      <h1 className="text-2xl font-bold tracking-tight">Nuevo proceso</h1>
      <p className="text-sm text-neutral-500">
        Pega la descripción del puesto y de la empresa. Si la IA está activa, el Evaluador UNO
        generará el perfil de referencia ideal (ancla de compatibilidad).
      </p>
      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Nombre del proceso</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Gerente de Operaciones — Hotel X" />
        </div>
        <div>
          <label className="label">Descripción del puesto</label>
          <textarea className="input min-h-[120px]" value={puestoText} onChange={(e) => setPuesto(e.target.value)}
            placeholder="Responsabilidades, requisitos, competencias esperadas..." />
        </div>
        <div>
          <label className="label">Perfil de la empresa</label>
          <textarea className="input min-h-[100px]" value={empresaText} onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Sector, cultura, valores, estilo de liderazgo..." />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? "Creando…" : "Crear proceso"}
        </button>
      </form>
    </div>
  );
}
