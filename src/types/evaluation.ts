export type PerformanceLevel = "I" | "II" | "III" | "IV";

export interface TeacherEvaluation {
  id: string;
  teacherId: string;
  evaluatorId: string;
  evaluatorName: string;
  date: string;
  time: string; // Nueva: hora de la evaluación
  reflectiveDialogueDate: string | null;
  reflectiveDialogueTime: string | null; // Nueva: hora del diálogo reflexivo
  evidenceImageUrl: string | null; // Nueva: URL de la imagen de evidencia
  evidenceImageBase64?: string | null; // Nueva: imagen en base64 para exportación

  // Los 6 desempeños evaluados
  performance1: PerformanceLevel; // Involucra activamente a los estudiantes
  performance2: PerformanceLevel; // Promueve el razonamiento, creatividad y pensamiento crítico
  performance3: PerformanceLevel; // Evalúa el progreso de los aprendizajes
  performance4: PerformanceLevel; // Propicia un ambiente de respeto y proximidad
  performance5: PerformanceLevel; // Regula positivamente el comportamiento
  performance6: PerformanceLevel; // Uso de ayudas tecnológicas

  // Comentarios adicionales
  observations: string;
  strengths: string;
  improvementAreas: string;
  commitments: string;

  createdAt: string;
  updatedAt: string;
}

export interface EvaluationFormData
  extends Omit<TeacherEvaluation, "id" | "createdAt" | "updatedAt"> {
  id?: string;
  evidenceImage?: File | null; // Para el archivo de imagen en el formulario
}

// Descripciones de los niveles para cada desempeño
export const performanceDescriptions = {
  performance1: {
    I: "Su explicación es confusa, poco clara, con uso excesivo de jerga. No hay progresión lógica en los temas.",
    II: "Su explicación generalmente es clara, pero con momentos de confusión o falta de fluidez.",
    III: "La explicación es muy clara, lógica y fluida. Utiliza lenguaje comprensible y ejemplos pertinentes.",
    IV: "Explica excepcionalmente con clara, concisa y cautivadora, la sesión de aprendizaje. Simplifica lo complejo con eficiencia y usa analogías conceptuales. Usa la clase invertida o entrega material extra, antes de la sesión.",
  },
  performance2: {
    I: "La clase predominantemente, es unilateral. Se observa pocas o nulas oportunidades para la participación de los estudiantes, a través del chat, los estudiantes no usan rl micro, porque el docente no lo promueve.",
    II: "Intenta esporádicamente la interacción con los estudiantes, pero no logra una participación sostenida o equitativa, a través del chat y/o micro.",
    III: "Fomenta activamente la participación mediante preguntas, encuestas o actividades. Escucha y responde a los estudiantes, a través del chat y/o micro.",
    IV: "Empieza explorando saberes previos de los estudintes. Promueve una interacción constante y significativa. Utiliza diversas estrategias para involucrar a todos o casi todos los estudiantes, a través del chat y/o micro. Motiva al estudiante a lo largo de la clase.",
  },
  performance3: {
    I: "Se observa en el docente dificultades frecuentes con el uso de la plataforma y herramientas. Problemas técnicos que interrumpen la clase.",
    II: "Maneja lo básico de la plataforma; resuelve ocasionalmente problemas técnicos, el uso de recursos tecnológicos es limitado.",
    III: "Maneja fluidamente la plataforma Meet y las herramientas básicas. Utiliza los recursos tecnológicos de manera efectiva para el aprendizaje. Usa lápices y resaltadores virtuales para aclarar las diapositivas. ",
    IV: "Domina excepcional la plataforma Meet y herramientas avanzadas. Maximiza el potencial de la tecnología para la interacción, visualización y evaluación. Usa gamificaciones como Kahoot, Quizizz, Cerebriti, entre otras. Uso de Tableta gráfica.",
  },
  performance4: {
    I: "Poca gestión del tiempo; temas incompletos o exceso de contenido. Su ritmo es inadecuado para el aprendizaje.",
    II: "Gestiiona el tiempo aceptablemente, pero con algunas desviaciones. El ritmo podría ser más ajustado.",
    III: "Gestiona eficientemente el tiempo, cubriendo los objetivos de la clase de manera adecuada. Su ritmo esequilibrado permitiendo la comprensión.",
    IV: "Gestiona cronometrada del tiempo, optimizando cada minuto para el aprendizaje. Su ritmo es dinámico y adaptable a las necesidades de los estudiantes, haciendo pausas cada cierto tiempo, para evaluar lo explicado. ",
  },
  performance5: {
    I: "La retroalimentación del docente es escasa, genérica o tardía. No utiliza la evaluación formativa durante la clase.",
    II: "Retroalimenta ocasionalmente, a veces, poco específico. Utiliza algunas preguntas, pero sin un seguimiento claro.",
    III: "Ofrece retroalimentación clara y específica durante la clase. Utiliza preguntas y actividades para verificar la comprensión.",
    IV: "Ofrece retroalimentación reflexiva, personalizada. Diseña actividades de evaluación formativa innovadoras para monitorear el aprendizaje en tiempo real. Lo que planifica lo evalua, formativamente. Se organiza para evaluar poco a poco a los estudiantes a lo largo del tiempo.",
  },
  performance6: {
    I: "El trato del docente es impersonal o distante. No genera un ambiente de confianza para los estudiantes.",
    II: "Su trato, generalmente, es respetuoso, pero con poca expresión de empatía. No siempre logra conectar emocionalmente.",
    III: "Establece un ambiente de respeto y confianza. Demuestra empatía al escuchar y atender las preocupaciones de los estudiantes.",
    IV: "Crea un ambiente virtual excepcionalmente cálido, seguro y motivador. Muestra profunda empatía, comprensión y cercanía, fomentando el bienestar emocional. Conecta con la cámara para transmitir emociones.",
  },
};

// Títulos de los desempeños
export const performanceTitles = {
  performance1: "Claridad y Coherencia en la Explicación",
  performance2: "Fomento de la Participación e Interacción",
  performance3: "Manejo de Herramientas Tecnológicas y Plataforma",
  performance4: "Gestión del Tiempo y Ritmo de la Clase",
  performance5: "Retroalimentación (Feedback) y Evaluación Formativa",
  performance6: "Clima Emocional y Empatía",
};

// Descripción general de los niveles
export const levelDescriptions = {
  I: "Insuficiente (Necesita Mejora Sustancial)",
  II: "En Desarrollo (Necesita Reforzamiento)",
  III: "Competente (Desempeño Sólido)",
  IV: "Sobresaliente (Ejemplar)",
};
