import { useState, useCallback, useEffect, useMemo } from "react"
import { useNotifications } from "./useNotifications"
import { useMenuService } from "../lib/menuService"
import type { MenuItem } from "@/components/Editor/types/menu.types"
import { dispatchMenuUpdate } from "../utils/menuUtils"

declare global {
  interface Window {
    isMenuDragging?: boolean;
  }
}

/**
 * Hook que gestiona todas las operaciones CRUD y sincronización de menús.
 */
export function useMenuOperations(initialMenuGroup: "main" | "footer" | "sidebar" | "custom" = "main") {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [menuGroup, setMenuGroup] = useState(initialMenuGroup)
  const [error, setError] = useState<string | null>(null)
  const notify = useNotifications()
  const menuService = useMenuService()

  /**
   * Cargar todos los elementos del menú desde la base de datos.
   */
  const loadMenus = useCallback(async (menuGroup: string) => {
    try {
      setLoading(true)
      const { data, error } = await menuService.getMenus(menuGroup) // ✅ CAMBIO: Usa el servicio

      if (error) {
        setError("Error al cargar menús")
        setMenus([])
      } else {
        setMenus(data || [])
        setError(null)
      }
    } catch (err) {
      setError("Error inesperado")
      setMenus([])
    } finally {
      setLoading(false)
    }
  }, [menuService])

  useEffect(() => {
    const handler = () => {
      if (!window.isMenuDragging) {
        loadMenus(menuGroup)
      }
    }
    window.addEventListener("menus-updated", handler)
    return () => window.removeEventListener("menus-updated", handler)
  }, [loadMenus, menuGroup])

  /**
   * Crear un nuevo elemento del menú.
   */
  const addMenuItem = useCallback(
    async (item: MenuItem) => {
      setLoading(true)
      const { data, error } = await menuService.createMenuItem(item) // ✅ CAMBIO: Usa el servicio
      
      if (error) {
        notify.showNotification("Error al crear el ítem del menú", "error")
        setError("Error al crear ítem")
      } else {
        notify.showNotification("Ítem creado correctamente", "success")
        await loadMenus(menuGroup)
        dispatchMenuUpdate()
      }
      setLoading(false)
      return { data, error }
    },
    [menuService, notify, loadMenus, menuGroup],
  )

  /**
   * Actualizar un elemento existente del menú.
   */
  const editMenuItem = useCallback(
    async (id: string, updates: Partial<MenuItem>) => {
      setLoading(true)
      const { data, error } = await menuService.updateMenuItem(id, updates) // ✅ CAMBIO: Usa el servicio
      
      if (error) {
        notify.showNotification("Error al actualizar ítem del menú", "error")
        setError("Error al actualizar")
      } else {
        notify.showNotification("Ítem actualizado correctamente", "success")
        await loadMenus(menuGroup)
        dispatchMenuUpdate()
      }
      setLoading(false)
      return { data, error }
    },
    [menuService, notify, loadMenus, menuGroup],
  )

  /**
   * Eliminar un ítem del menú.
   */
  const removeMenuItem = useCallback(
    async (id: string) => {
      setLoading(true)
      const { data, error } = await menuService.deleteMenuItem(id) // ✅ CAMBIO: Usa el servicio
      
      if (error || !data) {
        notify.showNotification("Error al eliminar el ítem del menú", "error")
        setError("Error al eliminar")
      } else {
        notify.showNotification("Ítem eliminado correctamente", "success")
        await loadMenus(menuGroup)
        dispatchMenuUpdate()
      }
      setLoading(false)
      return { data, error }
    },
    [menuService, notify, loadMenus, menuGroup],
  )

  /**
   * Sincronizar automáticamente el menú con las categorías activas.
   */
  const syncMenuWithCategories = useCallback(async () => {
    setLoading(true)
    const { added, error } = await menuService.syncWithCategories(menuGroup) // ✅ CAMBIO: Usa el servicio
    
    if (error) {
      notify.showNotification("Error al sincronizar con categorías", "error")
    } else {
      notify.showNotification(
        added > 0 ? `Se agregaron ${added} categorías al menú` : "El menú ya está sincronizado",
        "success",
      )
      await loadMenus(menuGroup)
      dispatchMenuUpdate()
    }
    setLoading(false)
  }, [menuService, notify, loadMenus, menuGroup])

  // const hierarchicalMenus = useMemo(() => {
  //   return menus
  // }, [menus])

  return useMemo(
    () => ({
      menus,
      loading,
      error,
      menuGroup,
      setMenuGroup,
      setMenus,
      loadMenus,
      addMenuItem,
      editMenuItem,
      removeMenuItem,
      syncMenuWithCategories,
    }),
    [
      menus,
      loading,
      error,
      menuGroup,
      setMenuGroup,
      setMenus,
      loadMenus,
      addMenuItem,
      editMenuItem,
      removeMenuItem,
      syncMenuWithCategories,
    ],
  )
}