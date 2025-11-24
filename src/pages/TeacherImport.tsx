"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTeachers } from "../hooks/useTeachers"
import toast from "react-hot-toast"
import type { TeacherFormData } from "../types/teacher"
import { Upload, FileText, Check, AlertTriangle, X, ArrowLeft } from "lucide-react"

const TeacherImport = () => {
  const navigate = useNavigate()
  const { importTeachers, isImporting } = useTeachers()
  const [jsonData, setJsonData] = useState<string>("")
  const [parsedData, setParsedData] = useState<TeacherFormData[] | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        setJsonData(content)
        validateJsonData(content)
      } catch (error) {
        console.error("Error al leer el archivo:", error)
        toast.error("Error al leer el archivo")
      }
    }
    reader.readAsText(file)
  }

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setJsonData(content)
    if (content.trim()) {
      validateJsonData(content)
    } else {
      setParsedData(null)
      setValidationErrors([])
    }
  }

  const validateJsonData = (content: string) => {
    try {
      const data = JSON.parse(content)
      const errors: string[] = []

      // Validar que sea un array
      if (!Array.isArray(data)) {
        errors.push("El JSON debe ser un array de docentes")
        setParsedData(null)
        setValidationErrors(errors)
        return
      }

      // Validar cada docente
      const validatedData: TeacherFormData[] = []

      data.forEach((item, index) => {
        // Validar campos requeridos
        const requiredFields = [
          "dni",
          "apellidos",
          "nombres",
          "telefono",
          "correoPersonal",
          "correoInstitucional",
          "curso",
          "condicionInstitucional",
          "horasPorTurno",
        ]

        for (const field of requiredFields) {
          if (!item[field]) {
            errors.push(`Docente #${index + 1}: Falta el campo "${field}"`)
          }
        }

        // Validar DNI (8-10 dígitos)
        if (item.dni && !/^\d{8,10}$/.test(item.dni)) {
          errors.push(`Docente #${index + 1}: El DNI debe tener entre 8 y 10 dígitos`)
        }

        // Validar correos
        if (item.correoPersonal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.correoPersonal)) {
          errors.push(`Docente #${index + 1}: El correo personal no es válido`)
        }

        if (item.correoInstitucional && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.correoInstitucional)) {
          errors.push(`Docente #${index + 1}: El correo institucional no es válido`)
        }

        // Validar teléfono
        if (item.telefono && !/^\d{9,}$/.test(item.telefono)) {
          errors.push(`Docente #${index + 1}: El teléfono debe tener al menos 9 dígitos`)
        }

        // Validar horasPorTurno
        if (item.horasPorTurno) {
          if (typeof item.horasPorTurno !== "object" || Array.isArray(item.horasPorTurno)) {
            errors.push(`Docente #${index + 1}: horasPorTurno debe ser un objeto`)
          } else {
            // Verificar que todas las horas sean números
            for (const [turno, horas] of Object.entries(item.horasPorTurno)) {
              if (typeof horas !== "number" || horas < 0) {
                errors.push(`Docente #${index + 1}: Las horas para ${turno} deben ser un número positivo`)
              }
            }
          }
        }

        validatedData.push(item as TeacherFormData)
      })

      setParsedData(validatedData)
      setValidationErrors(errors)

      if (errors.length === 0 && validatedData.length > 0) {
        toast.success(`${validatedData.length} docentes validados correctamente`)
      }
    } catch (error) {
      console.error("Error al parsear JSON:", error)
      setParsedData(null)
      setValidationErrors(["El formato JSON no es válido"])
    }
  }

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      toast.error("No hay datos válidos para importar")
      return
    }

    if (validationErrors.length > 0) {
      toast.error("Corrige los errores antes de importar")
      return
    }

    try {
      importTeachers(parsedData)
      navigate("/teachers")
    } catch (error) {
      console.error("Error al importar docentes:", error)
      toast.error("Error al importar docentes")
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      setFileName(file.name)

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          setJsonData(content)
          validateJsonData(content)
        } catch (error) {
          console.error("Error al leer el archivo:", error)
          toast.error("Error al leer el archivo")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const clearFile = () => {
    setFileName("")
    setJsonData("")
    setParsedData(null)
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Importar Docentes</h3>
            <p className="mt-1 text-sm text-gray-600">
              Importa múltiples docentes a la vez utilizando un archivo JSON.
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Formato esperado:</h4>
              <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs overflow-auto">
                {`[
  {
    "dni": "12345678",
    "apellidos": "Apellido1 Apellido2",
    "nombres": "Nombre1 Nombre2",
    "telefono": "987654321",
    "correoPersonal": "correo@ejemplo.com",
    "correoInstitucional": "correo@institucion.edu",
    "curso": "matemática",
    "condicionInstitucional": "tiempo completo",
    "horasPorTurno": {
      "turno 1": 10,
      "turno 2": 5
    }
  },
  ...
]`}
              </pre>
            </div>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 bg-white sm:p-6">
              <div className="space-y-6">
                {/* Área para arrastrar archivos */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                  <div className="text-center">
                    {fileName ? (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{fileName}</p>
                          <p className="text-xs text-gray-500">
                            {parsedData ? `${parsedData.length} docentes encontrados` : "Archivo cargado"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearFile()
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm font-medium text-gray-900">Arrastra y suelta un archivo JSON aquí</p>
                        <p className="mt-1 text-xs text-gray-500">O haz clic para seleccionar un archivo</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Área de texto para JSON */}
                <div>
                  <label htmlFor="jsonData" className="block text-sm font-medium text-gray-700">
                    O pega el contenido JSON directamente:
                  </label>
                  <textarea
                    id="jsonData"
                    name="jsonData"
                    rows={10}
                    value={jsonData}
                    onChange={handleTextAreaChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md font-mono"
                    placeholder='[{"dni": "12345678", "apellidos": "Apellido", ...}]'
                  ></textarea>
                </div>

                {/* Errores de validación */}
                {validationErrors.length > 0 && (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Se encontraron {validationErrors.length} errores
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            {validationErrors.slice(0, 10).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {validationErrors.length > 10 && <li>Y {validationErrors.length - 10} errores más...</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen de datos válidos */}
                {parsedData && parsedData.length > 0 && validationErrors.length === 0 && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Datos válidos</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Se encontraron {parsedData.length} docentes listos para importar.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={() => navigate("/teachers")}
                className="btn btn-secondary mr-3 inline-flex items-center"
              >
                <ArrowLeft size={18} className="mr-2" />
                <span>Volver</span>
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !parsedData || parsedData.length === 0 || validationErrors.length > 0}
                className="btn btn-primary inline-flex items-center"
              >
                <Upload size={18} className="mr-2" />
                <span>{isImporting ? "Importando..." : "Importar Docentes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherImport
