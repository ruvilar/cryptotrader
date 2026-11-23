import { useState, useEffect } from "react";
import Editor from "./Editor";
import DesignSection from "./DesignSection";
import { Button } from "./ui/button";
import { useFormValidation } from "./hooks/useFormValidation";
import { generateSlug } from "./utils/slugGenerator";
import { generateSEODefaults } from "./utils/seoHelpers";
import { ContentFormData, ContentItem, ContentTypeEnum, ContentStatus } from "./types/content.types";
import { ContTrans } from "./utils/contentTransformers";
import { Eye } from "lucide-react";
import { PreviewModal } from "./PreviewModal";
import { getNormalizedType } from "./hooks/useNotifications";
import { useContentService } from "./lib/contentService";

// ✅ Define los valores válidos para los campos type y status del contenido. Se usan para validar que el usuario no seleccione opciones no permitidas
const CONTENT_TYPE_VALUES: ContentTypeEnum[] = ['post', 'page'];
const CONTENT_STATUS_VALUES: ContentStatus[] = ['draft', 'published', 'archived', 'scheduled'];

// Función normalizadora para valores de select
function normalizeSelectValue(value: string | null | undefined) { // Evita que los campos select tengan valores null o undefined, devolviendo siempre un string
  return value ?? ""; // Si value es null o undefined, retorna "" (cadena vacía). Si tiene cualquier otro valor (incluido 0, false, etc.), retorna ese valor
}

// ✅ Define la interfaz de props que recibe el componente ContentForm. Es fundamental para tipar correctamente los datos y funciones que el formulario necesita para funcionar en el editor avanzado del proyecto
interface Props {
  formData: ContentFormData; // Recibe el estado actual del formulario (título, slug, tipo, estado, SEO, etc.), tipado por ContentFormData
  setFormData: (data: ContentFormData) => void; // Función para actualizar el estado del formulario. Permite modificar cualquier campo del contenido
  editingContent: ContentItem | null; // Objeto del contenido que se está editando. Si es null, se está creando uno nuevo
  setEditingContent: (content: ContentItem | null) => void; // Función para cambiar el contenido en edición. Útil para cancelar, guardar o cambiar el modo de edición
  showNotification: (msg: string, type?: string) => void; // Función para mostrar mensajes al usuario (éxito, error, advertencia). Usa el hook useNotifications
  saveContent: ( // Función asíncrona para guardar o actualizar el contenido. Recibe todos los datos relevantes y devuelve una promesa con el resultado (data o error)
    formData: ContentFormData,
    content: string,
    seo: { metaTitle: string; metaDescription: string; metaKeywords: string },
    featuredImage: string,
    editingContent: ContentItem | null,
    json?: any
  ) => Promise<{ data?: any; error?: any }>;
  isLoading: boolean; // Indica si el formulario está guardando. Permite mostrar loaders y deshabilitar botones
  startCreating: () => void; // Función para resetear el formulario y comenzar a crear un nuevo contenido
  contentList: ContentItem[]; // Lista de todos los contenidos. Se usa para validar slugs únicos y otras operaciones
  setContentList: (list: ContentItem[]) => void; // Función para actualizar la lista de contenidos tras guardar, editar o eliminar
  setIsDirty: (dirty: boolean) => void; // Marca si el formulario ha sido modificado. Útil para advertencias de cambios no guardados
  onFeaturedImageSelect: (imageUrl: string) => void; // Función que gestiona la selección de imagen destacada desde el editor
}

// ✅ Recibe las props tipadas por la interfaz Props. Cada prop es una función o dato necesario para el funcionamiento del formulario
const ContentForm: React.FC<Props> = ({
  formData,
  setFormData,
  editingContent,
  setEditingContent,
  showNotification,
  saveContent,
  isLoading,
  setIsDirty,
  onFeaturedImageSelect,
  contentList
}) => {
  const { validate } = useFormValidation(); // Hook personalizado que provee la función validate. Permite validar los datos del formulario antes de guardar
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({}); // Estado local para guardar los errores de cada campo del formulario. Se usa para mostrar mensajes de error debajo de los inputs
  const [editorContent, setEditorContent] = useState(""); // Estado local para el contenido escrito en el editor avanzado (Tiptap). Permite sincronizar el contenido entre el editor y el formulario
  const [previewOpen, setPreviewOpen] = useState(false); // Estado local para controlar si el modal de vista previa está abierto o cerrado. Permite mostrar una previsualización del contenido antes de guardar/publicar
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; path: string }[]>([]);

  // ✅ Usa el hook useContentService para acceder a las funciones del servicio de contenido, como listar categorías, validar slugs, guardar contenido, etc. Esto permite mantener el formulario desacoplado de la implementación específica del servicio (MySQL, Supabase, etc.) y facilita la reutilización y mantenimiento del código
  const contentService = useContentService();

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await contentService.listCategories();
      setCategories(data);
    };
    fetchCategories();
  
    const handleRefresh = () => fetchCategories();
    window.addEventListener("categories-updated", handleRefresh);
    return () => window.removeEventListener("categories-updated", handleRefresh);
  }, []);

  // ✅ Utiliza el hook useEffect para escuchar los cambios realizados en el editor avanzado (Tiptap) y sincronizarlos con el estado del formulario y el almacenamiento temporal
  useEffect(() => {
    const handleEditorChange = (event: CustomEvent) => {
      const content = event.detail?.content || ""; // Escucha el evento personalizado editor-content-changed que dispara el editor cada vez que el usuario modifica el contenido
      setEditorContent(content); // Actualiza el estado local editorContent y el campo content de formData para mantener sincronizados el editor y el formulario
      updateField("content", content); // Actualiza el campo content dentro del estado formData del formulario, usando la función updateField
      setIsDirty(true); // Marca el formulario como "inconsistente", útil para mostrar advertencias si el usuario intenta salir sin guardar
      localStorage.setItem("editor-content", content); // Guarda el contenido en localStorage para evitar pérdida de datos si el usuario recarga la página o cierra el modal
    };
    window.addEventListener("editor-content-changed", handleEditorChange as EventListener);
    return () => window.removeEventListener("editor-content-changed", handleEditorChange as EventListener); // Limpia el listener cuando el componente se desmonta, evitando fugas de memoria
  }, [setIsDirty]);
  
  // ✅ Recupera el contenido guardado en localStorage cuando el formulario se monta por primera vez. Así se evita la pérdida de datos si el usuario recarga la página o vuelve al editor después de cerrar el modal
  useEffect(() => {
    const savedContent = localStorage.getItem("editor-content"); // Recupera el contenido previamente guardado en el navegador bajo la clave "editor-content"
    if (savedContent) { // Si existe contenido guardado, lo restaura en el estado local y en el editor
      setEditorContent(savedContent); // Actualiza el estado local editorContent con el contenido recuperado
      window.dispatchEvent(new CustomEvent("editor-content-updated", { // Dispara un evento personalizado para que el editor avanzado (Tiptap) reciba y cargue ese contenido restaurado
        detail: { content: savedContent } 
      }));
    }
  }, []); // Ejecuta el bloque solo una vez al montar el componente (dependencias vacías)

  // ✅ Escucha el evento de reseteo completo del formulario ("form-reset"). Esto es útil para limpiar todos los campos y estados cuando el usuario decide empezar de nuevo o cancelar la edición
  useEffect(() => {
    const handleFormReset = (event: CustomEvent) => {
      const freshData = event.detail?.formData;
      if (freshData) {
        setFormData(freshData);
        setEditorContent("");
        setFieldErrors({});
        localStorage.removeItem("editor-content");
        localStorage.removeItem("form-data");
      }
    };
    
    window.addEventListener("form-reset", handleFormReset as EventListener);
    return () => window.removeEventListener("form-reset", handleFormReset as EventListener);
  }, [setFormData]);

  // ✅ Cada vez que cambia el estado editorContent (es decir, cuando el usuario edita el contenido en el editor avanzado), este efecto actualiza el campo content dentro de formData
  // useEffect(() => {
  //   setFormData({ ...formData, content: editorContent }); // Copia todas las propiedades del objeto formData en un nuevo objeto. Luego, sobrescribe la propiedad content con el valor de editorContent
  // }, [editorContent]);

  // ✅ Función para actualizar cualquier campo del formulario y persistirlo temporalmente en localStorage
  const updateField = (field: keyof ContentFormData, value: any) => { // Recibe el nombre del campo (field) y el nuevo valor (value)
    const updated = { ...formData, [field]: value }; // Crea una copia actualizada de formData con el nuevo valor
    setFormData(updated); // Actualiza el estado del formulario con setFormData
    setIsDirty(true); // Marca el formulario como modificado usando setIsDirty(true), útil para advertencias de cambios no guardados
    localStorage.setItem("form-data", JSON.stringify(updated)); // Guarda el estado actualizado en localStorage bajo la clave "form-data", permitiendo persistencia temporal si el usuario recarga la página
  };

  // ✅ Define la función validateSlug, que se encarga de asegurar que el slug (la URL amigable del contenido) sea único dentro de la lista de contenidos. Es fundamental para evitar conflictos de URLs y mejorar el SEO
  const validateSlug = async (slug: string, title: string, currentId?: string) => {
    let finalSlug = slug || generateSlug(title); // Si el usuario no ha escrito un slug, se genera automáticamente a partir del título usando la función generateSlug
    
    const existingSlugs = contentList // Se obtiene la lista de slugs existentes en el sistema
      .filter(item => currentId ? item.id !== currentId : true) // Si se está editando un contenido, se excluye el propio (para evitar falsos positivos)
      .map(item => item.slug); // Toma la lista de contenidos (contentList) y crea un nuevo array que contiene solo los slugs de cada contenido. Así, se obtiene fácilmente la lista de URLs existentes para validar que el nuevo slug sea único
    
    let counter = 1; // Si el slug generado ya existe, se le agrega un sufijo numérico (-1, -2, etc.) hasta encontrar uno único
    let originalSlug = finalSlug; // Guarda el valor inicial del slug generado para poder reutilizarlo como base si se necesita agregarle un sufijo numérico y así asegurar que el slug final sea único.
    
    while (existingSlugs.includes(finalSlug)) { // Dentro de la función validateSlug, este bucle verifica si el slug generado (finalSlug) ya existe en la lista de slugs (existingSlugs) de otros contenidos
      finalSlug = `${originalSlug}-${counter}`; // Le agrega un sufijo numérico (-1, -2, etc.) usando la variable counter. Actualiza finalSlug con el nuevo valor y aumenta el contador
      counter++; // Repite el proceso hasta encontrar un slug que no esté en la lista
    }
    return finalSlug; // Finalmente, retorna el slug único que se puede usar para guardar el contenido sin conflictos de URL
  };

  // ✅ Se encarga de guardar el contenido (nuevo o editado) en el sistema
  const handleSave = async () => {
    const { isValid, errors } = validate(formData); // Llama a la función validate (del hook useFormValidation) pasando el estado actual del formulario (formData)
    if (!isValid) { // Booleano que indica si el formulario es válido
      setFieldErrors(Object.fromEntries(errors.map(e => [e.field, e.message]))); // Usa setFieldErrors para guardar los errores en el estado local, mapeando cada error al campo correspondiente
      showNotification(errors[0].message, getNormalizedType("warning")); // Muestra una notificación al usuario con el primer mensaje de error, usando el hook showNotification y el tipo "warning"
      return; // Sale de la función (return), evitando que se intente guardar contenido inválido
    }
    setFieldErrors({}); // Limpia los errores previos si la validación es exitosa

    // ✅ Realiza una validación adicional para asegurar que los valores de los campos type y status del formulario sean válidos antes de guardar el contenido
    const issues: string[] = []; // Inicializa un array vacío para acumular mensajes de error
    if (!CONTENT_TYPE_VALUES.includes(formData.type as ContentTypeEnum)) { // Si el campo type del formulario no está dentro de los valores permitidos ('post', 'page')...
      issues.push("El tipo de contenido no es válido"); // ...agrega un mensaje de error
    }
    if (!CONTENT_STATUS_VALUES.includes(formData.status as ContentStatus)) { // Si el campo status no es uno de los valores permitidos ('draft', 'published', 'archived')...
      issues.push("El estado del contenido no es válido"); // ...agrega otro mensaje de error
    }
    if (issues.length > 0) {
      showNotification(issues.join(", "), "error"); // Muestra una notificación al usuario con todos los mensajes de error concatenados
      return; // Sale de la función, evitando que se intente guardar contenido con valores inválidos
    }

    // ✅ Validación adicional para estado 'scheduled'
    if (formData.status === "scheduled" && !formData.publishedAt) {
      showNotification("⚠️ Debes seleccionar una fecha de publicación para el estado Programado.", "warning");
      return;
    }

    // ✅ Listener para el evento personalizado "editor-content-ready". Se encarga de procesar el contenido del editor avanzado (Tiptap) justo antes de guardar el contenido en la base de datos
    const onEditorContentReady = async (e: any) => {
      const { html, json } = e.detail; // Recibe el evento y extrae el HTML y el JSON generado por el editor
      const sanitizedHtml = ContTrans.sanitizeHtml(html); // Sanitiza el HTML usando la función sanitizeHtml de ContTrans para evitar problemas de seguridad (XSS, etiquetas no permitidas, etc.)

      // Genera un slug único usando la función validateSlug, asegurando que la URL del contenido no se repita en el sistema
      try {
        const finalSlug = await validateSlug(
          formData.slug, // Es el slug actual que el usuario ha escrito en el formulario. Si está vacío, la función validateSlug generará uno automáticamente a partir del título
          formData.title,  // Es el título del contenido. Se usa para generar un slug amigable si el campo slug está vacío.
          editingContent?.id || formData.id // Es el identificador único del contenido que se está editando. Si se está editando un contenido existente (editingContent no es null), se usa su id. Si se está creando uno nuevo, se usa el id de formData (puede ser generado temporalmente)
        );

        const seo = generateSEODefaults(formData.metaTitle || formData.title, sanitizedHtml); // Genera los metadatos SEO básicos usando el título (o metaTitle) y el HTML ya sanitizado. Esto asegura que el contenido tenga información SEO mínima aunque el usuario no la complete manualmente

        const { data, error } = await saveContent( // Llama a la función asíncrona para guardar o actualizar el contenido en la base de datos
          { ...formData, slug: finalSlug }, // Envía todos los datos del formulario (formData), sobrescribiendo el slug con el valor único generado
          sanitizedHtml, // Envía el HTML del contenido, ya sanitizado
          {
            // Envía los metadatos SEO (metaTitle, metaDescription, metaKeywords)
            metaTitle: formData.metaTitle,
            metaDescription: formData.metaDescription,
            metaKeywords: formData.metaKeywords
          },
          formData.featuredImage.trim(), // Envía la imagen destacada, recortando espacios en blanco
          editingContent, // Envía el objeto de edición actual (si existe)
          json // Envía el JSON del editor (estructura interna para renderizado y edición avanzada)
        );

        // Recibe data (si el guardado fue exitoso) y error (si hubo algún problema)
        if (error) {
          showNotification(`❌ Error: ${error.message || "No se ha podido guardar"}`, getNormalizedType("error"));
        } else if (data) {
          showNotification(`✅ "${formData.title}" guardado correctamente`, getNormalizedType("success"));

          // Si se está editando, se mantiene el contenido actualizado en el estado
          if (editingContent) {
            setEditingContent(data); // Actualiza el contenido editado con los nuevos datos
            setFormData(ContTrans.transformContentItemToFormData(data)); // Actualiza el formulario con los datos más recientes del contenido guardado
            setIsDirty(false); // Marca el formulario como "no modificado", ya que se acaba de guardar
            localStorage.setItem("form-data", JSON.stringify(ContTrans.transformContentItemToFormData(data))); // Actualiza el estado guardado en localStorage con los datos más recientes
            localStorage.setItem("editor-content", data.content || sanitizedHtml); // Actualiza el contenido del editor en localStorage con el HTML guardado o sanitizado
          } 
          
          // ✅ Muestra el reseteo completo del formulario tras guardar exitosamente el contenido. Aquí se inicializan todas las propiedades principales de ContentFormData con valores por defecto
          const freshFormData = {
            title: "",
            slug: "",
            category: "",
            type: "post" as const,
            status: "draft" as const,
            content: "",
            metaTitle: "",
            metaDescription: "",
            metaKeywords: "",
            featuredImage: "",
            customCss: "",
            canonicalUrl: "",
            metaRobots: "index, follow",
            ogTitle: "",
            ogDescription: "",
            ogImage: "",
            twitterTitle: "",
            twitterDescription: "",
            twitterImage: "",
            contentType: "article",
            authorName: "Admin",
            publishedAt: undefined,
          } as ContentFormData;
          
          setFormData(freshFormData); // Resetea el formulario a los valores por defecto
          setEditorContent(""); // Limpia el contenido del editor
          setFieldErrors({}); // Limpia cualquier error de validación previo
          localStorage.removeItem("editor-content"); // Elimina el contenido temporal guardado del editor en el navegador. Así se evita que se recupere contenido viejo en futuras ediciones
          localStorage.removeItem("form-data"); // Elimina el estado temporal del formulario guardado en localStorage. Esto asegura que el formulario se reinicie limpio la próxima vez
          setEditingContent(null); // Sale del modo edición, indicando que no hay contenido seleccionado para editar. El formulario queda listo para crear un nuevo contenido
          setIsDirty(false); // Marca el formulario como "no modificado", ya que se acaba de guardar y reiniciar. Esto evita advertencias de cambios no guardados y permite cerrar el editor sin alertas

          setTimeout(() => { // Actualiza la lista de contenidos en el componente padre (ContentEditor) para reflejar el nuevo contenido guardado o los cambios realizados
            window.dispatchEvent(new CustomEvent("editor-clear-content")); // Dispara un evento para limpiar el editor avanzado (Tiptap)
            window.dispatchEvent(new CustomEvent("editor-content-updated", { 
              detail: { html: "", json: null, forceEmpty: true } // Envía un evento personalizado para que el editor visual (Tiptap) limpie su contenido
            }));
          }, 50);
        } else {
          showNotification("⚠️ Guardado pero sin confirmación de datos", "warning"); // Caso en el que no hay error pero tampoco datos. Se muestra una advertencia al usuario
        }
      } catch (err) {
        showNotification(`❌ Error inesperado: ${err instanceof Error ? err.message : "Error desconocido"}`, "error"); // Captura cualquier error inesperado durante el proceso de guardado y muestra una notificación al usuario
      }
      window.removeEventListener("editor-content-ready", onEditorContentReady); // Remueve el listener para evitar fugas de memoria
    };
    window.addEventListener("editor-content-ready", onEditorContentReady, { once: true }); // Registra el listener antes de disparar el evento, asegurando que la respuesta del editor se procese correctamente
    window.dispatchEvent(new CustomEvent("editor-request-content")); // Solicita el contenido del editor para guardarlo, disparando el evento personalizado
  };

  return (
    <div className="grid gap-4 relative">
      {/* Botón de vista previa */}
      <div className="flex justify-end z-10">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-purple-500 hover:cyber-purple-600 mr-10"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="w-4 h-4" />
          Vista previa
        </Button>
      </div>
      
      {/* Campo título */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-800">Título *</label>
        <input
          type="text"
          placeholder="Ingresa el título de la publicación"
          value={formData.title}
          onChange={e => updateField("title", e.target.value)}
          className={`w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin ${fieldErrors.title ? "border-red-500" : ""}`}
          required
        />
        {fieldErrors.title && <span className="text-red-500 text-xs">{fieldErrors.title}</span>}
      </div>

      {/* Campo slug */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-800">Slug</label>
        <input
          type="text"
          placeholder="URL de página (Si se deja en blanco, se genera automáticamente)"
          value={formData.slug}
          onChange={e => updateField("slug", e.target.value)}
          className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
        />
      </div>

      {/* Categorías dinámicas solo si son tipo Artículo */}
      {formData.type === "post" && (
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Categoría</label>
          <select
            name="category"
            value={formData.category || ""}
            onChange={(e) => updateField("category", e.target.value)}
            className="border rounded p-2 w-full text-gray-700"
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tipo de contenido y estado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Tipo de contenido</label>
          <select
            value={formData.type}
            onChange={e => updateField("type", e.target.value as "post" | "page")}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
          >
            <option value="post">Artículo</option>
            <option value="page">Página</option>
          </select>
        </div>

        {/* Estado de publicación */}
        <div>
        <label className="block text-sm font-medium mb-1 text-gray-800">Estado</label>
        <select
          value={formData.status}
          onChange={e => {
            const newStatus = e.target.value as ContentStatus;
            const updated = {
              ...formData,
              status: newStatus,
              publishedAt: newStatus !== "scheduled" ? undefined : formData.publishedAt,
            };
            setFormData(updated);
            setIsDirty(true);
            localStorage.setItem("form-data", JSON.stringify(updated));
          }}
          className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="scheduled">Programado</option>
        </select>

        {/* Selector de fecha: visible solo cuando el estado es 'scheduled' */}
        {formData.status === "scheduled" && (
          <div className="mt-2">
            <label className="block text-xs font-medium mb-1 text-gray-600">
              Fecha de publicación
            </label>
            <input
              type="datetime-local"
              value={formData.publishedAt ? formData.publishedAt.slice(0, 16) : ""}
              onChange={e => updateField("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              className="w-full border rounded-lg p-2 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin text-sm"
            />
            {formData.publishedAt && new Date(formData.publishedAt) <= new Date() && (
              <p className="text-xs text-red-600 font-medium mt-1">
                ⚠️ Esta fecha está en el pasado. El contenido se publicará con esa fecha histórica.
              </p>
            )}
            {formData.publishedAt && new Date(formData.publishedAt) > new Date() && (
              <p className="text-xs text-blue-600 mt-1">
                🕐 Se publicará automáticamente el {new Date(formData.publishedAt).toLocaleString("es-ES")}.
              </p>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Editor de contenido */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-800">Contenido</label>
        <Editor onFeaturedImageSelect={onFeaturedImageSelect} />
      </div>

      {/* Sección de diseño y personalización */}
      <DesignSection formData={formData} updateField={updateField} onFeaturedImageSelect={onFeaturedImageSelect} />

      {/* Botón para guardar */}
      <Button onClick={handleSave} disabled={isLoading || !formData.title.trim()} className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 text-lg font-semibold">
        {isLoading ? "Guardando..." : ((editingContent || formData.id) ? "Actualizar contenido" : "Guardar contenido")}
      </Button>

      {/* Modal de vista previa */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        formData={formData}
        type={formData.type}
      />
    </div>
  );
};

export default ContentForm;