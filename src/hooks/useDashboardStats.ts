"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Teacher } from "../types/teacher";
import type { TeacherEvaluation } from "../types/evaluation";

export interface DashboardStats {
  totalTeachers: number;
  totalEvaluations: number;
  evaluatedTeachers: number;
  notEvaluatedTeachers: number;
  evaluationPercentage: number;
  averageEvaluationsPerTeacher: number;
  courseDistribution: { [course: string]: number };
  evaluatedCourseDistribution: {
    [course: string]: { total: number; evaluated: number };
  };
  recentEvaluations: Array<{
    evaluation: TeacherEvaluation;
    teacher: Teacher;
  }>;
  topPerformingTeachers: Array<{
    teacher: Teacher;
    evaluation: TeacherEvaluation;
    totalScore: number;
  }>;
}

const getDashboardStats = async (): Promise<DashboardStats> => {
  // Obtener todos los docentes
  const teachersRef = collection(db, "teachers");
  const teachersSnapshot = await getDocs(teachersRef);
  const teachers = teachersSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Teacher)
  );

  // Obtener todas las evaluaciones
  const evaluationsRef = collection(db, "evaluations");
  const evaluationsSnapshot = await getDocs(evaluationsRef);
  const evaluations = evaluationsSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as TeacherEvaluation)
  );

  // Obtener evaluaciones recientes (últimas 5)
  const recentEvaluationsQuery = query(
    evaluationsRef,
    orderBy("date", "desc"),
    limit(5)
  );
  const recentEvaluationsSnapshot = await getDocs(recentEvaluationsQuery);
  const recentEvaluationsData = recentEvaluationsSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as TeacherEvaluation)
  );

  // Crear lista de evaluaciones recientes con información del docente
  const recentEvaluations = recentEvaluationsData
    .map((evaluation) => {
      const teacher = teachers.find((t) => t.id === evaluation.teacherId);
      if (!teacher) return null;

      return {
        evaluation,
        teacher,
      };
    })
    .filter((item) => item !== null) as Array<{
    evaluation: TeacherEvaluation;
    teacher: Teacher;
  }>;

  // Calcular estadísticas básicas
  const totalTeachers = teachers.length;
  const totalEvaluations = evaluations.length;

  // Docentes evaluados (que tienen al menos una evaluación)
  const teachersWithEvaluations = new Set(
    evaluations.map((evaluation) => evaluation.teacherId)
  );
  const evaluatedTeachers = teachersWithEvaluations.size;
  const notEvaluatedTeachers = totalTeachers - evaluatedTeachers;
  const evaluationPercentage =
    totalTeachers > 0 ? (evaluatedTeachers / totalTeachers) * 100 : 0;

  // Promedio de evaluaciones por docente
  const averageEvaluationsPerTeacher =
    evaluatedTeachers > 0 ? totalEvaluations / evaluatedTeachers : 0;

  // Distribución por cursos
  const courseDistribution: { [course: string]: number } = {};
  const evaluatedCourseDistribution: {
    [course: string]: { total: number; evaluated: number };
  } = {};

  teachers.forEach((teacher) => {
    const course = teacher.curso;
    courseDistribution[course] = (courseDistribution[course] || 0) + 1;

    if (!evaluatedCourseDistribution[course]) {
      evaluatedCourseDistribution[course] = { total: 0, evaluated: 0 };
    }
    evaluatedCourseDistribution[course].total += 1;

    if (teachersWithEvaluations.has(teacher.id)) {
      evaluatedCourseDistribution[course].evaluated += 1;
    }
  });

  // Función para calcular la suma total de una evaluación
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

  // Docentes con mejor desempeño (últimas evaluaciones con mejor puntaje total)
  const teacherLatestEvaluations = new Map<string, TeacherEvaluation>();

  // Obtener la evaluación más reciente de cada docente
  evaluations.forEach((evaluation) => {
    const existing = teacherLatestEvaluations.get(evaluation.teacherId);
    if (!existing || new Date(evaluation.date) > new Date(existing.date)) {
      teacherLatestEvaluations.set(evaluation.teacherId, evaluation);
    }
  });

  // Crear lista de docentes con mejor desempeño
  const topPerformingTeachers = Array.from(teacherLatestEvaluations.entries())
    .map(([teacherId, evaluation]) => {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) return null;

      const totalScore = calculateTotalScore(evaluation);
      return {
        teacher,
        evaluation,
        totalScore,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => b!.totalScore - a!.totalScore)
    .slice(0, 5) as Array<{
    teacher: Teacher;
    evaluation: TeacherEvaluation;
    totalScore: number;
  }>;

  return {
    totalTeachers,
    totalEvaluations,
    evaluatedTeachers,
    notEvaluatedTeachers,
    evaluationPercentage,
    averageEvaluationsPerTeacher,
    courseDistribution,
    evaluatedCourseDistribution,
    recentEvaluations,
    topPerformingTeachers,
  };
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
};
