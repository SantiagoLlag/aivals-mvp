// Tipos del Evaluador de Evidencias (CV) y de la integración con HUMAN.

export interface CvDimensionScore {
  key: string;
  score: number;        // 1-5
  evidence: string[];   // citas/observaciones del CV
  note: string;
}

// Evaluación AISLADA del CV (contra el puesto/empresa).
export interface CvIsolatedEval {
  source: "ai" | "pending";
  generatedAt: string;
  overall: number;            // 0-100 ponderado
  dimensions: CvDimensionScore[];
  strengths: string[];
  gaps: string[];
  flags: string[];            // banderas / faltantes vs requisitos
  summary: string;
}

// Evaluación INTEGRADA: CV + resultados HUMAN (triangulación / Evaluador Central).
export interface CvIntegratedEval {
  source: "ai" | "pending";
  generatedAt: string;
  congruencias: string[];     // rasgo (HUMAN) ↔ evidencia (CV) que se refuerzan
  discrepancias: string[];    // señales en conflicto a explorar
  compatibilidad: { score: number; rationale: string }; // 0-100 ajuste integral
  explorarEnEntrevista: string[];
  summary: string;
}

export interface CvData {
  fileName: string;
  uploadedAt: string;
  text: string;
  chars: number;
  isolated?: CvIsolatedEval;
  integrated?: CvIntegratedEval;
}
