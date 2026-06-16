// Gráficas del reporte HUMAN — SVG puro, sin dependencias.
import type { FactorScores, ValueScores, StyleScores } from "@/lib/human/types";

const FACTOR_COLOR: Record<string, string> = { D: "#c0563f", I: "#d9a441", S: "#3f8f6b", C: "#3f6fb0" };
const FACTOR_NAME: Record<string, string> = { D: "Dominancia", I: "Influencia", S: "Estabilidad", C: "Cumplimiento" };

function HBar({ label, value, color, cut }: { label: string; value: number; color: string; cut?: number }) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-28 shrink-0 text-neutral-600">{label}</div>
      <div className="relative h-5 flex-1 rounded bg-paper border border-line overflow-hidden">
        {cut != null && (
          <div className="absolute top-0 bottom-0 w-px bg-neutral-400/60" style={{ left: `${cut}%` }} />
        )}
        <div className="h-full rounded-l" style={{ width: `${w}%`, background: color }} />
      </div>
      <div className="w-8 text-right tabular-nums font-medium">{Math.round(value)}</div>
    </div>
  );
}

export function DiscProfile({ title, scores, highlight }: { title: string; scores: FactorScores; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-accent bg-accentSoft/40" : "border-line bg-white"}`}>
      <div className="text-xs font-semibold mb-2 flex items-center gap-2">
        {title}{highlight && <span className="text-[10px] font-bold text-accent">INTERPRETADO</span>}
      </div>
      <div className="space-y-1.5">
        {(["D", "I", "S", "C"] as const).map((f) => (
          <HBar key={f} label={f} value={scores[f]} color={FACTOR_COLOR[f]} cut={50} />
        ))}
      </div>
    </div>
  );
}

export function ValoresChart({ scores }: { scores: ValueScores }) {
  const names: Record<string, string> = { T: "Teórico", E: "Económico", A: "Estético", S: "Social", P: "Político", R: "Regulatorio" };
  return (
    <div className="space-y-1.5">
      {(["T", "E", "A", "S", "P", "R"] as const).map((v) => (
        <HBar key={v} label={names[v]} value={scores[v]} color={scores[v] >= 49 ? "#1f6f78" : "#a8a29e"} cut={49} />
      ))}
      <div className="text-[10px] text-neutral-400 pl-28">línea de corte 49 (ALTO ≥ 49)</div>
    </div>
  );
}

export function PensanteChart({ scores }: { scores: StyleScores }) {
  const names: Record<string, string> = { A: "Análisis", V: "Visión", I: "Intuición", L: "Lógica" };
  const color = (v: number) => (v >= 70 ? "#1f6f78" : v >= 45 ? "#5aa0a6" : "#a8a29e");
  return (
    <div className="space-y-1.5">
      {(["A", "V", "I", "L"] as const).map((s) => (
        <HBar key={s} label={names[s]} value={scores[s]} color={color(scores[s])} />
      ))}
      <div className="text-[10px] text-neutral-400 pl-28">BAJO 0–44 · MEDIO 45–69 · ALTO 70–100</div>
    </div>
  );
}

export { FACTOR_NAME };
