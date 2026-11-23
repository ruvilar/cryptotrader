import { Editor } from '@tiptap/react';

// Definen los posibles valores para el tipo de medio (MediaType) y la pestaña activa (ActiveTab). Permiten tipar correctamente las props y parámetros, evitando errores y mejorando el autocompletado
export type MediaType = "image" | "video" | "audio" | "file" | "featured-image";
export type ActiveTab = 'media' | 'link' | 'youtube';

// ✅ Función para insertar distintos tipos de medios (imagen, video, audio, archivo, enlace) en el editor TipTap. Recibe el editor, la fuente (archivo o URL), el tipo de medio y la pestaña activa
export function insertMedia(
  editor: Editor, // Instancia del editor TipTap donde se insertará el contenido
  source: File | string, // Fuente del medio, puede ser un archivo (subido por el usuario) o una URL/DataURL
  mediaType: MediaType, // Tipo de medio a insertar (imagen, video, audio, archivo, imagen destacada)
  activeTab?: ActiveTab, // Pestaña activa en el UI del editor, útil para decidir si se inserta un enlace
  options?: { filename?: string } // Opciones adicionales, como el nombre del archivo para enlaces de descarga
) {
  if (!editor) return; // Previene errores si el editor no está inicializado. Si no existe, la función termina aquí

  // Si la fuente es un archivo (por ejemplo, una imagen subida), se debe convertir a un formato que el editor pueda manejar (DataURL)
  if (source instanceof File) {
    const reader = new FileReader(); // Si el usuario sube un archivo, lo convierte a DataURL (base64) usando FileReader
    reader.onload = (event) => { // Cuando termina de leer el archivo, obtiene el resultado (DataURL)
      const fileDataUrl = event.target?.result as string; // Convierte el archivo leído por el FileReader en una cadena de texto (DataURL), que luego se usará como fuente (src) para insertar el medio en el editor. Así, el editor puede manejar archivos subidos como si fueran URLs
      insertMedia(editor, fileDataUrl, mediaType, activeTab); // Una vez convertido, vuelve a llamar a insertMedia con la URL generada
    };
    reader.readAsDataURL(source); //  Así, el editor siempre recibe una URL, nunca un objeto File
    return; // Sale de la función para evitar que siga ejecutando el resto del código
  }

  // ✅ Si es string (URL/DataURL) o ya se ha convertido a DataURL, procede a insertar el medio según su tipo
  switch (mediaType) {
    // Si es imagen, usa el comando setImage del editor TipTap para insertar la imagen en la posición actual del cursor
    case 'image':
      editor.chain().focus().setImage({ src: source }).run(); // Inserta una imagen en el editor usando la URL o DataURL proporcionada. El método chain().focus() asegura que el editor esté activo antes de insertar la imagen
      break;
    // Si es video, puede ser un video de YouTube (incrustado con iframe) o un video estándar (elemento <video>)
    case 'video':
      const youtubeId = extractYouTubeId(source);
      if (youtubeId) {
        editor.commands.insertContent(
          `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
            <iframe 
              src="https://www.youtube.com/embed/${youtubeId}" 
              frameborder="0" 
              allowfullscreen="true"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            ></iframe>
          </div>`
        );
      } else {
        editor.commands.insertContent(
          `<video controls style="max-width: 100%; height: auto; margin: 1rem 0;">
             <source src="${source}" type="video/mp4">
           </video>`
        );
      }
      break;
    // Si es audio, inserta un reproductor de audio HTML5 con controles
    case 'audio':
      editor.chain().focus().insertContent(
        `<audio controls style="width: 100%;">
           <source src="${source}">
           Tu navegador no soporta el elemento audio.
         </audio>`
      ).run();
      break;
    // Si es archivo, inserta un enlace de descarga con estilos Tailwind, mostrando un icono y texto descriptivo
    case 'file':
      editor.chain().focus().insertContent(
        `<a href="${source}" download class="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">
          📄 ${options?.filename || 'Descargar archivo'}
        </a>`
      ).run();
      break;
    // Si es imagen, la inserta como imagen destacada pero la trata igual que una imagen normal
    case 'featured-image':
      editor.chain().focus().setImage({ src: source }).run();
      break;
    // Si el tipo no coincide con ninguno de los anteriores y la pestaña activa es 'link', inserta un enlace usando la URL
    default:
      // Si es enlace (solo si el tab activo es 'link')
      if (activeTab === 'link') {
        editor.chain().focus().setLink({ href: source }).run();
      }
      break;
  }
}

// ✅ Aplica un enlace a la selección actual del editor. Usa el rango de selección para asegurarse de que el enlace se aplique correctamente
export function applyLink(editor: any, url: string, range: any) {
  if (url.trim() && range) { // Verifica que la URL no esté vacía (quitando espacios) y que exista un rango de selección válido
    editor.view.dispatch(editor.view.state.tr.setSelection(range)); // Cambia la selección actual del editor al rango indicado. Esto asegura que el enlace se aplique exactamente donde el usuario lo espera
    editor.view.focus(); // Da foco al editor para que el usuario vea el cambio inmediatamente
    editor.chain().focus().setLink({ href: url.trim() }).run(); // Utiliza la API encadenada de TipTap para aplicar el enlace a la selección. chain().focus() asegura que el editor esté activo. setLink({ href: url.trim() }) aplica el enlace y run() ejecuta la acción
  }
}

// Extrae el ID de un video de YouTube desde una URL. Devuelve el ID si es válido, o null si no lo es
export function extractYouTubeId(url: string): string | null {
  // Define una expresión regular que busca los patrones más comunes de URLs de YouTube:
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/; // Esto permite soportar enlaces cortos, largos, incrustados y variantes
  const match = url.match(regExp); // Aplica la expresión regular a la URL recibida. Si hay coincidencia, match[2] contendrá el posible ID del video
  return (match && match[2].length === 11) ? match[2] : null; // Verifica que haya coincidencia y que el ID tenga exactamente 11 caracteres (longitud estándar de IDs de YouTube). Si es válido, lo devuelve el ID; si no, devuelve null
}