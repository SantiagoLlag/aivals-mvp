// Tipos del Assessment Center (5a vertical). Separan CAPTURA de CALIFICACIÓN (regla GENTZA).

export interface CharolaItem {
  id: string;
  asunto: string;            // subject line
  de: string;                // remitente
  cuerpo: string;            // contenido del correo/memo
  competencias: string[];    // competency keys que este ítem busca estresar
}

export interface SjtScenario {
  id: string;
  situacion: string;
  pregunta: string;
  competencia: string;       // competency key objetivo
}

// Generado por la IA (Evaluador estilo UNO) y curado por el psicólogo. Vive en el proceso.
export interface AcBlueprint {
  generatedBy: "ai" | "template";
  generatedAt: string;
  contextoPuesto: string;          // contexto breve que ve el candidato (rol, empresa, escenario)
  charola: { instrucciones: string; items: CharolaItem[] };
  sjt: { instrucciones: string; escenarios: SjtScenario[] };
  competencyKeys: string[];        // competencias evaluadas
  approved: boolean;               // el psicólogo lo aprobó antes de activar el link
  gentzaFiel: boolean;             // false: rúbrica en formato GENTZA, contenido provisional
}

// ---- Captura (verbatim del candidato), SIN calificar ----
export interface CharolaResponse { itemId: string; accion: string; rationale: string }
export interface SjtResponse { scenarioId: string; respuesta: string }
export interface AcCapture {
  charola: CharolaResponse[];
  sjt: SjtResponse[];
  submittedAt: string;
}

// ---- Calificación (propuesta IA + edición del psicólogo) ----
export interface CompetencyScore {
  competency: string;        // competency key
  exercise: "charola" | "sjt";
  score: number;             // 1-5
  evidence: string[];        // citas verbatim
  rationale: string;
  edited?: boolean;          // el psicólogo sobrescribió
}
export interface AcScoring {
  source: "ai" | "pending";
  generatedAt: string;
  porCompetencia: CompetencyScore[];
  resumen: string;
  semaforo: { competency: string; color: "verde" | "amarillo" | "rojo" }[];
}

export interface AcResult {
  captura: AcCapture;
  calificacion?: AcScoring;
}
