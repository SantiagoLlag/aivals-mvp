import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TestIndex({ params }: { params: { token: string } }) {
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;

  const humanDone = !!candidate.result;
  const acAvailable = !!proc.acBlueprint?.approved && proc.acBlueprint.charola.items.length > 0;
  const acDone = !!candidate.acResult;
  const cvDone = !!candidate.cv;
  const voiceAvailable = !!proc.voiceBlueprint?.approved;
  const voiceDone = !!candidate.voiceResult;
  const allDone = humanDone && cvDone && (!acAvailable || acDone) && (!voiceAvailable || voiceDone);
  // Avance global sobre las actividades realmente activas para este candidato.
  const activities = [
    { done: humanDone }, { done: cvDone },
    ...(acAvailable ? [{ done: acDone }] : []),
    ...(voiceAvailable ? [{ done: voiceDone }] : []),
  ];
  const total = activities.length;
  const completed = activities.filter((a) => a.done).length;
  const t = params.token;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {candidate.name} 👋</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Completa estas actividades. Puedes hacerlas en el orden que prefieras.
        </p>
      </div>

      <div className="card py-3">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium">
            {completed === total ? "¡Completaste todo! 🎉" : `${completed} de ${total} actividades completadas`}
          </span>
          <span className="text-xs text-neutral-500 tabular-nums">{Math.round((completed / total) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      </div>

      <PruebaCard href={`/test/${t}/human`} done={humanDone} emoji="🧠" title="Prueba HUMAN"
        desc="Tu estilo de comportamiento, tus motivadores y tu estilo de pensamiento. ~15–25 min." />

      <PruebaCard href={`/test/${t}/cv`} done={cvDone} emoji="📄" title="Sube tu CV"
        desc="Adjunta tu currículum en PDF. Se analiza junto con el resto de tu evaluación. ~1 min." />

      {acAvailable && (
        <PruebaCard href={`/test/${t}/ac`} done={acDone} emoji="📥"
          title="Ejercicio de simulación" badge="Assessment Center"
          desc="Te pones en un puesto real y resuelves su bandeja de entrada y algunas situaciones. ~20–30 min." />
      )}

      {voiceAvailable && (
        <PruebaCard href={`/test/${t}/voz`} done={voiceDone} emoji="📞"
          title="Conversación por voz" badge="Role-play"
          desc="Una llamada en vivo: das feedback a un colaborador de tu equipo. Necesitas micrófono. ~8–12 min." />
      )}

      {allDone && (
        <div className="card text-center py-8 anim-pop">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm text-neutral-700">¡Completaste todo! Gracias. Ya puedes cerrar esta ventana.</p>
        </div>
      )}
    </div>
  );
}

function PruebaCard({ href, done, emoji, title, desc, badge }: {
  href: string; done: boolean; emoji: string; title: string; desc: string; badge?: string;
}) {
  return (
    <div className={`card flex items-center gap-4 ${done ? "opacity-70" : ""}`}>
      <div className="text-3xl">{emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          {badge && <span className="text-[10px] uppercase tracking-wide bg-accentSoft text-accent px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <p className="text-sm text-neutral-600 mt-0.5">{desc}</p>
      </div>
      {done ? (
        <span className="text-sm text-S font-medium whitespace-nowrap">✓ Completada</span>
      ) : (
        <Link href={href} className="btn-primary text-sm whitespace-nowrap">Comenzar →</Link>
      )}
    </div>
  );
}
