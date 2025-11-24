/**
 * Capitaliza la primera letra de cada palabra en un texto
 */
export const capitalizeText = (text: string): string => {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
