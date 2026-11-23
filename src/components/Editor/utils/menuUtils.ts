import { MenuItem } from "../types/menu.types";
import { MenuService } from "../lib/menuService";

/**
 * Construye un árbol jerárquico de menús basado en parent_id
 * @param items - Array plano de items de menú
 * @returns Array de items con estructura jerárquica (children)
 */
export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const map = new Map<string, MenuItem & { children: MenuItem[] }>();
  const roots: MenuItem[] = [];

  // Crear mapa con todos los items
  items.forEach((item) => {
    if (item.id) {
      map.set(item.id, { ...item, children: [] });
    }
  });

  // Construir jerarquía
  map.forEach((item) => {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children.push(item);
    } else {
      roots.push(item);
    }
  });

  return roots;
}

/**
 * Aplana un árbol de menús jerárquico a un array plano
 * @param items - Array de menús jerárquicos con children
 * @param parentId - ID del padre (usado en importación, opcional)
 * @param assignSortOrder - Si debe asignar sort_order basado en la posición
 * @returns Array plano de menús sin children
 */
export function flattenMenuTree(
  items: MenuItem[],
  parentId: string | null = null,
  resetOrder: boolean = false
): MenuItem[] {
  let result: MenuItem[] = [];
  
  items.forEach((item, index) => {
    // Crea una copia del item actual
    const flatItem: MenuItem = {
      id: item.id,
      title: item.title,
      url: item.url,
      icon: item.icon,
      menu_group: item.menu_group,
      is_active: item.is_active,
      parent_id: parentId || item.parent_id,
      sort_order: resetOrder ? index : (item.sort_order ?? index),
    };
    
    result.push(flatItem);
    
    // Recursivamente aplanar hijos
    if (item.children && item.children.length > 0) {
      const flatChildren = flattenMenuTree(item.children, item.id!, resetOrder);
      result = result.concat(flatChildren);
    }
  });
  
  return result;
}

/* Dispara evento global de actualización de menús */
export function dispatchMenuUpdate() {
  window.dispatchEvent(new CustomEvent("menus-updated"));
}

/* Exporta la estructura de menús a un archivo JSON descargable */
export function exportMenusToJSON(menus: MenuItem[]) {
  const structuredMenus = buildMenuTree(menus);
  const jsonString = JSON.stringify(structuredMenus, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `menus-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Importa estructura de menús desde un archivo JSON */
export async function importMenusFromJSON(file: File, menuService: MenuService) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);

    if (!Array.isArray(json)) {
      throw new Error("El archivo no contiene un arreglo válido de menús.");
    }

    // Aplana jerarquía recursiva (menú principal + submenús)
    const flatMenus = flattenMenuTree(json, null, true);

    // Reemplazar estructura existente en Supabase
    const { error: deleteError } = await menuService.deleteAllMenus();
    if (deleteError) throw new Error(deleteError);
    
    for (const item of flatMenus) {
      const { error: insertError } = await menuService.createMenuItem(item);
      if (insertError) throw new Error(insertError);
    }
    dispatchMenuUpdate();
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}