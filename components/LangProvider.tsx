"use client";
// Provee el idioma (resuelto en el servidor desde la cookie) a todos los client components.
// Úsalo así dentro de un componente cliente:  const { t } = useT();  …  t("Hola", "Hi")
import { createContext, useContext, useMemo } from "react";
import { makeT, type Lang, type T } from "@/lib/i18n";

const Ctx = createContext<{ lang: Lang; t: T }>({ lang: "es", t: (es) => es });

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}
