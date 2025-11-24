"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTeachers } from "../hooks/useTeachers";
import { useEvaluations } from "../hooks/useEvaluations";
import { capitalizeText } from "../utils/formatters";
import { exportTeacherEvaluationsToExcel } from "../utils/excelExporter";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  Download,
} from "lucide-react";
import type { TeacherEvaluation } from "../types/evaluation";
import { performanceTitles } from "../types/evaluation";
import toast from "react-hot-toast";

const TeacherEvaluations = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teacherByIdQuery } = useTeachers();
  const { useEvaluationsByTeacherId, deleteEvaluation, isDeleting } =
    useEvaluations();

  const {
    data: teacher,
    isLoading: isLoadingTeacher,
    isError: isTeacherError,
  } = teacherByIdQuery(id);
  const {
    data: evaluations = [],
    isLoading: isLoadingEvaluations,
    isError: isEvaluationsError,
    error: evaluationsError,
  } = useEvaluationsByTeacherId(id || "");

  const [evaluationToDelete, setEvaluationToDelete] =
    useState<TeacherEvaluation | null>(null);

  // Efecto para mostrar errores específicos
  useEffect(() => {
    if (isEvaluationsError && evaluationsError) {
      console.error("Error al cargar evaluaciones:", evaluationsError);
      toast.error("Error al cargar las evaluaciones del docente");
    }
  }, [isEvaluationsError, evaluationsError]);

  if (isLoadingTeacher || isLoadingEvaluations) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Manejar el caso de error en la carga del docente
  if (isTeacherError || !teacher) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudo cargar la información del docente.
        </span>
        <div className="mt-4">
          <button
            onClick={() => navigate("/teachers")}
            className="btn btn-secondary inline-flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Volver a la lista de docentes</span>
          </button>
        </div>
      </div>
    );
  }

  // Manejar el caso de error en la carga de evaluaciones
  if (isEvaluationsError) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudieron cargar las evaluaciones del docente.
        </span>
        <div className="mt-4">
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/teachers")}
              className="btn btn-secondary inline-flex items-center"
            >
              <ArrowLeft size={18} className="mr-2" />
              <span>Volver a la lista</span>
            </button>
            <Link
              to={`/teachers/${id}/evaluations/new`}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus size={18} className="mr-2" />
              <span>Nueva Evaluación</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (evaluation: TeacherEvaluation) => {
    setEvaluationToDelete(evaluation);
  };

  const confirmDelete = async () => {
    if (!evaluationToDelete || !evaluationToDelete.id) return;

    try {
      await deleteEvaluation(evaluationToDelete.id);
      setEvaluationToDelete(null);
    } catch (error) {
      console.error("Error al eliminar evaluación:", error);
      toast.error("Error al eliminar la evaluación");
    }
  };

  const cancelDelete = () => {
    setEvaluationToDelete(null);
  };

  // Función para manejar la exportación a Excel
  const handleExportToExcel = () => {
    if (!teacher || !evaluations || evaluations.length === 0) {
      toast.error("No hay evaluaciones para exportar");
      return;
    }

    try {
      exportTeacherEvaluationsToExcel(teacher, evaluations);
      toast.success("Archivo Excel descargado exitosamente");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al generar el archivo Excel");
    }
  };

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

  // Función para obtener el color según la suma total
  const getTotalScoreColor = (totalScore: number): string => {
    if (totalScore >= 21) return "bg-green-100 text-green-800 border-green-200"; // 21-24 puntos
    if (totalScore >= 15) return "bg-blue-100 text-blue-800 border-blue-200"; // 15-20 puntos
    if (totalScore >= 9)
      return "bg-yellow-100 text-yellow-800 border-yellow-200"; // 9-14 puntos
    return "bg-red-100 text-red-800 border-red-200"; // 6-8 puntos
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Encabezado con acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/teachers")}
            className="mr-4 p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Evaluaciones del Docente
            </h1>
            <p className="text-sm text-gray-500">
              {teacher.apellidos}, {teacher.nombres} -{" "}
              {capitalizeText(teacher.curso)}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {evaluations && evaluations.length > 0 && (
            <button
              onClick={handleExportToExcel}
              className="btn btn-success inline-flex items-center"
              title="Exportar evaluaciones a Excel"
            >
              <Download size={18} className="mr-2" />
              <span>Exportar Excel</span>
            </button>
          )}
          <Link
            to={`/teachers/${id}/evaluations/new`}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            <span>Nueva Evaluación</span>
          </Link>
        </div>
      </div>

      {/* Lista de evaluaciones */}
      {evaluations && evaluations.length > 0 ? (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="divide-y divide-gray-200">
            {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
            <div className="hidden lg:grid lg:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
              <div className="lg:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </div>
              <div className="lg:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evaluador
              </div>
              <div className="lg:col-span-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Desempeños
              </div>
              <div className="lg:col-span-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </div>
            </div>

            {/* Filas de evaluaciones */}
            {evaluations.map((evaluation) => {
              const totalScore = calculateTotalScore(evaluation);
              const totalScoreColor = getTotalScoreColor(totalScore);

              return (
                <div
                  key={evaluation.id}
                  className="p-4 lg:p-0 hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Vista para pantallas grandes */}
                  <div className="hidden lg:grid lg:grid-cols-12 lg:items-center lg:px-6 lg:py-4">
                    <div className="lg:col-span-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(
                            evaluation.date + "T00:00:00"
                          ).toLocaleDateString()}
                        </span>
                        {evaluation.reflectiveDialogueDate && (
                          <span className="text-xs text-gray-500">
                            Diálogo:{" "}
                            {new Date(
                              evaluation.reflectiveDialogueDate + "T00:00:00"
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-2 text-sm text-gray-900">
                      {evaluation.evaluatorName}
                    </div>
                    <div className="lg:col-span-6">
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(performanceTitles).map(
                          ([key, _], index) => {
                            const performanceKey = `performance${
                              index + 1
                            }` as keyof TeacherEvaluation;
                            const level = evaluation[performanceKey];
                            let bgColor = "";

                            switch (level) {
                              case "I":
                                bgColor = "bg-red-100 text-red-800";
                                break;
                              case "II":
                                bgColor = "bg-yellow-100 text-yellow-800";
                                break;
                              case "III":
                                bgColor = "bg-blue-100 text-blue-800";
                                break;
                              case "IV":
                                bgColor = "bg-green-100 text-green-800";
                                break;
                            }

                            return (
                              <div key={key} className="text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bgColor} text-xs font-medium`}
                                >
                                  {level}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {evaluation.observations ? (
                            <span className="truncate block max-w-xs">
                              {evaluation.observations.substring(0, 50)}
                              {evaluation.observations.length > 50 ? "..." : ""}
                            </span>
                          ) : (
                            <span className="italic">Sin observaciones</span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${totalScoreColor} border`}
                        >
                          Total: {totalScore}/24
                        </span>
                      </div>
                    </div>
                    <div className="lg:col-span-2 text-right flex justify-end space-x-2">
                      <Link
                        to={`/teachers/${id}/evaluations/${evaluation.id}/view`}
                        className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        to={`/teachers/${id}/evaluations/${evaluation.id}/edit`}
                        className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                        title="Editar evaluación"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(evaluation)}
                        className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                        title="Eliminar evaluación"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Vista para pantallas pequeñas y medianas */}
                  <div className="lg:hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(
                              evaluation.date + "T00:00:00"
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {evaluation.reflectiveDialogueDate && (
                          <div className="text-xs text-gray-500 mt-1 ml-6">
                            Diálogo:{" "}
                            {new Date(
                              evaluation.reflectiveDialogueDate + "T00:00:00"
                            ).toLocaleDateString()}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Evaluador: {evaluation.evaluatorName}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Link
                          to={`/teachers/${id}/evaluations/${evaluation.id}/view`}
                          className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/teachers/${id}/evaluations/${evaluation.id}/edit`}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          title="Editar evaluación"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(evaluation)}
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                          title="Eliminar evaluación"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-6 gap-2">
                      {Object.entries(performanceTitles).map(
                        ([key, _], index) => {
                          const performanceKey = `performance${
                            index + 1
                          }` as keyof TeacherEvaluation;
                          const level = evaluation[performanceKey];
                          let bgColor = "";

                          switch (level) {
                            case "I":
                              bgColor = "bg-red-100 text-red-800";
                              break;
                            case "II":
                              bgColor = "bg-yellow-100 text-yellow-800";
                              break;
                            case "III":
                              bgColor = "bg-blue-100 text-blue-800";
                              break;
                            case "IV":
                              bgColor = "bg-green-100 text-green-800";
                              break;
                          }

                          return (
                            <div key={key} className="text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bgColor} text-xs font-medium`}
                              >
                                {level}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {index + 1}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {evaluation.observations ? (
                          <span className="truncate block max-w-[200px]">
                            {evaluation.observations.substring(0, 40)}
                            {evaluation.observations.length > 40 ? "..." : ""}
                          </span>
                        ) : (
                          <span className="italic">Sin observaciones</span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${totalScoreColor} border`}
                      >
                        Total: {totalScore}/24
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-yellow-100 p-3 mb-4">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No hay evaluaciones registradas
            </h3>
            <p className="text-gray-500 mb-4">
              Este docente aún no tiene evaluaciones registradas.
            </p>
            <Link
              to={`/teachers/${id}/evaluations/new`}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus size={18} className="mr-2" />
              <span>Registrar Primera Evaluación</span>
            </Link>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {evaluationToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Eliminar evaluación
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar esta evaluación del{" "}
                        <span className="font-semibold">
                          {evaluationToDelete.date
                            ? new Date(
                                evaluationToDelete.date + "T00:00:00"
                              ).toLocaleDateString()
                            : ""}
                        </span>
                        ? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-danger sm:ml-3"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherEvaluations;
