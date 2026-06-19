// Gráficas del reporte HUMAN — SVG puro, sin dependencias.
import type { FactorScores, ValueScores, StyleScores } from "@/lib/human/types";

// Colores de dominio DISC (design language) — identifican factor, no son semáforo.
const FACTOR_COLOR: Record<string, string> = { D: "#9c4a39", I: "#b08a32", S: "#3a7d5e", C: "#3f6390" };
const FACTOR_NAME: Record<string, string> = { D: "Dominancia", I: "Influencia", S: "Estabilidad", C: "Cumplimiento" };
const TEAL = "#1d4e57"; // accent-700
const GRIS = "#8a8d92"; // texto-3 / neutro

function HBar({ label, value, color, cut }: { label: string; value: number; color: string; cut?: number }) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <div className="w-28 shrink-0 text-neutral-600">{label}</div>
      <div className="relative h-2.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
        {cut != null && (
          <div className="absolute top-0 bottom-0 w-px bg-neutral-300 z-10" style={{ left: `${cut}%` }} />
        )}
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
      </div>
      <div className="w-8 text-right tabular-nums font-medium text-ink">{Math.round(value)}</div>
    </div>
  );
}

export function DiscProfile({ title, scores, highlight }: { title: string; scores: FactorScores; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-accent bg-accentSoft/50" : "border-line bg-white"}`}>
      <div className="text-xs font-semibold mb-2.5 flex items-center gap-2">
        {title}{highlight && <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-accent">interpretado</span>}
      </div>
      <div className="space-y-2">
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
    <div className="space-y-2">
      {(["T", "E", "A", "S", "P", "R"] as const).map((v) => (
        <HBar key={v} label={names[v]} value={scores[v]} color={scores[v] >= 49 ? TEAL : GRIS} cut={49} />
      ))}
      <div className="font-mono text-[10px] text-neutral-400 pl-28">línea de corte 49 · ALTO ≥ 49</div>
    </div>
  );
}

export function PensanteChart({ scores }: { scores: StyleScores }) {
  const names: Record<string, string> = { A: "Análisis", V: "Visión", I: "Intuición", L: "Lógica" };
  const color = (v: number) => (v >= 70 ? TEAL : v >= 45 ? "#5b9aa0" : GRIS);
  return (
    <div className="space-y-2">
      {(["A", "V", "I", "L"] as const).map((s) => (
        <HBar key={s} label={names[s]} value={scores[s]} color={color(scores[s])} />
      ))}
      <div className="font-mono text-[10px] text-neutral-400 pl-28">BAJO 0–44 · MEDIO 45–69 · ALTO 70–100</div>
    </div>
  );
}

export { FACTOR_NAME };
