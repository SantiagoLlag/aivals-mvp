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
import SetupChecklist from "./SetupChecklist";
import ConfigSection from "./ConfigSection";

export const dynamic = "force-dynamic";

export default async function ProcessPage({ params }: { params: { id: string } }) {
  const proc = await getProcess(params.id);
  if (!proc) notFound();
  const ref = proc.reference;
  const { t } = getServerT();

  if (!FLAGS.procesoV2) {
    // Ruta anterior (FF_PROCESO_V2=0): configuración arriba, candidatos abajo.
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
          bigfive={FLAGS.bigFive}
          candidates={proc.candidates.map((c) => ({
            id: c.id, name: c.name, token: c.token, status: c.status,
            human: !!c.result, cv: !!c.cv, ac: !!c.acResult, voice: !!c.voiceResult,
            bigfive: !!c.bigFive?.result,
          }))}
        />
      </div>
    );
  }

  // ---- Proceso v2: checklist + candidatos primero, configuración colapsable ----
  const refOk = ref?.source === "ai";
  const bateriaSel = TEST_CATALOG.filter((m) => testSelected(proc, m.key)).length;
  const bateriaTotal = TEST_CATALOG.length;
  const acReady = testReady(proc, "ac");
  const vozReady = testReady(proc, "voz");
  const acMensajes = proc.acBlueprint?.charola?.items?.length ?? 0;

  const configSummary = [
    `${t("Perfil", "Profile")} ${refOk ? "✓" : "—"}`,
    acReady
      ? t(`AC ✓ ${acMensajes} ${acMensajes === 1 ? "mensaje" : "mensajes"}`, `AC ✓ ${acMensajes} ${acMensajes === 1 ? "message" : "messages"}`)
      : t("AC pendiente", "AC pending"),
    vozReady ? t("Voz ✓", "Voice ✓") : t("Voz pendiente", "Voice pending"),
    ...(FLAGS.bigFive ? [t(`Batería ${bateriaSel}/${bateriaTotal}`, `Battery ${bateriaSel}/${bateriaTotal}`)] : []),
  ].join(" · ");

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

      <SetupChecklist
        refOk={refOk}
        bateria={FLAGS.bigFive ? { selected: bateriaSel, total: bateriaTotal } : null}
        acReady={acReady}
        vozReady={vozReady}
        nCandidates={proc.candidates.length}
      />

      <ProcessClient
        processId={proc.id}
        reabrir={FLAGS.reabrirTest}
        bigfive={FLAGS.bigFive}
        candidates={proc.candidates.map((c) => ({
          id: c.id, name: c.name, token: c.token, status: c.status,
          human: !!c.result, cv: !!c.cv, ac: !!c.acResult, voice: !!c.voiceResult,
          bigfive: !!c.bigFive?.result,
        }))}
      />

      <ConfigSection summary={configSummary} defaultOpen={!(acReady && vozReady)}>
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
      </ConfigSection>
    </div>
  );
}
