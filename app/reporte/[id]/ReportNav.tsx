"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/LangProvider";

// Navegación pegajosa por secciones del reporte (FLAGS.reportNav).
// Igual que ReportTour: descubre las <section> presentes anclándose al texto del <h2>
// en sus variantes ES/EN. Tolera ausencias (p. ej. Triangulación puede no existir aún).
const TARGETS: { key: string; headings: string[]; es: string; en: string }[] = [
  { key: "human", headings: ["Comportamiento (DISC)", "Behavior (DISC)"], es: "HUMAN", en: "HUMAN" },
  { key: "bigfive", headings: ["Personalidad — Big Five", "Personality — Big Five"], es: "Big Five", en: "Big Five" },
  { key: "ac", headings: ["Assessment Center"], es: "AC", en: "AC" },
  { key: "cv", headings: ["Evidencias (CV)", "Evidence (Résumé)"], es: "CV", en: "CV" },
  { key: "voz", headings: ["Role-play por voz", "Voice role-play"], es: "Voz", en: "Voice" },
  { key: "interpretacion", headings: ["Interpretación profesional", "Professional interpretation"], es: "Interpretación", en: "Interpretation" },
  { key: "triangulacion", headings: ["Triangulación multi-método", "Multi-method triangulation"], es: "Triangulación", en: "Triangulation" },
];

// Compensación de los elementos pegajosos: header del sitio (h-14 = 56px) + esta barra (~48px).
const SCROLL_OFFSET = 112;

type Item = { key: string; es: string; en: string };

export default function ReportNav() {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const elsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    // Descubre las secciones EN ORDEN DEL DOCUMENTO para que el scroll-spy sea coherente.
    const els = new Map<string, HTMLElement>();
    const found: Item[] = [];
    document.querySelectorAll("section").forEach((sec) => {
      const h = sec.querySelector("h2")?.textContent ?? "";
      for (const tgt of TARGETS) {
        if (els.has(tgt.key)) continue;
        if (tgt.headings.some((v) => h.includes(v))) {
          // scroll-margin-top vía JS: así scrollIntoView({ block: "start" }) no queda
          // tapado por el header sticky ni por esta barra, sin tocar page.tsx.
          sec.style.scrollMarginTop = `${SCROLL_OFFSET}px`;
          els.set(tgt.key, sec);
          found.push({ key: tgt.key, es: tgt.es, en: tgt.en });
          break;
        }
      }
    });
    elsRef.current = els;
    setItems(found);
    if (found.length < 2) return;

    // Estado activo: la primera sección (en orden del documento) visible en la zona de lectura.
    const visibility = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visibility.set(e.target, e.isIntersecting));
        for (const it of found) {
          const el = els.get(it.key);
          if (el && visibility.get(el)) {
            setActiveKey(it.key);
            return;
          }
        }
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -55% 0px`, threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (items.length < 2) return null;

  function goTo(key: string) {
    const el = elsRef.current.get(key);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveKey(key);
  }

  return (
    <nav
      role="navigation"
      aria-label={t("Secciones del reporte", "Report sections")}
      className="no-print sticky top-14 z-[9] bg-white/85 backdrop-blur border-b border-line"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto py-2">
        {items.map((it) => {
          const active = it.key === activeKey;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => goTo(it.key)}
              aria-current={active ? "location" : undefined}
              className={`text-[11px] rounded-full px-2.5 py-1 font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "bg-paper border border-line text-neutral-600 hover:text-accent hover:border-accent/40"
              }`}
            >
              {t(it.es, it.en)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
