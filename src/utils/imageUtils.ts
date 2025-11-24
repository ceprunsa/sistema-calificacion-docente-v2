import { getStorage, ref, getBytes } from "firebase/storage";

/**
 * Convierte una URL de Firebase Storage a base64 usando el SDK
 * @param url URL de Firebase Storage
 * @returns Promesa con la imagen en formato base64
 */
export const toBase64 = async (url: string): Promise<string> => {
  try {
    // Extraer el path de la URL de Firebase Storage
    const storage = getStorage();

    // Obtener la referencia desde la URL
    const urlParts = url.split("/o/")[1]?.split("?")[0];
    if (!urlParts) {
      throw new Error("URL de Firebase Storage inválida");
    }

    const path = decodeURIComponent(urlParts);
    const imageRef = ref(storage, path);

    // Descargar los bytes de la imagen
    const bytes = await getBytes(imageRef);

    // Convertir bytes a base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));

    // Determinar el tipo MIME basado en la extensión del archivo
    let mimeType = "image/jpeg"; // por defecto
    if (path.toLowerCase().includes(".png")) {
      mimeType = "image/png";
    } else if (path.toLowerCase().includes(".webp")) {
      mimeType = "image/webp";
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error al convertir imagen a base64:", error);
    throw new Error("No se pudo procesar la imagen desde Firebase Storage");
  }
};

/**
 * Redimensiona una imagen para que no exceda un tamaño máximo
 * @param file Archivo de imagen
 * @param maxSizeKB Tamaño máximo en KB
 * @returns Promesa con el archivo redimensionado
 */
export const resizeImageIfNeeded = (
  file: File,
  maxSizeKB: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si el archivo ya es menor que el tamaño máximo, lo devolvemos sin cambios
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Calculamos el factor de reducción basado en el tamaño actual
        const compressionRatio = Math.sqrt((maxSizeKB * 1024) / file.size);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Reducimos las dimensiones proporcionalmente
        canvas.width = img.width * compressionRatio;
        canvas.height = img.height * compressionRatio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertimos el canvas a Blob con calidad reducida
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo redimensionar la imagen"));
              return;
            }
            // Creamos un nuevo archivo con el mismo nombre pero redimensionado
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          0.8 // Calidad de compresión
        );
      };
      img.onerror = () => {
        reject(new Error("Error al cargar la imagen para redimensionar"));
      };
    };
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo de imagen"));
    };
  });
};
