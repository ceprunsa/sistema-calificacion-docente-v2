"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase/config";
import type {
  TeacherEvaluation,
  EvaluationFormData,
} from "../types/evaluation";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

const getEvaluations = async (): Promise<TeacherEvaluation[]> => {
  const evaluationsRef = collection(db, "evaluations");
  const q = query(evaluationsRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as TeacherEvaluation)
  );
};

// Función para convertir archivo a base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Función para subir imagen a Firebase Storage
const uploadEvidenceImage = async (
  file: File,
  evaluationId: string
): Promise<string> => {
  const imageRef = ref(
    storage,
    `evaluations/${evaluationId}/evidence-${Date.now()}`
  );
  const snapshot = await uploadBytes(imageRef, file);
  return await getDownloadURL(snapshot.ref);
};

// Función para eliminar imagen de Firebase Storage
const deleteEvidenceImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.warn("No se pudo eliminar la imagen anterior:", error);
  }
};

// Modificar la función getEvaluationsByTeacherId para manejar mejor los casos de error
const getEvaluationsByTeacherId = async (
  teacherId: string
): Promise<TeacherEvaluation[]> => {
  if (!teacherId) {
    console.warn(
      "Se intentó obtener evaluaciones sin proporcionar un teacherId válido"
    );
    return [];
  }

  try {
    const evaluationsRef = collection(db, "evaluations");
    const q = query(
      evaluationsRef,
      where("teacherId", "==", teacherId),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TeacherEvaluation)
    );
  } catch (error) {
    console.error("Error al obtener evaluaciones por teacherId:", error);
    throw error;
  }
};

const getEvaluationById = async (
  id?: string
): Promise<TeacherEvaluation | null> => {
  if (!id) return null;
  const docRef = doc(db, "evaluations", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as TeacherEvaluation;
  }
  return null;
};

// Mejorar la función saveEvaluation para manejar imágenes y base64
const saveEvaluation = async (
  evaluationData: EvaluationFormData,
  _queryClient: any,
  user: any
): Promise<TeacherEvaluation> => {
  const now = new Date().toISOString();

  try {
    if (evaluationData.id) {
      // Actualizar evaluación existente
      const evaluationRef = doc(db, "evaluations", evaluationData.id);

      // Extraemos el id y la imagen para no incluirlos en los datos a actualizar
      const { id, evidenceImage, ...evaluationDataWithoutId } = evaluationData;

      const updatedEvaluation = {
        ...evaluationDataWithoutId,
        updatedAt: now,
      };

      // Manejar la imagen de evidencia si se proporciona una nueva
      if (evidenceImage) {
        // Eliminar imagen anterior si existe
        if (evaluationDataWithoutId.evidenceImageUrl) {
          await deleteEvidenceImage(evaluationDataWithoutId.evidenceImageUrl);
        }

        // Subir nueva imagen y convertir a base64
        const imageUrl = await uploadEvidenceImage(
          evidenceImage,
          evaluationData.id
        );
        const imageBase64 = await fileToBase64(evidenceImage);

        updatedEvaluation.evidenceImageUrl = imageUrl;
        updatedEvaluation.evidenceImageBase64 = imageBase64;
      }

      await updateDoc(evaluationRef, updatedEvaluation);

      toast.success("Evaluación actualizada exitosamente");
      return {
        ...updatedEvaluation,
        id: evaluationData.id,
      } as TeacherEvaluation;
    } else {
      // Crear nueva evaluación
      // Asegurarse de que el evaluador esté establecido
      if (!evaluationData.evaluatorId && user) {
        evaluationData.evaluatorId = user.id;
        evaluationData.evaluatorName = user.displayName || user.email;
      }

      // Extraemos el id y la imagen si existe
      const { id, evidenceImage, ...evaluationDataWithoutId } = evaluationData;

      const newEvaluation = {
        ...evaluationDataWithoutId,
        createdAt: now,
        updatedAt: now,
      };

      // Crear el documento primero para obtener el ID
      const docRef = await addDoc(collection(db, "evaluations"), newEvaluation);

      // Manejar la imagen de evidencia si se proporciona
      if (evidenceImage) {
        const imageUrl = await uploadEvidenceImage(evidenceImage, docRef.id);
        const imageBase64 = await fileToBase64(evidenceImage);

        // Actualizar el documento con la URL y base64 de la imagen
        await updateDoc(docRef, {
          evidenceImageUrl: imageUrl,
          evidenceImageBase64: imageBase64,
        });
        newEvaluation.evidenceImageUrl = imageUrl;
        newEvaluation.evidenceImageBase64 = imageBase64;
      }

      toast.success("Evaluación registrada exitosamente");
      return { ...newEvaluation, id: docRef.id } as TeacherEvaluation;
    }
  } catch (error) {
    console.error("Error al guardar evaluación:", error);
    toast.error("Error al guardar la evaluación. Inténtelo de nuevo.");
    throw error;
  }
};

const deleteEvaluation = async (id: string): Promise<string> => {
  try {
    // Obtener la evaluación para eliminar la imagen si existe
    const evaluation = await getEvaluationById(id);

    if (evaluation?.evidenceImageUrl) {
      await deleteEvidenceImage(evaluation.evidenceImageUrl);
    }

    await deleteDoc(doc(db, "evaluations", id));
    toast.success("Evaluación eliminada exitosamente");
    return id;
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    toast.error("Error al eliminar evaluación");
    throw error;
  }
};

export const useEvaluations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // React Query hooks
  const evaluationsQuery = useQuery({
    queryKey: ["evaluations"],
    queryFn: getEvaluations,
  });

  // Modificar la función useEvaluationsByTeacherId para mejorar el manejo de errores
  const useEvaluationsByTeacherId = (teacherId: string) => {
    return useQuery({
      queryKey: ["evaluations", "teacher", teacherId],
      queryFn: () => getEvaluationsByTeacherId(teacherId),
      enabled: !!teacherId,
      retry: 2, // Intentar la consulta hasta 2 veces en caso de error
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  // Función para obtener una evaluación por ID
  const useEvaluationById = (id?: string) => {
    return useQuery({
      queryKey: ["evaluations", "id", id],
      queryFn: () => getEvaluationById(id),
      enabled: !!id,
    });
  };

  // Mejorar las mutaciones para manejar mejor los errores
  const saveEvaluationMutation = useMutation({
    mutationFn: (evaluationData: EvaluationFormData) =>
      saveEvaluation(evaluationData, queryClient, user),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({
        queryKey: ["evaluations", "teacher", data.teacherId],
      });
      if (data.id) {
        queryClient.invalidateQueries({
          queryKey: ["evaluations", "id", data.id],
        });
      }
    },
    onError: (error) => {
      console.error("Error en la mutación de guardar evaluación:", error);
      toast.error(
        "No se pudo guardar la evaluación. Por favor, inténtelo de nuevo."
      );
    },
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: (deletedId, _variables) => {
      // Intentar obtener el teacherId de la evaluación eliminada desde el caché
      const evaluations =
        queryClient.getQueryData<TeacherEvaluation[]>(["evaluations"]) || [];
      const deletedEvaluation = evaluations.find((e) => e.id === deletedId);

      queryClient.invalidateQueries({ queryKey: ["evaluations"] });

      // Si encontramos la evaluación, invalidamos también la consulta específica del profesor
      if (deletedEvaluation) {
        queryClient.invalidateQueries({
          queryKey: ["evaluations", "teacher", deletedEvaluation.teacherId],
        });
      }
    },
    onError: (error) => {
      console.error("Error en la mutación de eliminar evaluación:", error);
      toast.error(
        "No se pudo eliminar la evaluación. Por favor, inténtelo de nuevo."
      );
    },
  });

  return {
    evaluations: evaluationsQuery.data || [],
    isLoadingEvaluations: evaluationsQuery.isLoading,
    isErrorEvaluations: evaluationsQuery.isError,
    errorEvaluations: evaluationsQuery.error as Error | null,
    useEvaluationsByTeacherId,
    useEvaluationById,
    saveEvaluation: saveEvaluationMutation.mutate,
    deleteEvaluation: deleteEvaluationMutation.mutate,
    isSaving: saveEvaluationMutation.isPending,
    isDeleting: deleteEvaluationMutation.isPending,
  };
};
