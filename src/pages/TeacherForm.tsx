"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTeachers } from "../hooks/useTeachers";
import toast from "react-hot-toast";
import type {
  TeacherFormData,
  CourseType,
  WorkConditionType,
  ShiftHours,
} from "../types/teacher";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { capitalizeText } from "../utils/formatters";

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

const WORK_CONDITION_OPTIONS: WorkConditionType[] = [
  "tiempo completo",
  "tiempo parcial",
  "no trabaja en otra institución",
];

const TeacherForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teacherByIdQuery, saveTeacher, isSaving } = useTeachers();
  const { data: existingTeacher, isLoading } = teacherByIdQuery(id);

  const [formData, setFormData] = useState<TeacherFormData>({
    dni: "",
    apellidos: "",
    nombres: "",
    telefono: "",
    correoPersonal: "",
    correoInstitucional: "",
    curso: "BIOLOGÍA",
    condicionInstitucional: "tiempo completo",
    horasPorTurno: { "turno 1": 0 },
  });

  const [shifts, setShifts] = useState<string[]>(["turno 1"]);
  const [totalHours, setTotalHours] = useState<number>(0);

  useEffect(() => {
    if (existingTeacher) {
      setFormData({
        dni: existingTeacher.dni || "",
        apellidos: existingTeacher.apellidos || "",
        nombres: existingTeacher.nombres || "",
        telefono: existingTeacher.telefono || "",
        correoPersonal: existingTeacher.correoPersonal || "",
        correoInstitucional: existingTeacher.correoInstitucional || "",
        curso: existingTeacher.curso || "matemática",
        condicionInstitucional:
          existingTeacher.condicionInstitucional || "tiempo completo",
        horasPorTurno: existingTeacher.horasPorTurno || { "turno 1": 0 },
      });

      // Extraer los turnos existentes
      setShifts(Object.keys(existingTeacher.horasPorTurno));

      // Calcular el total de horas
      calculateTotalHours(existingTeacher.horasPorTurno);
    }
  }, [existingTeacher]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShiftHoursChange = (shift: string, hours: number) => {
    const updatedHours = {
      ...formData.horasPorTurno,
      [shift]: hours,
    };

    setFormData((prev) => ({
      ...prev,
      horasPorTurno: updatedHours,
    }));

    calculateTotalHours(updatedHours);
  };

  const calculateTotalHours = (horasPorTurno: ShiftHours) => {
    const total = Object.values(horasPorTurno).reduce(
      (sum, hours) => sum + hours,
      0
    );
    setTotalHours(total);
  };

  const addShift = () => {
    const newShiftNumber = shifts.length + 1;
    const newShift = `turno ${newShiftNumber}`;

    setShifts([...shifts, newShift]);

    setFormData((prev) => ({
      ...prev,
      horasPorTurno: {
        ...prev.horasPorTurno,
        [newShift]: 0,
      },
    }));
  };

  const removeShift = (shiftToRemove: string) => {
    if (shifts.length <= 1) {
      toast.error("Debe haber al menos un turno");
      return;
    }

    const updatedShifts = shifts.filter((shift) => shift !== shiftToRemove);
    setShifts(updatedShifts);

    const updatedHours = { ...formData.horasPorTurno };
    delete updatedHours[shiftToRemove];

    setFormData((prev) => ({
      ...prev,
      horasPorTurno: updatedHours,
    }));

    calculateTotalHours(updatedHours);
  };

  const validateForm = (): boolean => {
    // Validar DNI (8-10 dígitos)
    if (!/^\d{8,10}$/.test(formData.dni)) {
      toast.error("El DNI debe tener entre 8 y 10 dígitos");
      return false;
    }

    // Validar campos obligatorios
    if (!formData.apellidos || !formData.nombres) {
      toast.error("Los apellidos y nombres son obligatorios");
      return false;
    }

    // Validar correo personal
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoPersonal)) {
      toast.error("El correo personal no es válido");
      return false;
    }

    // Validar correo institucional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoInstitucional)) {
      toast.error("El correo institucional no es válido");
      return false;
    }

    // Validar teléfono (al menos 9 dígitos)
    if (!/^\d{9,}$/.test(formData.telefono)) {
      toast.error("El teléfono debe tener al menos 9 dígitos");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Si estamos editando, incluimos el ID en los datos del formulario
      const teacherData: TeacherFormData = {
        ...formData,
      };

      // Si tenemos un ID (estamos editando), lo incluimos
      if (id) {
        teacherData.id = id;
      }

      saveTeacher(teacherData);
      navigate("/teachers");
    } catch (error) {
      console.error("Error al guardar docente:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar docente"
      );
    }
  };

  if (id && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {id ? "Editar Docente" : "Nuevo Docente"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {id
                ? "Actualiza la información del docente"
                : "Completa la información para registrar un nuevo docente"}
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* DNI */}
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="dni"
                      className="block text-sm font-medium text-gray-700"
                    >
                      DNI / CE
                    </label>
                    <input
                      type="text"
                      name="dni"
                      id="dni"
                      value={formData.dni}
                      onChange={handleChange}
                      required
                      pattern="\d{8,10}"
                      title="DNI debe tener entre 8 y 10 dígitos"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Entre 8 y 10 dígitos
                    </p>
                  </div>

                  {/* Apellidos */}
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="apellidos"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Nombres */}
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="nombres"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      id="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="telefono"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      id="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      pattern="\d{9,}"
                      title="Teléfono debe tener al menos 9 dígitos"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Correo Personal */}
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="correoPersonal"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Correo Personal
                    </label>
                    <input
                      type="email"
                      name="correoPersonal"
                      id="correoPersonal"
                      value={formData.correoPersonal}
                      onChange={handleChange}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Correo Institucional */}
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="correoInstitucional"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Correo Institucional
                    </label>
                    <input
                      type="email"
                      name="correoInstitucional"
                      id="correoInstitucional"
                      value={formData.correoInstitucional}
                      onChange={handleChange}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Curso */}
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="curso"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Curso
                    </label>
                    <select
                      id="curso"
                      name="curso"
                      value={formData.curso}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {COURSE_OPTIONS.map((course) => (
                        <option key={course} value={course}>
                          {capitalizeText(course)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condición Institucional */}
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="condicionInstitucional"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Condición en otra institución
                    </label>
                    <select
                      id="condicionInstitucional"
                      name="condicionInstitucional"
                      value={formData.condicionInstitucional}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {WORK_CONDITION_OPTIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition.charAt(0).toUpperCase() +
                            condition.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Horas por Turno */}
                  <div className="col-span-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Horas por Turno
                      </label>
                      <button
                        type="button"
                        onClick={addShift}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus size={16} className="mr-1" />
                        Agregar Turno
                      </button>
                    </div>

                    <div className="space-y-3">
                      {shifts.map((shift) => (
                        <div
                          key={shift}
                          className="flex items-center space-x-3"
                        >
                          <div className="flex-grow">
                            <label
                              htmlFor={`shift-${shift}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              {shift.charAt(0).toUpperCase() + shift.slice(1)}
                            </label>
                            <input
                              type="number"
                              id={`shift-${shift}`}
                              min="0"
                              value={formData.horasPorTurno[shift] || 0}
                              onChange={(e) =>
                                handleShiftHoursChange(
                                  shift,
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeShift(shift)}
                            className="mt-6 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Eliminar turno"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Total de Horas:
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {totalHours}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/teachers")}
                  className="btn btn-secondary mr-3 inline-flex items-center"
                  title="Cancelar"
                >
                  <X size={18} className="mr-2" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary inline-flex items-center"
                  title="Guardar docente"
                >
                  <Save size={18} className="mr-2" />
                  <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
