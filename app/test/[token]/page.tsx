import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/store";
import { getServerT } from "@/lib/i18n-server";
import { FLAGS } from "@/lib/flags";
import { testActive } from "@/lib/tests/catalog";

export const dynamic = "force-dynamic";

export default async function TestIndex({ params }: { params: { token: string } }) {
  const { t } = getServerT();
  const found = await getCandidateByToken(params.token);
  if (!found) notFound();
  const { process: proc, candidate } = found;

  // Con la feature de batería on, la disponibilidad la decide el catálogo (lo que eligió el
  // aplicador + readiness). Con la feature off, se preserva la lógica original (sin Big Five).
  const ff = FLAGS.bigFive;
  const humanOn = ff ? testActive(proc, "human") : true;
  const humanDone = !!candidate.result;
  const bigfiveOn = ff && testActive(proc, "bigfive");
  const bigfiveDone = !!candidate.bigFive?.result;
  const cvOn = ff ? testActive(proc, "cv") : true;
  const cvDone = !!candidate.cv;
  const acAvailable = ff ? testActive(proc, "ac") : (!!proc.acBlueprint?.approved && proc.acBlueprint.charola.items.length > 0);
  const acDone = !!candidate.acResult;
  const voiceAvailable = ff ? testActive(proc, "voz") : !!proc.voiceBlueprint?.approved;
  const voiceDone = !!candidate.voiceResult;

  // Avance global sobre las actividades realmente activas para este candidato.
  const activities = [
    { on: humanOn, done: humanDone },
    { on: bigfiveOn, done: bigfiveDone },
    { on: cvOn, done: cvDone },
    { on: acAvailable, done: acDone },
    { on: voiceAvailable, done: voiceDone },
  ].filter((a) => a.on);
  const total = activities.length;
  const completed = activities.filter((a) => a.done).length;
  const allDone = total > 0 && completed === total;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const tk = params.token;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-accent900">{t("Hola,", "Hello,")} {candidate.name}</h1>
        <p className="text-base text-neutral-600 mt-2.5 leading-relaxed">
          {t("Estas actividades nos ayudan a conocerte mejor.", "These activities help us get to know you better.")} <b className="font-medium text-ink">{t("No es un examen", "It is not an exam")}</b>:
          {t(" no hay respuestas correctas ni incorrectas, y puedes hacerlas en el orden que prefieras.", " there are no right or wrong answers, and you can do them in whatever order you prefer.")}
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {completed === total ? t("¡Completaste todo!", "You completed everything!") : t(`${completed} de ${total} actividades completadas`, `${completed} of ${total} activities completed`)}
          </span>
          <span className="font-mono text-[11px] text-neutral-500 tabular-nums">{pct}%</span>
        </div>
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="space-y-3">
        {humanOn && (
          <PruebaCard href={`/test/${tk}/human`} done={humanDone} icon="human" title={t("Prueba HUMAN", "HUMAN Test")}
            desc={t("Tu estilo de comportamiento, tus motivadores y tu forma de pensar.", "Your behavioral style, your motivators and the way you think.")} time="15–25 min" />
        )}
        {bigfiveOn && (
          <PruebaCard href={`/test/${tk}/bigfive`} done={bigfiveDone} icon="bigfive" title={t("Cuestionario Big Five", "Big Five questionnaire")} badge={t("Personalidad", "Personality")}
            desc={t("50 frases sobre cómo eres. Para cada una indicas qué tan de acuerdo estás.", "50 statements about how you are. For each, you say how much you agree.")} time="5–8 min" />
        )}
        {cvOn && (
          <PruebaCard href={`/test/${tk}/cv`} done={cvDone} icon="cv" title={t("Sube tu CV", "Upload your résumé")}
            desc={t("Adjunta tu currículum en PDF. Se considera junto con el resto de tu evaluación.", "Attach your résumé as a PDF. It is considered together with the rest of your assessment.")} time="1 min" />
        )}
        {acAvailable && (
          <PruebaCard href={`/test/${tk}/ac`} done={acDone} icon="ac" title={t("Ejercicio de simulación", "Simulation exercise")} badge="Assessment Center"
            desc={t("Te pones en un puesto real y resuelves su bandeja de entrada y algunas situaciones.", "You step into a real role and work through its inbox and a few situations.")} time="20–30 min" />
        )}
        {voiceAvailable && (
          <PruebaCard href={`/test/${tk}/voz`} done={voiceDone} icon="voz" title={t("Conversación por voz", "Voice conversation")} badge="Role-play"
            desc={t("Una llamada en vivo: das retroalimentación a un colaborador. Necesitas micrófono.", "A live call: you give feedback to a team member. You need a microphone.")} time="8–12 min" />
        )}
      </div>

      {allDone && (
        <div className="card text-center py-8 anim-pop">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-accentSoft text-success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <p className="text-sm text-neutral-700">{t("¡Completaste todo! Gracias. Ya puedes cerrar esta ventana.", "You completed everything! Thank you. You can now close this window.")}</p>
        </div>
      )}
    </div>
  );
}

const ICONS = {
  human: <><path d="M12 3v4M12 17v4M5 12H1M23 12h-4" /><circle cx="12" cy="12" r="3.5" /></>,
  bigfive: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M2 14h4M10 8h4M18 16h4" /></>,
  cv: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  ac: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.4 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.5Z" /></>,
  voz: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
};

function PruebaCard({ href, done, icon, title, desc, time, badge }: {
  href: string; done: boolean; icon: keyof typeof ICONS; title: string; desc: string; time: string; badge?: string;
}) {
  const { t } = getServerT();
  return (
    <div className={`card flex items-center gap-4 ${done ? "opacity-70" : ""}`}>
      <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-lg ${done ? "bg-paper text-text3" : "bg-accentSoft text-accent"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</svg>
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">{title}</h2>
          {badge && <span className="chip">{badge}</span>}
        </div>
        <p className="text-[13px] text-neutral-600 mt-0.5 leading-snug">{desc}</p>
        <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-text3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {time}
        </div>
      </div>
      {done ? (
        <span className="flex-none inline-flex items-center gap-1.5 text-sm font-medium text-success whitespace-nowrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          {t("Completada", "Completed")}
        </span>
      ) : (
        <Link href={href} className="btn-primary text-sm whitespace-nowrap flex-none">{t("Comenzar →", "Start →")}</Link>
      )}
    </div>
  );
}
