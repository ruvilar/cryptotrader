import { useState } from 'react';
import { supabaseServices } from '@/lib/supabaseServices';
import type { MediaFolder } from '../types/media.types';

// ✅ Hook personalizado para subir imágenes al Storage de la base de datos con validación de tipo y tamaño
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false); // Declara un estado booleano llamado uploading para indicar si hay una subida de imagen en curso. Permite mostrar feedback visual (spinners, desactivar botones, etc.) mientras se sube una imagen

  // ✅ Función asíncrona que recibe un archivo y un tipo de imagen, y gestiona todo el proceso de subida. Centraliza la lógica de validación, subida y obtención de la URL pública, facilitando su reutilización en cualquier componente
  const uploadImage = async (file: File, type: 'featured_image' | 'common_image' = 'featured_image') => {
    setUploading(true); // Indica que la subida ha comenzado
    
    try {
      // Valida el tipo de archivo (permitiendo solo imágenes JPG, PNG y WebP) 
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) { // Si el tipo de archivo no está en la lista de permitidos...
        throw new Error('Tipo de archivo no permitido. Usa JPG, PNG o WebP.'); // ...lanza un error
      }

      // ✅ Calcula el tamaño máximo permitido para la imagen (5MB) y lanza un error si el archivo excede ese límite
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) { // Si el tamaño del archivo es mayor que el tamaño máximo permitido...
        throw new Error('El archivo es demasiado grande. Máximo 5MB.'); // ...lanza un error
      }

      // Usa el nuevo servicio de medios (registra en BD automáticamente)
      const result = await supabaseServices.uploadMedia(file, {
        folder: type as MediaFolder,
        title: file.name
      });

      if (!result.success || !result.media) {
        return { url: null, error: result.error || 'Error al subir imagen' };
      }

      return { url: result.media.public_url, error: null };
    } catch (error: any) {
      return { url: null, error: error.message || "Error al subir imagen" };
    } finally {
      setUploading(false);
    }
  };

  // ✅ Función asíncrona que recibe la URL de una imagen y la elimina del Storage de la base de datos. Centraliza la lógica de borrado, facilitando su reutilización en cualquier componente
  const deleteImage = async (url: string) => {
    try {
      // Buscar el medio en la BD por URL
      const { items } = await supabaseServices.listMedia({ 
        page: 1, 
        pageSize: 1,
        filter: {} 
      });
      
      const mediaItem = items.find(m => m.publicUrl === url);
      
      if (mediaItem) {
        await supabaseServices.deleteMedia(mediaItem.id, true);
        return { success: true };
      }
      
      return { error: "Imagen no encontrada en la biblioteca" };
    } catch (error: any) {
      return { error: error.message || "Error al borrar imagen" };
    }
  };

  return { uploadImage, deleteImage, uploading };
};