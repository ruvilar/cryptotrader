import { useState, useCallback, useEffect } from 'react';
import { useMediaService } from '../lib/mediaService';
import type {
  MediaItem,
  MediaSummary,
  MediaFilter,
  MediaUploadOptions,
  MediaStats,
  MediaUsage
} from '@/components/Editor/types/media.types';

interface UseMediaOperationsReturn {
  // Estado
  media: MediaSummary[];
  selectedMedia: MediaItem | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  filters: MediaFilter;
  stats: MediaStats | null;
  
  // Paginación
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  
  // Acciones de carga
  loadMedia: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshMedia: () => Promise<void>;
  
  // Acciones de archivos
  uploadFile: (file: File, options?: MediaUploadOptions) => Promise<MediaItem | null>;
  uploadMultipleFiles: (files: File[], options?: MediaUploadOptions) => Promise<MediaItem[]>;
  deleteMedia: (id: string, hardDelete?: boolean) => Promise<void>;
  
  // Acciones de metadatos
  updateMediaMetadata: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  
  // Acciones de búsqueda y filtros
  searchMedia: (term: string) => Promise<void>;
  applyFilters: (newFilters: MediaFilter) => Promise<void>;
  clearFilters: () => Promise<void>;
  
  // Acciones de selección
  selectMedia: (mediaId: string) => Promise<void>;
  clearSelection: () => void;
  
  // Acciones de estadísticas
  loadStats: () => Promise<void>;
  getMediaUsage: (mediaId: string) => Promise<MediaUsage | null>;
  
  // Utilidades
  copyUrlToClipboard: (url: string) => Promise<boolean>;
  downloadMedia: (media: MediaItem) => void;
}

export const useMediaOperations = (): UseMediaOperationsReturn => {
  // ===========================
  // ESTADO
  // ===========================
  
  const [media, setMedia] = useState<MediaSummary[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MediaFilter>({});
  const [stats, setStats] = useState<MediaStats | null>(null);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const hasMore = media.length < total;
  const mediaService = useMediaService();

  // ===========================
  // ACCIONES DE CARGA
  // ===========================

  /**
   * Carga la lista de medios según filtros y paginación actual
   */
  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mediaService.listMedia({
        page,
        pageSize,
        filter: filters
      });
      
      setMedia(result.items);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Error al cargar medios');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  /**
   * Carga más medios (paginación infinita)
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const nextPage = page + 1;
      const result = await mediaService.listMedia({
        page: nextPage,
        pageSize,
        filter: filters
      });
      
      setMedia(prev => [...prev, ...result.items]);
      setPage(nextPage);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Error al cargar más medios');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, loading, hasMore]);

  /**
   * Recarga la lista de medios desde el principio
   */
  const refreshMedia = useCallback(async () => {
    setPage(1);
    setMedia([]);
    await loadMedia();
  }, [loadMedia]);

  // ===========================
  // ACCIONES DE ARCHIVOS
  // ===========================

  /**
   * Sube un archivo
   */
  const uploadFile = useCallback(async (
    file: File, 
    options?: MediaUploadOptions
  ): Promise<MediaItem | null> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await mediaService.uploadMedia(file, options);
      
      if (!result.success || !result.media) {
        throw new Error(result.error || 'Error al subir archivo');
      }
      
      // Recargar lista para mostrar el nuevo archivo
      await refreshMedia();
      
      return result.media;
    } catch (err: any) {
      setError(err.message || 'Error al subir archivo');
      return null;
    } finally {
      setUploading(false);
    }
  }, [refreshMedia]);

  /**
   * Sube múltiples archivos
   */
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options?: MediaUploadOptions
  ): Promise<MediaItem[]> => {
    setUploading(true);
    setError(null);
    
    const uploadedMedia: MediaItem[] = [];
    const errors: string[] = [];
    
    try {
      for (const file of files) {
        try {
          const result = await mediaService.uploadMedia(file, options);
          if (result.success && result.media) {
            uploadedMedia.push(result.media);
          } else {
            errors.push(`${file.name}: ${result.error}`);
          }
        } catch (err: any) {
          errors.push(`${file.name}: ${err.message}`);
        }
      }
      
      if (errors.length > 0) {
        setError(`Algunos archivos no se pudieron subir: ${errors.join(', ')}`);
      }
      
      // Recargar lista
      await refreshMedia();
      
      return uploadedMedia;
    } catch (err: any) {
      setError(err.message || 'Error al subir archivos');
      return uploadedMedia;
    } finally {
      setUploading(false);
    }
  }, [refreshMedia]);

  /**
   * Elimina un medio
   */
  const deleteMedia = useCallback(async (id: string, hardDelete: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      await mediaService.deleteMedia(id, hardDelete);
      
      // Actualizar lista local
      setMedia(prev => prev.filter(m => m.id !== id));
      
      // Si el medio eliminado estaba seleccionado, limpiar selección
      if (selectedMedia?.id === id) {
        setSelectedMedia(null);
      }
      
      // Actualizar total
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar medio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedMedia, mediaService]);

  // ===========================
  // ACCIONES DE METADATOS
  // ===========================

  /**
   * Actualiza los metadatos de un medio
   */
  const updateMediaMetadata = useCallback(async (
    id: string,
    updates: Partial<MediaItem>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedMedia = await mediaService.updateMedia(id, updates);
      
      // Actualizar en la lista local
      setMedia(prev => prev.map(m => 
        m.id === id 
          ? { ...m, ...updates } as MediaSummary
          : m
      ));
      
      // Si es el medio seleccionado, actualizarlo también
      if (selectedMedia?.id === id) {
        setSelectedMedia(updatedMedia);
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar medio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedMedia]);

  // ===========================
  // ACCIONES DE BÚSQUEDA Y FILTROS
  // ===========================

  /**
   * Busca medios por término
   */
  const searchMedia = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!term.trim()) {
        // Si el término está vacío, recargar todos los medios
        await refreshMedia();
        return;
      }
      
      const results = await mediaService.searchMedia(term);
      setMedia(results);
      setTotal(results.length);
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Error al buscar medios');
    } finally {
      setLoading(false);
    }
  }, [refreshMedia]);

  /**
   * Aplica filtros y recarga la lista
   */
  const applyFilters = useCallback(async (newFilters: MediaFilter) => {
    setFilters(newFilters);
    setPage(1);
    setMedia([]);
  }, []);

  /**
   * Limpia todos los filtros
   */
  const clearFilters = useCallback(async () => {
    setFilters({});
    setPage(1);
    setMedia([]);
  }, []);

  // ===========================
  // ACCIONES DE SELECCIÓN
  // ===========================

  /**
   * Selecciona un medio por ID y carga sus detalles completos
   */
  const selectMedia = useCallback(async (mediaId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const media = await mediaService.getMediaById(mediaId);
      setSelectedMedia(media);
    } catch (err: any) {
      setError(err.message || 'Error al cargar detalles del medio');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpia la selección actual
   */
  const clearSelection = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  // ===========================
  // ACCIONES DE ESTADÍSTICAS
  // ===========================

  /**
   * Carga estadísticas del sistema de medios
   */
  const loadStats = useCallback(async () => {
    try {
      const mediaStats = await mediaService.getMediaStats();
      setStats(mediaStats);
    } catch (err: any) {
      setError(err.message + 'Error cargando estadísticas:');
    }
  }, []);

  /**
   * Obtiene información sobre dónde se usa un medio
   */
  const getMediaUsage = useCallback(async (mediaId: string): Promise<MediaUsage | null> => {
    try {
      return await mediaService.getMediaUsage(mediaId);
    } catch (err: any) {
      setError(err.message + 'Error obteniendo uso del medio:');
      return null;
    }
  }, []);

  // ===========================
  // UTILIDADES
  // ===========================

  /**
   * Copia la URL de un medio al portapapeles
   */
  const copyUrlToClipboard = useCallback(async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      setError(err.message + 'Error al copiar la URL al portapapeles');
      return false;
    }
  }, []);

  /**
   * Descarga un medio
   */
  const downloadMedia = useCallback((media: MediaItem) => {
    const link = document.createElement('a');
    link.href = media.public_url;
    link.download = media.original_filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // ===========================
  // EFECTOS
  // ===========================

  // Cargar medios cuando cambian los filtros o la página
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // ===========================
  // RETORNO
  // ===========================

  return {
    // Estado
    media,
    selectedMedia,
    loading,
    uploading,
    error,
    filters,
    stats,
    
    // Paginación
    page,
    pageSize,
    total,
    hasMore,
    
    // Acciones
    loadMedia,
    loadMore,
    refreshMedia,
    uploadFile,
    uploadMultipleFiles,
    deleteMedia,
    updateMediaMetadata,
    searchMedia,
    applyFilters,
    clearFilters,
    selectMedia,
    clearSelection,
    loadStats,
    getMediaUsage,
    copyUrlToClipboard,
    downloadMedia
  };
};