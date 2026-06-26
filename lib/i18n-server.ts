// i18n SOLO server (lee la cookie). Los server components/route handlers usan getServerT().
import { cookies } from "next/headers";
import { FLAGS } from "./flags";
import { makeT, LANG_COOKIE, type Lang, type T } from "./i18n";

// Idioma activo: cookie "lang" (default "es"). Con la feature apagada, siempre "es".
export function getLang(): Lang {
  if (!FLAGS.i18n) return "es";
  return cookies().get(LANG_COOKIE)?.value === "en" ? "en" : "es";
}

export function getServerT(): { lang: Lang; t: T } {
  const lang = getLang();
  return { lang, t: makeT(lang) };
}
