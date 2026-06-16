"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Cand = { id: string; name: string; token: string; status: string; human: boolean; cv: boolean; ac: boolean; voice: boolean };

export default function ProcessClient({ processId, candidates }: { processId: string; candidates: Cand[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch(`/api/processes/${processId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    setLoading(false);
    router.refresh();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/test/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Candidatos</h2>
      </div>

      <form onSubmit={add} className="flex gap-2">
        <input className="input" placeholder="Nombre del candidato" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary whitespace-nowrap" disabled={loading}>+ Agregar</button>
      </form>

      {candidates.length === 0 ? (
        <p className="text-sm text-neutral-500">Agrega un candidato para generar su link del test.</p>
      ) : (
        <div className="grid gap-2">
          {candidates.map((c) => {
            const hasData = c.human || c.cv || c.ac || c.voice;
            return (
              <div key={c.id} className="card flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="flex gap-1 mt-1">
                    <Mini on={c.human} label="HUMAN" />
                    <Mini on={c.cv} label="CV" />
                    <Mini on={c.ac} label="AC" />
                    <Mini on={c.voice} label="Voz" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasData && <Link href={`/reporte/${c.id}`} className="btn-primary text-xs">Ver reporte</Link>}
                  <button onClick={() => copyLink(c.token)} className="btn-ghost text-xs">
                    {copied === c.token ? "¡Copiado!" : "Copiar link"}
                  </button>
                </div>
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
