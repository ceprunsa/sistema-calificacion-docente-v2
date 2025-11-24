"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTeachers } from "../hooks/useTeachers";
import { capitalizeText } from "../utils/formatters";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  BookOpen,
  Building,
  Clock,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const TeacherDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teacherByIdQuery } = useTeachers();
  const { data: teacher, isLoading, isError } = teacherByIdQuery(id);
  const [totalHours, setTotalHours] = useState<number>(0);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (teacher?.horasPorTurno) {
      const total = Object.values(teacher.horasPorTurno).reduce(
        (sum, hours) => sum + hours,
        0
      );
      setTotalHours(total);
    }
  }, [teacher]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !teacher) {
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
            <span>Volver a la lista</span>
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Detalles del Docente
          </h1>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/teachers/${id}/evaluations`}
            className="btn btn-secondary inline-flex items-center"
          >
            <ClipboardList size={18} className="mr-2" />
            <span>Evaluaciones</span>
          </Link>
          <Link
            to={`/teachers/${id}/evaluations/new`}
            className="btn btn-primary inline-flex items-center"
          >
            <ClipboardList size={18} className="mr-2" />
            <span>Evaluar</span>
          </Link>
          {isAdmin && (
            <Link
              to={`/teachers/${id}`}
              className="btn btn-secondary inline-flex items-center"
            >
              <Edit size={18} className="mr-2" />
              <span>Editar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tarjeta principal con información del docente */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {/* Encabezado con nombre y DNI */}
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {teacher.apellidos}, {teacher.nombres}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                DNI: {teacher.dni}
              </p>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {capitalizeText(teacher.curso)}
              </span>
            </div>
          </div>
        </div>

        {/* Cuerpo con información detallada */}
        <div className="border-t border-gray-200">
          <dl>
            {/* Información de contacto */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone size={16} className="mr-2" />
                Teléfono
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {teacher.telefono}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail size={16} className="mr-2" />
                Correo Personal
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a
                  href={`mailto:${teacher.correoPersonal}`}
                  className="text-blue-600 hover:underline"
                >
                  {teacher.correoPersonal}
                </a>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail size={16} className="mr-2" />
                Correo Institucional
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a
                  href={`mailto:${teacher.correoInstitucional}`}
                  className="text-blue-600 hover:underline"
                >
                  {teacher.correoInstitucional}
                </a>
              </dd>
            </div>

            {/* Información académica */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <BookOpen size={16} className="mr-2" />
                Curso
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {capitalizeText(teacher.curso)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Building size={16} className="mr-2" />
                Condición en otra institución
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {capitalizeText(teacher.condicionInstitucional)}
              </dd>
            </div>

            {/* Horas por turno */}
            <div className="bg-gray-50 px-4 py-5 sm:px-6">
              <div className="mb-2 flex items-center">
                <Clock size={16} className="mr-2" />
                <h4 className="text-sm font-medium text-gray-500">
                  Horas por Turno
                </h4>
              </div>
              <div className="mt-2 border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Turno
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Horas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(teacher.horasPorTurno).map(
                      ([turno, horas]) => (
                        <tr key={turno}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {capitalizeText(turno)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {horas}
                          </td>
                        </tr>
                      )
                    )}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
                        {totalHours}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fechas de creación y actualización */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Fecha de registro
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {teacher.createdAt
                  ? new Date(teacher.createdAt).toLocaleString()
                  : "No disponible"}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Última actualización
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {teacher.updatedAt
                  ? new Date(teacher.updatedAt).toLocaleString()
                  : "No disponible"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetails;
