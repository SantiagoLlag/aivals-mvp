// Rúbrica de evaluación de CV (Evaluador de Evidencias). Dimensiones y pesos tomados
// del "CV template" del proyecto. Cada dimensión se califica 1-5; el global 0-100 es el
// promedio ponderado. La evaluación es SIEMPRE relativa al puesto/empresa de referencia.

export interface CvDimension {
  key: string;
  name: string;
  weight: number; // % del peso total (suma 100)
  desc: string;
}

export const CV_DIMENSIONS: CvDimension[] = [
  { key: "technical", name: "Habilidades técnicas", weight: 25, desc: "habilidades técnicas requeridas y deseadas para el puesto, certificaciones y desarrollo profesional" },
  { key: "experience", name: "Experiencia", weight: 25, desc: "experiencia relevante en roles similares, alineación de industria, seniority apropiado y progresión de carrera" },
  { key: "achievement", name: "Logros", weight: 20, desc: "logros cuantificados con métricas, uso del marco STAR e impacto demostrable" },
  { key: "culturalFit", name: "Ajuste cultural", weight: 15, desc: "encaje con la cultura y los valores de la empresa, inferido del contenido y trayectoria del CV" },
  { key: "education", name: "Educación y credenciales", weight: 10, desc: "cumplimiento de la formación mínima requerida, posgrados y credenciales relevantes" },
  { key: "presentation", name: "Presentación y comunicación", weight: 5, desc: "formato y profesionalismo, redacción clara y sin errores, longitud apropiada y flujo lógico" },
];

export const cvDimensionByKey = (k: string) => CV_DIMENSIONS.find((d) => d.key === k);
