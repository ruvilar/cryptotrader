import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import ContentForm from "./ContentForm";
import ContentList from "./ContentList";
import Notification from "./ui/notification";
import { useNotifications } from "./hooks/useNotifications";
import { useContentOperations } from "./hooks/useContentOperations";
import { ContentItem, ContentFormData, ProcessedSEOData } from "./types/content.types";
import SEOSection from "./SEOSection";
import backgroundImgModalForm from "./assets/metallic-bg.webp";
import EditorDialog from "./EditorDialog";
import { useAuth } from "./hooks/useAuth";
import LoginForm from "./LoginForm";
import SiteStructurePanel from "./SiteStructurePanel";
import { ContTrans } from "./utils/contentTransformers";

interface ContentEditorProps {
  showTrigger?: boolean;
}

// ✅ Devuelve el estado inicial del formulario de contenido, tipado según ContentFormData
function getDefaultFormData(): ContentFormData {
  return {
    title: "", slug: "", category: "", type: "post", status: "draft", content: "",
    metaTitle: "", metaDescription: "", metaKeywords: "", featuredImage: "", 
    customCss: "", canonicalUrl: "", metaRobots: "index,follow", ogTitle: "", 
    ogDescription: "", ogImage: "", twitterTitle: "", twitterDescription: "", 
    twitterImage: "", contentType: "article", authorName: "Admin",
  };
}

export default function ContentEditor({ showTrigger = false }: ContentEditorProps) {
  const [open, setOpen] = useState(false); // Controla si el modal está abierto
  const [activeTab, setActiveTab] = useState<"create" | "list" | "seo" | "structure">("create"); // Pestaña activa (Crear Contenido, Ver Publicaciones, SEO y Metadatos)
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null); // Contenido que se está editando
  const [formData, setFormData] = useState<ContentFormData>(getDefaultFormData()); // Datos del formulario
  const [showExitConfirm, setShowExitConfirm] = useState(false); // Muestra confirmación al salir si hay cambios sin guardar
  const [isDirty, setIsDirty] = useState(false); // Indica si hay cambios sin guardar
  const [showLoginModal, setShowLoginModal] = useState(false); // Controla si se muestra el modal de login
  const { isAuthenticated, isLoading: authLoading, signIn, signOut } = useAuth(); // Hook de autenticación
  const { notifications, showNotification, closeNotification } = useNotifications(); // Gestiona notificaciones (feedback al usuario)
  const {
    contentList, 
    isLoading, 
    isLoadingList,
    loadContentList, 
    deleteContent, 
    restoreContent,
    saveContent, 
    setContentList
  } = useContentOperations(showNotification); // Operaciones CRUD de contenido (listar, guardar, borrar, restaurar)

  // Carga la lista cuando se abre la pestaña 'Ver Publicaciones'
  useEffect(() => {
    if (activeTab === "list" && open) loadContentList(); // Solo ejecuta su lógica si la pestaña activa (activeTab) es "list" (es decir, el usuario está viendo la lista de publicaciones)
  }, [activeTab, open]); // O si el modal del editor está abierto (open es true)

  // Al abrir el editor, recupera el formulario guardado en localStorage
  useEffect(() => {
  if (open) { // Verifica si el modal está abierto (open es true)
    const savedForm = localStorage.getItem("form-data"); // Busca en localStorage el ítem "form-data", que contiene el estado del formulario guardado previamente
    if (savedForm) setFormData(JSON.parse(savedForm)); // Si existe ese dato guardado, lo convierte de texto a objeto con JSON.parse. Actualiza el estado del formulario (formData) con esos datos usando setFormData
  }
  }, [open]); // Solo se ejecuta cuando cambia el estado 'open' (al abrir o cerrar el modal)

  // Guarda el estado del formulario en localStorage cada vez que cambia
  useEffect(() => {
    if (open) localStorage.setItem("form-data", JSON.stringify(formData)); // Verifica si el modal está abierto y guarda el estado actual del formulario (formData) en localStorage bajo la clave "form-data", convirtiéndolo a texto con JSON.stringify
  }, [formData, open]);

  // ✅ Edita contenido
  // Carga los datos de un contenido para editar, actualiza el formulario y dispara eventos para el editor visual
  const startEditing = (content: ContentItem) => {
    setFormData(ContTrans.transformContentItemToFormData(content));

    localStorage.setItem("editor-content", content.content); // Guarda el contenido HTML en localStorage para que el editor visual lo recupere si es necesario
    setEditingContent(content); // Marca el contenido como el que se está editando
    setActiveTab("create"); // Cambia la pestaña activa a "Crear/Editar contenido
    showNotification(`📝 "${content.title}" cargado para editar`, "success"); // Muestra una notificación indicando que el contenido está listo para editar

    setTimeout(() => { // Usa setTimeout para ejecutar el código después de 100 ms. Esto asegura que el estado del formulario y el editor estén actualizados antes de disparar el evento
      window.dispatchEvent(new CustomEvent("editor-content-updated", { // Dispara un evento personalizado (CustomEvent) llamado "editor-content-updated" en el objeto window
        detail: { // Envía un objeto detail con:
          html: content.content, // El contenido HTML del post
          json: (content as any).content_json || null, // El contenido en formato JSON (si existe, por ejemplo, si el editor visual lo soporta)
          forceHtml: !(content as any).content_json // Un booleano que indica si debe forzar el uso de HTML (cuando no hay JSON disponible)
        } 
      }));
    }, 100);
    setIsDirty(false); // Marca que no hay cambios sin guardar al cargar el contenido
  };

  // ✅ Crea nuevo contenido
  // Limpia el estado del editor y formulario y prepara para crear nuevo contenido
  const startCreating = () => {
    setEditingContent(null); // Limpia el contenido que se estaba editando
    const freshData = getDefaultFormData(); // Obtiene los valores por defecto del formulario
    setFormData(freshData); // Inicializa el formulario con los valores por defecto
    localStorage.removeItem("editor-content"); // Elimina cualquier dato previo guardado en localStorage (tanto el contenido como el formulario)
    localStorage.removeItem("form-data");
    setActiveTab("create"); // Cambia la pestaña activa a "Crear"
    setIsDirty(false); // Marca que no hay cambios sin guardar
    
    setTimeout(() => { // Usa setTimeout para asegurarse que el estado esté actualizado antes de disparar los eventos
      window.dispatchEvent(new CustomEvent("editor-content-updated", { 
        detail: { content: "", json: null, forceEmpty: true } // Envía un evento personalizado para que el editor visual (Tiptap) limpie su contenido
      }));
      window.dispatchEvent(new CustomEvent("editor-clear-content")); // El evento editor-clear-content fuerza el borrado total del editor
      window.dispatchEvent(new CustomEvent("form-reset", { 
        detail: { formData: freshData } // Envía un evento form-reset con los datos por defecto para que cualquier otro componente (como SEOSection) también se resetee
      }));
    }, 100);
  };

  // ✅ Selecciona imagen destacada
  // Actualiza la imagen destacada en el formulario y muestra notificación
  const handleFeaturedImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, featuredImage: imageUrl })); // Usa setFormData con el estado anterior (prev) y reemplaza solo el campo featuredImage por el nuevo valor (imageUrl)
    setIsDirty(true); // Llama a setIsDirty(true) para que el sistema sepa que el usuario ha realizado una modificación y debe guardar antes de salir
    showNotification("🖼️ Imagen destacada agregada", "success"); // Usa el hook showNotification para mostrar un mensaje de éxito al usuario, mejorando la experiencia y confirmando la acción
  };

  // ✅ Resetea estado del editor
  // Limpia todos los estados y localStorage, útil al cerrar el editor
  const resetEditorState = () => {
    setFormData(getDefaultFormData()); // Limpia el formulario usando los valores por defecto definidos en getDefaultFormData()
    setEditingContent(null); // Elimina el contenido que se estaba editando
    setActiveTab("create"); // Vuelve a la pestaña "Crear Contenido" para que el usuario pueda iniciar una nueva publicación
    setIsDirty(false); // Marca que no hay cambios sin guardar
    localStorage.removeItem("form-data"); // Elimina la persistencia temporal en localStorage tanto del formulario como del contenido HTML
    localStorage.removeItem("editor-content");
  };

  // ✅ Cierra modal con confirmación
  // Si hay cambios sin guardar, muestra confirmación antes de cerrar
  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen && isDirty) { // Si el usuario intenta cerrar el modal (isOpen es false) y hay cambios sin guardar (isDirty es true), muestra una confirmación (setShowExitConfirm(true)) y no cierra el modal aún
      setShowExitConfirm(true);
      return; // Usa return para evitar que el modal se cierre si hay cambios sin guardar
    }
    setOpen(isOpen); // Cierra el modal normalmente si no hay cambios sin guardar. Actualiza el estado open con el valor recibido

    if (!isOpen) {
      resetEditorState();// Si realmente se cierra (!isOpen), llama a resetEditorState() para limpiar el formulario, el contenido editado y la persistencia temporal
    }
  };

  // ✅ Actualiza campo del formulario
  // Actualiza un campo específico del formulario y lo guarda en localStorage.
  const updateField = (field: keyof ContentFormData, value: string | number | boolean) => {
    const updated = { ...formData, [field]: value }; // Crea una copia del estado actual del formulario y actualiza solo el campo indicado (field) con el nuevo valor (value)
    setFormData(updated); // Actualiza el estado del formulario con la copia modificada
    setIsDirty(true); // Marca el formulario como "inconsistente" (hay cambios sin guardar)
    localStorage.setItem("form-data", JSON.stringify(updated)); // Guarda el estado actualizado en localStorage bajo la clave "form-data"
  };

  // ✅ Guardar contenido
  // Procesa datos SEO, métricas, llama a saveContent y actualiza estados según resultado
  const handleSaveContent = async (
    formData: ContentFormData, // Recibe el objeto con todos los datos del formulario de contenido: Título, slug, categoría, etc.
    content: string, // Recibe el contenido HTML principal del post o página
    seo: { metaTitle: string; metaDescription: string; metaKeywords: string }, // Recibe un objeto con los campos SEO básicos
    featuredImage: string, // Recibe la URL de la imagen destacada
    editingContent: ContentItem | null, // Recibe el objeto del contenido que se está editando (si existe). Si es null, significa que se está creando un nuevo contenido. Si tiene valor, se está actualizando un contenido existente
    json?: any // Recibe el contenido en formato JSON (opcional)
  ) => {
    // Construye el objeto processedSEO de tipo ProcessedSEOData, que reúne todos los metadatos SEO y sociales necesarios para el contenido antes de guardarlo en la base de datos
    const processedSEO: ProcessedSEOData = {
      metaTitle: formData.metaTitle || seo.metaTitle || formData.title, // Usa el título SEO del formulario, si no existe toma el del objeto seo, y si tampoco existe, usa el título principal del contenido
      metaDescription: formData.metaDescription || seo.metaDescription, // Prioriza la descripción SEO del formulario, luego la del objeto seo
      metaKeywords: formData.metaKeywords || seo.metaKeywords,
      canonicalUrl: formData.canonicalUrl || "", // Toma la URL canónica del formulario o deja vacío si no existe
      metaRobots: formData.metaRobots || "index, follow", // Usa la directiva de robots del formulario o un valor por defecto "index, follow"
      ogTitle: formData.ogTitle || formData.title, // Título para Open Graph (redes sociales), prioriza el formulario y luego el título principal, descripción e imagen destacada
      ogDescription: formData.ogDescription || formData.metaDescription,
      ogImage: formData.ogImage || formData.featuredImage,
      twitterTitle: formData.twitterTitle || formData.title, // Título para Twitter Card, prioriza el formulario y luego el título principal, descripción e imagen destacada
      twitterDescription: formData.twitterDescription || formData.metaDescription,
      twitterImage: formData.twitterImage || formData.featuredImage,
    };

    const { ContTrans } = await import('@/components/Editor/utils/contentTransformers'); // Usa await import() para cargar el módulo contentTransformers solo cuando es necesario
    const metrics = ContTrans.calculateContentMetrics(content); // Calcula métricas del contenido. Llama a ContTrans.calculateContentMetrics(content) pasando el contenido HTML actual

    const result = await saveContent(// Llama a la función saveContent (del hook useContentOperations) para guardar o actualizar el contenido en la base de datos
      formData, // Todos los datos del formulario (título, slug, categoría, tipo, estado, etc.)
      content, // El contenido HTML principal del post o página
      processedSEO, // Objeto con todos los metadatos SEO y sociales procesados
      metrics, // Métricas calculadas del contenido (palabras, tiempo de lectura, etc.)
      editingContent, // El contenido que se está editando (si existe). Si es null, se crea uno nuevo
      json // El contenido en formato JSON (opcional, para editores avanzados)
    );

    // Verifica si el guardado fue exitoso
    if (result?.data && !result.error) {
      const savedContent = Array.isArray(result.data) ? result.data[0] : result.data;
     
      if (!savedContent || !savedContent.id) {
        showNotification("❌ Error: No se recibió el ID del contenido guardado", "error");
        return result;
      }
     
      // ✅ Actualiza el estado con el contenido guardado
      setEditingContent(savedContent);
     
      const updatedFormData = ContTrans.transformContentItemToFormData(savedContent);
      setFormData(updatedFormData);
      setIsDirty(false);
     
      localStorage.setItem("editor-content", content);
      localStorage.setItem("form-data", JSON.stringify(updatedFormData));
     
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("editor-content-updated", {
          detail: {
            html: content,
            json: json || null,
            forceHtml: !json,
            skipUpdate: true
          }
        }));
      }, 100);
     
      showNotification("Contenido guardado correctamente", "success");
      return result;
     
    } else if (result?.error) {
      showNotification(`❌ Error al guardar: ${result.error.message || 'Error desconocido'}`, "error");
      return result;
    }
  };

  // ✅ Eliminar contenido
  // Elimina contenido (soft/hard), limpia el editor si era el contenido editado
  const handleDeleteContent = (id: string, permanent?: boolean) => {
    deleteContent(id, permanent); // Elimina un contenido usando el hook deleteContent, que sabe si debe hacer un borrado lógico (soft delete) o permanente (hard delete) según el parámetro 'permanent'

    // Si el post eliminado es el que está siendo editado, limpia el editor
    if (editingContent && editingContent.id === id) { // Limpia el editor si el contenido eliminado es el que está siendo editado
      setEditingContent(null); // Borra el estado de edición
      setFormData(getDefaultFormData()); // Resetea el formulario a sus valores por defecto
      setIsDirty(false); // Marca que no hay cambios sin guardar
      localStorage.removeItem("editor-content"); // Elimina la persistencia temporal en localStorage tanto del contenido...
      localStorage.removeItem("form-data"); // ... como del formulario
    }
  };

  // ✅ Estructura del modal flotante, pestañas, renderizado condicional de subcomponentes, confirmación de salida y notificaciones.
  return (
    <div className="fixed bottom-4 right-20 z-50">
      <Dialog open={open} onOpenChange={handleModalClose}>
        {/* Botón flotante para abrir el editor de contenidos (solo en desarrollo) */}
        {showTrigger && (
          <DialogTrigger asChild>
            <Button 
              className="shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                }
              }}
              disabled={authLoading}
            >
              {authLoading ? '⏳ Cargando...' : (isAuthenticated ? '✏️ Editar contenido' : '🔐 Iniciar Sesión')}
            </Button>
          </DialogTrigger>
        )}

        {/* Modal de Login */}
        {showLoginModal && !isAuthenticated && (
          <DialogContent className="max-w-md bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>🔐 Acceso al Editor</DialogTitle>
            </DialogHeader>
            <LoginForm
              onLogin={signIn}
              onClose={() => {
                setShowLoginModal(false);
                setOpen(true);
              }}
            />
          </DialogContent>
        )}

        {/* Modal del Editor (solo si está autenticado) */}
        {isAuthenticated && !showExitConfirm && (
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-cover bg-center text-white rounded-2xl shadow-xl"
            style={{
              backgroundImage: `url(${backgroundImgModalForm})`,
            }}
            onInteractOutside={(e) => {
              if (!showExitConfirm) e.preventDefault();
            }}
          >
            <DialogHeader className="pb-0">
              <div className="flex items-center justify-between mb-4">
                <DialogTitle className="text-xl font-semibold">
                  {(editingContent || formData.id) ? (
                    <>
                      <span className="text-gray-500">Editando: </span>
                      <span className="text-yellow-800 font-bold">{formData.title || editingContent?.title}</span>
                    </>
                  ) : (
                    "Gestor de Contenidos"
                  )}
                </DialogTitle>
                <div className="mr-10 flex items-center gap-4">
                  {(editingContent || formData.id) && (
                    <Button onClick={startCreating} className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-1 text-md">
                      ➕ Nueva Publicación
                    </Button>
                  )}
                  <Button 
                    onClick={signOut} 
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 text-sm"
                  >
                    🚪 Cerrar Sesión
                  </Button>
                </div>
              </div>
              {/* Pestañas del editor */}
              <div className="flex border-b border-gray-600">
                <button onClick={() => setActiveTab("create")}
                  className={`px-6 py-3 font-medium transition-colors shadow-bitcoin ${activeTab === "create" ? "text-yellow-200 border-b-2 border-blue-400 bg-blue-600/20" : "text-gray-700 hover:text-white hover:bg-white/10"}`}>
                  {(editingContent || formData.id) ? "📝 Editar Contenido" : "➕ Crear Nuevo Contenido"}
                </button>
                <button onClick={() => setActiveTab("list")}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === "list" ? "text-yellow-200 border-b-2 border-blue-400 bg-blue-600/20" : "text-gray-700 hover:text-white hover:bg-white/10"}`}>
                  📋 Ver Publicaciones
                </button>
                <button onClick={() => setActiveTab("seo")}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === "seo" ? "text-yellow-200 border-b-2 border-blue-400 bg-blue-600/20" : "text-gray-700 hover:text-white hover:bg-white/10"}`}>
                  🔍 SEO y Metadatos
                </button>
                <button
                  onClick={() => setActiveTab("structure")}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === "structure" ? "text-yellow-200 border-b-2 border-blue-400 bg-blue-600/20" : "text-gray-700 hover:text-white hover:bg-white/10"}`}
                >
                  🧭 Estructura del Sitio
                </button>
              </div>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-4">
              {/* Contenido de las pestañas sin cambios... */}
              {activeTab === "create" ? (
                <ContentForm
                  setIsDirty={setIsDirty}
                  formData={formData}
                  setFormData={setFormData}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  showNotification={showNotification}
                  saveContent={handleSaveContent}
                  isLoading={isLoading}
                  startCreating={startCreating}
                  contentList={contentList}
                  setContentList={setContentList}
                  onFeaturedImageSelect={handleFeaturedImageSelect}
                />
              ) : activeTab === "seo" ? (
                <SEOSection 
                  formData={formData} 
                  updateField={updateField}
                  contentList={contentList}
                />
              ) : activeTab === "list" ? (
                <ContentList
                  contentList={contentList}
                  isLoadingList={isLoadingList}
                  startEditing={startEditing}
                  deleteContent={handleDeleteContent}
                  startCreating={startCreating}
                  loadContentList={loadContentList}
                  restoreContent={restoreContent}
                />
              ) : activeTab === "structure" ? (
                <SiteStructurePanel />
              ) : null}
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Modal de confirmación de salida sin cambios... */}
      <EditorDialog
        open={showExitConfirm}
        title="⚠️ Cambios sin guardar"
        message="¿Estás seguro de que quieres salir? Se perderán todos los cambios no guardados."
        confirmLabel="Salir sin guardar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => {
          setShowExitConfirm(false);
          setOpen(false);
          resetEditorState();
        }}
        onCancel={() => {
          setShowExitConfirm(false);
          setOpen(true);
        }}
      />
      
      {/* Notificaciones sin cambios... */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={
            ["success", "error", "warning"].includes(notification.type)
              ? (notification.type as "success" | "error" | "warning")
              : "success"
          }
          onClose={() => closeNotification(notification.id)}
        />
      ))}
    </div>
  );
}