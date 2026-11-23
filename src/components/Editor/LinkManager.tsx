import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Plus, Copy, ExternalLink, Trash2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardHeader, CardContent } from "./ui/card"
import { Separator } from "./ui/separator"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useLinkOperations } from "./hooks/useLinkOperations"
import { useLinkService } from "./lib/linkService"
import type { Link, LinkType, RedirectType } from "./types/link.types"
import {
  LINK_TYPE_VALUES,
  LINK_TYPE_LABELS,
  REDIRECT_TYPE_VALUES,
  REDIRECT_TYPE_LABELS,
} from "./types/link.types"
import { debounce } from "./utils/editorUtils";

export default function LinkManager() {
  const {
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
    setLinks,
  } = useLinkOperations()

  // ✅ Estados locales para formularios y UI
  const [activeTab, setActiveTab] = useState<"links" | "redirects">("links")
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false)
  const [showAddRedirectDialog, setShowAddRedirectDialog] = useState(false)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // ✅ Estado para nuevo enlace
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
    linkType: "external" as LinkType,
  })

  // ✅ Estado para nueva redirección
  const [newRedirect, setNewRedirect] = useState({
    sourceUrl: "",
    targetUrl: "",
    redirectType: "301" as RedirectType,
  })

  // ✅ Carga datos al montar
  useEffect(() => {
    loadLinks()
    loadRedirects()
  }, [])

  // ✅ Crea nuevo enlace
  const handleCreateLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      alert("El título y la URL son obligatorios")
      return
    }

    const { error } = await addLink({
      type: "link",
      title: newLink.title,
      url: newLink.url,
      description: newLink.description || undefined,
      link_type: newLink.linkType,
      is_active: true,
    })

    if (!error) {
      setNewLink({ title: "", url: "", description: "", linkType: "external" })
      setShowAddLinkDialog(false)
    }
  }

  // ✅ Crea nueva redirección
  const handleCreateRedirect = async () => {
    if (!newRedirect.sourceUrl.trim() || !newRedirect.targetUrl.trim()) {
      alert("Las URLs de origen y destino son obligatorias")
      return
    }

    const { error } = await addRedirect({
      type: "redirect",
      url: newRedirect.sourceUrl,
      target_url: newRedirect.targetUrl,
      redirect_type: newRedirect.redirectType,
      is_active: true,
    })

    if (!error) {
      setNewRedirect({ sourceUrl: "", targetUrl: "", redirectType: "301" })
      setShowAddRedirectDialog(false)
    }
  }

  // ✅ Edita enlace con debounce
  const handleEditLink = (id: string, field: keyof Link, value: any) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
    debouncedSaveLink(id, { [field]: value })
  }

  const debouncedSaveLink = debounce(async (id: string, updates: Partial<Link>) => {
    await editLink(id, updates)
    setSavedItemId(id)
    setTimeout(() => setSavedItemId(null), 3000)
  }, 1500)

  // ✅ Edita redirección con debounce
  const handleEditRedirect = (id: string, field: keyof Link, value: any) => {
    // Actualiza estado local inmediatamente
    debouncedSaveRedirect(id, { [field]: value })
  }

  const debouncedSaveRedirect = debounce(async (id: string, updates: Partial<Link>) => {
    await editRedirect(id, updates)
    setSavedItemId(id)
    setTimeout(() => setSavedItemId(null), 3000)
  }, 1500)

  // ✅ Elimina enlace
  const handleDeleteLink = async (id: string, title: string) => {
    if (!confirm(`¿Seguro que deseas eliminar "${title}"?`)) return
    await removeLink(id)
  }

  // ✅ Elimina redirección
  const handleDeleteRedirect = async (id: string, sourceUrl: string) => {
    if (!confirm(`¿Seguro que deseas eliminar la redirección de "${sourceUrl}"?`)) return
    await removeRedirect(id)
  }

  // ✅ Copia URL al portapapeles
  const handleCopyUrl = (url: string) => {
    const fullUrl = url.startsWith("/") ? `${window.location.origin}${url}` : url
    navigator.clipboard.writeText(fullUrl)
    alert("URL copiada al portapapeles")
  }

  // ✅ Drag & Drop para enlaces
  const handleDragStart = () => {
    setIsDragging(true)
    ;(window as any).isLinkDragging = true
  }

  const linkService = useLinkService();

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false)
    ;(window as any).isLinkDragging = false

    if (!result.destination) return
    if (result.source.index === result.destination.index) return

    const reordered = Array.from(links)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    const updated = reordered.map((link, index) => ({ ...link, sort_order: index }))
    setLinks(updated)

    await linkService.updateLinksOrder(updated)
  }

  // ✅ Valida enlace
  const handleValidateLink = async (url: string) => {
    const result = await validateLink(url);
    if (result.data?.isValid) {
      alert(`✅ Enlace válido: ${url}`);
    } else {
      alert(`❌ Enlace inválido: ${result.data?.error || result.error || "Error desconocido"}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-400">Gestor de Enlaces y Redirecciones</h2>
          </div>
          <p className="text-sm text-muted-foreground font-bold">
            Administra enlaces personalizados y redirecciones 301/302
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "links" | "redirects")}>
          <TabsList className="grid w-full grid-cols-2 mb-5">
            <TabsTrigger className="shadow-lg shadow-gray-700" value="links">Enlaces Personalizados ({links.length})</TabsTrigger>
            <TabsTrigger className="shadow-lg shadow-gray-700" value="redirects">Redirecciones ({redirects.length})</TabsTrigger>
          </TabsList>

          {/* ==================== TAB: ENLACES PERSONALIZADOS ==================== */}
          <TabsContent value="links" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button className="shadow-lg shadow-gray-700" size="sm" variant="default" onClick={() => setShowAddLinkDialog(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo Enlace
              </Button>
              <Button className="shadow-lg shadow-gray-700" size="sm" variant="outline" onClick={loadLinks} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Recargar
              </Button>
            </div>

            {loading && links.length === 0 ? (
              <p className="text-sm text-center py-4">Cargando enlaces...</p>
            ) : links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-md bg-muted/30">
                <p className="text-base text-yellow-300 font-medium mb-2">No hay enlaces creados todavía</p>
                <p className="text-sm">Usa el botón de arriba para crear uno nuevo.</p>
              </div>
            ) : (
              <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <Droppable droppableId="links-list">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-2 ${
                        snapshot.isDraggingOver ? "bg-blue-50 border-2 border-dashed border-blue-400 p-2 rounded" : ""
                      }`}
                    >
                      {links.map((link, index) => (
                        <Draggable key={link.id!} draggableId={link.id!} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`flex flex-col border rounded-md px-3 py-2 bg-card transition-all hover:bg-muted/40 ${
                                snap.isDragging ? "border-l-4 border-l-blue-500 shadow-lg" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  {/* Título */}
                                  <input
                                    type="text"
                                    value={link.title}
                                    onChange={(e) => handleEditLink(link.id!, "title", e.target.value)}
                                    className="font-medium text-yellow-900 border-b focus:border-blue-400 outline-none w-full bg-transparent"
                                    placeholder="Título del enlace"
                                  />

                                  {/* URL */}
                                  <input
                                    type="text"
                                    value={link.url}
                                    onChange={(e) => handleEditLink(link.id!, "url", e.target.value)}
                                    className="text-sm text-blue-600 border-b focus:border-blue-400 outline-none w-full bg-transparent"
                                    placeholder="https://ejemplo.com"
                                  />

                                  {/* Descripción */}
                                  <textarea
                                    value={link.description || ""}
                                    onChange={(e) => handleEditLink(link.id!, "description", e.target.value)}
                                    className="text-sm text-gray-600 border-b focus:border-blue-400 outline-none w-full bg-transparent resize-none"
                                    rows={1}
                                    placeholder="Descripción opcional..."
                                  />

                                  {/* Tipo de enlace */}
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={link.link_type || "external"}
                                      onValueChange={(value) =>
                                        handleEditLink(link.id!, "link_type", value as LinkType)
                                      }
                                    >
                                      <SelectTrigger className="w-[150px] h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LINK_TYPE_VALUES.map((type) => (
                                          <SelectItem key={type} value={type}>
                                            {LINK_TYPE_LABELS[type]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {savedItemId === link.id && (
                                      <span className="text-green-600 text-xs flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        ¡Guardado!
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col gap-1">
                                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={link.is_active ?? true}
                                      onChange={(e) => toggleLinkActive(link.id!, e.target.checked)}
                                    />
                                    {link.is_active ? "Activo" : "Inactivo"}
                                  </label>

                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleValidateLink(link.url)}
                                      title="Validar enlace"
                                      className="p-1 hover:bg-green-400 rounded"
                                      disabled={validating}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCopyUrl(link.url)}
                                      title="Copiar URL"
                                      className="p-1 hover:bg-gray-400 rounded"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => window.open(link.url, "_blank")}
                                      title="Abrir URL"
                                      className="p-1 hover:bg-gray-400 rounded"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLink(link.id!, link.title)}
                                      title="Eliminar"
                                      className="p-1 hover:bg-red-400 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </TabsContent>

          {/* ==================== TAB: REDIRECCIONES ==================== */}
          <TabsContent value="redirects" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button className="shadow-lg shadow-gray-700" size="sm" variant="default" onClick={() => setShowAddRedirectDialog(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nueva Redirección
              </Button>
              <Button className="shadow-lg shadow-gray-700" size="sm" variant="outline" onClick={loadRedirects} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Recargar
              </Button>
            </div>

            {loading && redirects.length === 0 ? (
              <p className="text-sm text-center py-4">Cargando redirecciones...</p>
            ) : redirects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-md bg-muted/30">
                <p className="text-base text-yellow-300 font-medium mb-2">No hay redirecciones creadas todavía</p>
                <p className="text-sm">Usa el botón de arriba para crear una nueva.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {redirects.map((redirect) => (
                  <div
                    key={redirect.id}
                    className="flex flex-col border rounded-md px-3 py-2 bg-card hover:bg-muted/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {/* URL de origen */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-16">Origen:</span>
                          <input
                            type="text"
                            value={redirect.url}
                            onChange={(e) => handleEditRedirect(redirect.id!, "url", e.target.value)}
                            className="flex-1 text-sm text-red-600 border-b focus:border-blue-400 outline-none bg-transparent"
                            placeholder="/ruta-antigua"
                          />
                        </div>

                        {/* URL de destino */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-16">Destino:</span>
                          <input
                            type="text"
                            value={redirect.target_url}
                            onChange={(e) => handleEditRedirect(redirect.id!, "target_url", e.target.value)}
                            className="flex-1 text-sm text-green-600 border-b focus:border-blue-400 outline-none bg-transparent"
                            placeholder="/ruta-nueva"
                          />
                        </div>

                        {/* Tipo y hits */}
                        <div className="flex items-center gap-2">
                          <Select
                            value={redirect.redirect_type}
                            onValueChange={(value) =>
                              handleEditRedirect(redirect.id!, "redirect_type", value as RedirectType)
                            }
                          >
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {REDIRECT_TYPE_VALUES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {REDIRECT_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-xs text-gray-500">
                            📊 {redirect.hits || 0} {redirect.hits === 1 ? "uso" : "usos"}
                          </span>

                          {savedItemId === redirect.id && (
                            <span className="text-green-600 text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              ¡Guardado!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={redirect.is_active ?? true}
                            onChange={(e) => toggleRedirectActive(redirect.id!, e.target.checked)}
                          />
                          {redirect.is_active ? "Activa" : "Inactiva"}
                        </label>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopyUrl(redirect.url)}
                            title="Copiar origen"
                            className="p-1 hover:bg-gray-400 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRedirect(redirect.id!, redirect.url)}
                            title="Eliminar"
                            className="p-1 hover:bg-red-400 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="mt-4" />
      </CardContent>

      {/* ==================== DIALOG: NUEVO ENLACE ==================== */}
      <Dialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Enlace Personalizado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Título *</Label>
              <Input
                className="text-gray-700"
                id="link-title"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Ej: Canal de YouTube"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-url">URL *</Label>
              <Input
                className="text-gray-700" 
                id="link-url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://youtube.com/@micanal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-description">Descripción</Label>
              <Input
                className="text-gray-700"
                id="link-description"
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-type">Tipo de enlace</Label>
              <Select
                value={newLink.linkType}
                onValueChange={(value) => setNewLink({ ...newLink, linkType: value as LinkType })}
              >
                <SelectTrigger id="link-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-400">
                  {LINK_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type} className="bg-gray-400 hover:bg-gray-500">
                      {LINK_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLinkDialog(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleCreateLink}>
              Crear Enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: NUEVA REDIRECCIÓN ==================== */}
      <Dialog open={showAddRedirectDialog} onOpenChange={setShowAddRedirectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Redirección</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="redirect-source">URL de Origen *</Label>
              <Input
                className="text-gray-700"
                id="redirect-source"
                value={newRedirect.sourceUrl}
                onChange={(e) => setNewRedirect({ ...newRedirect, sourceUrl: e.target.value })}
                placeholder="/ruta-antigua"
              />
              <p className="text-xs text-muted-foreground">La URL que será redirigida</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect-target">URL de Destino *</Label>
              <Input
                className="text-gray-700"
                id="redirect-target"
                value={newRedirect.targetUrl}
                onChange={(e) => setNewRedirect({ ...newRedirect, targetUrl: e.target.value })}
                placeholder="/ruta-nueva"
              />
              <p className="text-xs text-muted-foreground">La URL a la que se redirigirá</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect-type">Tipo de Redirección</Label>
              <Select
                value={newRedirect.redirectType}
                onValueChange={(value) =>
                  setNewRedirect({ ...newRedirect, redirectType: value as RedirectType })
                }
              >
                <SelectTrigger id="redirect-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-400">
                  {REDIRECT_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type} className="bg-gray-400 hover:bg-gray-500">
                      {REDIRECT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                301 = Permanente (SEO), 302 = Temporal
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRedirectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleCreateRedirect}>
              Crear Redirección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDragging && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          🎯 Arrastrando enlace...
        </div>
      )}
    </Card>
  )
}