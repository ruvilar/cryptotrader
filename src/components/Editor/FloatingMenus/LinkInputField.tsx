import React, { useState } from "react";
import { UrlUtils } from "../utils/validateUrl"; // Usar helper centralizado
import { ExternalLink, Check, X, AlertCircle } from "lucide-react";

// ✅ Es una interfaz TypeScript que define los props (propiedades) que debe recibir el componente LinkInputField
interface LinkInputFieldProps {
  visible: boolean; // Indica si el campo de enlace debe mostrarse (true) o no (false). Permite controlar el renderizado condicional del componente
  url: string; // Es el valor actual del enlace que se está editando. Se usa como valor del input de texto
  setUrl: (url: string) => void; // Es una función que permite actualizar el valor de la URL. Se llama cada vez que el usuario escribe en el input
  onApply: () => void; // Función que se ejecuta cuando el usuario confirma/aplica el enlace. Normalmente guarda el enlace o lo inserta en el editor
  onCancel: () => void; // Función que se ejecuta cuando el usuario cancela la acción. Suele cerrar el menú flotante o limpiar el input
}

// ✅Usa la interfaz LinkInputFieldProps para tipar los props, asegurando que solo reciba las propiedades esperadas
const LinkInputField: React.FC<LinkInputFieldProps> = ({
  // Extrae los props directamente para usarlos dentro del componente. Esto hace el código más limpio y fácil de leer
  visible,
  url,
  setUrl,
  onApply,
  onCancel,
}) => {
  const [showPreview, setShowPreview] = useState(false); // Declara un estado local llamado showPreview (por defecto false). Se usa para controlar si se muestra la vista previa del enlace

  if (!visible) return null; // Si el prop visible es false, el componente no se renderiza nada (null). Esto evita que el menú aparezca cuando no debe

  const trimmedUrl = url.trim(); // Elimina espacios en blanco al inicio y final de la URL ingresada
  const hasUrl = trimmedUrl.length > 0; // Indica si el usuario ha escrito algo en el campo de la URL
  const isUrlValid = !hasUrl || UrlUtils.isValidUrl(trimmedUrl); // Si el campo está vacío, lo considera válido (para evitar mostrar errores antes de que el usuario escriba). Si hay texto, valida la URL usando el helper UrlUtils.isValidUrl

  // ✅ Se ejecuta cada vez que el usuario escribe en el input del enlace
  const handleUrlChange = (inputUrl: string) => {
    setUrl(inputUrl); // Actualiza el estado externo del enlace
    setShowPreview(inputUrl.length > 10 && UrlUtils.isValidUrl(inputUrl)); // Decide si mostrar la vista previa del enlace. Solo la muestra si la URL tiene más de 10 caracteres y es válida según el helper UrlUtils.isValidUrl
  };

  // ✅ Se ejecuta cuando el usuario confirma/aplica el enlace (botón o Enter). Garantiza que todas las URLs tengan el formato correcto antes de guardarlas o insertarlas
  const handleApply = () => {
    const finalUrl = UrlUtils.normalizeUrl(trimmedUrl); // Normaliza la URL (agrega https:// si falta) usando el helper UrlUtils.normalizeUrl
    setUrl(finalUrl); // Actualiza el valor de la URL con la versión normalizada
    onApply(); // Llama a la función onApply para que el componente padre procese el enlace
  };

  // ✅ Se ejecuta cuando el usuario presiona una tecla en el input. Mejora la experiencia de usuario permitiendo atajos de teclado estándar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isUrlValid && hasUrl) { // Si la tecla es Enter y la URL es válida y no está vacía, ejecuta handleApply()
      handleApply();
    } else if (e.key === "Escape") { // Si la tecla es Escape, ejecuta onCancel() para cerrar el menú o limpiar el campo.
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white text-black rounded-lg shadow-lg border border-gray-200 min-w-80">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ExternalLink size={18} className="text-blue-600" />
        <h4 className="font-semibold text-gray-800">Insertar Enlace</h4>
      </div>

      {/* Input con validación visual */}
      <div className="relative">
        <input
          type="text"
          placeholder="https://ejemplo.com o ejemplo.com"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
            !hasUrl
              ? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              : isUrlValid
              ? "border-green-500 focus:ring-green-500 bg-green-50"
              : "border-red-500 focus:ring-red-500 bg-red-50"
          }`}
          autoFocus
        />
        {hasUrl && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isUrlValid ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <AlertCircle size={16} className="text-red-600" />
            )}
          </div>
        )}
      </div>

      {/* Mensaje de validación */}
      {hasUrl && !isUrlValid && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          URL no válida. Formato: https://ejemplo.com
        </p>
      )}

      {/* Preview rápido */}
      {showPreview && isUrlValid && (
        <div className="p-2 bg-gray-50 rounded border text-xs">
          <span className="text-gray-600">Vista previa:</span>
          <span className="ml-2 text-blue-600 font-medium">
            {UrlUtils.normalizeUrl(trimmedUrl).replace(/^https?:\/\//, "")}
          </span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={!isUrlValid || !hasUrl}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          title={!isUrlValid || !hasUrl ? "Ingresa una URL válida" : "Aplicar enlace"}
        >
          <Check size={16} />
          Aplicar
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Cancelar (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Shortcuts */}
      <div className="text-xs text-gray-500 text-center">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> para aplicar •
        <kbd className="px-1 py-0.5 bg-gray-100 rounded ml-1">Esc</kbd> para cancelar
      </div>
    </div>
  );
};

export default LinkInputField;
