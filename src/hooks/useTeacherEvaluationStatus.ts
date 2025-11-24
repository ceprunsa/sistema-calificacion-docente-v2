"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

interface TeacherEvaluationStatus {
  [teacherId: string]: {
    hasEvaluations: boolean;
    evaluationCount: number;
    lastEvaluationDate?: string;
  };
}

const getTeachersEvaluationStatus = async (
  teacherIds: string[]
): Promise<TeacherEvaluationStatus> => {
  if (teacherIds.length === 0) return {};

  const evaluationsRef = collection(db, "evaluations");
  const status: TeacherEvaluationStatus = {};

  // Inicializar todos los profesores como no evaluados
  teacherIds.forEach((id) => {
    status[id] = {
      hasEvaluations: false,
      evaluationCount: 0,
    };
  });

  // Obtener evaluaciones para todos los profesores
  // Nota: Firestore tiene un límite de 10 elementos en consultas "in",
  // por lo que dividimos en lotes si es necesario
  const batchSize = 10;
  for (let i = 0; i < teacherIds.length; i += batchSize) {
    const batch = teacherIds.slice(i, i + batchSize);
    const q = query(evaluationsRef, where("teacherId", "in", batch));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const evaluation = doc.data();
      const teacherId = evaluation.teacherId;

      if (!status[teacherId]) {
        status[teacherId] = {
          hasEvaluations: false,
          evaluationCount: 0,
        };
      }

      status[teacherId].hasEvaluations = true;
      status[teacherId].evaluationCount += 1;

      // Actualizar la fecha de la última evaluación
      if (
        !status[teacherId].lastEvaluationDate ||
        evaluation.date > status[teacherId].lastEvaluationDate!
      ) {
        status[teacherId].lastEvaluationDate = evaluation.date;
      }
    });
  }

  return status;
};

export const useTeacherEvaluationStatus = (teacherIds: string[]) => {
  return useQuery({
    queryKey: ["teacher-evaluation-status", teacherIds],
    queryFn: () => getTeachersEvaluationStatus(teacherIds),
    enabled: teacherIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
