// Tipos de la vertical de voz (role-play con agente ElevenLabs).

// Generado por Evaluador UNO y curado por el psicólogo. Calibra el escenario al puesto.
export interface VoiceBlueprint {
  generatedBy: "ai" | "template";
  generatedAt: string;
  agentId?: string;                 // id del agente de ElevenLabs (se configura una vez)
  contexto: string;                 // contexto que ve el candidato (su rol de jefe, el caso)
  instrucciones: string;            // qué se espera que haga en la llamada
  // Variables dinámicas que se inyectan al agente al iniciar la llamada:
  scenario: {
    nombre_colaborador: string;
    puesto_colaborador: string;
    historial_desempeno: string;    // hechos documentados del bajo desempeño
    causa_legitima: string;         // causa de fondo que el candidato debe descubrir
  };
  competencyKeys: string[];
  approved: boolean;
  gentzaFiel: boolean;
}

// ---- Captura (transcript del actor IA), SIN calificar ----
export interface TranscriptTurn { role: "agent" | "user"; text: string }
export interface ElevenCriterion { id: string; result: string; rationale?: string }
export interface ElevenDataPoint { key: string; value: unknown; rationale?: string }
export interface ElevenAnalysis {
  criteria: ElevenCriterion[];        // evaluation criteria nativos (GENTZA)
  dataCollection: ElevenDataPoint[];  // data collection points (evidencia ORCSE)
  summary?: string;
}

export interface VoiceCapture {
  conversationId?: string;
  transcript: TranscriptTurn[];
  durationSecs?: number;
  analysis?: ElevenAnalysis;          // criterios + data collection de ElevenLabs
  submittedAt: string;
}

// ---- Calificación (ORCSE, post-hoc) ----
export interface VoiceCompetencyScore {
  competency: string;
  score: number;          // 1-5
  evidence: string[];     // citas verbatim del candidato (turnos "user")
  rationale: string;
  edited?: boolean;
}
export interface VoiceScoring {
  source: "ai" | "pending";
  generatedAt: string;
  porCompetencia: VoiceCompetencyScore[];
  resumen: string;
  semaforo: { competency: string; color: "verde" | "amarillo" | "rojo" }[];
}

export interface VoiceResult {
  captura: VoiceCapture;
  calificacion?: VoiceScoring;
}
