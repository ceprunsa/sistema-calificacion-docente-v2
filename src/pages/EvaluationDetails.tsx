"use client";

import { useParams, useNavigate, Link } from "react-router-dom";
import { useTeachers } from "../hooks/useTeachers";
import { useEvaluations } from "../hooks/useEvaluations";
import { capitalizeText } from "../utils/formatters";
import { generateEvaluationDocument } from "../utils/documentGenerator";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  FileText,
  Clock,
  ImageIcon,
  Download,
} from "lucide-react";
import {
  performanceTitles,
  performanceDescriptions,
} from "../types/evaluation";
import toast from "react-hot-toast";
import { useState } from "react";

const EvaluationDetails = () => {
  const { teacherId, evaluationId } = useParams<{
    teacherId: string;
    evaluationId: string;
  }>();
  const navigate = useNavigate();
  const { teacherByIdQuery } = useTeachers();
  const { useEvaluationById } = useEvaluations();
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  const { data: teacher, isLoading: isLoadingTeacher } =
    teacherByIdQuery(teacherId);
  const {
    data: evaluation,
    isLoading: isLoadingEvaluation,
    isError,
  } = useEvaluationById(evaluationId);

  const handleGenerateDocument = async () => {
    if (!teacher || !evaluation) {
      toast.error("No se pueden cargar los datos necesarios");
      return;
    }

    setIsGeneratingDocument(true);
    try {
      await generateEvaluationDocument(teacher, evaluation);
      toast.success("Documento generado exitosamente");
    } catch (error) {
      console.error("Error al generar documento:", error);
      toast.error("Error al generar el documento");
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  if (isLoadingTeacher || isLoadingEvaluation) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !teacher || !evaluation) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudo cargar la información de la evaluación.
        </span>
        <div className="mt-4">
          <button
            onClick={() => navigate(`/teachers/${teacherId}/evaluations`)}
            className="btn btn-secondary inline-flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Volver a las evaluaciones</span>
          </button>
        </div>
      </div>
    );
  }

  // Función para obtener el color según el nivel
  const getLevelColor = (level: string): string => {
    switch (level) {
      case "I":
        return "bg-red-100 text-red-800 border-red-200";
      case "II":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "III":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IV":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calcular la suma total de desempeño
  const calculateTotalScore = (): number => {
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

  const totalScore = calculateTotalScore();
  const totalScoreColor = getLevelColor(
    totalScore >= 21
      ? "IV"
      : totalScore >= 15
      ? "III"
      : totalScore >= 9
      ? "II"
      : "I"
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Encabezado con acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/teachers/${teacherId}/evaluations`)}
            className="mr-4 p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Detalles de la Evaluación
            </h1>
            <p className="text-sm text-gray-500">
              {teacher.apellidos}, {teacher.nombres} -{" "}
              {capitalizeText(teacher.curso)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateDocument}
            disabled={isGeneratingDocument}
            className="btn btn-secondary inline-flex items-center"
          >
            <Download size={18} className="mr-2" />
            <span>
              {isGeneratingDocument ? "Generando..." : "Exportar Word"}
            </span>
          </button>
          <Link
            to={`/teachers/${teacherId}/evaluations/${evaluationId}/edit`}
            className="btn btn-primary inline-flex items-center"
          >
            <Edit size={18} className="mr-2" />
            <span>Editar Evaluación</span>
          </Link>
        </div>
      </div>

      {/* Información general */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Información General
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Fecha y Hora de Monitoreo
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(evaluation.date + "T00:00:00").toLocaleDateString()}
                  {evaluation.time && (
                    <span className="ml-2 text-gray-600">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {evaluation.time}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Fecha y Hora de Diálogo Reflexivo
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {evaluation.reflectiveDialogueDate ? (
                    <>
                      {new Date(
                        evaluation.reflectiveDialogueDate + "T00:00:00"
                      ).toLocaleDateString()}
                      {evaluation.reflectiveDialogueTime && (
                        <span className="ml-2 text-gray-600">
                          <Clock className="inline h-4 w-4 mr-1" />
                          {evaluation.reflectiveDialogueTime}
                        </span>
                      )}
                    </>
                  ) : (
                    "No registrada"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-gray-500">Evaluador</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {evaluation.evaluatorName}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Puntaje Total de Desempeño
                </h4>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${totalScoreColor} border`}
                  >
                    {totalScore} / 24 puntos
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Imagen de evidencia */}
          {evaluation.evidenceImageUrl && (
            <div className="mt-6">
              <div className="flex items-start">
                <ImageIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Imagen de Evidencia
                  </h4>
                  <div className="mt-2">
                    <img
                      src={evaluation.evidenceImageUrl || "/placeholder.svg"}
                      alt="Evidencia de evaluación"
                      className="max-w-md h-auto rounded-lg border border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        window.open(evaluation.evidenceImageUrl!, "_blank")
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Haga clic en la imagen para verla en tamaño completo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desempeños evaluados */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Desempeños Evaluados
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="divide-y divide-gray-200">
            {Object.entries(performanceTitles).map(
              ([performance, title], index) => {
                const performanceKey = `performance${
                  index + 1
                }` as keyof typeof evaluation;
                const level = evaluation[performanceKey];
                const levelColor = getLevelColor(level as string);

                return (
                  <div key={performance} className="px-4 py-5 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {
                            performanceDescriptions[
                              performance as keyof typeof performanceDescriptions
                            ][
                              level as keyof (typeof performanceDescriptions)[keyof typeof performanceDescriptions]
                            ]
                          }
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0 md:ml-4">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${levelColor} border`}
                        >
                          Nivel {level}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Observaciones y comentarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Observaciones y Comentarios
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="divide-y divide-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-900">
                Observaciones Generales
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {evaluation.observations || "No se registraron observaciones."}
              </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-900">
                Fortalezas Identificadas
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {evaluation.strengths || "No se registraron fortalezas."}
              </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-900">
                Áreas de Mejora
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {evaluation.improvementAreas ||
                  "No se registraron áreas de mejora."}
              </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-900">Compromisos</h4>
              <p className="mt-1 text-sm text-gray-500">
                {evaluation.commitments || "No se registraron compromisos."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de registro */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Información de Registro
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Fecha de Creación
              </h4>
              <p className="mt-1 text-sm text-gray-900">
                {evaluation.createdAt
                  ? new Date(evaluation.createdAt).toLocaleString()
                  : "No disponible"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Última Actualización
              </h4>
              <p className="mt-1 text-sm text-gray-900">
                {evaluation.updatedAt
                  ? new Date(evaluation.updatedAt).toLocaleString()
                  : "No disponible"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetails;
