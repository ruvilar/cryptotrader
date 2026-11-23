import React, { createContext, useContext } from "react";
import type {
  MediaItem,
  MediaSummary,
  MediaFilter,
  MediaUploadOptions,
  MediaUploadResult,
  MediaStats,
  MediaUsage
} from "../types/media.types";

// INTERFAZ ABSTRACTA
export interface MediaService {
  /* Lista todos los medios con filtros y paginación */
  listMedia(params?: {
    page?: number;
    pageSize?: number;
    filter?: MediaFilter;
  }): Promise<{
    items: MediaSummary[];
    page: number;
    pageSize: number;
    total: number;
  }>;

  /* Obtiene un medio por su ID */
  getMediaById(id: string): Promise<MediaItem | null>;

  /* Sube un archivo y guarda sus metadatos */
  uploadMedia(file: File, options?: MediaUploadOptions): Promise<MediaUploadResult>;

  /* Actualiza los metadatos de un medio existente */
  updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem>;

  /* Elimina un medio por su ID */
  deleteMedia(id: string, hardDelete?: boolean): Promise<void>;

  /* Busca medios por término de búsqueda */
  searchMedia(searchTerm: string): Promise<MediaSummary[]>;

  /* Obtiene estadísticas generales sobre los medios */
  getMediaStats(): Promise<MediaStats>;

  /* Obtiene el uso de un medio específico */
  getMediaUsage(mediaId: string): Promise<MediaUsage>;
}

// CONTEXTO E INYECCIÓN
const MediaServiceContext = createContext<MediaService | null>(null);

/* Hook para obtener el servicio de medios inyectado */
export function useMediaService(): MediaService {
  const ctx = useContext(MediaServiceContext);
  if (!ctx) {
    throw new Error("MediaService no está disponible. Envuelve con MediaServiceProvider.");
  }
  return ctx;
}

/* Provider para inyectar la implementación del servicio */
type ProviderProps = {
  service: MediaService;
  children: React.ReactNode;
};

export function MediaServiceProvider({ service, children }: ProviderProps) {
  return React.createElement(MediaServiceContext.Provider, { value: service, children });
}