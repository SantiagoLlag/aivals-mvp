// Evidencia determinista del CV (sin IA). Métricas de documento y detección por patrón.
import type { CvData } from "@/lib/cv/types";

// La detección se hace sobre CVs en español (contexto MX); por eso los patrones quedan en
// español. `key` es estable para que la UI traduzca la etiqueta sin tocar la detección.
const SECCIONES: { key: string; label: string; re: RegExp }[] = [
  { key: "experiencia", label: "Experiencia", re: /experiencia|trayectoria|empleo|laboral/i },
  { key: "educacion", label: "Educación", re: /educaci[oó]n|formaci[oó]n acad|estudios|escolaridad/i },
  { key: "certificaciones", label: "Certificaciones", re: /certificaci|diplomad|cursos/i },
  { key: "idiomas", label: "Idiomas", re: /idiomas?|ingl[eé]s|lenguas?/i },
  { key: "contacto", label: "Contacto", re: /tel[eé]fono|correo|e-?mail/i },
];

export type CvMetrics = {
  palabras: number;
  chars: number;
  secciones: { key: string; label: string; presente: boolean }[];
  emails: string[];
  urls: string[];
  anios: string[];
};

export function cvMetrics(cv: CvData): CvMetrics {
  const text = cv.text ?? "";
  return {
    palabras: (text.match(/\p{L}+/gu) ?? []).length,
    chars: cv.chars ?? text.length,
    secciones: SECCIONES.map((s) => ({ key: s.key, label: s.label, presente: s.re.test(text) })),
    emails: [...new Set(text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [])].slice(0, 5),
    urls: [...new Set(text.match(/(?:https?:\/\/|www\.|linkedin\.com)\S+/gi) ?? [])].slice(0, 5),
    anios: [...new Set(text.match(/\b(?:19|20)\d{2}\b/g) ?? [])].sort(),
  };
}
