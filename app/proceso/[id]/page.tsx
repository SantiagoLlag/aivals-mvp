import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcess } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { voiceEnabled } from "@/lib/voice/elevenlabs";
import ProcessClient from "./ProcessClient";
import AcBlueprintPanel from "./AcBlueprintPanel";
import VoiceBlueprintPanel from "./VoiceBlueprintPanel";

export const dynamic = "force-dynamic";

export default async function ProcessPage({ params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) notFound();
  const ref = proc.reference;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-accent">← Procesos</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{proc.name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Creado el {new Date(proc.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {ref?.source === "ai" && (
        <div className="card">
          <h2 className="font-semibold mb-2">Perfil de referencia (Evaluador UNO)</h2>
          {ref.resumen && <p className="text-sm text-neutral-700">{ref.resumen}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {ref.discIdeal && (
              <span className="rounded-md bg-paper border border-line px-2 py-1">
                DISC ideal · D{ref.discIdeal.D} I{ref.discIdeal.I} S{ref.discIdeal.S} C{ref.discIdeal.C}
              </span>
            )}
            {ref.valoresDeseados?.map((v) => (
              <span key={v} className="rounded-md bg-accentSoft text-accent px-2 py-1">{v}</span>
            ))}
          </div>
          {ref.estiloPensamiento && <p className="text-xs text-neutral-500 mt-2">Pensamiento: {ref.estiloPensamiento}</p>}
        </div>
      )}

      <AcBlueprintPanel processId={proc.id} blueprint={proc.acBlueprint ?? null} aiEnabled={aiEnabled()} />

      <VoiceBlueprintPanel processId={proc.id} blueprint={proc.voiceBlueprint ?? null} aiEnabled={aiEnabled()} voiceConfigured={voiceEnabled()} />

      <ProcessClient
        processId={proc.id}
        candidates={proc.candidates.map((c) => ({
          id: c.id, name: c.name, token: c.token, status: c.status,
          human: !!c.result, cv: !!c.cv, ac: !!c.acResult, voice: !!c.voiceResult,
        }))}
      />
    </div>
  );
}
