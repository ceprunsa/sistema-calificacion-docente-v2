"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTeachers, type TeachersFilters } from "../hooks/useTeachers";
import { useTeacherEvaluationStatus } from "../hooks/useTeacherEvaluationStatus";
import { useExportAllEvaluations } from "../hooks/useExportAllEvaluations";
import type { Teacher, CourseType } from "../types/teacher";
import {
  Plus,
  Trash2,
  Edit,
  Upload,
  X,
  Eye,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { capitalizeText } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";

const COURSE_OPTIONS: CourseType[] = [
  "BIOLOGÍA",
  "CÍVICA",
  "FILOSOFÍA",
  "FÍSICA",
  "GEOGRAFÍA",
  "HISTORIA",
  "INGLES",
  "LENGUAJE",
  "LITERATURA",
  "MATEMÁTICA",
  "PSICOLOGÍA",
  "QUÍMICA",
  "RAZONAMIENTO LÓGICO",
  "RAZONAMIENTO MATEMÁTICO",
  "RAZONAMIENTO VERBAL",
];

const TURNO_OPTIONS = ["turno 1", "turno 2", "turno 3"];

const Teachers = () => {
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<TeachersFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const {
    paginatedResult,
    teachers,
    isLoading,
    isError,
    deleteTeacher,
    isDeleting,
  } = useTeachers(currentPage, pageSize, filters);

  const { exportAllEvaluations, isExporting } = useExportAllEvaluations();

  // Obtener IDs de profesores para verificar estado de evaluación
  const teacherIds = teachers.map((teacher) => teacher.id);
  const { data: evaluationStatus } = useTeacherEvaluationStatus(teacherIds);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const { isAdmin } = useAuth();

  if (isError) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudieron cargar los docentes.
        </span>
      </div>
    );
  }

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete || !teacherToDelete.id) return;

    try {
      await deleteTeacher(teacherToDelete.id);
      setTeacherToDelete(null);
    } catch (error) {
      console.error("Error al eliminar docente:", error);
    }
  };

  const cancelDelete = () => {
    setTeacherToDelete(null);
  };

  const handleFilterChange = (key: keyof TeachersFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleExportAllToExcel = async () => {
    await exportAllEvaluations(filters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getEvaluationStatusBadge = (teacherId: string) => {
    const status = evaluationStatus?.[teacherId];

    if (!status || !status.hasEvaluations) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
          Sin evaluar
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
        {status.evaluationCount} evaluación
        {status.evaluationCount !== 1 ? "es" : ""}
      </span>
    );
  };

  const totalPages = paginatedResult
    ? Math.ceil(paginatedResult.totalCount / pageSize)
    : 0;

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Docentes
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar por DNI, nombre o curso..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.searchTerm || ""}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            />
            {filters.searchTerm && (
              <button
                onClick={() => handleFilterChange("searchTerm", "")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary inline-flex items-center"
            >
              <Filter size={18} className="mr-1 md:mr-2" />
              <span>Filtros</span>
            </button>
            <button
              onClick={handleExportAllToExcel}
              disabled={isExporting}
              className="btn btn-success inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar todas las evaluaciones a Excel"
            >
              <FileSpreadsheet size={18} className="mr-1 md:mr-2" />
              <span>{isExporting ? "Exportando..." : "Exportar Excel"}</span>
            </button>
            {isAdmin && (
              <>
                <Link
                  to="/teachers/import"
                  className="btn btn-secondary inline-flex items-center"
                >
                  <Upload size={18} className="mr-1 md:mr-2" />
                  <span>Importar</span>
                </Link>
                <Link
                  to="/teachers/new"
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus size={18} className="mr-1 md:mr-2" />
                  <span>Nuevo</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="curso-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Curso
              </label>
              <select
                id="curso-filter"
                value={filters.curso || ""}
                onChange={(e) => handleFilterChange("curso", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los cursos</option>
                {COURSE_OPTIONS.map((course) => (
                  <option key={course} value={course}>
                    {capitalizeText(course)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="turno-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Turno
              </label>
              <select
                id="turno-filter"
                value={filters.turno || ""}
                onChange={(e) => handleFilterChange("turno", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los turnos</option>
                {TURNO_OPTIONS.map((turno) => (
                  <option key={turno} value={turno}>
                    {capitalizeText(turno)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full btn btn-secondary"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información de resultados */}
      {paginatedResult && !isLoading && (
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, paginatedResult.totalCount)} de{" "}
          {paginatedResult.totalCount} docentes
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-sm text-gray-500 flex items-center">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mr-2"></div>
          Cargando docentes...
        </div>
      )}

      {/* Vista de tarjetas para todos los tamaños de pantalla */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        {isLoading ? (
          // Mostrar indicador de carga solo en el área de datos
          <div className="flex justify-center items-center h-64">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {Object.keys(filters).some(
              (key) => filters[key as keyof TeachersFilters]
            )
              ? "No se encontraron docentes con los filtros aplicados"
              : "No hay docentes registrados"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
            <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
              <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNI
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apellidos
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombres
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curso
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado Evaluación
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Horas
              </div>
              <div className="xl:col-span-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </div>
            </div>

            {/* Filas de docentes */}
            {teachers.map((teacher, index) => (
              <div
                key={teacher.id}
                className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                  index === teachers.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                {/* Vista para pantallas grandes (similar a tabla) */}
                <div className="hidden xl:grid xl:grid-cols-12 xl:items-center xl:px-6 xl:py-4">
                  <div className="xl:col-span-1 text-sm text-gray-900">
                    {teacher.dni}
                  </div>
                  <div className="xl:col-span-2 text-sm text-gray-900">
                    {teacher.apellidos}
                  </div>
                  <div className="xl:col-span-2 text-sm text-gray-900">
                    {teacher.nombres}
                  </div>
                  <div className="xl:col-span-2 text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {capitalizeText(teacher.curso)}
                    </span>
                  </div>
                  <div className="xl:col-span-2 text-sm text-gray-900">
                    {getEvaluationStatusBadge(teacher.id)}
                  </div>
                  <div className="xl:col-span-2 text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                      {teacher.totalHoras} horas
                    </span>
                  </div>
                  <div className="xl:col-span-1 text-right flex justify-end space-x-2">
                    <Link
                      to={`/teachers/${teacher.id}/evaluations`}
                      className="p-2 rounded-md text-purple-600 hover:bg-purple-50 transition-colors duration-200"
                      title="Ver evaluaciones"
                    >
                      <ClipboardList size={18} />
                    </Link>
                    <Link
                      to={`/teachers/${teacher.id}/evaluations/new`}
                      className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                      title="Evaluar docente"
                    >
                      <FileText size={18} />
                    </Link>
                    <Link
                      to={`/teachers/${teacher.id}/details`}
                      className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          to={`/teachers/${teacher.id}`}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          title="Editar docente"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(teacher)}
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                          title="Eliminar docente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Vista para pantallas pequeñas y medianas (tarjetas) */}
                <div className="xl:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {teacher.apellidos}, {teacher.nombres}
                      </div>
                      <div className="text-sm text-gray-500">
                        DNI: {teacher.dni}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {capitalizeText(teacher.curso)}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          {teacher.totalHoras} horas
                        </span>
                        {getEvaluationStatusBadge(teacher.id)}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Link
                        to={`/teachers/${teacher.id}/evaluations`}
                        className="p-2 rounded-md text-purple-600 hover:bg-purple-50 transition-colors duration-200"
                        title="Ver evaluaciones"
                      >
                        <ClipboardList size={18} />
                      </Link>
                      <Link
                        to={`/teachers/${teacher.id}/evaluations/new`}
                        className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                        title="Evaluar docente"
                      >
                        <FileText size={18} />
                      </Link>
                      <Link
                        to={`/teachers/${teacher.id}/details`}
                        className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            to={`/teachers/${teacher.id}`}
                            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                            title="Editar docente"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(teacher)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                            title="Eliminar docente"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      {paginatedResult && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!paginatedResult.hasPreviousPage}
              className="btn btn-secondary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} className="mr-1" />
              Anterior
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNumber
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!paginatedResult.hasNextPage}
              className="btn btn-secondary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight size={18} className="ml-1" />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {teacherToDelete && (
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
                      Eliminar docente
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar al docente{" "}
                        <span className="font-semibold">
                          {teacherToDelete.apellidos}, {teacherToDelete.nombres}
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

export default Teachers;
