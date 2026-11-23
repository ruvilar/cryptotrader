import React, { createContext, useContext } from "react";
import type { MenuItem } from "../types/menu.types";

// ===========================
// CONSTANTES REUTILIZABLES
// ===========================

export const DEFAULT_MENU_GROUP = "main";
export const DEFAULT_TARGET = "_self";
export const DEFAULT_SORT_ORDER = 0;
export const DEFAULT_IS_ACTIVE = true;

// ===========================
// TIPOS DE RESPUESTA
// ===========================

export interface MenuServiceResponse<T> {
  data: T | null;
  error: any;
}

export interface SyncResult {
  added: number;
  updated: number;
  error: any;
}

// ===========================
// INTERFAZ ABSTRACTA
// ===========================

export interface MenuService {
  /* Obtiene todos los elementos del menú por grupo */
  getMenus(menu_group?: string): Promise<MenuServiceResponse<MenuItem[]>>;

  /* Crea un nuevo elemento de menú */
  createMenuItem(item: MenuItem): Promise<MenuServiceResponse<MenuItem>>;

  /* Actualiza un elemento existente del menú */
  updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuServiceResponse<MenuItem>>;

  /* Actualiza el orden y jerarquía de los ítems del menú */
  updateMenuOrder(menus: MenuItem[]): Promise<MenuServiceResponse<boolean>>;

  /* Elimina un ítem del menú */
  deleteMenuItem(id: string): Promise<MenuServiceResponse<boolean>>;

  /* Elimina todos los ítems del menú */
  deleteAllMenus(): Promise<MenuServiceResponse<boolean>>;

  /* Sincroniza el menú con las categorías activas */
  syncWithCategories(menu_group?: string): Promise<SyncResult>;
}

// ===========================
// CONTEXTO E INYECCIÓN
// ===========================

const MenuServiceContext = createContext<MenuService | null>(null);

/**
 * Hook para obtener el servicio de menús inyectado
 */
export function useMenuService(): MenuService {
  const ctx = useContext(MenuServiceContext);
  if (!ctx) {
    throw new Error("MenuService no está disponible. Envuelve con MenuServiceProvider.");
  }
  return ctx;
}

/**
 * Provider para inyectar la implementación del servicio
 */
type ProviderProps = {
  service: MenuService;
  children: React.ReactNode;
};

export function MenuServiceProvider({ service, children }: ProviderProps) {
  return React.createElement(MenuServiceContext.Provider, { value: service, children });
}