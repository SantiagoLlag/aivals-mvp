import Link from "next/link";
import { listProcesses, backend } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const processes = await listProcesses();
  const ai = aiEnabled();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procesos de evaluación</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Crea un proceso, envía el test HUMAN a cada candidato y recibe el reporte interpretado.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tour" className="btn-ghost">🎬 Tour</Link>
          <Link href="/comparar" className="btn-ghost">📊 Comparar candidatos</Link>
          <Link href="/proceso/new" className="btn-primary">+ Nuevo proceso</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className={`text-xs rounded-lg px-3 py-2 inline-flex items-center gap-2 ${ai ? "bg-accentSoft text-accent" : "bg-amber-50 text-amber-700"}`}>
          <span className={`h-2 w-2 rounded-full ${ai ? "bg-accent" : "bg-amber-500"}`} />
          {ai ? "IA activa (Claude): los evaluadores UNO y DOS generan narrativa." : "IA inactiva — reporte determinista del manual. Añade ANTHROPIC_API_KEY para la capa de IA."}
        </div>
        <div className={`text-xs rounded-lg px-3 py-2 inline-flex items-center gap-2 ${backend === "supabase" ? "bg-accentSoft text-accent" : "bg-neutral-100 text-neutral-600"}`}>
          <span className={`h-2 w-2 rounded-full ${backend === "supabase" ? "bg-accent" : "bg-neutral-400"}`} />
          {backend === "supabase" ? "Datos: Supabase (Postgres)" : "Datos: archivo local — añade SUPABASE_SERVICE_ROLE_KEY para usar Supabase"}
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="card text-center py-12 text-neutral-500">
          Aún no hay procesos. Crea el primero para empezar.
        </div>
      ) : (
        <div className="grid gap-3">
          {processes.map((p) => {
            const done = p.candidates.filter((c) => c.status === "completado").length;
            return (
              <Link key={p.id} href={`/proceso/${p.id}`} className="card hover:border-accent transition flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    {p.reference?.source === "ai" && " · perfil de referencia ✓"}
                  </div>
                </div>
                <div className="text-sm text-neutral-600">
                  {p.candidates.length} candidato{p.candidates.length === 1 ? "" : "s"} · {done} completado{done === 1 ? "" : "s"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
