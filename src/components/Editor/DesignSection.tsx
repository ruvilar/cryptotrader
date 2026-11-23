import React, { useState } from "react";
import { ContentFormData } from "./types/content.types";
import { useImageUpload } from "./hooks/useImageUpload";
import { MediaManager } from "./MediaManager";
import type { MediaItem } from "./types/media.types";

// ✅ Es una interfaz TypeScript llamada Props. Define la estructura y los tipos de las propiedades (props) que debe recibir el componente DesignSection
interface Props {
  formData: ContentFormData; // Es un objeto que contiene todos los datos del formulario de contenido (por ejemplo: título, imagen destacada, CSS personalizado, etc.). El tipo ContentFormData está definido en content.types.ts. Permite que el componente acceda y muestre los valores actuales del formulario
  updateField: (field: keyof ContentFormData, value: string) => void; // Permite que el componente acceda y muestre los valores actuales del formulario. Recibe dos argumentos: field: el nombre del campo a actualizar (por ejemplo, "featuredImage" o "customCss"). value: el nuevo valor para ese campo. Así, el componente puede modificar el estado del formulario de manera controlada y tipada
  onFeaturedImageSelect?: (imageUrl: string) => void; // Es una función opcional (por el signo ?). Se ejecuta cuando el usuario selecciona o sube una imagen destacada. Recibe como argumento la URL de la imagen seleccionada. Permite que el componente padre realice acciones adicionales cuando se selecciona una imagen (por ejemplo, mostrar una notificación o actualizar una vista previa global)
}

// ✅ Sección de diseño y personalización del contenido
const DesignSection: React.FC<Props> = ({ formData, updateField, onFeaturedImageSelect }) => { // Declara el componente funcional DesignSection usando la interfaz Props para tipar las propiedades. Desestructura las props recibidas: formData, updateField y onFeaturedImageSelect
  const { uploadImage, uploading } = useImageUpload(); // Usa el hook personalizado useImageUpload para gestionar la subida de imágenes. uploadImage: función para subir una imagen. uploading: booleano que indica si hay una subida en curso (útil para mostrar feedback visual)
  const [uploadError, setUploadError] = useState<string>(""); // Declara un estado local para guardar mensajes de error relacionados con la subida de imágenes
  const [cssError, setCssError] = useState<string>(""); // Declara un estado local para guardar mensajes de error relacionados con el CSS personalizado
  const [showMediaManager, setShowMediaManager] = useState(false);

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => { // Define una función asíncrona que se ejecuta cuando el usuario selecciona un archivo de imagen. Recibe el evento del input de tipo file
    const file = event.target.files?.[0]; // Extrae el primer archivo seleccionado por el usuario. Si no hay archivo, la función termina aquí
    if (!file) return; // Si no se seleccionó ningún archivo, no hace nada

    setUploadError(""); // Limpia cualquier error previo antes de intentar una nueva subida
    
    const { url, error } = await uploadImage(file, 'featured_image'); // Llama a la función uploadImage (del hook personalizado) para subir el archivo seleccionado. El segundo argumento 'featured_image' indica que es una imagen destacada (puede usarse para categorizar en el backend). Espera la respuesta, que puede contener una url (si la subida fue exitosa) o un error
    
    if (error) { // Si ocurre un error durante la subida, actualiza el estado local uploadError para mostrar el mensaje al usuario
      setUploadError(error);
    } else if (url) { // Si la subida fue exitosa y se obtiene una URL:
      updateField("featuredImage", url); // Llama a updateField para actualizar el campo featuredImage en el formulario con la nueva URL
      onFeaturedImageSelect?.(url); // Si existe la función opcional onFeaturedImageSelect, la ejecuta pasando la URL (esto permite que el componente padre reaccione, por ejemplo, mostrando una notificación o actualizando una vista previa global)
    }
    event.target.value = ''; // Limpia el valor del input de tipo file. Esto es importante porque permite que el usuario pueda volver a subir el mismo archivo si lo desea (de lo contrario, el evento onChange no se dispararía si selecciona el mismo archivo dos veces seguidas)
  };

  const handleSelectFromLibrary = (media: MediaItem) => {
    updateField("featuredImage", media.public_url);
    onFeaturedImageSelect?.(media.public_url);
    setShowMediaManager(false);
  };

  // Validación básica de CSS
  const validateCss = (css: string) => {
    if (!css.trim()) {
      setCssError("");
      return true;
    }

    const hasValidBlock = /[^{]+\{[^}]+\}/.test(css);
    
    if (!hasValidBlock) {
      setCssError("⚠️ El CSS debe contener al menos un selector válido. Ejemplo: .mi-clase { color: red; }");
      return false;
    }

    const dangerousSelectors = ['html', 'body', '*'];
    const hasDangerous = dangerousSelectors.some(sel => 
      new RegExp(`\\b${sel}\\s*\\{`, 'i').test(css)
    );

    if (hasDangerous) {
      setCssError("⚠️ Evita selectores globales como html, body o *. Afectarán toda la página.");
      return false;
    }

    setCssError("");
    return true;
  };

  const handleCssChange = (value: string) => {
    updateField("customCss", value);
    validateCss(value);
  };

  // Sangría automática en el textarea de CSS
  const handleCssKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insertar espacios al presionar Tab
    if (e.key === "Tab") {
      e.preventDefault();
      const insert = "  "; // 2 espacios
      const before = value.slice(0, start);
      const after = value.slice(end);
      const newValue = before + insert + after;
      handleCssChange(newValue);
      // Colocar el cursor después de los espacios insertados
      requestAnimationFrame(() => {
        const pos = start + insert.length;
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    // Sangría al presionar Enter
    if (e.key === "Enter") {
      e.preventDefault();

      const before = value.slice(0, start);
      const after = value.slice(end);

      const lineStart = before.lastIndexOf("\n") + 1;
      const currentLine = before.slice(lineStart);
      const baseIndent = (currentLine.match(/^[ \t]*/)?.[0] ?? "");
      const trimmedCurrent = currentLine.trimEnd();

      const nextChar = after[0] ?? "";
      const endsWithOpenBrace = trimmedCurrent.endsWith("{");

      // Caso: línea con "{" y el siguiente carácter es "}" -> bloque con sangría intermedia
      if (endsWithOpenBrace && nextChar === "}") {
        const insert = `\n${baseIndent}  \n${baseIndent}`;
        const newValue = before + insert + after;
        handleCssChange(newValue);
        requestAnimationFrame(() => {
          const pos = start + 1 + baseIndent.length + 2; // dentro del bloque sangrado
          textarea.setSelectionRange(pos, pos);
        });
        return;
      }

      const openCount = (before.match(/{/g) || []).length;
      const closeCount = (before.match(/}/g) || []).length;
      const insideBlock = openCount > closeCount;

      const extraIndent = endsWithOpenBrace ? "  " : insideBlock ? "  " : "";
      const insert = `\n${baseIndent}${extraIndent}`;

      const newValue = before + insert + after;
      handleCssChange(newValue);
      requestAnimationFrame(() => {
        const pos = start + insert.length;
        textarea.setSelectionRange(pos, pos);
      });
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-blue-700">Diseño y Personalización</h3>
      <div className="grid gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-800">Imagen destacada</label>
          {formData.featuredImage && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <img 
                  src={formData.featuredImage} 
                  alt="Imagen destacada" 
                  className="w-20 h-20 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">Vista previa de la imagen destacada</p>
                  <button 
                    type="button"
                    onClick={() => updateField("featuredImage", "")}
                    className="mt-1 text-red-600 hover:text-red-800 text-sm font-bold underline"
                  >
                    ❌ Quitar imagen
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {/* Input URL */}
            <input
              type="url"
              placeholder="URL de la imagen destacada"
              value={formData.featuredImage}
              onChange={e => updateField("featuredImage", e.target.value)}
              className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Botones: Subir y Biblioteca */}
            <div className="flex gap-2">
              {/* Input oculto para subir archivo */}
              <input
                type="file"
                accept="image/*"
                onChange={handleFeaturedImageUpload}
                className="hidden"
                id="featured-image-upload"
              />
              
              {/* Botón Subir archivo */}
              <label
                htmlFor="featured-image-upload"
                className={`flex-1 px-4 py-3 font-bold text-white rounded-lg transition-colors text-center cursor-pointer ${
                  uploading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {uploading ? '⏳ Subiendo...' : '📁 Subir archivo'}
              </label>
              
              {/* Botón Biblioteca de medios */}
              <button
                type="button"
                onClick={() => setShowMediaManager(true)}
                className="flex-1 px-4 py-3 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                📚 Biblioteca de medios
              </button>
            </div>
            
            {/* Error de subida */}
            {uploadError && (
              <div className="p-2 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
                ❌ {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* ✅ CSS personalizado con validación */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            🎨 CSS personalizado (Opcional)
          </label>
          <p className="text-xs text-gray-600 mb-2">
            💡 Los estilos solo afectarán a este post. Evita selectores globales.
          </p>

          <textarea
            placeholder={`Ejemplo:\n.mi-titulo { color: #ff6b00; font-size: 2rem; }\n.mi-parrafo { line-height: 1.8; }`}
            value={formData.customCss}
            onChange={e => handleCssChange(e.target.value)}
            onKeyDown={handleCssKeyDown}
            className={`w-full border rounded-lg p-3 font-mono text-sm text-black focus:ring-2 ${
              cssError 
                ? 'border-red-500 focus:ring-red-500' 
                : 'focus:ring-blue-500'
            }`}
            rows={6}
          />

          {cssError && (
            <div className="p-2 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-xs">
              {cssError}
            </div>
          )}
          {formData.customCss && !cssError && (
            <div className="p-2 bg-green-100 border border-green-400 rounded text-green-800 text-xs">
              ✅ CSS válido. Se aplicará solo a este artículo.
            </div>
          )}
        </div>
      </div>

      {/* Media Manager Modal */}
      <MediaManager
        isOpen={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onSelect={handleSelectFromLibrary}
        allowedTypes={['image']}
      />
    </div>
  );
};

export default DesignSection;