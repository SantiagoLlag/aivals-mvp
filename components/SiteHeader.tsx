"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Un solo header para toda la app que cambia de rol según la ruta:
//  - rutas del candidato (/test/...): marca neutra, SIN enlace al dashboard y SIN "Panel del psicólogo"
//    (el candidato no debe poder saltar al panel con la lista de todas las empresas).
//  - resto (panel del psicólogo): logo que vuelve al panel + leyenda "Panel del psicólogo".
export default function SiteHeader() {
  const path = usePathname() ?? "";
  const isCandidate = path.startsWith("/test/");

  const brand = (
    <span className="flex items-center gap-2 font-semibold text-accent900">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3 L20 19 H15.2 L12 11.6 L8.8 19 H4 Z" fill="#11303a" />
        <circle cx="12" cy="15.4" r="1.5" fill="#2b7a83" />
      </svg>
      Aivals
    </span>
  );

  return (
    <header className="border-b border-line bg-white/80 backdrop-blur sticky top-0 z-10 print:hidden">
      <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
        {isCandidate ? brand : <Link href="/">{brand}</Link>}
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-text3">
          {isCandidate ? "Evaluación de talento" : "Panel del psicólogo"}
        </span>
      </div>
    </header>
  );
}
