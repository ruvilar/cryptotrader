import { useState, useCallback } from "react";
import { useContentService } from "../lib/contentService";
import type { ContentItem, ContentFormData, ProcessedSEOData, ContentMetrics } from "../types/content.types";
import { ContTrans } from "../utils/contentTransformers";

/**
 * Hook para manejar operaciones CRUD sobre los contenidos publicados
 */
export const useContentOperations = (
  showNotification: (msg: string, type?: string) => void
) => {
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // ✅ NUEVO: Obtener el servicio del contexto
  const contentService = useContentService();

  /**
   * Función para cargar la lista de contenidos no eliminados, ordenados por fecha de actualización
   */
  const loadContentList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      // ✅ Hacer dos llamadas: una para activos y otra para eliminados
      const [activeResult, deletedResult] = await Promise.all([
        // Posts activos (is_deleted = false o null)
        contentService.listContent({ 
          page: 1, 
          pageSize: 1000
        }),
        // Posts eliminados (is_deleted = true) - usando includeDeleted
        contentService.listContent({ 
          page: 1, 
          pageSize: 1000,
          includeDeleted: true 
        } as any)
      ]);
  
      const activeItems = (activeResult.items || []).map((item: any) => ({
        ...item,
        is_deleted: false // Asegurar que los activos tengan is_deleted = false
      }));
  
      const deletedItems = (deletedResult.items || [])
        .filter((item: any) => item.is_deleted === true) // Solo los que realmente están eliminados
        .map((item: any) => ({
          ...item,
          is_deleted: true
        }));
  
      // Combinar ambas listas sin duplicados
      const allContent = [...activeItems, ...deletedItems];
  
      setContentList(allContent);
    } catch (error: any) {
      showNotification("❌ Error cargando publicaciones", "error");
      setContentList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [contentService, showNotification]);

  /**
   * Función para eliminar un contenido específico y recargar la lista
   */
  const deleteContent = useCallback(async (contentId: string, permanent: boolean = false) => {
    try {
      if (permanent) {
        await contentService.deleteContent(contentId);
        showNotification("Contenido eliminado permanentemente", "success");
      } else {
        // Soft delete: marcar como eliminado sin borrar de la BD
        const content = await contentService.getContentById(contentId);
        if (!content) {
          showNotification("❌ Contenido no encontrado", "error");
          return;
        }
        await contentService.upsertContent({
          ...content,
          is_deleted: true,
        } as any);
        showNotification("Contenido movido a la papelera", "success");
      }
  
      await loadContentList();
    } catch (error: any) {
      showNotification("Error al eliminar", "error");
    }
  }, [contentService, showNotification, loadContentList]);

  /**
   * Función para guardar un nuevo contenido o actualizar uno existente
   */
  const saveContent = useCallback(async (
    formData: ContentFormData,
    html: string,
    seo: ProcessedSEOData,
    metrics: ContentMetrics,
    editingContent: ContentItem | null,
    contentJson?: any
  ) => {
    setIsLoading(true);

    try {
      // Transforma los datos del formulario en el payload para la BD
      const payload = ContTrans.transformFormDataToPayload(
        formData,
        html,
        seo,
        metrics,
        contentJson
      );

      // Determina si es edición basándose en múltiples fuentes
      const contentId = editingContent?.id || formData.id;
      const isEditing = !!contentId;

      let data, error;

      // ✅ CAMBIO: Usa el servicio unificado (upsert)
      try {
        if (isEditing) {
          // Para edición: el payload ya debería tener el id desde transformFormDataToPayload
          // Si no lo tiene, lo agregamos explícitamente
          const updatePayload = {
            ...payload,
            ...(contentId && { id: contentId })
          } as any; // Cast a any para evitar errores de tipo estricto
      
          data = await contentService.upsertContent(updatePayload);
          error = null;
        } else {
          // Para creación: agregamos created_at
          const createPayload = {
            ...payload,
            created_at: new Date().toISOString()
          } as any; // Cast a any para evitar errores de tipo estricto
      
          data = await contentService.upsertContent(createPayload);
          error = null;
        }
      } catch (err: any) {
        error = err;
        data = null;
      }

      setIsLoading(false);
      return { data, error };
    } catch (err: any) {
      setIsLoading(false);
      return { data: null, error: err };
    }
  }, [contentService]);

  /**
   * Marca un contenido como eliminado (lo envía a la papelera) sin borrarlo realmente
   * 
   * ⚠️ NOTA: Esta función necesita que ContentService tenga un método para soft delete.
   * Por ahora, simplemente actualiza is_deleted a true.
   */
  const softDeleteContent = useCallback(async (id: string) => {
    try {
      // ⚠️ LIMITACIÓN: ContentService no tiene método explícito para soft delete
      // Necesitarías agregarlo a la interfaz o usar deleteContent
      
      // Workaround temporal: obtener el contenido y hacer upsert
      const content = await contentService.getContentById(id);
      if (!content) {
        showNotification("❌ Contenido no encontrado", "error");
        return;
      }

      // Actualizar con is_deleted: true
      await contentService.upsertContent({
        ...content,
        is_deleted: true,
        deleted_at: new Date().toISOString()
      } as any);

      showNotification("🔥 Publicación enviada a la papelera.", "success");

      // Actualiza el estado local
      setContentList(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_deleted: true } : item
        )
      );
    } catch (err) {
      showNotification("Error al enviar a la papelera.", "error");
    }
  }, [contentService, showNotification]);

  /**
   * Función para restaurar un contenido que estaba en la papelera
   */
  const restoreContent = useCallback(async (contentId: string) => {
    try {
      // Obtener el contenido
      const content = await contentService.getContentById(contentId);
      if (!content) {
        showNotification("Error al restaurar publicación", "error");
        return;
      }

      // Actualizar con is_deleted: false
      await contentService.upsertContent({
        ...content,
        is_deleted: false,
        deleted_at: null
      } as any);

      showNotification("♻️ Publicación restaurada.", "success");
      await loadContentList();
    } catch (err) {
      showNotification("Error al restaurar publicación", "error");
    }
  }, [contentService, showNotification, loadContentList]);

  /**
   * Devuelve los métodos y estados principales para gestión de contenidos
   */
  return {
    contentList,
    isLoading,
    isLoadingList,
    loadContentList,
    deleteContent,
    softDeleteContent,
    restoreContent,
    saveContent,
    setContentList,
  };
};
