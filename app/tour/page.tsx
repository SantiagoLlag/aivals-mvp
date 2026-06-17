import Link from "next/link";

export const metadata = { title: "Aivals — Conoce el proyecto" };

// Enlaces de exploración (demo en vivo)
const REPORTE_COMPLETO = "/reporte/eb668bdf-7c31-41a2-9af4-3dbdf900438f"; // Carlos Silva: HUMAN + CV + AC + voz
const EXPERIENCIA_CANDIDATO = "/test/6fcfaaf49621";                       // Invitada (demo)
const PANEL = "/";
const NUEVO = "/proceso/new";

export default function TourPage() {
  return (
    <div className="-mt-8">
      {/* HERO */}
      <section className="relative overflow-hidden text-center py-16 px-5">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accentSoft/60 to-transparent" />
        <div className="mx-auto h-16 w-16 rounded-2xl bg-accent text-white grid place-items-center text-3xl font-bold anim-float shadow-sm">A</div>
        <h1 className="text-4xl font-bold tracking-tight mt-5 anim-fadeup">Bienvenida a Aivals</h1>
        <p className="text-lg text-neutral-600 mt-3 max-w-xl mx-auto anim-fadeup" style={{ animationDelay: "90ms" }}>
          Evaluación de talento <b>potenciada por IA</b>. La inteligencia artificial <b>amplifica</b> al
          psicólogo — nunca lo reemplaza.
        </p>
        <div className="mt-7 flex flex-wrap gap-2 justify-center anim-fadeup" style={{ animationDelay: "180ms" }}>
          <a href="#explorar" className="btn-primary anim-pulse">Explorar la demo ↓</a>
          <Link href={PANEL} className="btn-ghost">Ir al panel</Link>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 pb-16 space-y-14">
        {/* QUÉ ES */}
        <section className="anim-fadeup">
          <h2 className="text-xl font-bold">¿Qué resuelve?</h2>
          <p className="text-sm text-neutral-700 mt-2 leading-relaxed">
            Una evaluación de talento tradicional es <b>fragmentada, lenta e inconsistente</b> (cada prueba en
            su plataforma, horas de integración manual, dos evaluadores con conclusiones distintas). Aivals la
            convierte en una evaluación <b>profunda, consistente y trazable</b>: el psicólogo crea un proceso, el
            candidato completa las actividades por un link único, y la IA interpreta todo en un reporte — que el
            psicólogo revisa y ajusta. <b>La IA es insumo, nunca veredicto.</b>
          </p>
        </section>

        {/* LAS 4 VERTICALES */}
        <section>
          <h2 className="text-xl font-bold anim-fadeup">Cuatro formas de evaluar, en un solo lugar</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {[
              { e: "🧠", t: "Prueba HUMAN", d: "Test psicométrico propietario: comportamiento (DISC), motivadores (Valores) y estilo de pensamiento. Motor determinista, 100% exacto." },
              { e: "📥", t: "Assessment Center", d: "Bandeja de entrada simulada + situaciones del puesto. Mide conducta real con el método GENTZA (ORCSE, escala 1–5)." },
              { e: "📄", t: "CV / Evidencias", d: "Evalúa el CV contra el puesto y lo cruza con HUMAN (triangulación rasgo ↔ evidencia)." },
              { e: "📞", t: "Role-play por voz", d: "Una llamada en vivo con un colaborador de IA; se califica la conducta conversacional. Hecho con ElevenLabs." },
            ].map((v, i) => (
              <div key={v.t} className="card anim-pop" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="text-3xl">{v.e}</div>
                <div className="font-semibold mt-1">{v.t}</div>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section>
          <h2 className="text-xl font-bold anim-fadeup">Cómo funciona el flujo</h2>
          <div className="mt-4 space-y-3">
            {[
              { n: "1", t: "El psicólogo crea un proceso", d: "Pega la descripción del puesto y la empresa. La IA (Evaluador UNO) genera el perfil de referencia ideal — el ancla de compatibilidad." },
              { n: "2", t: "El candidato entra por un link único", d: "Da su consentimiento y completa las actividades, solo y a su ritmo, sin un evaluador presente." },
              { n: "3", t: "La IA interpreta y triangula", d: "Calcula puntajes exactos, redacta la interpretación y cruza las fuentes. El psicólogo recibe un reporte editable y decide." },
            ].map((s, i) => (
              <div key={s.n} className="flex gap-4 items-start card anim-fadeup" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="flex-none h-8 w-8 rounded-full bg-accent text-white grid place-items-center font-bold text-sm">{s.n}</div>
                <div>
                  <div className="font-semibold text-sm">{s.t}</div>
                  <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXPLORAR */}
        <section id="explorar" className="scroll-mt-4">
          <h2 className="text-xl font-bold anim-fadeup">Explóralo tú misma</h2>
          <p className="text-sm text-neutral-600 mt-1 anim-fadeup">Todo lo de abajo es la demo real, en vivo. Empieza por el reporte para ver el resultado final.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Explore href={REPORTE_COMPLETO} emoji="📊" title="Ver un reporte completo" badge="Empieza aquí"
              desc="Un candidato evaluado con las 4 verticales: gráficas de HUMAN, evaluación del CV, Assessment Center y el role-play por voz, con la interpretación de la IA." primary />
            <Explore href={EXPERIENCIA_CANDIDATO} emoji="🎤" title="Vívelo como candidato"
              desc="Abre el link de un candidato y prueba las actividades (incluida la llamada por voz — necesita micrófono). Así lo experimenta el evaluado." />
            <Explore href={PANEL} emoji="🧑‍⚕️" title="El panel del psicólogo"
              desc="Donde se crean los procesos, se agregan candidatos y se generan los reportes." />
            <Explore href={NUEVO} emoji="✨" title="Crea un proceso"
              desc="Pega un puesto y una empresa y mira cómo la IA arma el perfil de referencia y los ejercicios." />
          </div>
        </section>

        <p className="text-center text-xs text-neutral-400 anim-fadeup">
          MVP en vivo · Next.js + Supabase + Claude + ElevenLabs · evaluación human-in-the-loop
        </p>
      </div>
    </div>
  );
}

function Explore({ href, emoji, title, desc, badge, primary }: {
  href: string; emoji: string; title: string; desc: string; badge?: string; primary?: boolean;
}) {
  return (
    <Link href={href} className={`card block transition hover:shadow-md hover:-translate-y-0.5 ${primary ? "border-accent ring-1 ring-accent/20" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        {badge && <span className="text-[10px] uppercase tracking-wide bg-accent text-white px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div className="font-semibold mt-2">{title} <span className="text-accent">→</span></div>
      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{desc}</p>
    </Link>
  );
}
