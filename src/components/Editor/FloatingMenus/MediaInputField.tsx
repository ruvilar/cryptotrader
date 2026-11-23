import React, { useState, useRef } from "react";
import { Upload, Youtube, Paperclip, Image, Video, Music, FileText, Check, X, AlertCircle, Library } from "lucide-react";
import { UrlUtils } from "../utils/validateUrl";
import { extractYouTubeId } from "../utils/insertMedia";

// ✅ Es un type alias de TypeScript. Define los valores posibles para el tipo de medio que puede manejar el componente. Permite que las props y funciones relacionadas con el tipo de medio sean estrictamente tipadas. Así, solo se pueden usar estos valores, evitando errores y facilitando el autocompletado
export type MediaType = "image" | "video" | "audio" | "file" | "featured-image";

interface MediaInputFieldProps {
  visible: boolean; // Indica si el componente debe mostrarse o no (útil para modales/flotantes)
  url: string; // Guarda la URL del archivo/media que el usuario está editando o agregando
  type: MediaType; // Define el tipo de media actual (imagen, video, etc)
  setUrl: (url: string) => void; // Función para actualizar el estado de la URL desde el componente padre
  setType: (type: MediaType) => void; // Función para cambiar el tipo de media desde el componente padre
  onApply: () => void; // Función que se ejecuta cuando el usuario confirma la selección o inserción del media
  onCancel: () => void; // Función que se ejecuta cuando el usuario cancela la acción (cierra el modal, etc)
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; // Handler para cuando el usuario selecciona un archivo desde el input
  onFeaturedImageSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Handler específico para seleccionar una imagen destacada (solo se usa si el tipo es "featured-image")
  onOpenLibrary?: () => void;
}

// ✅ Es un objeto de configuración que centraliza las propiedades visuales y funcionales para cada tipo de medio soportado por el componente. Así, el código es más limpio, fácil de mantener y escalar
const MEDIA_CONFIG = { // icon: El componente de icono de lucide-react que se usará para representar visualmente el tipo de archivo. || label: El texto descriptivo que se muestra al usuario (por ejemplo, "Imagen", "Video"). || accept: El valor para el atributo accept del input file, que restringe los tipos de archivos que se pueden seleccionar. || color: El color base para el fondo y el icono, usado para dar feedback visual y coherencia de UI.
  image: { icon: Image, label: 'Imagen', accept: 'image/*', color: 'blue' },
  video: { icon: Video, label: 'Video', accept: 'video/*', color: 'red' },
  audio: { icon: Music, label: 'Audio', accept: 'audio/*', color: 'purple' },
  file: { icon: FileText, label: 'Archivo', accept: '*/*', color: 'gray' },
  'featured-image': { icon: Image, label: 'Imagen Destacada', accept: 'image/*', color: 'yellow' }
};

const MediaInputField: React.FC<MediaInputFieldProps> = ({
  visible,
  url,
  type,
  setUrl,
  setType,
  onApply,
  onCancel,
  onFileSelect,
  onFeaturedImageSelect,
  onOpenLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'youtube' | 'library'>('upload'); // Controla qué pestaña está activa: subir archivo, URL o YouTube
  const [dragActive, setDragActive] = useState(false); // Indica si el usuario está arrastrando un archivo sobre la zona de drop (para feedback visual)
  const [youtubeUrl, setYoutubeUrl] = useState(''); // Guarda la URL que el usuario escribe en el campo de YouTube
  const fileInputRef = useRef<HTMLInputElement>(null); // Referencia al input de archivos para poder activarlo programáticamente (al hacer clic en la zona de drop)

  if (!visible) return null; // Si la prop visible es false, el componente no renderiza nada. Permite mostrar/ocultar el modal flotante de forma eficiente

  const config = MEDIA_CONFIG[type]; // Obtiene la configuración visual y funcional para el tipo de media actual (image, video, etc)
  const IconComponent = config.icon; // Permite renderizar el icono correspondiente de forma dinámica
  const isUrlValid = url.trim() === "" || UrlUtils.isValidUrl(url.trim()); // Es true si el campo está vacío o si la URL es válida según la función UrlUtils.isValidUrl. Permite que el input no marque error si está vacío, pero sí valide cuando el usuario escribe algo
  const hasUrl = url.trim() !== ""; // Es true si el usuario ha escrito algo en el campo de URL. Se usa para mostrar feedback visual y habilitar/deshabilitar botones

  // ✅ Handler que se ejecuta cuando el usuario arrastra un archivo sobre la zona de drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto. Evita que el navegador abra el archivo arrastrado en una nueva pestaña o realice otra acción por defecto
    setDragActive(false); // Desactiva el estado visual de drag. Cambia el estado dragActive a false para quitar el feedback visual (por ejemplo, el borde azul de la zona de drop)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { // Verifica si hay archivos arrastrados. Comprueba que realmente se hayan soltado archivos
      const event = { // Crea un evento simulado para el input file
        target: { files: e.dataTransfer.files } // Crea un objeto que simula el evento de cambio (onChange) de un input de tipo file, para reutilizar la lógica de manejo de archivos
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event); // Llama a la función que maneja la selección de archivos, pasando el evento simulado
    }
  };

  // ✅ Handler que se ejecuta cuando el usuario selecciona un archivo, ya sea desde el input file o mediante drag & drop
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "featured-image" && onFeaturedImageSelect) { // Si el tipo de media (type) es "featured-image" y existe la función onFeaturedImageSelect...
      onFeaturedImageSelect(event); // ...llama esta función específica para manejar la selección de la imagen destacada. Esto permite un tratamiento especial para la imagen destacada (por ejemplo, validaciones o flujos distintos)
    } else {
      onFileSelect(event); // En cualquier otro caso llama a onFileSelect(event). Se usa para imágenes, videos, audios o archivos normales
    }
  };

  // ✅ Handler que se ejecuta cuando el usuario quiere insertar un video de YouTube usando la pestaña correspondiente del modal
  const handleYouTubeInsert = () => {
    const videoId = extractYouTubeId(youtubeUrl); // Llama a la función extractYouTubeId para obtener el ID del video desde la URL ingresada
    if (youtubeUrl && videoId) { // Solo continúa si el campo youtubeUrl no está vacío y la función extractYouTubeId(youtubeUrl) devuelve un ID válido (es decir, la URL realmente corresponde a un video de YouTube)
      const embedUrl = `https://www.youtube.com/embed/${videoId}`; // Convierte a formato embed para asegurar compatibilidad
      setUrl(embedUrl); // Guarda la URL de YouTube en el estado url
      setType('video'); // Cambia el tipo de media a "video" (por si el usuario estaba en otro tipo)
      onApply(); // Llama a la función onApply, que normalmente cierra el modal y aplica la inserción del video en el editor principal
    }
  };

  // ✅ Handler que se ejecuta cuando el usuario quiere insertar un archivo o recurso usando una URL directa (no YouTube)
  const handleUrlApply = () => {
    let finalUrl = url.trim(); // Elimina espacios al inicio y final de la URL
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) { // Verifica si la URL no tiene protocolo (http:// o https://)
      finalUrl = 'https://' + finalUrl; // Si no lo tiene, agrega https:// al principio para asegurar que la URL sea válida y segura
      setUrl(finalUrl); // Actualiza el estado url con la URL normalizada
    }
    onApply(); // Llama a la función onApply, que normalmente cierra el modal y aplica la inserción del recurso en el editor principal
  };

  // ✅ Función que se ejecuta cuando el usuario presiona una tecla mientras está enfocado en el componente
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { // Si la tecla presionada es Escape, llama a la función onCancel()
      onCancel(); // Esto permite que el usuario cierre el modal o cancele la acción rápidamente usando el teclado, mejorando la accesibilidad y la experiencia de usuario
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white text-black rounded-lg shadow-xl border border-gray-200 min-w-96 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          config.color === 'blue' ? 'bg-blue-100' :
          config.color === 'red' ? 'bg-red-100' :
          config.color === 'purple' ? 'bg-purple-100' :
          config.color === 'gray' ? 'bg-gray-100' :
          'bg-yellow-100'
        }`}>
          <IconComponent size={20} className={`${
            config.color === 'blue' ? 'text-blue-600' :
            config.color === 'red' ? 'text-red-600' :
            config.color === 'purple' ? 'text-purple-600' :
            config.color === 'gray' ? 'text-gray-600' :
            'text-yellow-600'
          }`} />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">{config.label}</h4>
          <p className="text-sm text-gray-600">
            {type === "featured-image" ? "Selecciona la imagen principal" : "Sube archivo o ingresa URL"}
          </p>
        </div>
      </div>

      {/* Tabs (solo si no es imagen destacada) */}
      {type !== "featured-image" && (
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 text-sm font-medium ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Upload size={14} className="inline mr-1" />
            Subir
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-3 py-2 text-sm font-medium ${activeTab === 'url' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Paperclip size={14} className="inline mr-1" />
            URL
          </button>
          {onOpenLibrary && (
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'library' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Library size={14} className="inline mr-1" />
              Biblioteca de medios
            </button>
          )}
          {type === 'video' && (
            <button
              onClick={() => setActiveTab('youtube')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'youtube' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Youtube size={14} className="inline mr-1" />
              YouTube
            </button>
          )}
        </div>
      )}

      {/* Contenido según tab activo */}
      <div onKeyDown={handleKeyPress}>
        {(activeTab === 'upload' || type === "featured-image") && (
          <div>
            {/* Selector de tipo (solo si no es imagen destacada) */}
            {type !== "featured-image" && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de archivo</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as MediaType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="image">📷 Imagen</option>
                  <option value="video">🎬 Video</option>
                  <option value="audio">🔊 Audio</option>
                  <option value="file">📎 Archivo</option>
                </select>
              </div>
            )}

            {/* Zona de drag & drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Arrastra archivos aquí o haz clic
              </p>
              <p className="text-xs text-gray-500">
                {config.accept === 'image/*' ? 'JPG, PNG, GIF, WebP' : 
                 config.accept === 'video/*' ? 'MP4, WebM, MOV' : 
                 config.accept === 'audio/*' ? 'MP3, WAV, OGG' : 'Cualquier archivo'}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept={config.accept}
              className="hidden"
            />
          </div>
        )}

        {activeTab === 'url' && type !== "featured-image" && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="url"
                placeholder="https://ejemplo.com/archivo.jpg"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  !hasUrl ? 'border-gray-300 focus:ring-blue-500' :
                  isUrlValid ? 'border-green-500 focus:ring-green-500 bg-green-50' : 
                  'border-red-500 focus:ring-red-500 bg-red-50'
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
            
            {hasUrl && !isUrlValid && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} />
                URL no válida
              </p>
            )}

            <button
              onClick={handleUrlApply}
              disabled={!isUrlValid || !hasUrl}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Insertar desde URL
            </button>
          </div>
        )}

{       /* ✅ Contenido de la pestaña "Biblioteca de medios" */}
        {activeTab === 'library' && onOpenLibrary && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Library size={48} className="mx-auto text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Biblioteca de Medios
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Accede a todos los archivos multimedia ya subidos en tu sitio web
              </p>
              <button
                onClick={onOpenLibrary}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Abrir Biblioteca
              </button>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 text-center">
                Busca, filtra y selecciona archivos existentes
              </p>
            </div>
          </div>
        )}

        {activeTab === 'youtube' && type === 'video' && (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <Youtube size={32} className="mx-auto text-red-500 mb-2" />
              <p className="text-sm text-gray-600">Pega la URL del video de YouTube</p>
            </div>
            
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            
            <button
              onClick={handleYouTubeInsert}
              disabled={!youtubeUrl || !extractYouTubeId(youtubeUrl)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Insertar Video de YouTube
            </button>
          </div>
        )}
      </div>

      {/* Botones de acción (solo para imagen destacada o upload directo) */}
      {(type === "featured-image" || activeTab === 'upload') && (
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={16} className="inline mr-1" />
            Cancelar
          </button>
        </div>
      )}

      {/* Shortcuts */}
      <div className="text-xs text-gray-500 text-center">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> para cancelar
      </div>
    </div>
  );
};

export default MediaInputField;
