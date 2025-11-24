import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "@slosarek/docxtemplater-image-module-free";
import { saveAs } from "file-saver";
import type { TeacherEvaluation } from "../types/evaluation";
import type { Teacher } from "../types/teacher";
import {
  performanceTitles,
  performanceDescriptions,
} from "../types/evaluation";

/* ─────────────── UTILIDADES GENERALES ─────────────── */

const getPerformanceDescription = (
  performance: string,
  level: string
): string => {
  const descriptions =
    performanceDescriptions[
      performance as keyof typeof performanceDescriptions
    ];
  return descriptions[level as keyof typeof descriptions] || "";
};

const calculateTotalScore = (evaluation: TeacherEvaluation): number => {
  const levels = [
    evaluation.performance1,
    evaluation.performance2,
    evaluation.performance3,
    evaluation.performance4,
    evaluation.performance5,
    evaluation.performance6,
  ];

  const levelValues = levels.map((level) => {
    switch (level) {
      case "I":
        return 1;
      case "II":
        return 2;
      case "III":
        return 3;
      case "IV":
        return 4;
      default:
        return 0;
    }
  });

  return levelValues.reduce<number>((sum, value) => sum + value, 0);
};

const getTotalScoreText = (totalScore: number): string => {
  if (totalScore >= 21) return "Destacado (21-24 puntos)";
  if (totalScore >= 15) return "Satisfactorio (15-20 puntos)";
  if (totalScore >= 9) return "En proceso (9-14 puntos)";
  return "Inicio (6-8 puntos)";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string, timeString?: string): string => {
  const formattedDate = formatDate(dateString);
  return timeString ? `${formattedDate} a las ${timeString}` : formattedDate;
};

/* Convierte base64 → Uint8Array que exige el image-module */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const data = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(data);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};
/* ---------------------- Imagen: dimensiones ---------------------- */
interface Dim {
  w: number;
  h: number;
}

const getPngDimensions = (u8: Uint8Array): Dim | null => {
  if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) {
    const view = new DataView(u8.buffer);
    return { w: view.getUint32(16), h: view.getUint32(20) };
  }
  return null;
};

const getJpegDimensions = (u8: Uint8Array): Dim | null => {
  if (u8[0] !== 0xff || u8[1] !== 0xd8) return null;
  let i = 2;
  while (i < u8.length) {
    if (u8[i] !== 0xff) return null;
    const marker = u8[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const view = new DataView(u8.buffer, i + 5, 4);
      return { h: view.getUint16(0), w: view.getUint16(2) };
    }
    const len = (u8[i + 2] << 8) + u8[i + 3];
    i += 2 + len;
  }
  return null;
};

const getImageDimensions = (u8: Uint8Array): Dim =>
  getPngDimensions(u8) || getJpegDimensions(u8) || { w: 400, h: 300 };

/* ---------------------- Escalado ---------------------- */
const MAX_W = 580; // ~6 pulgadas dentro de márgenes Word (96 dpi)
const MAX_H = 760; // altura para que no invada el pie de página

const constrain = ({ w, h }: Dim): Dim => {
  const ratio = Math.min(MAX_W / w, MAX_H / h, 1); // nunca aumenta tamaño
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
};

/* ------------------------------------------------------------------
 *  CONFIGURACIÓN DEL IMAGE MODULE (función para crear nueva instancia)
 * ------------------------------------------------------------------ */
const createImageModule = () =>
  new ImageModule({
    getImage: (tag: string) => base64ToUint8Array(tag),
    getSize: (img: Uint8Array) => {
      const dim = constrain(getImageDimensions(img));
      return [dim.w, dim.h];
    },
    getProps: (tag: string) => {
      if (tag.includes("jpeg") || tag.includes("jpg"))
        return { extension: "jpeg" };
      if (tag.includes("webp")) return { extension: "webp" };
      return { extension: "png" };
    },
  });

/* ──────────────  GENERACIÓN DE DOCUMENTOS ────────────── */

/* 1. Documento de una sola evaluación */
export const generateEvaluationDocument = async (
  teacher: Teacher,
  evaluation: TeacherEvaluation
): Promise<void> => {
  try {
    /* Cargar plantilla */
    const resp = await fetch("/templates/evaluation-template.docx");
    if (!resp.ok) throw new Error("No se pudo cargar el template");
    const zip = new PizZip(await resp.arrayBuffer());

    /* Instanciar Docxtemplater con el módulo de imágenes */
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [createImageModule()], // Crear nueva instancia cada vez
    });

    const totalScore = calculateTotalScore(evaluation);

    /* Datos para la plantilla */
    const data = {
      /* ── Información del docente ── */
      teacher_name: `${teacher.apellidos}, ${teacher.nombres}`,
      teacher_dni: teacher.dni,
      teacher_course: teacher.curso.toUpperCase(),
      teacher_phone: teacher.telefono,
      teacher_email_personal: teacher.correoPersonal,
      teacher_email_institutional: teacher.correoInstitucional,
      teacher_work_condition: teacher.condicionInstitucional,
      teacher_total_hours: teacher.totalHoras.toString(),

      /* ── Información de la evaluación ── */
      evaluator_name: evaluation.evaluatorName,
      evaluation_date: formatDateTime(evaluation.date, evaluation.time),
      dialogue_date: evaluation.reflectiveDialogueDate
        ? formatDateTime(
            evaluation.reflectiveDialogueDate,
            evaluation.reflectiveDialogueTime || undefined
          )
        : "No registrada",

      /* Imagen de evidencia */
      has_evidence_image: !!evaluation.evidenceImageBase64,
      evidence_image: evaluation.evidenceImageBase64 || "",

      /* Puntaje total de desempeño */
      total_score: totalScore.toString(),
      total_score_text: getTotalScoreText(totalScore),

      /* Desempeños individuales */
      performance1_title: performanceTitles.performance1,
      performance1_level: `Nivel ${evaluation.performance1}`,
      performance1_description: getPerformanceDescription(
        "performance1",
        evaluation.performance1
      ),

      performance2_title: performanceTitles.performance2,
      performance2_level: `Nivel ${evaluation.performance2}`,
      performance2_description: getPerformanceDescription(
        "performance2",
        evaluation.performance2
      ),

      performance3_title: performanceTitles.performance3,
      performance3_level: `Nivel ${evaluation.performance3}`,
      performance3_description: getPerformanceDescription(
        "performance3",
        evaluation.performance3
      ),

      performance4_title: performanceTitles.performance4,
      performance4_level: `Nivel ${evaluation.performance4}`,
      performance4_description: getPerformanceDescription(
        "performance4",
        evaluation.performance4
      ),

      performance5_title: performanceTitles.performance5,
      performance5_level: `Nivel ${evaluation.performance5}`,
      performance5_description: getPerformanceDescription(
        "performance5",
        evaluation.performance5
      ),

      performance6_title: performanceTitles.performance6,
      performance6_level: `Nivel ${evaluation.performance6}`,
      performance6_description: getPerformanceDescription(
        "performance6",
        evaluation.performance6
      ),

      /* Comentarios */
      observations:
        evaluation.observations || "No se registraron observaciones.",
      strengths: evaluation.strengths || "No se registraron fortalezas.",
      improvement_areas:
        evaluation.improvementAreas || "No se registraron áreas de mejora.",
      commitments: evaluation.commitments || "No se registraron compromisos.",

      /* Fechas del sistema */
      creation_date: evaluation.createdAt
        ? new Date(evaluation.createdAt).toLocaleDateString("es-PE")
        : "",
      current_date: new Date().toLocaleDateString("es-PE"),
      current_year: new Date().getFullYear().toString(),

      /* Información institucional */
      institution_name: "CEPRUNSA - Centro de Estudios Preuniversitarios",
      institution_address: "Universidad Nacional de San Agustín de Arequipa",
    };

    /* Renderizar y generar */
    doc.render(data);
    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const fileName = `Evaluacion_${teacher.apellidos.replace(
      /\s+/g,
      "_"
    )}_${teacher.nombres.replace(/\s+/g, "_")}_${evaluation.date.replace(
      /-/g,
      ""
    )}.docx`;
    saveAs(blob, fileName);
  } catch (err) {
    console.error("Error al generar el documento:", err);
    throw new Error(
      "No se pudo generar el documento. Por favor, inténtelo de nuevo."
    );
  }
};

/* 2. Reporte de múltiples evaluaciones (sin imágenes) */
export const generateMultipleEvaluationsDocument = async (
  evaluationsData: Array<{ teacher: Teacher; evaluation: TeacherEvaluation }>
): Promise<void> => {
  try {
    const resp = await fetch("/templates/multiple-evaluations-template.docx");
    if (!resp.ok) throw new Error("No se pudo cargar el template");
    const zip = new PizZip(await resp.arrayBuffer());

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const evaluations = evaluationsData.map(({ teacher, evaluation }) => {
      const totalScore = calculateTotalScore(evaluation);
      return {
        teacher_name: `${teacher.apellidos}, ${teacher.nombres}`,
        teacher_course: teacher.curso.toUpperCase(),
        evaluation_date: formatDate(evaluation.date),
        evaluator_name: evaluation.evaluatorName,
        total_score: totalScore.toString(),
        total_score_text: getTotalScoreText(totalScore),
        has_evidence: !!evaluation.evidenceImageUrl,
        evidence_status: evaluation.evidenceImageUrl
          ? "Con evidencia"
          : "Sin evidencia",
      };
    });

    doc.render({
      evaluations,
      total_evaluations: evaluations.length,
      evaluations_with_evidence: evaluations.filter((e) => e.has_evidence)
        .length,
      evaluations_without_evidence: evaluations.filter((e) => !e.has_evidence)
        .length,
      generation_date: new Date().toLocaleDateString("es-PE"),
      institution_name: "CEPRUNSA - Centro de Estudios Preuniversitarios",
    });

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const fileName = `Reporte_Evaluaciones_${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}.docx`;
    saveAs(blob, fileName);
  } catch (err) {
    console.error("Error al generar el documento múltiple:", err);
    throw new Error(
      "No se pudo generar el documento. Por favor, inténtelo de nuevo."
    );
  }
};
