import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardHeader, CardContent } from "./ui/card"
import { Separator } from "./ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Plus, RefreshCw, Copy, ExternalLink, Trash2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { useNotifications } from "./hooks/useNotifications"
import { useMenuOperations } from "./hooks/useMenuOperations"
import { useMenuService } from "./lib/menuService"
import type { MenuItem } from "./types/menu.types"
import { debounce } from "./utils/editorUtils";

interface MenuItemWithSort {
  id?: string
  title?: string
  url?: string
  menu_group?: string
  is_active?: boolean
  sort_order?: number
  children?: MenuItemWithSort[]
  parent_id?: string | null
}

const dispatchMenuUpdate = () => {
  window.dispatchEvent(new CustomEvent("menus-updated"))
}

export default function MenuManager() {
  const {
    menus,
    loading,
    error,
    menuGroup,
    setMenuGroup,
    loadMenus,
    addMenuItem,
    editMenuItem,
    removeMenuItem,
    syncMenuWithCategories,
  } = useMenuOperations("main")
  const { showNotification } = useNotifications()

  // Estados para modales
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [dialogType, setDialogType] = useState<"custom" | "category">("custom")
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogUrl, setDialogUrl] = useState("")
  const [dialogCategorySlug, setDialogCategorySlug] = useState("")
  const [localMenus, setLocalMenus] = useState<MenuItemWithSort[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)

  // Carga menús al cambiar grupo
  useEffect(() => {
    loadMenus(menuGroup)
  }, [menuGroup, loadMenus])

  useEffect(() => {
    if (!isDragging) {
      const sortedMenus = (menus || []).map((item, index) => ({
        ...item,
        sort_order: index,
      }))
      setLocalMenus(sortedMenus)
    }
  }, [menus, isDragging])

  useEffect(() => {
    const handler = () => {
      if (!isDragging) {
        loadMenus(menuGroup)
      }
    }

    window.addEventListener("menus-updated", handler)
    return () => window.removeEventListener("menus-updated", handler)
  }, [loadMenus, menuGroup, isDragging])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const menuService = useMenuService();

  const handleDragEnd = async (result: DropResult) => {
    try {
      const cleanupState = () => {
        setIsDragging(false)
      }
  
      // Validar destino
      if (!result.destination) {
        cleanupState()
        return
      }
  
      // Mismo lugar = no hacer nada
      if (
        result.source.index === result.destination.index &&
        result.source.droppableId === result.destination.droppableId
      ) {
        cleanupState()
        return
      }
  
      // Identifica tipo de movimiento
      const sourceIsRoot = result.source.droppableId === "menu-list"
      const destIsRoot = result.destination.droppableId === "menu-list"
      const sourceParentId = sourceIsRoot ? null : result.source.droppableId.replace("submenu-", "")
      const destParentId = destIsRoot ? null : result.destination.droppableId.replace("submenu-", "")
  
      // Separa elementos raíz y crear mapa de hijos
      const roots = localMenus.filter((item) => !item.parent_id)
      const childrenMap = new Map<string, MenuItemWithSort[]>()
      
      localMenus.forEach((item) => {
        if (item.parent_id) {
          if (!childrenMap.has(item.parent_id)) {
            childrenMap.set(item.parent_id, [])
          }
          childrenMap.get(item.parent_id)!.push(item)
        }
      })
  
      let newRoots = [...roots]
      let newChildrenMap = new Map(childrenMap)
  
      // Obtener el elemento movido
      let movedItem: MenuItemWithSort
  
      if (sourceIsRoot) {
        // Mover desde raíz
        movedItem = { ...roots[result.source.index] }
        newRoots.splice(result.source.index, 1)
      } else {
        // Mover desde submenu
        const sourceChildren = newChildrenMap.get(sourceParentId!) || []
        movedItem = { ...sourceChildren[result.source.index] }
        sourceChildren.splice(result.source.index, 1)
        newChildrenMap.set(sourceParentId!, sourceChildren)
      }
  
      // Actualizar parent_id del elemento movido
      movedItem.parent_id = destParentId
  
      // Insertar en destino
      if (destIsRoot) {
        // Insertar en raíz
        newRoots.splice(result.destination.index, 0, movedItem)
      } else {
        // Insertar en submenu
        const destChildren = newChildrenMap.get(destParentId!) || []
        destChildren.splice(result.destination.index, 0, movedItem)
        newChildrenMap.set(destParentId!, destChildren)
      }
  
      // Reconstruye array completo con sort_order correcto
      const reconstructed: MenuItemWithSort[] = []
      
      // Primero los roots con su sort_order...
      newRoots.forEach((root, index) => {
        reconstructed.push({ ...root, sort_order: index })
        
        // ...luego sus hijos
        const children = newChildrenMap.get(root.id!) || []
        children.forEach((child, childIndex) => {
          reconstructed.push({ ...child, sort_order: childIndex })
        })
      })
  
      // Actualiza UI inmediatamente
      setLocalMenus(reconstructed)
  
      const menuItemsToUpdate = reconstructed.map(item => ({
        id: item.id,
        parent_id: item.parent_id || null,
        menu_group: item.menu_group,
        title: item.title,
        url: item.url,
        is_active: item.is_active,
        sort_order: item.sort_order,
      })) as MenuItem[]
  
      const { error } = await menuService.updateMenuOrder(menuItemsToUpdate)
  
      if (error) {
        showNotification("Error al guardar el orden", "error")
        cleanupState()
        return
      }
      cleanupState()
      dispatchMenuUpdate()
      showNotification("Orden actualizado", "success")
    } catch (error) {
      setIsDragging(false)
      showNotification("Error inesperado", "error")
    }
  }

  const handleAddCustom = () => {
    setDialogType("custom")
    setDialogTitle("")
    setDialogUrl("/")
    setShowAddDialog(true)
  }

  const handleAddCategory = () => {
    setDialogType("category")
    setDialogTitle("")
    setDialogCategorySlug("")
    setShowAddDialog(true)
  }

  const handleConfirmAdd = async () => {
    if (dialogType === "custom") {
      if (!dialogTitle || !dialogUrl) {
        showNotification("Completa todos los campos", "error")
        return
      }

      await addMenuItem({
        title: dialogTitle,
        url: dialogUrl,
        menu_group: menuGroup,
        is_active: true,
      })
    } else {
      if (!dialogTitle || !dialogCategorySlug) {
        showNotification("Completa todos los campos", "error")
        return
      }

      await addMenuItem({
        title: dialogTitle,
        url: `/${dialogCategorySlug}/`,
        menu_group: menuGroup,
        is_active: true,
      })
    }

    setShowAddDialog(false)
    setDialogTitle("")
    setDialogUrl("")
    setDialogCategorySlug("")
  }

  const handleEditTitle = async (id: string, value: string) => {
    setLocalMenus((prev) => prev.map((m) => (m.id === id ? { ...m, title: value } : m)))

    debouncedEditTitle(id, { title: value })
  }

  const debouncedEditTitle = debounce(async (id: string, updates: Record<string, any>) => {
    await editMenuItem(id, updates)
    setSavedItemId(id)
    setTimeout(() => setSavedItemId(null), 3000)
  }, 1000)

  const handleEditUrl = async (id: string, value: string) => {
    setLocalMenus((prev) => prev.map((m) => (m.id === id ? { ...m, url: value } : m)))

    debouncedEditUrl(id, { url: value })
  }

  const debouncedEditUrl = debounce(async (id: string, updates: Record<string, any>) => {
    await editMenuItem(id, updates)
    setSavedItemId(id)
    setTimeout(() => setSavedItemId(null), 3000)
  }, 1000)

  const handleDelete = async (id: string, title?: string) => {
    const confirmDelete = window.confirm(`¿Seguro que quieres eliminar "${title ?? "este elemento"}"?`)
    if (!confirmDelete) return

    const { error } = await removeMenuItem(id)
    if (error) {
      showNotification(`Error al eliminar: ${error?.message ?? error}`, "error")
    } else {
      showNotification("Elemento eliminado correctamente", "success")
      await loadMenus(menuGroup)
    }
  }

  const handlePromoteToRoot = async (id: string) => {
    const item = localMenus.find(m => m.id === id)
    if (!item) return

    // Actualiza localmente
    setLocalMenus((prev) => prev.map((m) => (m.id === id ? { ...m, parent_id: null } : m)))

    // Actualiza en la base de datos
    const { error } = await editMenuItem(id, { parent_id: null })
    if (error) {
      showNotification("Error al promover elemento", "error")
      loadMenus(menuGroup) // Recargar si falla
    } else {
      showNotification("Elemento movido a raíz", "success")
      dispatchMenuUpdate()
    }
  }

  const handleDemoteToChild = async (id: string, newParentId: string) => {
    const item = localMenus.find(m => m.id === id)
    if (!item) return

    // Prevenir loops (un elemento no puede ser hijo de sí mismo)
    if (id === newParentId) {
      showNotification("Un elemento no puede ser hijo de sí mismo", "error")
      return
    }

    // Actualiza localmente
    setLocalMenus((prev) => prev.map((m) => (m.id === id ? { ...m, parent_id: newParentId } : m)))

    // Actualizar en la base de datos
    const { error } = await editMenuItem(id, { parent_id: newParentId })
    if (error) {
      showNotification("Error al convertir en subelemento", "error")
      loadMenus(menuGroup) // Recargar si falla
    } else {
      showNotification("Elemento convertido en subelemento", "success")
      dispatchMenuUpdate()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-900">Gestor de Menús</h2>
          </div>

          <p className="text-sm text-muted-foreground font-bold">Crea, edita y organiza los menús de tu web o app</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Select value={menuGroup} onValueChange={(val: any) => setMenuGroup(val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="bg-gray-400 hover:bg-gray-500" value="main">Menú Principal</SelectItem>
                <SelectItem className="bg-gray-400 hover:bg-gray-500" value="footer">Menú Secundario</SelectItem>
                <SelectItem className="bg-gray-400 hover:bg-gray-500" value="sidebar">Menú Lateral</SelectItem>
                <SelectItem className="bg-gray-400 hover:bg-gray-500" value="custom">Menú Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={handleAddCustom}>
                <Plus className="w-4 h-4 mr-1" /> Enlace personalizado
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddCategory}>
                <Plus className="w-4 h-4 mr-1" /> Desde categoría
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <Button size="sm" variant="outline" onClick={syncMenuWithCategories}>
              <RefreshCw className="w-4 h-4 mr-1" /> Sincronizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm">Cargando menús...</p>
        ) : localMenus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-md bg-muted/30">
            <p className="text-base text-yellow-300 font-medium mb-2">No hay menús creados todavía</p>
            <p className="text-sm">Usa los botones de arriba para crear enlaces.</p>
          </div>
        ) : null}

        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="menu-list">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`
                  space-y-2
                  ${snapshot.isDraggingOver ? "bg-blue-50 border-2 border-dashed border-blue-400 p-2 rounded" : ""}
                `}
                style={{
                  display: loading || localMenus.length === 0 ? "none" : "block",
                }}
              >
                {/* 🎯 ZONA "DROP TO ROOT" - NUEVO */}
                {isDragging && (
                  <div className={`
                    mb-4 p-4 border-2 border-dashed rounded-lg text-center transition-all
                    ${snapshot.isDraggingOver 
                      ? "border-blue-500 bg-blue-50 scale-105" 
                      : "border-gray-300 bg-gray-50"
                    }
                  `}>
                    <p className="text-sm font-medium text-gray-600">
                      ⬆️ Soltar aquí para mover a nivel raíz
                    </p>
                  </div>
                )}
          
                {(() => {
                  const roots = localMenus.filter((item) => !item.parent_id && item.id)
                  const childrenMap = new Map<string, MenuItemWithSort[]>()

                  localMenus.forEach((item) => {
                    if (item.parent_id) {
                      if (!childrenMap.has(item.parent_id)) {
                        childrenMap.set(item.parent_id, [])
                      }
                      childrenMap.get(item.parent_id)!.push(item)
                    }
                  })

                  return roots.map((item, rootIndex) => (
                    <div key={`root-${item.id}`}>
                      {/* ITEM RAÍZ */}
                      <Draggable draggableId={item.id!} index={rootIndex}>
                        {(prov, snapshot) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`
                              flex items-center justify-between border rounded-md px-3 py-2 mb-2 
                              bg-card transition-all hover:bg-muted/40
                              ${snapshot.isDragging ? "border-l-4 border-l-blue-500" : ""}
                            `}
                          >
                            <div className="flex-1 w-full">
                              <input
                                type="text"
                                value={item.title || ""}
                                onChange={(e) => handleEditTitle(item.id!, e.target.value)}
                                className="text-yellow-300 font-medium border-b focus:border-blue-400 outline-none w-full bg-transparent"
                              />
                              <input
                                type="text"
                                value={item.url || ""}
                                onChange={(e) => handleEditUrl(item.id!, e.target.value)}
                                className="text-xs text-muted-foreground truncate max-w-xs border-b focus:border-blue-400 outline-none w-full bg-transparent mt-1"
                              />
                              {savedItemId === item.id && (
                                <span className="text-green-600 text-xs ml-1">💾 ¡Guardado exitoso!</span>
                              )}
                            </div>

                            <div className="flex gap-1 items-center">
                              {/* Selector para convertir en hijo */}
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleDemoteToChild(item.id!, e.target.value)
                                    e.target.value = "" // Reset
                                  }
                                }}
                                className="text-xs p-1 border rounded bg-gray-500 hover:bg-gray-600 max-w-[225px]"
                                defaultValue=""
                              >
                                <option value="" disabled>↘️ Convertir a subelemento de...</option>
                                {roots.filter(r => r.id !== item.id).map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.title}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${item.url}`)}
                                title="Copiar URL"
                                className="p-1 hover:bg-gray-400 rounded"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.open(item.url, "_blank")}
                                title="Abrir URL"
                                className="p-1 hover:bg-gray-400 rounded"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id!, item.title)}
                                title="Eliminar"
                                className="p-1 hover:bg-red-400 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>

                      {/* ZONA DROPPABLE PARA SUBMENÚS */}
                      <Droppable droppableId={`submenu-${item.id}`}>
                        {(prov, snapshot) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.droppableProps}
                            className={`
                              pl-6 border-l-2 ml-2 mb-3 py-1 min-h-12
                              transition-all duration-200
                              ${snapshot.isDraggingOver 
                                ? "border-l-4 border-l-green-500 bg-green-50 shadow-inner" 
                                : "border-l-gray-300 bg-transparent"
                              }
                              ${isDragging && !snapshot.isDraggingOver
                                ? "border-l-blue-200 bg-blue-50/30"
                                : ""
                              }
                            `}
                          >
                            {(childrenMap.get(item.id!) || []).map((child, childIndex) => (
                              <Draggable
                                key={`${child.id!}-child`}
                                draggableId={`${child.id!}-child`}
                                index={childIndex}
                              >
                                {(prov, snapshot) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    className={`
                                      flex items-center justify-between border rounded-md px-3 py-2 mb-2 
                                      border-yellow-200 transition-all
                                      ${snapshot.isDragging ? "border-l-4 border-l-yellow-500" : ""}
                                    `}
                                  >
                                    <div className="flex-1 w-full">
                                      <input
                                        type="text"
                                        value={child.title || ""}
                                        onChange={(e) => handleEditTitle(child.id!, e.target.value)}
                                        className="font-medium text-sm text-yellow-300 border-b focus:border-blue-400 outline-none w-full bg-transparent"
                                      />
                                      <input
                                        type="text"
                                        value={child.url || ""}
                                        onChange={(e) => handleEditUrl(child.id!, e.target.value)}
                                        className="text-xs text-muted-foreground truncate max-w-xs border-b focus:border-blue-400 outline-none w-full bg-transparent mt-1"
                                      />
                                      {savedItemId === child.id && (
                                        <span className="text-green-600 text-xs ml-1">💾 ¡Guardado exitoso!</span>
                                      )}
                                    </div>

                                    <div className="flex gap-1">
                                      {/* Botón para mover subelemento a raíz */}
                                      <button
                                        onClick={() => handlePromoteToRoot(child.id!)}
                                        title="Volver a elemento raíz"
                                        className="p-1 hover:bg-blue-400 rounded text-blue-600"
                                      >
                                        <span className="text-sm font-bold">↖️</span>
                                      </button>

                                      <button
                                        onClick={() =>
                                          navigator.clipboard.writeText(`${window.location.origin}${child.url}`)
                                        }
                                        title="Copiar URL"
                                        className="p-1 hover:bg-gray-400 rounded"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>

                                      <button
                                        onClick={() => window.open(child.url, "_blank")}
                                        title="Abrir URL"
                                        className="p-1 hover:bg-gray-400 rounded"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </button>

                                      <button
                                        onClick={() => handleDelete(child.id!, child.title)}
                                        title="Eliminar"
                                        className="p-1 hover:bg-red-400 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))
                })()}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Separator className="mt-4" />
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "custom" ? "Nuevo enlace personalizado" : "Nuevo enlace desde categoría"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="menu-title">Título del enlace</Label>
              <Input
                className="text-gray-700"
                id="menu-title"
                value={dialogTitle}
                onChange={(e) => setDialogTitle(e.target.value)}
                placeholder="Ej: Inicio, Contacto"
              />
            </div>

            {dialogType === "custom" ? (
              <div className="space-y-2">
                <Label htmlFor="menu-url">URL</Label>
                <Input
                  className="text-gray-700"
                  id="menu-url"
                  value={dialogUrl}
                  onChange={(e) => setDialogUrl(e.target.value)}
                  placeholder="Ej: /contacto"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="menu-category">Slug de la categoría</Label>
                <Input
                  className="text-gray-700"
                  id="menu-category"
                  value={dialogCategorySlug}
                  onChange={(e) => setDialogCategorySlug(e.target.value)}
                  placeholder="Ej: tecnologia"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleConfirmAdd}>
              Crear enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDragging && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          🎯 Arrastrando menú...
        </div>
      )}
    </Card>
  )
}
