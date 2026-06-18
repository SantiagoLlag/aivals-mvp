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
    <span className="flex items-center gap-2 font-semibold">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-white text-xs">A</span>
      Aivals
    </span>
  );

  return (
    <header className="border-b border-line bg-white/70 backdrop-blur sticky top-0 z-10 print:hidden">
      <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
        {isCandidate ? brand : <Link href="/">{brand}</Link>}
        <span className="text-xs text-neutral-500">
          {isCandidate ? "Evaluación de talento" : "Panel del psicólogo"}
        </span>
      </div>
    </header>
  );
}
