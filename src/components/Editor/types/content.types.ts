/* Tipos y interfaces para el sistema de gestión de contenidos */

export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled'; // Estado del contenido (borrador, publicado, archivado)
export type ContentTypeEnum = 'post' | 'page' | 'product'; // Tipo de contenido (post, página, producto)
export type MetaRobotsDirective = 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow'; // Opciones para la directiva robots de SEO

// Constantes para listas de valores permitidos, útiles para selects y validaciones
export const CONTENT_TYPE_VALUES: ContentTypeEnum[] = ['post', 'page', 'product'];
export const CONTENT_STATUS_VALUES: ContentStatus[] = ['draft', 'published', 'archived', 'scheduled'];

export type ContentSemanticType =
  | "article"
  | "blogpost"
  | "news"
  | "webpage"
  | "guide"
  | "review"
  | "technical";

export const CONTENT_SEMANTIC_TYPE_VALUES: ContentSemanticType[] = [
  "article",
  "blogpost",
  "news",
  "webpage",
  "guide",
  "review",
  "technical",
];

// ContentFormData: Estructura para el formulario del editor de contenidos
export interface ContentFormData {
  id?: string;
  title: string;
  slug: string;
  category?: string;
  category_id?: string;
  type: ContentTypeEnum;
  status: ContentStatus;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  featuredImage?: string;
  customCss?: string;
  contentType?: ContentSemanticType;
  authorName?: string;
  readingTime?: number;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  isDeleted?: boolean;
}

// ContentItem: Representa un ítem de contenido tal como se almacena en la base de datos. Incluye campos de sistema (created_at, updated_at, updated_by). Incluye campos SEO y metadatos. Puede tener un campo content_json para almacenar el contenido estructurado
export interface ContentItem {
  id?: string;
  title: string;
  slug: string;
  category?: string;
  type: ContentTypeEnum;
  status: ContentStatus;
  content: string;
  featured_image?: string;
  custom_css?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  meta_robots?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  content_type?: ContentSemanticType;
  author_name?: string;
  content_json?: any;
  word_count?: number;
  reading_time?: number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  updated_by?: string;
  published_at?: string;
  views: number;
}

// ContentMetrics: Métricas calculadas del contenido (palabras, tiempo de lectura, caracteres, párrafos)
export interface ContentMetrics {
  wordCount: number;
  readingTime: number;
  characterCount: number;
  paragraphs: number;
}

// ContentValidation: Resultado de la validación del contenido (si es válido, problemas y advertencias)
export interface ContentValidation {
  isValid: boolean;
  issues: string[];
  warnings?: string[];
}

// ContentFilter: Filtros para búsquedas/listados de contenido
export interface ContentFilter {
  type?: ContentTypeEnum;
  status?: ContentStatus;
  category?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// ContentListItem: Estructura simplificada para mostrar ítems en listados
export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  type: ContentTypeEnum;
  status: ContentStatus;
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  word_count: number;
  reading_time: number;
  category_id?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  featured_image?: string;
  is_deleted?: boolean;
}

// Tipo de utilidad para convertir nombres de BD a formulario
export type ContentItemToForm = {
  [K in keyof ContentItem as K extends `${infer P}_${infer S}`
    ? `${P}${Capitalize<S>}`
    : K]: ContentItem[K];
};

// Helper para campos calculados del contenido
export interface ContentCalculatedFields {
  wordCount?: number;
  readingTime?: number;
  characterCount?: number;
  paragraphCount?: number;
}

// ProcessedSEOData: Estructura para datos SEO procesados antes de guardar o mostrar
export interface ProcessedSEOData {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  metaRobots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

// Respuesta genérica de operaciones (usado en services)
export interface ServiceResponse<T = any> {
  data: T | null;
  error: Error | string | null;
}

// Respuesta con múltiples items
export interface ServiceListResponse<T = any> {
  data: T[] | null;
  error: Error | string | null;
  count?: number;
  page?: number;
  pageSize?: number;
}

export type CreateContentInput = Pick<ContentItem, "id" | "title" | "slug"> & 
  Partial<Omit<ContentItem, "created_at" | "updated_at">>;

export type UpdateContentInput = Partial<Omit<ContentItem, "id" | "created_at">>;
