"use client";

import { useAuth } from "../hooks/useAuth";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { capitalizeText } from "../utils/formatters";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import { Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  Eye,
  FileText,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useAuth();
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudieron cargar las estadísticas del dashboard.
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Encabezado de bienvenida */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Bienvenido, {user?.displayName || user?.email}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Resumen general del sistema de evaluación docente
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Docentes"
          value={stats.totalTeachers}
          subtitle="Registrados en el sistema"
          icon={<Users size={24} />}
          color="blue"
        />

        <StatCard
          title="Total de Evaluaciones"
          value={stats.totalEvaluations}
          subtitle="Evaluaciones realizadas"
          icon={<ClipboardList size={24} />}
          color="green"
        />

        <StatCard
          title="Docentes Evaluados"
          value={stats.evaluatedTeachers}
          subtitle={`${stats.evaluationPercentage.toFixed(1)}% del total`}
          icon={<CheckCircle size={24} />}
          color="green"
        />

        <StatCard
          title="Sin Evaluar"
          value={stats.notEvaluatedTeachers}
          subtitle="Docentes pendientes"
          icon={<XCircle size={24} />}
          color="red"
        />
      </div>

      {/* Progreso de evaluaciones y estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso general */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Progreso de Evaluaciones
            </h4>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <ProgressBar
              percentage={stats.evaluationPercentage}
              color={
                stats.evaluationPercentage >= 80
                  ? "green"
                  : stats.evaluationPercentage >= 50
                  ? "yellow"
                  : "red"
              }
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-800">
                  {stats.evaluatedTeachers}
                </div>
                <div className="text-green-600">Evaluados</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="font-semibold text-red-800">
                  {stats.notEvaluatedTeachers}
                </div>
                <div className="text-red-600">Pendientes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadística adicional */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Estadísticas Adicionales
            </h4>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-800">
                Promedio de evaluaciones por docente
              </span>
              <span className="text-lg font-bold text-blue-600">
                {stats.averageEvaluationsPerTeacher.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-sm font-medium text-purple-800">
                Cursos diferentes
              </span>
              <span className="text-lg font-bold text-purple-600">
                {Object.keys(stats.courseDistribution).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por cursos */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">
              Distribución por Cursos
            </h4>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.evaluatedCourseDistribution)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([course, data]) => {
                const percentage =
                  data.total > 0 ? (data.evaluated / data.total) * 100 : 0;
                return (
                  <div
                    key={course}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-900">
                        {capitalizeText(course)}
                      </h5>
                      <span className="text-sm text-gray-500">
                        {data.evaluated}/{data.total}
                      </span>
                    </div>
                    <ProgressBar
                      percentage={percentage}
                      color={
                        percentage >= 80
                          ? "green"
                          : percentage >= 50
                          ? "yellow"
                          : "red"
                      }
                      showLabel={false}
                      height="sm"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {percentage.toFixed(1)}% evaluado
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Evaluaciones recientes y mejores docentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evaluaciones recientes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">
                Evaluaciones Recientes
              </h4>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {stats.recentEvaluations.length > 0 ? (
              <div className="space-y-3">
                {stats.recentEvaluations.map((item) => (
                  <div
                    key={item.evaluation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.teacher.apellidos}, {item.teacher.nombres}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.evaluation.date).toLocaleDateString()} -{" "}
                        {item.evaluation.evaluatorName}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/teachers/${item.teacher.id}/evaluations/${item.evaluation.id}/view`}
                        className="p-1 rounded text-green-600 hover:bg-green-50"
                        title="Ver evaluación"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/teachers/${item.teacher.id}/evaluations`}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50"
                        title="Ver todas las evaluaciones"
                      >
                        <FileText size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No hay evaluaciones recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Mejores docentes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">
                Mejores Desempeños
              </h4>
              <Award className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {stats.topPerformingTeachers.length > 0 ? (
              <div className="space-y-3">
                {stats.topPerformingTeachers.map((item, index) => (
                  <div
                    key={item.teacher.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.teacher.apellidos}, {item.teacher.nombres}
                        </div>
                        <div className="text-sm text-gray-500">
                          {capitalizeText(item.teacher.curso)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {item.totalScore}/24
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.evaluation.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Award className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No hay evaluaciones disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/teachers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Ver Docentes</div>
              <div className="text-sm text-gray-500">
                Gestionar lista de docentes
              </div>
            </div>
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/teachers/new"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Nuevo Docente</div>
                  <div className="text-sm text-gray-500">
                    Registrar nuevo docente
                  </div>
                </div>
              </Link>

              <Link
                to="/teachers/import"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ClipboardList className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">
                    Importar Docentes
                  </div>
                  <div className="text-sm text-gray-500">
                    Importar desde archivo
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
