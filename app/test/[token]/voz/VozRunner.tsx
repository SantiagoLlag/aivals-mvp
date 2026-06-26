"use client";
import { useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useT } from "@/components/LangProvider";

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
  const { t } = useT();
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState<string | null>(null);
  const convIdRef = useRef<string | null>(null);
  const finalizedRef = useRef(false);
  const manualRef = useRef(false); // true solo si el candidato colgó a propósito

  const conversation = useConversation({
    onConnect: () => { try { convIdRef.current = conversation.getId(); } catch {} },
    onError: (e: any) => setError(typeof e === "string" ? e : e?.message ?? t("Error de conexión.", "Connection error.")),
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
        setError(t("Tu navegador bloqueó el micrófono. Haz clic en el candado de la barra de direcciones, actívalo y recarga la página.", "Your browser blocked the microphone. Click the lock icon in the address bar, enable it, and reload the page."));
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError(t("No detectamos ningún micrófono. Conecta uno y vuelve a intentar.", "We couldn't detect a microphone. Connect one and try again."));
      } else {
        setError(t("Necesitamos permiso del micrófono para la llamada. Permítelo y vuelve a intentar.", "We need microphone permission for the call. Allow it and try again."));
      }
      return;
    }
    try {
      const res = await fetch(`/api/test/${token}/voice/start`, { method: "POST" });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || t("No se pudo iniciar.", "Could not start.")); }
      const { signedUrl, dynamicVariables } = await res.json();
      conversation.startSession({ signedUrl, dynamicVariables, connectionType: "websocket" } as any);
      setStep("call");
    } catch (e: any) {
      setError(e?.message || t("No se pudo iniciar la llamada.", "Could not start the call."));
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
    if (!id) { finalizedRef.current = false; setError(t("No se registró la conversación. Intenta de nuevo.", "The conversation was not recorded. Please try again.")); setStep("failed"); return; }
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
      setError(t("No pudimos guardar tu conversación. Intenta de nuevo.", "We couldn't save your conversation. Please try again."));
      setStep("failed");
    }
  }

  if (step === "done") {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto anim-pop">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold">{t("¡Gracias, ", "Thank you, ")}{candidateName}!</h2>
        <p className="text-sm text-neutral-600 mt-2">{t("Terminaste la conversación. Será revisada por un evaluador profesional. Ya puedes cerrar esta ventana.", "You finished the conversation. It will be reviewed by a professional evaluator. You can now close this window.")}</p>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-4xl mb-3">📵</div>
        <h2 className="text-xl font-bold">{t("La llamada se interrumpió", "The call was interrupted")}</h2>
        <p className="text-sm text-neutral-600 mt-2">{error || t("La conexión se cortó antes de terminar. Puedes intentarlo de nuevo.", "The connection dropped before finishing. You can try again.")}</p>
        <button className="btn-primary mt-5" onClick={retry}>{t("Reintentar llamada", "Retry call")}</button>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-3xl mb-3 anim-float">⏳</div>
        <h2 className="text-lg font-bold">{t("Guardando tu conversación…", "Saving your conversation…")}</h2>
        <p className="text-sm text-neutral-600 mt-1">{t("Un momento, no cierres la ventana.", "One moment, please don't close the window.")}</p>
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
            {connected ? (speaking ? t("Está hablando…", "Speaking…") : t("Te escucha. Habla con naturalidad.", "Listening to you. Speak naturally.")) : t("Conectando…", "Connecting…")}
          </p>
        </div>
        <button className="btn-ghost" onClick={hangup}>{t("Terminar conversación", "End conversation")}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="card text-center">
        <div className="text-4xl anim-float">📞</div>
        <h2 className="text-2xl font-bold mt-2 anim-fadeup">{t("Conversación por voz", "Voice conversation")}</h2>
        <p className="text-sm text-neutral-600 mt-1 anim-fadeup max-w-md mx-auto" style={{ animationDelay: "80ms" }}>
          {t("Vas a tener una", "You will have a")} <b>{t("llamada real por voz", "real voice call")}</b> {t("con un colaborador de tu equipo. Hablas tú, te responde en vivo. No es un examen — queremos ver", "with a colleague from your team. You speak, and they answer live. It's not an exam — we want to see")} <b>{t("cómo conversas", "how you converse")}</b>.
        </p>
      </div>

      <div className="rounded-xl bg-accentSoft border border-accent/20 px-4 py-3 anim-fadeup" style={{ animationDelay: "160ms" }}>
        <div className="label text-accent">{t("Tu situación", "Your situation")}</div>
        <p className="text-sm text-ink">{contexto}</p>
        <p className="text-sm text-ink mt-2"><b>{t("Tu objetivo:", "Your goal:")}</b> {instrucciones}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Tip emoji="🎙️" t={t("Habla natural", "Speak naturally")} d={t("Es una llamada normal: habla cuando quieras, te escucha y responde.", "It's a normal call: speak whenever you want, it listens and responds.")} delay={220} />
        <Tip emoji="⏱️" t={t("Sin prisa", "No rush")} d={t("Tómate el tiempo que necesites. Tú decides cuándo terminar.", "Take all the time you need. You decide when to finish.")} delay={300} />
        <Tip emoji="🔒" t={t("Confidencial", "Confidential")} d={t("Se graba y transcribe para tu evaluación profesional.", "It is recorded and transcribed for your professional assessment.")} delay={380} />
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-neutral-600 anim-fadeup" style={{ animationDelay: "460ms" }}>
        {t("Al iniciar, tu navegador pedirá permiso del", "When you start, your browser will ask for permission to use the")} <b>{t("micrófono", "microphone")}</b> {t("(acéptalo) y otorgas tu consentimiento para grabar y transcribir la llamada con fines de evaluación.", "(accept it) and you give your consent to record and transcribe the call for assessment purposes.")}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full anim-pulse" onClick={start}>🎤 {t("Iniciar llamada", "Start call")}</button>
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
