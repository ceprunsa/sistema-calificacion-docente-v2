"use client";

import { useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Teacher } from "../types/teacher";
import type { TeacherEvaluation } from "../types/evaluation";
import { exportAllTeachersEvaluationsToExcel } from "../utils/excelExporter";
import toast from "react-hot-toast";

export const useExportAllEvaluations = () => {
  const [isExporting, setIsExporting] = useState(false);

  const getAllTeachers = async (): Promise<Teacher[]> => {
    const teachersRef = collection(db, "teachers");
    const q = query(teachersRef, orderBy("apellidos", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Teacher)
    );
  };

  const getTeacherEvaluations = async (
    teacherId: string
  ): Promise<TeacherEvaluation[]> => {
    const evaluationsQuery = query(
      collection(db, "evaluations"),
      where("teacherId", "==", teacherId),
      orderBy("date", "desc")
    );
    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    return evaluationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TeacherEvaluation[];
  };

  const exportAllEvaluations = async (filters?: {
    curso?: string;
    turno?: string;
    searchTerm?: string;
  }) => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      // Toast inicial
      toast.loading("Obteniendo datos de todos los docentes...", {
        id: "export-progress",
      });

      // Obtener todos los docentes
      let allTeachers = await getAllTeachers();

      // Aplicar filtros si existen
      if (filters) {
        // Filtrar por curso
        if (filters.curso) {
          allTeachers = allTeachers.filter(
            (teacher) => teacher.curso === filters.curso
          );
        }

        // Filtrar por término de búsqueda
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          allTeachers = allTeachers.filter(
            (teacher) =>
              teacher.dni.toLowerCase().includes(searchLower) ||
              teacher.apellidos.toLowerCase().includes(searchLower) ||
              teacher.nombres.toLowerCase().includes(searchLower) ||
              teacher.curso.toLowerCase().includes(searchLower)
          );
        }

        // Filtrar por turno
        if (filters.turno) {
          allTeachers = allTeachers.filter(
            (teacher) =>
              teacher.horasPorTurno[filters.turno!] &&
              teacher.horasPorTurno[filters.turno!] > 0
          );
        }
      }

      if (allTeachers.length === 0) {
        toast.dismiss("export-progress");
        toast.error("No se encontraron docentes con los filtros aplicados");
        return;
      }

      // Actualizar toast para mostrar progreso inicial
      toast.loading(
        `Procesando evaluaciones... 0/${allTeachers.length} docentes`,
        { id: "export-progress" }
      );

      // Obtener evaluaciones de todos los profesores
      const teachersWithEvaluations: Array<{
        teacher: Teacher;
        evaluations: TeacherEvaluation[];
      }> = [];

      let processedCount = 0;
      let totalEvaluations = 0;

      for (const teacher of allTeachers) {
        try {
          const evaluations = await getTeacherEvaluations(teacher.id);

          if (evaluations.length > 0) {
            teachersWithEvaluations.push({
              teacher,
              evaluations,
            });
            totalEvaluations += evaluations.length;
          }

          processedCount++;

          // Actualizar progreso cada 5 docentes o al final
          if (
            processedCount % 5 === 0 ||
            processedCount === allTeachers.length
          ) {
            toast.loading(
              `Procesando evaluaciones... ${processedCount}/${allTeachers.length} docentes`,
              {
                id: "export-progress",
              }
            );
          }
        } catch (error) {
          console.error(
            `Error al obtener evaluaciones del docente ${teacher.apellidos}:`,
            error
          );
          // Continuar con el siguiente docente
        }
      }

      if (teachersWithEvaluations.length === 0) {
        toast.dismiss("export-progress");
        toast.error("No se encontraron evaluaciones para exportar");
        return;
      }

      // Generar y descargar el Excel
      toast.loading("Generando archivo Excel...", { id: "export-progress" });

      try {
        exportAllTeachersEvaluationsToExcel(teachersWithEvaluations);
        toast.dismiss("export-progress");

        toast.success(
          `Excel exportado exitosamente: ${teachersWithEvaluations.length} docentes con ${totalEvaluations} evaluaciones`,
          {
            duration: 4000,
          }
        );
      } catch (exportError) {
        toast.dismiss("export-progress");
        console.error("Error al generar Excel:", exportError);
        toast.error("Error al generar el archivo Excel");
      }
    } catch (error) {
      toast.dismiss("export-progress");
      console.error("Error al exportar evaluaciones:", error);
      toast.error("Error al obtener los datos para exportar");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportAllEvaluations,
    isExporting,
  };
};
