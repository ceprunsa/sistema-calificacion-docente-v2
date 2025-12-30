import * as XLSX from "xlsx";
import type { TeacherEvaluation } from "../types/evaluation";
import type { Teacher } from "../types/teacher";

// Función para calcular la suma total de desempeño
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

// Función para convertir nivel a número
const levelToNumber = (level: string): number => {
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
};

export const exportTeacherEvaluationsToExcel = (
  teacher: Teacher,
  evaluations: TeacherEvaluation[]
) => {
  // Preparar los datos para Excel
  const excelData = evaluations.map((evaluation, index) => ({
    "N°": index + 1,
    Apellidos: teacher.apellidos,
    Nombres: teacher.nombres,
    Curso: teacher.curso.toUpperCase(),
    Dni: teacher.dni,
    Telefono: teacher.telefono,
    Correo: teacher.correoPersonal,
    CorreoInstitucional: teacher.correoInstitucional,
    Turno1: teacher.horasPorTurno["turno 1"] || 0,
    Turno2: teacher.horasPorTurno["turno 2"] || 0,
    Turno3: teacher.horasPorTurno["turno 3"] || 0,
    TotalHoras: teacher.totalHoras,
    "Fecha de Evaluación": new Date(
      evaluation.date + "T00:00:00"
    ).toLocaleDateString("es-PE"),
    Evaluador: evaluation.evaluatorName,
    "Fecha Diálogo Reflexivo": evaluation.reflectiveDialogueDate
      ? new Date(
          evaluation.reflectiveDialogueDate + "T00:00:00"
        ).toLocaleDateString("es-PE")
      : "No realizado",
    "Desempeño 1": evaluation.performance1,
    "Desempeño 1 (Valor)": levelToNumber(evaluation.performance1),
    "Desempeño 2": evaluation.performance2,
    "Desempeño 2 (Valor)": levelToNumber(evaluation.performance2),
    "Desempeño 3": evaluation.performance3,
    "Desempeño 3 (Valor)": levelToNumber(evaluation.performance3),
    "Desempeño 4": evaluation.performance4,
    "Desempeño 4 (Valor)": levelToNumber(evaluation.performance4),
    "Desempeño 5": evaluation.performance5,
    "Desempeño 5 (Valor)": levelToNumber(evaluation.performance5),
    "Desempeño 6": evaluation.performance6,
    "Desempeño 6 (Valor)": levelToNumber(evaluation.performance6),
    "Puntaje Total": calculateTotalScore(evaluation),
    "Puntaje Máximo": 24,
    Observaciones: evaluation.observations || "",
    Fortalezas: evaluation.strengths || "",
    "Areas de Mejora": evaluation.improvementAreas || "",
    Compromisos: evaluation.commitments || "",
  }));

  // Crear el libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Crear la hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Configurar el ancho de las columnas
  const columnWidths = [
    { wch: 5 }, // N°
    { wch: 20 }, // Apellidos
    { wch: 20 }, // Nombres
    { wch: 25 }, // Curso
    { wch: 15 }, // Dni
    { wch: 15 }, // Telefono
    { wch: 25 }, // Correo Personal
    { wch: 25 }, // Correo Institucional
    { wch: 10 }, // Turno 1
    { wch: 10 }, // Turno 2
    { wch: 10 }, // Turno 3
    { wch: 12 }, // Total Horas
    { wch: 15 }, // Fecha de Evaluación
    { wch: 25 }, // Evaluador
    { wch: 18 }, // Fecha Diálogo Reflexivo
    { wch: 12 }, // Desempeño 1
    { wch: 8 }, // Desempeño 1 (Valor)
    { wch: 12 }, // Desempeño 2
    { wch: 8 }, // Desempeño 2 (Valor)
    { wch: 12 }, // Desempeño 3
    { wch: 8 }, // Desempeño 3 (Valor)
    { wch: 12 }, // Desempeño 4
    { wch: 8 }, // Desempeño 4 (Valor)
    { wch: 12 }, // Desempeño 5
    { wch: 8 }, // Desempeño 5 (Valor)
    { wch: 12 }, // Desempeño 6
    { wch: 8 }, // Desempeño 6 (Valor)
    { wch: 12 }, // Puntaje Total
    { wch: 12 }, // Puntaje Máximo
    { wch: 30 }, // Observaciones
    { wch: 30 }, // Fortalezas
    { wch: 30 }, // Areas de Mejora
    { wch: 30 }, // Compromisos
  ];

  worksheet["!cols"] = columnWidths;

  // Agregar la hoja al libro
  const sheetName = `${teacher.apellidos}_${teacher.nombres}`.substring(0, 31); // Excel limita a 31 caracteres
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generar el nombre del archivo
  const fileName = `Evaluaciones_${teacher.apellidos}_${teacher.nombres}_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  // Descargar el archivo
  XLSX.writeFile(workbook, fileName);
};

export const exportAllTeachersEvaluationsToExcel = (
  teachersWithEvaluations: Array<{
    teacher: Teacher;
    evaluations: TeacherEvaluation[];
  }>
) => {
  // Preparar los datos para Excel combinando todos los profesores
  const allData: any[] = [];

  teachersWithEvaluations.forEach(({ teacher, evaluations }) => {
    evaluations.forEach((evaluation, _evalIndex) => {
      allData.push({
        "N°": allData.length + 1,
        Apellidos: teacher.apellidos,
        Nombres: teacher.nombres,
        Curso: teacher.curso.toUpperCase(),
        Dni: teacher.dni,
        Telefono: teacher.telefono,
        Correo: teacher.correoPersonal,
        CorreoInstitucional: teacher.correoInstitucional,
        Turno1: teacher.horasPorTurno["turno 1"] || 0,
        Turno2: teacher.horasPorTurno["turno 2"] || 0,
        Turno3: teacher.horasPorTurno["turno 3"] || 0,
        TotalHoras: teacher.totalHoras,
        "Fecha de Evaluación": new Date(
          evaluation.date + "T00:00:00"
        ).toLocaleDateString("es-PE"),
        Evaluador: evaluation.evaluatorName,
        "Fecha Diálogo Reflexivo": evaluation.reflectiveDialogueDate
          ? new Date(
              evaluation.reflectiveDialogueDate + "T00:00:00"
            ).toLocaleDateString("es-PE")
          : "No realizado",
        "Desempeño 1": evaluation.performance1,
        "Desempeño 1 (Valor)": levelToNumber(evaluation.performance1),
        "Desempeño 2": evaluation.performance2,
        "Desempeño 2 (Valor)": levelToNumber(evaluation.performance2),
        "Desempeño 3": evaluation.performance3,
        "Desempeño 3 (Valor)": levelToNumber(evaluation.performance3),
        "Desempeño 4": evaluation.performance4,
        "Desempeño 4 (Valor)": levelToNumber(evaluation.performance4),
        "Desempeño 5": evaluation.performance5,
        "Desempeño 5 (Valor)": levelToNumber(evaluation.performance5),
        "Desempeño 6": evaluation.performance6,
        "Desempeño 6 (Valor)": levelToNumber(evaluation.performance6),
        "Puntaje Total": calculateTotalScore(evaluation),
        "Puntaje Máximo": 24,
        Observaciones: evaluation.observations || "",
        Fortalezas: evaluation.strengths || "",
        "Areas de Mejora": evaluation.improvementAreas || "",
        Compromisos: evaluation.commitments || "",
      });
    });
  });

  // Crear el libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Crear la hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(allData);

  // Configurar el ancho de las columnas
  const columnWidths = [
    { wch: 5 }, // N°
    { wch: 20 }, // Apellidos
    { wch: 20 }, // Nombres
    { wch: 25 }, // Curso
    { wch: 15 }, // Dni
    { wch: 15 }, // Telefono
    { wch: 25 }, // Correo Personal
    { wch: 25 }, // Correo Institucional
    { wch: 10 }, // Turno 1
    { wch: 10 }, // Turno 2
    { wch: 10 }, // Turno 3
    { wch: 12 }, // Total Horas
    { wch: 15 }, // Fecha de Evaluación
    { wch: 25 }, // Evaluador
    { wch: 18 }, // Fecha Diálogo Reflexivo
    { wch: 12 }, // Desempeño 1
    { wch: 8 }, // Desempeño 1 (Valor)
    { wch: 12 }, // Desempeño 2
    { wch: 8 }, // Desempeño 2 (Valor)
    { wch: 12 }, // Desempeño 3
    { wch: 8 }, // Desempeño 3 (Valor)
    { wch: 12 }, // Desempeño 4
    { wch: 8 }, // Desempeño 4 (Valor)
    { wch: 12 }, // Desempeño 5
    { wch: 8 }, // Desempeño 5 (Valor)
    { wch: 12 }, // Desempeño 6
    { wch: 8 }, // Desempeño 6 (Valor)
    { wch: 12 }, // Puntaje Total
    { wch: 12 }, // Puntaje Máximo
    { wch: 30 }, // Observaciones
    { wch: 30 }, // Fortalezas
    { wch: 30 }, // Areas de Mejora
    { wch: 30 }, // Compromisos
  ];

  worksheet["!cols"] = columnWidths;

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, "Todas_las_Evaluaciones");

  // Generar el nombre del archivo
  const fileName = `Todas_las_Evaluaciones_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  // Descargar el archivo
  XLSX.writeFile(workbook, fileName);
};
