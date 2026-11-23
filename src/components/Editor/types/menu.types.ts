/* Tipos e interfaces para el sistema de gestión de menús */

// Tipos de menú según su grupo
export type MenuGroupType = "main" | "footer" | "sidebar" | "custom";

// Constantes para grupos de menú
export const MENU_GROUP_VALUES: MenuGroupType[] = ["main", "footer", "sidebar", "custom"];

// Labels legibles para los grupos de menú
export const MENU_GROUP_LABELS: Record<MenuGroupType, string> = {
  main: "Menú Principal",
  footer: "Menú Footer",
  sidebar: "Menú Lateral",
  custom: "Menú Personalizado",
};

// Límites y restricciones para menús
export const MENU_CONSTRAINTS = {
  MAX_TITLE_LENGTH: 100,
  MAX_URL_LENGTH: 500,
  MAX_DEPTH: 3,
  MAX_CHILDREN: 20,
  MIN_SORT_ORDER: 0,
  MAX_SORT_ORDER: 9999,
} as const;

export interface MenuItem {
  id?: string;
  parent_id?: string | null;
  // Clasificación
  menu_group?: "main" | "footer" | "sidebar" | "custom";
  // Contenido
  title: string;
  // Enlaces
  url?: string | null;
  // Presentación
  icon?: string | null;
  // Estado
  is_active?: boolean;
  sort_order?: number;
  // Timestamps
  created_at?: string;
  updated_at?: string;
  // Jerarquía
  type?: "custom" | "category" | "internal" | "external";
  target?: "_self" | "_blank" | "_parent" | "_top";
  children?: MenuItem[];
}

// Tipo para operaciones de menú (usado en hooks)
export interface MenuOperation {
  type: "create" | "update" | "delete" | "reorder";
  itemId?: string;
  changes?: Partial<MenuItem>;
}

// Estado de carga para operaciones de menú
export interface MenuLoadingState {
  isLoading: boolean;
  operation?: "loading" | "creating" | "updating" | "deleting" | "reordering" | "syncing";
  itemId?: string;
}

// Resultado de operaciones de menú
export interface MenuOperationResult {
  data: MenuItem | MenuItem[] | boolean | null;
  error: Error | string | null;
}

// Resultado de sincronización con categorías
export interface MenuSyncResult {
  added: number;
  updated: number;
  error?: string | null;
}

// Validación de estructura de menú
export interface MenuValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Filtros para búsqueda de menús
export interface MenuFilter {
  menuGroup?: MenuGroupType;
  isActive?: boolean;
  hasParent?: boolean;
  searchTerm?: string;
}

// Opciones para exportar menús
export interface MenuExportOptions {
  includeInactive?: boolean;
  menuGroup?: MenuGroupType;
  formatIndented?: boolean;
}

// Opciones para importar menús
export interface MenuImportOptions {
  replaceExisting?: boolean;
  validateStructure?: boolean;
  menuGroup?: MenuGroupType;
}

// Tipo para drag & drop
export interface MenuDragResult {
  itemId: string;
  sourceIndex: number;
  destinationIndex: number;
  newParentId?: string | null;
}

// Tipo para representar un ítem de menú con información de profundidad
export interface MenuTreeItem extends MenuItem {
  depth: number;
  hasChildren: boolean;
  isExpanded?: boolean;
}