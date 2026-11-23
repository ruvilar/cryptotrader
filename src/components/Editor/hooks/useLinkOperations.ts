import { useState, useCallback, useMemo } from "react"
import { useNotifications } from "./useNotifications"
import { useLinkService } from "../lib/linkService" // ✅ CAMBIO: Usa el hook del contexto
import type { Link } from "@/components/Editor/types/link.types"

/**
 * Hook que gestiona todas las operaciones CRUD para enlaces personalizados y redirecciones.
 * Diseñado para evitar bucles infinitos de eventos.
 */
export function useLinkOperations() {
  const [links, setLinks] = useState<Link[]>([])
  const [redirects, setRedirects] = useState<Link[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const notify = useNotifications()
  
  // ✅ NUEVO: Obtener el servicio del contexto
  const linkService = useLinkService()

  /**
   * Cargar todos los enlaces personalizados desde la base de datos
   */
  const loadLinks = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await linkService.getLinks() // ✅ CAMBIO: Usa el servicio

      if (error) {
        setError("Error al cargar enlaces")
        setLinks([])
        notify.showNotification("❌ Error al cargar enlaces", "error")
      } else {
        setLinks(data || [])
        setError(null)
      }
    } catch (err) {
      setError("Error inesperado")
      setLinks([])
      notify.showNotification("❌ Error inesperado al cargar enlaces", "error")
    } finally {
      setLoading(false)
    }
  }, [linkService, notify])

  /**
   * Cargar todas las redirecciones desde la base de datos
   */
  const loadRedirects = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await linkService.getRedirects() // ✅ CAMBIO: Usa el servicio

      if (error) {
        setError("Error al cargar redirecciones")
        setRedirects([])
        notify.showNotification("❌ Error al cargar redirecciones", "error")
      } else {
        setRedirects(data || [])
        setError(null)
      }
    } catch (err) {
      setError("Error inesperado")
      setRedirects([])
      notify.showNotification("❌ Error inesperado al cargar redirecciones", "error")
    } finally {
      setLoading(false)
    }
  }, [linkService, notify])

  /**
   * Crear un nuevo enlace personalizado
   */
  const addLink = useCallback(
    async (link: Link) => {
      const { data, error } = await linkService.createLink(link) // ✅ CAMBIO: Usa el servicio

      if (error) {
        notify.showNotification("❌ Error al crear el enlace", "error")
        setError("Error al crear enlace")
      } else {
        notify.showNotification("✅ Enlace creado correctamente", "success")
        if (data) {
          setLinks((prev) => [...prev, data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
        }
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Actualizar un enlace existente
   */
  const editLink = useCallback(
    async (id: string, updates: Partial<Link>) => {
      const { data, error } = await linkService.updateLink(id, updates) // ✅ CAMBIO: Usa el servicio

      if (error) {
        notify.showNotification("❌ Error al actualizar enlace", "error")
        setError("Error al actualizar")
      } else {
        if (data) {
          setLinks((prev) => prev.map((link) => (link.id === id ? data : link)))
        }
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Eliminar un enlace
   */
  const removeLink = useCallback(
    async (id: string) => {
      const { data, error } = await linkService.deleteLink(id) // ✅ CAMBIO: Usa el servicio

      if (error || !data) {
        notify.showNotification("❌ Error al eliminar el enlace", "error")
        setError("Error al eliminar")
      } else {
        notify.showNotification("🗑️ Enlace eliminado correctamente", "success")
        setLinks((prev) => prev.filter((link) => link.id !== id))
      }

      return { data, error }
    },
    [linkService, notify]
  )

  const validateLink = useCallback(
    async (url: string) => {
      return await linkService.validateLink(url);
    },
    [linkService]
  );

  /**
   * Crear una nueva redirección
   */
  const addRedirect = useCallback(
    async (redirect: Link) => {
      const { data, error } = await linkService.createRedirect(redirect) // ✅ CAMBIO: Usa el servicio

      if (error) {
        notify.showNotification("❌ Error al crear la redirección", "error")
        setError("Error al crear redirección")
      } else {
        notify.showNotification("✅ Redirección creada correctamente", "success")
        if (data) {
          setRedirects((prev) => [data, ...prev])
        }
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Actualizar una redirección existente
   */
  const editRedirect = useCallback(
    async (id: string, updates: Partial<Link>) => {
      const { data, error } = await linkService.updateRedirect(id, updates) // ✅ CAMBIO: Usa el servicio

      if (error) {
        notify.showNotification("❌ Error al actualizar redirección", "error")
        setError("Error al actualizar")
      } else {
        if (data) {
          setRedirects((prev) => prev.map((redirect) => (redirect.id === id ? data : redirect)))
        }
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Eliminar una redirección
   */
  const removeRedirect = useCallback(
    async (id: string) => {
      const { data, error } = await linkService.deleteRedirect(id) // ✅ CAMBIO: Usa el servicio

      if (error || !data) {
        notify.showNotification("❌ Error al eliminar la redirección", "error")
        setError("Error al eliminar")
      } else {
        notify.showNotification("🗑️ Redirección eliminada correctamente", "success")
        setRedirects((prev) => prev.filter((redirect) => redirect.id !== id))
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Alternar estado activo/inactivo de un enlace
   */
  const toggleLinkActive = useCallback(
    async (id: string, isActive: boolean) => {
      const { data, error } = await linkService.updateLink(id, { is_active: isActive }) // ✅ CAMBIO: Usa el servicio

      if (error) {
        notify.showNotification("❌ Error al cambiar estado del enlace", "error")
      } else {
        notify.showNotification(
          isActive ? "✅ Enlace activado" : "⚠️ Enlace desactivado",
          "success"
        )
        if (data) {
          setLinks((prev) => prev.map((link) => (link.id === id ? data : link)))
        }
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Alternar estado activo/inactivo de una redirección
   */
  const toggleRedirectActive = useCallback(
    async (id: string, isActive: boolean) => {
      const { data, error } = await linkService.updateRedirect(id, { is_active: isActive }) // ✅ CAMBIO: Usa el servicio

      if (error) {
        notify.showNotification("❌ Error al cambiar estado de la redirección", "error")
      } else {
        notify.showNotification(
          isActive ? "✅ Redirección activada" : "⚠️ Redirección desactivada",
          "success"
        )
        if (data) {
          setRedirects((prev) => prev.map((redirect) => (redirect.id === id ? data : redirect)))
        }
      }

      return { data, error }
    },
    [linkService, notify]
  )

  /**
   * Retornar el estado y funciones memoizadas
   */
  return useMemo(
    () => ({
      // Estado
      links,
      redirects,
      loading,
      validating,
      error,

      // Setters
      setLinks,
      setRedirects,

      // Funciones de carga manual
      loadLinks,
      loadRedirects,

      // Operaciones de enlaces
      addLink,
      editLink,
      removeLink,
      validateLink,
      toggleLinkActive,

      // Operaciones de redirecciones
      addRedirect,
      editRedirect,
      removeRedirect,
      toggleRedirectActive,
    }),
    [
      links,
      redirects,
      loading,
      validating,
      error,
      loadLinks,
      loadRedirects,
      addLink,
      editLink,
      removeLink,
      validateLink,
      toggleLinkActive,
      addRedirect,
      editRedirect,
      removeRedirect,
      toggleRedirectActive,
    ]
  )
}