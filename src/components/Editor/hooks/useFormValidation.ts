import { ContentFormData } from "../types/content.types";

// ✅ Hook que permite encapsular y reutilizar lógica de estado y comportamiento en componentes funcionales
export const useFormValidation = () => {
  function validate(formData: ContentFormData) { // Recibe un objeto formData tipado como ContentFormData (definido en /src/types/content.types). Centraliza la lógica de validación de los datos del formulario
    const errors: { field: string; message: string }[] = []; // Cada error es un objeto con el nombre del campo (field) y un mensaje descriptivo (message)
    if (!formData.title.trim()) {
      errors.push({ field: "title", message: "El título es obligatorio" }); // Comprueba si el campo title está vacío o solo contiene espacios. Si la condición se cumple, agrega un error específico al array
    }
    return { isValid: errors.length === 0, errors }; // isValid: Booleano, indica si el formulario pasó todas las validaciones. errors: Lista de errores encontrados
  }
  return { validate }; // Expone la función validate para ser utilizada en componentes de formulario
};