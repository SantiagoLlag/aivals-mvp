"use client";
import { useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";

type Props = { token: string; candidateName: string; contexto: string; instrucciones: string; colaborador: string };
type Step = "intro" | "call" | "sending" | "done" | "failed";

export default function VozRunner(props: Props) {
  return (
    <ConversationProvider>
      <VozInner {...props} />
    </ConversationProvider>
  );
}

function VozInner({ token, candidateName, contexto, instrucciones, colaborador }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState<string | null>(null);
  const convIdRef = useRef<string | null>(null);
  const finalizedRef = useRef(false);
  const manualRef = useRef(false); // true solo si el candidato colgó a propósito

  const conversation = useConversation({
    onConnect: () => { try { convIdRef.current = conversation.getId(); } catch {} },
    onError: (e: any) => setError(typeof e === "string" ? e : e?.message ?? "Error de conexión."),
    onDisconnect: () => {
      // Fin normal (el candidato colgó) -> guardar. Corte inesperado -> ofrecer reintento, sin falso "¡Gracias!".
      if (manualRef.current) void finalize();
      else setStep("failed");
    },
  });

  async function start() {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      const name = e?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Tu navegador bloqueó el micrófono. Haz clic en el candado de la barra de direcciones, actívalo y recarga la página.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No detectamos ningún micrófono. Conecta uno y vuelve a intentar.");
      } else {
        setError("Necesitamos permiso del micrófono para la llamada. Permítelo y vuelve a intentar.");
      }
      return;
    }
    try {
      const res = await fetch(`/api/test/${token}/voice/start`, { method: "POST" });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "No se pudo iniciar."); }
      const { signedUrl, dynamicVariables } = await res.json();
      conversation.startSession({ signedUrl, dynamicVariables, connectionType: "websocket" } as any);
      setStep("call");
    } catch (e: any) {
      setError(e?.message || "No se pudo iniciar la llamada.");
    }
  }

  async function hangup() {
    manualRef.current = true;
    try { await conversation.endSession(); } catch {}
    void finalize();
  }

  function retry() {
    manualRef.current = false;
    finalizedRef.current = false;
    convIdRef.current = null;
    setError(null);
    setStep("intro");
  }

  async function finalize() {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    let id = convIdRef.current;
    try { id = id || conversation.getId(); } catch {}
    // Sin id no hubo conversación que guardar: no mostramos "¡Gracias!" en falso.
    if (!id) { finalizedRef.current = false; setError("No se registró la conversación. Intenta de nuevo."); setStep("failed"); return; }
    setStep("sending");
    try {
      const res = await fetch(`/api/test/${token}/voice`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      if (!res.ok) throw new Error();
      setStep("done");
    } catch {
      finalizedRef.current = false;
      setError("No pudimos guardar tu conversación. Intenta de nuevo.");
      setStep("failed");
    }
  }

  if (step === "done") {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto anim-pop">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold">¡Gracias, {candidateName}!</h2>
        <p className="text-sm text-neutral-600 mt-2">Terminaste la conversación. Será revisada por un evaluador profesional. Ya puedes cerrar esta ventana.</p>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-4xl mb-3">📵</div>
        <h2 className="text-xl font-bold">La llamada se interrumpió</h2>
        <p className="text-sm text-neutral-600 mt-2">{error || "La conexión se cortó antes de terminar. Puedes intentarlo de nuevo."}</p>
        <button className="btn-primary mt-5" onClick={retry}>Reintentar llamada</button>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-3 anim-float">⏳</div>
        <h2 className="text-lg font-bold">Guardando tu conversación…</h2>
        <p className="text-sm text-neutral-600 mt-1">Un momento, no cierres la ventana.</p>
      </div>
    );
  }

  if (step === "call") {
    const connected = conversation.status === "connected";
    const speaking = conversation.isSpeaking;
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <div className="card py-10">
          <div className={`mx-auto h-24 w-24 rounded-full grid place-items-center text-4xl transition ${speaking ? "bg-accent text-white anim-pulse" : "bg-accentSoft text-accent"}`}>
            🎧
          </div>
          <p className="mt-4 font-semibold">{colaborador}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {connected ? (speaking ? "Está hablando…" : "Te escucha. Habla con naturalidad.") : "Conectando…"}
          </p>
        </div>
        <button className="btn-ghost" onClick={hangup}>Terminar conversación</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="card text-center">
        <div className="text-4xl anim-float">📞</div>
        <h2 className="text-2xl font-bold mt-2 anim-fadeup">Conversación por voz</h2>
        <p className="text-sm text-neutral-600 mt-1 anim-fadeup max-w-md mx-auto" style={{ animationDelay: "80ms" }}>
          Vas a tener una <b>llamada real por voz</b> con un colaborador de tu equipo. Hablas tú, te responde en
          vivo. No es un examen — queremos ver <b>cómo conversas</b>.
        </p>
      </div>

      <div className="rounded-xl bg-accentSoft border border-accent/20 px-4 py-3 anim-fadeup" style={{ animationDelay: "160ms" }}>
        <div className="label text-accent">Tu situación</div>
        <p className="text-sm text-ink">{contexto}</p>
        <p className="text-sm text-ink mt-2"><b>Tu objetivo:</b> {instrucciones}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Tip emoji="🎙️" t="Habla natural" d="Es una llamada normal: habla cuando quieras, te escucha y responde." delay={220} />
        <Tip emoji="⏱️" t="Sin prisa" d="Tómate el tiempo que necesites. Tú decides cuándo terminar." delay={300} />
        <Tip emoji="🔒" t="Confidencial" d="Se graba y transcribe para tu evaluación profesional." delay={380} />
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-neutral-600 anim-fadeup" style={{ animationDelay: "460ms" }}>
        Al iniciar, tu navegador pedirá permiso del <b>micrófono</b> (acéptalo) y otorgas tu consentimiento para grabar y transcribir la llamada con fines de evaluación.
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full anim-pulse" onClick={start}>🎤 Iniciar llamada</button>
    </div>
  );
}

function Tip({ emoji, t, d, delay }: { emoji: string; t: string; d: string; delay: number }) {
  return (
    <div className="card anim-pop" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-2xl">{emoji}</div>
      <div className="font-semibold text-sm mt-1">{t}</div>
      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{d}</p>
    </div>
  );
}
