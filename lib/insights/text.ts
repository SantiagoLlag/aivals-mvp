// Utilidades de texto DETERMINISTAS (sin IA) para la banda de evidencia. Español MX.
// Nada aquí usa modelos de lenguaje: solo regex y conteos.

export function words(s: string): string[] {
  return s.match(/\p{L}+/gu) ?? [];
}
export function wordCount(s: string): number {
  return words(s).length;
}
export function countQuestions(s: string): number {
  return (s.match(/\?/g) ?? []).length;
}
export function normalize(s: string): string {
  // quita acentos: descompone y elimina diacríticos combinantes (U+0300–U+036F)
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
