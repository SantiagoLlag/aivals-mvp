import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcess } from "@/lib/store";
import { aiEnabled } from "@/lib/ai";
import { voiceEnabled } from "@/lib/voice/elevenlabs";
import { FLAGS } from "@/lib/flags";
import { getServerT } from "@/lib/i18n-server";
import { TEST_CATALOG, testSelected, testReady } from "@/lib/tests/catalog";
import ProcessClient from "./ProcessClient";
import ReferencePanel from "./ReferencePanel";
import AcBlueprintPanel from "./AcBlueprintPanel";
import VoiceBlueprintPanel from "./VoiceBlueprintPanel";
import TestsPanel from "./TestsPanel";

export const dynamic = "force-dynamic";

export default async function ProcessPage({ params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) notFound();
  const ref = proc.reference;
  const { t } = getServerT();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-accent">{t("← Procesos", "← Processes")}</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{proc.name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {t(
            `Creado el ${new Date(proc.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`,
            `Created on ${new Date(proc.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`
          )}
        </p>
      </div>

      {FLAGS.bigFive && (
        <TestsPanel
          processId={proc.id}
          tests={TEST_CATALOG.map((m) => ({
            key: m.key, nameEs: m.nameEs, nameEn: m.nameEn, descEs: m.descEs, descEn: m.descEn,
            selected: testSelected(proc, m.key), ready: testReady(proc, m.key), blueprint: m.blueprint, newish: m.newish,
          }))}
        />
      )}

      {ref?.source === "ai" && (
        <ReferencePanel processId={proc.id} reference={ref} aiEnabled={aiEnabled()} />
      )}

      <AcBlueprintPanel processId={proc.id} blueprint={proc.acBlueprint ?? null} aiEnabled={aiEnabled()} customize={FLAGS.acCustomize} />

      <VoiceBlueprintPanel processId={proc.id} blueprint={proc.voiceBlueprint ?? null} aiEnabled={aiEnabled()} voiceConfigured={voiceEnabled()} />

      <ProcessClient
        processId={proc.id}
        reabrir={FLAGS.reabrirTest}
        candidates={proc.candidates.map((c) => ({
          id: c.id, name: c.name, token: c.token, status: c.status,
          human: !!c.result, cv: !!c.cv, ac: !!c.acResult, voice: !!c.voiceResult,
        }))}
      />
    </div>
  );
}
