/* Tipos y interfaces para el sistema de gestión de contenidos multimedia */

// ENUMS Y TIPOS BASE
export type MediaType = 'image' | 'video' | 'audio' | 'file';
export type MediaFolder = 'featured_image' | 'common_image' | 'videos' | 'documents' | 'audio';
export const MEDIA_TYPE_VALUES: MediaType[] = ['image', 'video', 'audio', 'file'];
export const MEDIA_FOLDER_VALUES: MediaFolder[] = ['featured_image', 'common_image', 'videos', 'documents', 'audio'];

// Tipos MIME permitidos por categoría
export const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
  file: ['application/pdf', 'application/zip', 'application/msword', 
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};

// Tamaños máximos por tipo (en bytes)
export const MAX_FILE_SIZES: Record<MediaType, number> = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 100 * 1024 * 1024,    // 100MB
  audio: 10 * 1024 * 1024,     // 10MB
  file: 20 * 1024 * 1024       // 20MB
};

// INTERFACES PRINCIPALES
/* MediaItem - Estructura tal como se almacena en la BD */
export interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  public_url: string;
  file_size: number;
  mime_type: string;
  media_type: MediaType;
  storage_bucket: string;
  folder?: MediaFolder;
  alt_text?: string;
  caption?: string;
  title?: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_deleted: boolean;
}

/* MediaFormData - Estructura para el formulario de edición */
export interface MediaFormData {
  id?: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  publicUrl: string;
  fileSize: number;
  mimeType: string;
  mediaType: MediaType;
  storageBucket: string;
  folder?: MediaFolder;
  altText?: string;
  caption?: string;
  title?: string;
  width?: number;
  height?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isDeleted?: boolean;
}

/* MediaSummary - Versión simplificada para listados */
export interface MediaSummary {
  id: string;
  filename: string;
  originalFilename: string;
  publicUrl: string;
  mediaType: MediaType;
  fileSize: number;
  mimeType: string;
  thumbnail?: string;
  createdAt: string;
}

/* MediaFilter - Filtros para búsquedas y listados */
export interface MediaFilter {
  mediaType?: MediaType;
  folder?: MediaFolder;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  minSize?: number;
  maxSize?: number;
  mimeType?: string;
}

/* MediaUploadOptions - Opciones al subir un archivo */
export interface MediaUploadOptions {
  folder?: MediaFolder;
  title?: string;
  altText?: string;
  caption?: string;
  mediaType?: MediaType;
}

/* MediaUploadResult - Resultado de la operación de subida */
export interface MediaUploadResult {
  success: boolean;
  media?: MediaItem;
  error?: string;
}

/* MediaStats - Estadísticas del sistema de medios */
export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  byType: Record<MediaType, number>;
  byFolder: Record<MediaFolder, number>;
  recentUploads: MediaSummary[];
}

/* MediaUsage - Información sobre dónde se usa un medio */
export interface MediaUsage {
  mediaId: string;
  usedIn: Array<{
    contentId: string;
    contentTitle: string;
    contentType: string;
    field: 'featured_image' | 'og_image' | 'twitter_image' | 'content';
  }>;
  totalReferences: number;
}

/* MediaValidation - Resultado de validación de archivo */
export interface MediaValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// TIPOS DE RESPUESTA
export interface MediaServiceResponse<T = any> {
  data: T | null;
  error: string | null;
}

export interface MediaListResponse {
  items: MediaSummary[];
  page: number;
  pageSize: number;
  total: number;
}

// TIPOS DE UTILIDAD
/* Tipo para la selección de medios en el MediaManager */
export interface MediaSelection {
  media: MediaItem;
  action: 'insert' | 'select' | 'replace';
}

/* Estado del uploader */
export interface UploadState {
  uploading: boolean;
  progress: number;
  filename: string;
  error?: string;
}

/* Configuración del MediaManager */
export interface MediaManagerConfig {
  allowMultipleSelection?: boolean;
  allowedTypes?: MediaType[];
  maxFileSize?: number;
  onSelect?: (media: MediaItem | MediaItem[]) => void;
  onClose?: () => void;
}