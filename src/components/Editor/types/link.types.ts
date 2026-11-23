import type { ServiceResponse, ServiceListResponse } from "./content.types";
export type { ServiceResponse, ServiceListResponse };

/* Tipos e interfaces para el sistema de gestión de enlaces personalizados y redirecciones */

// Tipos de enlaces permitidos en el sistema
export type LinkType = 'external' | 'internal' | 'social' | 'commercial';

// Tipos de redirección HTTP estándar
export type RedirectType = '301' | '302';

// Estado de validación de enlaces
export type LinkStatus = 'active' | 'broken' | 'pending' | 'disabled';

// Constantes para valores permitidos, útiles para selects y validaciones
export const LINK_TYPE_VALUES: LinkType[] = ['external', 'internal', 'social', 'commercial'];
export const REDIRECT_TYPE_VALUES: RedirectType[] = ['301', '302'];
export const LINK_STATUS_VALUES: LinkStatus[] = ['active', 'broken', 'pending', 'disabled'];

// Etiquetas legibles para los tipos de enlaces
export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  external: 'Externo',
  internal: 'Interno',
  social: 'Red Social',
  commercial: 'Comercial',
};

// Etiquetas legibles para los tipos de redirección
export const REDIRECT_TYPE_LABELS: Record<RedirectType, string> = {
  '301': '301 - Permanente',
  '302': '302 - Temporal',
};

// Límites y restricciones para enlaces
export const LINK_CONSTRAINTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_URL_LENGTH: 2000,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_SORT_ORDER: 0,
  MAX_SORT_ORDER: 9999,
} as const;

// Link: Interfaz unificada para enlaces y redirecciones
export interface Link {
  id?: string;
  // Información básica
  title?: string;
  description?: string;
  // URLs
  url: string;
  target_url?: string;
  // Clasificación
  type: 'link' | 'redirect';
  link_type?: LinkType;
  redirect_type?: RedirectType;
  // Estado
  is_active?: boolean;
  sort_order?: number;
  // Métricas
  hits?: number;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// LinkValidation: Resultado de la validación de un enlace
export interface LinkValidation {
  isValid: boolean;
  status: LinkStatus;
  statusCode?: number;
  error?: string;
  checkedAt?: string;
}

// LinkAnalytics: Estadísticas de uso de enlaces
export interface LinkAnalytics {
  linkId: string;
  clicks?: number;
  lastUsed?: string;
  usageCount?: number;
}

// BrokenLink: Estructura para reportar enlaces rotos
export interface BrokenLink {
  id: string;
  title: string;
  url: string;
  error: string;
  foundIn: string[];
  lastChecked: string;
}

// Operación sobre enlaces
export interface LinkOperation {
  type: 'create' | 'update' | 'delete' | 'validate' | 'reorder';
  itemId?: string;
  changes?: Partial<Link>;
  recordType?: 'link' | 'redirect';
}

// Estado de carga para operaciones de enlaces
export interface LinkLoadingState {
  isLoading: boolean;
  operation?: 'loading' | 'creating' | 'updating' | 'deleting' | 'validating';
  itemId?: string;
}

// Resultado de operaciones sobre enlaces
export interface LinkOperationResult {
  data: Link | Link[] | boolean | null;
  error: Error | string | null;
}

// Filtros para búsqueda de enlaces
export interface LinkFilter {
  linkType?: LinkType;
  isActive?: boolean;
  status?: LinkStatus;
  searchTerm?: string;
}

// Filtros para búsqueda de redirecciones
export interface RedirectFilter {
  redirectType?: RedirectType;
  isActive?: boolean;
  searchTerm?: string;
}

// Opciones para validación masiva de enlaces
export interface LinkValidationOptions {
  checkExternal?: boolean;
  checkInternal?: boolean;
  timeout?: number;
  maxConcurrent?: number;
}

// Resultado de validación masiva
export interface LinkValidationReport {
  total: number;
  valid: number;
  broken: number;
  pending: number;
  brokenLinks: BrokenLink[];
  checkedAt: string;
}

// Opciones para exportar enlaces
export interface LinkExportOptions {
  includeInactive?: boolean;
  linkType?: LinkType;
  format?: 'json' | 'csv';
}

// Opciones para importar enlaces
export interface LinkImportOptions {
  replaceExisting?: boolean;
  validateUrls?: boolean;
}