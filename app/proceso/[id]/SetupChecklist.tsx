// Tira compacta con el estado de preparación del proceso (informativa, sin acciones).
// Server component: los estados se calculan en page.tsx y llegan como props.
import { getServerT } from "@/lib/i18n-server";
import type { ReactNode } from "react";

function Item({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-text2">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full shrink-0 ${ok ? "bg-success" : "bg-neutral-400"}`} />
      {children}
    </span>
  );
}

export default function SetupChecklist({
  refOk,
  bateria,
  acReady,
  vozReady,
  nCandidates,
}: {
  refOk: boolean;
  // null cuando la batería no aplica (FLAGS.bigFive apagado)
  bateria: { selected: number; total: number } | null;
  acReady: boolean;
  vozReady: boolean;
  nCandidates: number;
}) {
  const { t } = getServerT();
  return (
    <div className="card py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Item ok={refOk}>
          {t("Perfil de referencia", "Reference profile")} {refOk ? "✓" : "—"}
        </Item>
        {bateria && (
          <Item ok={bateria.selected > 0}>
            {t(`Batería ${bateria.selected}/${bateria.total}`, `Battery ${bateria.selected}/${bateria.total}`)}
          </Item>
        )}
        <Item ok={acReady}>AC {acReady ? "✓" : t("pendiente", "pending")}</Item>
        <Item ok={vozReady}>
          {t("Voz", "Voice")} {vozReady ? "✓" : t("pendiente", "pending")}
        </Item>
        <Item ok={nCandidates > 0}>
          {t(
            `${nCandidates} candidato${nCandidates === 1 ? "" : "s"}`,
            `${nCandidates} candidate${nCandidates === 1 ? "" : "s"}`
          )}
        </Item>
      </div>
    </div>
  );
}
