// Núcleo i18n CLIENT-SAFE (sin next/headers): tipos + helper de traducción inline.
//
// Patrón: en vez de un diccionario por claves, cada string se escribe en el lugar como
//   t("Texto en español", "Text in English")
// El español queda LITERAL en el código (default), así que con el idioma en "es" —o con la
// feature apagada— el comportamiento es byte-idéntico al de antes de i18n.

export type Lang = "es" | "en";
export const LANG_COOKIE = "lang";

export type T = (es: string, en: string) => string;

// Devuelve el traductor para un idioma ya resuelto. Puro: seguro en cliente y servidor.
export function makeT(lang: Lang): T {
  return (es, en) => (lang === "en" ? en : es);
}
