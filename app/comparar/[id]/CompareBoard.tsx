"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { CandidateComparison, ReferenceMini, Sem, VerticalKey, CompetencyCell } from "@/lib/compare/types";
import { globalEncaje, DEFAULT_WEIGHTS, VERTICAL_KEYS } from "@/lib/compare/score";
import { DiscProfile, ValoresChart, PensanteChart } from "@/components/charts";

const VMETA: Record<VerticalKey, { label: string; emoji: string; short: string }> = {
  human: { label: "HUMAN", emoji: "🧠", short: "HUMAN" },
  ac: { label: "Assessment Center", emoji: "📥", short: "AC" },
  cv: { label: "CV / Evidencias", emoji: "📄", short: "CV" },
  voz: { label: "Role-play por voz", emoji: "📞", short: "Voz" },
};
const SEM_BG: Record<Sem, string> = { verde: "#3f8f6b", amarillo: "#d9a441", rojo: "#c0563f", gris: "#e3e0da" };
const SEM_TX: Record<Sem, string> = { verde: "#ffffff", amarillo: "#3a2f12", rojo: "#ffffff", gris: "#6b6862" };
const PALETTE = ["#1f6f78", "#c0563f", "#d9a441", "#3f6fb0", "#7a5ea8", "#3f8f6b", "#b5654b", "#2f8a9b"];

const sem = (p: number | null): Sem =>
  p == null || Number.isNaN(p) ? "gris" : p >= 70 ? "verde" : p >= 45 ? "amarillo" : "rojo";
const fmt = (p: number | null) => (p == null ? "—" : String(Math.round(p)));

// Tres estados honestos por vertical:
//  scored     -> tiene encaje medible
//  unmeasured -> el candidato SÍ hizo la actividad, pero no es medible (p. ej. HUMAN sin perfil ideal)
//  missing    -> el candidato no completó la actividad
type CellState = "scored" | "unmeasured" | "missing";
const cellState = (v: { pct: number | null; available: boolean }): CellState =>
  v.pct != null ? "scored" : v.available ? "unmeasured" : "missing";

export default function CompareBoard({
  rows, reference,
}: {
  processId: string;
  processName: string;
  rows: CandidateComparison[];
  reference: ReferenceMini;
}) {
  const [weights, setWeights] = useState<Record<VerticalKey, number>>({ ...DEFAULT_WEIGHTS });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Verticales con al menos un candidato evaluado: solo esas se muestran/ponderan.
  const active = useMemo<VerticalKey[]>(
    () => VERTICAL_KEYS.filter((k) => rows.some((r) => r.verticals[k].pct != null)),
    [rows],
  );

  // Pesos efectivos: si el usuario pone todo en 0, se reparte equitativo para no romper el orden.
  const eff = useMemo(() => {
    const sum = active.reduce((a, k) => a + (weights[k] || 0), 0);
    if (sum > 0) return weights;
    const equal = { ...weights };
    active.forEach((k) => (equal[k] = 1));
    return equal;
  }, [weights, active]);

  const ranked = useMemo(() => {
    return rows
      .map((r) => ({ r, score: globalEncaje(r, eff) }))
      .sort((a, b) => {
        if (a.score == null && b.score == null) return a.r.name.localeCompare(b.r.name);
        if (a.score == null) return 1;
        if (b.score == null) return -1;
        return b.score - a.score;
      });
  }, [rows, eff]);

  const selectedRows = ranked.filter((x) => selected.has(x.r.id));
  const sumW = active.reduce((a, k) => a + (weights[k] || 0), 0);

  // Mejor candidato por vertical (para que el heatmap aporte una lectura por-columna
  // que el ranking no da). Solo si hay 2+ candidatos comparables.
  const bestByV = useMemo(() => {
    const m = {} as Record<VerticalKey, number | null>;
    for (const k of active) {
      const vals = rows.map((r) => r.verticals[k].pct).filter((p): p is number => p != null);
      m[k] = vals.length >= 2 ? Math.max(...vals) : null;
    }
    return m;
  }, [rows, active]);

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  return (
    <div className="space-y-5">
      {/* Contra qué se compara */}
      <ReferenceBanner reference={reference} humanActive={active.includes("human")} />

      {active.length === 0 && rows.length > 0 && (
        <div className="rounded-xl border border-line bg-paper/60 text-xs text-neutral-500 px-3 py-2">
          Todavía ningún candidato de este puesto tiene actividades evaluadas, así que aún no hay encaje que ponderar.
          En cuanto completen el test HUMAN, el Assessment Center, el CV o la llamada por voz, aparecerán aquí.
        </div>
      )}

      {/* Controles de peso (solo si hay verticales evaluadas) */}
      {active.length > 0 && (
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-sm">Pesos del encaje</h2>
          <div className="flex items-center gap-3">
            <Legend />
            <button
              onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
              className="text-xs text-accent hover:underline"
            >
              Reiniciar
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Define cuánto pesa cada vertical. El ranking se reordena en vivo. Una vertical que un candidato
          no completó no lo penaliza: su encaje se promedia solo sobre lo que sí tiene.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {active.map((k) => {
            const share = sumW > 0 ? Math.round(((weights[k] || 0) / sumW) * 100) : Math.round(100 / active.length);
            return (
              <div key={k} className="rounded-xl border border-line bg-paper/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{VETA(k)}</span>
                  <span className="tabular-nums text-neutral-500">{share}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5} value={weights[k]}
                  onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))}
                  className="w-full mt-2 accent-[#1f6f78]"
                  aria-label={`Peso de ${VMETA[k].label}`}
                />
              </div>
            );
          })}
        </div>
      </div>
      )}

      {rows.length === 0 ? (
        <div className="card text-center py-10 text-neutral-500">Este puesto aún no tiene candidatos.</div>
      ) : (
        <>
          {/* RANKING */}
          <div className="space-y-2">
            {ranked.map(({ r, score }, idx) => {
              const isOpen = expanded.has(r.id);
              const isSel = selected.has(r.id);
              const selColor = isSel ? PALETTE[selectedRows.findIndex((x) => x.r.id === r.id) % PALETTE.length] : undefined;
              return (
                <div key={r.id} className={`card p-0 overflow-hidden ${isSel ? "ring-1 ring-accent/40" : ""}`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-7 text-center text-sm font-bold text-neutral-400 tabular-nums">
                      {score == null ? "–" : idx + 1}
                    </div>
                    <button
                      onClick={() => setExpanded((s) => toggle(s, r.id))}
                      className="flex-1 min-w-0 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{r.name}</span>
                        {score == null && (
                          <span className="text-[10px] uppercase tracking-wide bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                            sin evaluaciones
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400">{r.completeness}/{active.length} verticales</span>
                      </div>
                      {/* barra de encaje + chips por vertical */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-2.5 rounded-full bg-paper border border-line overflow-hidden max-w-[260px]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${score ?? 0}%`, background: SEM_BG[sem(score)] }}
                          />
                        </div>
                        <div className="flex gap-1">
                          {active.map((k) => {
                            const v = r.verticals[k];
                            const st = cellState(v);
                            const label = st === "scored" ? fmt(v.pct) : st === "unmeasured" ? "sin perfil para medir" : "no evaluado";
                            return (
                              <span
                                key={k}
                                title={`${VMETA[k].label}: ${label}${v.note ? " · " + v.note : ""}`}
                                className={`inline-flex items-center justify-center text-[10px] font-semibold rounded w-7 h-5 tabular-nums ${st === "unmeasured" ? "border border-dashed border-neutral-300" : ""}`}
                                style={st === "scored"
                                  ? { background: SEM_BG[v.color], color: SEM_TX[v.color] }
                                  : { background: st === "unmeasured" ? "#f1eee8" : "#e3e0da", color: "#6f6b64" }}
                              >
                                {st === "scored" ? fmt(v.pct) : st === "unmeasured" ? "·" : "—"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </button>
                    <div className="text-right">
                      <div className="text-2xl font-bold tabular-nums leading-none" style={{ color: SEM_BG[sem(score)] }}>
                        {fmt(score)}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">encaje</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 pl-1">
                      <label
                        className="flex items-center gap-1 text-[11px] text-neutral-500 cursor-pointer select-none"
                        title="Sobreponer en el radar"
                      >
                        <input
                          type="checkbox" checked={isSel}
                          onChange={() => setSelected((s) => toggle(s, r.id))}
                          className="accent-[#1f6f78]"
                        />
                        <span style={selColor ? { color: selColor, fontWeight: 700 } : undefined}>radar</span>
                      </label>
                      <Link href={`/reporte/${r.id}`} className="text-[11px] text-accent hover:underline">
                        reporte →
                      </Link>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-line bg-paper/40 p-4">
                      <Detail row={r} reference={reference} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RADAR (al seleccionar) */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Radar de encaje</h2>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())} className="text-xs text-accent hover:underline">
                  Limpiar selección
                </button>
              )}
            </div>
            {active.length < 3 ? (
              <p className="text-xs text-neutral-500 mt-2">
                El radar necesita al menos 3 verticales evaluadas en este puesto. Por ahora compara con el ranking y el
                mapa de calor.
              </p>
            ) : selectedRows.length === 0 ? (
              <p className="text-xs text-neutral-500 mt-2">
                Marca la casilla <b>radar</b> de 2 o 3 candidatos en el ranking para sobreponer sus perfiles de encaje.
              </p>
            ) : (
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <Radar active={active} rows={selectedRows.map((x) => x.r)} colorOf={(id) =>
                    PALETTE[selectedRows.findIndex((x) => x.r.id === id) % PALETTE.length]} />
                  <ul className="space-y-1.5 text-sm">
                    {selectedRows.map((x, i) => {
                      const ejes = active.filter((k) => x.r.verticals[k].pct != null).length;
                      return (
                        <li key={x.r.id} className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                          <span className="font-medium">{x.r.name}</span>
                          <span className="text-neutral-400 tabular-nums">{fmt(x.score)}</span>
                          <span className="text-[10px] text-neutral-400">· {ejes}/{active.length} ejes con dato</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <p className="text-[11px] text-neutral-400 mt-3">
                  Cada eje es una vertical (0 al centro, 100 en el borde). Los ejes donde un candidato no tiene dato se
                  omiten de su figura — no se dibujan como 0.
                </p>
              </div>
            )}
          </div>

          {/* MAPA DE CALOR */}
          <div className="card overflow-x-auto">
            <h2 className="font-semibold text-sm mb-3">Mapa de calor por vertical</h2>
            <table className="w-full border-separate" style={{ borderSpacing: "0 4px" }}>
              <thead>
                <tr className="text-[11px] text-neutral-500">
                  <th className="text-left font-medium px-2 pb-1">Candidato</th>
                  <th className="text-center font-medium px-2 pb-1">Encaje</th>
                  {active.map((k) => (
                    <th key={k} className="text-center font-medium px-2 pb-1 whitespace-nowrap">
                      {VMETA[k].emoji} {VMETA[k].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ r, score }) => (
                  <tr key={r.id}>
                    <td className="px-2">
                      <button onClick={() => setExpanded((s) => toggle(s, r.id))} className="text-sm font-medium text-left hover:text-accent truncate max-w-[180px]">
                        {r.name}
                      </button>
                    </td>
                    <td className="px-1">
                      <Cell state={score == null ? "missing" : "scored"} pct={score} strong />
                    </td>
                    {active.map((k) => {
                      const v = r.verticals[k];
                      const st = cellState(v);
                      const best = v.pct != null && bestByV[k] != null && Math.round(v.pct) === Math.round(bestByV[k]);
                      const label = st === "scored" ? fmt(v.pct) : st === "unmeasured" ? "hecho, sin perfil para medir" : "no evaluado";
                      return (
                        <td key={k} className="px-1">
                          <Cell
                            state={st} pct={v.pct} best={best}
                            title={`${VMETA[k].label}: ${label}${v.note ? " · " + v.note : ""}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
              Cada celda es el encaje 0–100 de esa vertical. <b style={{ color: SEM_BG.verde }}>Verde ≥70</b> ·{" "}
              <b style={{ color: SEM_BG.amarillo }}>amarillo 45–69</b> · <b style={{ color: SEM_BG.rojo }}>rojo &lt;45</b>.
              {" "}<b>·</b> = hizo la actividad pero falta el perfil para medirla · <b>—</b> = no evaluado ·{" "}
              <span style={{ boxShadow: "inset 0 0 0 2px #171a1f", padding: "0 4px", borderRadius: 3 }}>borde</span> = mejor en esa columna.
              Clic en un nombre para ver el detalle.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function VETA(k: VerticalKey) {
  return `${VMETA[k].emoji} ${VMETA[k].short}`;
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-neutral-500">
      {(["verde", "amarillo", "rojo"] as Sem[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SEM_BG[s] }} />
          {s === "verde" ? "≥70" : s === "amarillo" ? "45–69" : "<45"}
        </span>
      ))}
    </div>
  );
}

function Cell({
  pct, state, title, strong, best,
}: { pct: number | null; state: CellState; title?: string; strong?: boolean; best?: boolean }) {
  const size = strong ? "w-14 h-9 text-base font-bold" : "w-12 h-8 text-sm font-semibold";
  if (state === "unmeasured") {
    return (
      <div title={title} className={`mx-auto grid place-items-center rounded-md border border-dashed border-neutral-300 text-neutral-500 ${size}`} style={{ background: "#f1eee8" }}>
        ·
      </div>
    );
  }
  const c = sem(pct); // scored, o missing (pct null -> gris "—")
  return (
    <div
      title={title}
      className={`mx-auto grid place-items-center rounded-md tabular-nums ${size}`}
      style={{ background: SEM_BG[c], color: SEM_TX[c], boxShadow: best ? "0 0 0 2px #171a1f" : undefined }}
    >
      {fmt(pct)}
    </div>
  );
}

function ReferenceBanner({ reference, humanActive }: { reference: ReferenceMini; humanActive: boolean }) {
  if (!reference.hasReference) {
    if (!humanActive) return null;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
        Este puesto no tiene <b>perfil de referencia</b> (Evaluador UNO), así que el encaje HUMAN no se puede medir.
        Genéralo en el proceso para activar esa columna.
      </div>
    );
  }
  const d = reference.discIdeal;
  return (
    <div className="card">
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Encaje medido contra el perfil ideal del puesto</div>
      {reference.resumen && <p className="text-sm text-neutral-700 mt-1">{reference.resumen}</p>}
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {d && (
          <span className="rounded-md bg-paper border border-line px-2 py-1">
            DISC ideal · D{d.D} I{d.I} S{d.S} C{d.C}
          </span>
        )}
        {reference.valoresDeseados?.map((v) => (
          <span key={v} className="rounded-md bg-accentSoft text-accent px-2 py-1">{v}</span>
        ))}
        {reference.estiloPensamiento && (
          <span className="rounded-md bg-paper border border-line px-2 py-1">Pensar: {reference.estiloPensamiento}</span>
        )}
      </div>
    </div>
  );
}

// ---------- Detalle expandible (nivel 2) ----------
function Detail({ row, reference }: { row: CandidateComparison; reference: ReferenceMini }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* HUMAN */}
      <div className="rounded-xl border border-line bg-white p-3">
        <h3 className="text-sm font-semibold mb-2">{VMETA.human.emoji} HUMAN</h3>
        {row.human ? (
          <div className="space-y-3">
            <DiscProfile
              title="DISC (perfil interpretado)"
              scores={row.human.disc.profiles[row.human.disc.interpretedProfile]}
              highlight
            />
            {reference.discIdeal && (
              <p className="text-[11px] text-neutral-500">
                Ideal del puesto · D{reference.discIdeal.D} I{reference.discIdeal.I} S{reference.discIdeal.S} C{reference.discIdeal.C}
              </p>
            )}
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 mb-1">Valores</div>
              <ValoresChart scores={row.human.valores.scores} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 mb-1">Estilo de pensamiento</div>
              <PensanteChart scores={row.human.pensante.scores} />
            </div>
            <CellList cells={row.verticals.human.detail} />
            {row.verticals.human.note && <Note text={row.verticals.human.note} />}
          </div>
        ) : (
          <Empty />
        )}
      </div>

      {/* AC / CV / Voz */}
      <div className="space-y-4">
        {(["ac", "cv", "voz"] as VerticalKey[]).map((k) => {
          const v = row.verticals[k];
          return (
            <div key={k} className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{VMETA[k].emoji} {VMETA[k].label}</h3>
                {v.pct != null && (
                  <span className="text-sm font-bold tabular-nums" style={{ color: SEM_BG[v.color] }}>{fmt(v.pct)}</span>
                )}
              </div>
              {v.available ? (
                <div className="mt-2">
                  <CellList cells={v.detail} />
                  {v.note && <Note text={v.note} />}
                </div>
              ) : (
                <Empty />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CellList({ cells }: { cells: CompetencyCell[] }) {
  if (!cells.length) return null;
  return (
    <div className="space-y-2">
      {cells.map((c) => (
        <div key={c.key} className="text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: SEM_BG[c.color] }} />
            <span className="font-medium flex-1">{c.name}</span>
            <span className="tabular-nums text-neutral-600">
              {c.scale === "1-5" ? `${c.score.toFixed(0)}/5` : `${Math.round(c.score)}/100`}
            </span>
          </div>
          {c.note && <p className="text-[11px] text-neutral-500 mt-0.5 pl-[18px]">{c.note}</p>}
          {c.evidence?.slice(0, 2).map((e, i) => (
            <p key={i} className="text-[11px] text-neutral-500 italic mt-0.5 pl-[18px] border-l-2 border-line ml-[3px]">“{e}”</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function Note({ text }: { text: string }) {
  return <p className="text-[11px] text-neutral-500 mt-2 border-t border-line pt-2">{text}</p>;
}
function Empty() {
  return <p className="text-xs text-neutral-400 mt-2">Sin datos: el candidato no completó esta actividad.</p>;
}

// ---------- Radar SVG puro ----------
function Radar({
  active, rows, colorOf,
}: {
  active: VerticalKey[];
  rows: CandidateComparison[];
  colorOf: (id: string) => string;
}) {
  const size = 250, cx = size / 2, cy = size / 2, R = 84;
  const n = active.length;
  const ang = (i: number) => (-90 + (i * 360) / n) * (Math.PI / 180);
  const pt = (val: number, i: number) => {
    const r = (Math.max(0, Math.min(100, val)) / 100) * R;
    return [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))] as const;
  };
  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox="-16 -8 282 266" width={size} height={size} className="shrink-0">
      {/* anillos */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={active.map((_, i) => pt(ring, i).join(",")).join(" ")}
          fill="none" stroke="#e3e0da" strokeWidth={1}
        />
      ))}
      {/* ejes + etiquetas */}
      {active.map((k, i) => {
        const [x, y] = pt(100, i);
        const [lx, ly] = pt(112, i);
        const anchor = Math.abs(lx - cx) < 6 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={k}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e3e0da" strokeWidth={1} />
            <text x={lx} y={ly} fontSize={10} fill="#6b6862" textAnchor={anchor} dominantBaseline="middle">
              {VMETA[k].short}
            </text>
          </g>
        );
      })}
      {/* polígonos de candidatos: solo los ejes con dato (null NO se dibuja como 0) */}
      {rows.map((r) => {
        const c = colorOf(r.id);
        const pts = active
          .map((k, i) => ({ i, pct: r.verticals[k].pct }))
          .filter((x): x is { i: number; pct: number } => x.pct != null)
          .map((x) => pt(x.pct, x.i));
        const ptsStr = pts.map((p) => p.join(",")).join(" ");
        return (
          <g key={r.id}>
            {pts.length >= 3 ? (
              <polygon points={ptsStr} fill={c} fillOpacity={0.12} stroke={c} strokeWidth={2} />
            ) : pts.length === 2 ? (
              <polyline points={ptsStr} fill="none" stroke={c} strokeWidth={2} />
            ) : null}
            {pts.map((p, j) => (
              <circle key={j} cx={p[0]} cy={p[1]} r={2.5} fill={c} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
