import React, { useState, useEffect } from "react";
import LoadingSpinner from "./ui/loadingSpinner";
import { ContentItem } from "./types/content.types";
import { useNotifications } from "./hooks/useNotifications";
import EditorDialog from "./EditorDialog";
import { useContentService } from "./lib/contentService";

interface Props {
  contentList: ContentItem[];
  isLoadingList: boolean;
  startEditing: (item: ContentItem) => void;
  deleteContent: (id: string, permanent?: boolean) => void;
  restoreContent: (id: string) => void;
  startCreating: () => void;
  loadContentList: () => void;
}

// Listado y filtros de publicaciones
const ContentList: React.FC<Props> = ({
  contentList,
  isLoadingList,
  startEditing,
  deleteContent,
  restoreContent,
  startCreating,
  loadContentList
}) => {
  const [categories, setCategories] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("todas"); // Guarda la categoría seleccionada para filtrar publicaciones
  const [searchTerm, setSearchTerm] = useState(""); // Guarda el texto de búsqueda para filtrar publicaciones por título
  const [dateFilter, setDateFilter] = useState<{from: string, to: string}>({from: "", to: ""}); // Guarda el rango de fechas para filtrar publicaciones por fecha de actualización
  const [sortBy, setSortBy] = useState<'title' | 'updated_at' | 'word_count' | 'reading_time'>('updated_at'); // Determina el campo por el que se ordenan las publicaciones
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Determina si el orden es ascendente (asc) o descendente (desc)
  const [currentPage, setCurrentPage] = useState(1); // Guarda el número de página actual para la paginación
  const [itemsPerPage, setItemsPerPage] = useState(5); // Determina cuántos elementos se muestran por página
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Controla si el diálogo de confirmación para eliminar/restaurar está abierto
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null); // Guarda el ID de la publicación pendiente de eliminar/restaurar
  const [showTrash, setShowTrash] = useState(false); // Indica si se está mostrando la papelera (publicaciones eliminadas)
  const [typeFilter, setTypeFilter] = useState<"all" | "post" | "page">("all"); // Guarda el tipo de contenido seleccionado para filtrar (todos, solo posts o solo páginas)
  const { showNotification } = useNotifications(); // Hook personalizado para mostrar notificaciones al usuario (feedback visual)

  // Carga categorías al montar el componente y cuando se actualicen
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

  // Detectar dominio automáticamente
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://tudominio.com';

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "Sin categoría";
    const category = categories.find(cat => 
      cat.slug === categoryId || cat.id === categoryId || cat.name === categoryId
    );
    return category ? category.name : categoryId;
  };

  // Función para construir URL completa según el tipo de contenido
  const getContentUrl = (content: ContentItem) => {
    if (!content.slug) return null;
    
    if (content.type === 'page') {
      // Las páginas van directamente en la raíz
      return `${baseUrl}/${content.slug}`;
    } else {
      // Los posts incluyen la categoría en la URL
      const categorySlug = content.category || 'sin-categoria';
      return `${baseUrl}/${categorySlug}/${content.slug}`;
    }
  };

  // ✅ Función clave para mostrar solo los contenidos relevantes según los filtros activos en la interfaz del editor
  const filteredAndSortedContent = contentList
    .filter((content) => { // Aplica una función de filtrado sobre cada elemento de contentList
      if (showTrash && !content.is_deleted) return false; // Si estás en la vista de papelera (showTrash es true), solo muestra los contenidos marcados como eliminados (is_deleted)
      if (!showTrash && content.is_deleted) return false; // Si estás en la vista normal, oculta los eliminados

      // Filtros combinados: tipo, categoría, búsqueda por título y rango de fechas
      const matchesType = typeFilter === "all" || content.type === typeFilter;
      // Si el filtro de tipo es "all", muestra todo. Si no, solo muestra los contenidos que coinciden con el tipo seleccionado (post o page)
      const matchesCategory = typeFilter === "page"
        ? true
        : activeCategory === "todas" || content.category === activeCategory; // Si el filtro de tipo es "page", ignora el filtro de categoría (si es una página, no se filtra por categoría). Si el filtro de tipo no es "page", solo muestra los contenidos que pertenecen a la categoría seleccionada o si se seleccionó "todas"
      
      const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()); // Convierte el título y el término de búsqueda a minúsculas para comparar sin importar mayúsculas/minúsculas. Solo muestra los contenidos cuyo título incluye el texto buscado
      
      const matchesDate = (() => {
        if (!dateFilter.from && !dateFilter.to) return true; // Si no hay filtro de fechas, muestra todo
        const contentDate = new Date(content.updated_at).toISOString().split('T')[0]; // Convierte la fecha de actualización del contenido a formato YYYY-MM-DD
        const fromMatch = !dateFilter.from || contentDate >= dateFilter.from; // Si hay fecha "desde", solo muestra los contenidos actualizados después o igual a esa fecha
        const toMatch = !dateFilter.to || contentDate <= dateFilter.to; // Si hay fecha "hasta", solo muestra los contenidos actualizados antes o igual a esa fecha
        return fromMatch && toMatch;
      })();
      
      return matchesType && matchesCategory && matchesSearch && matchesDate; // Solo se incluyen los contenidos que cumplen todos los filtros activos
    })
    // Ordenar
    .sort((a, b) => { // Ordena el array filtrado usando una función de comparación personalizada
      let valA = sortBy === 'updated_at' ? new Date(a[sortBy]).getTime() : 
                a[sortBy] || ''; // Si el campo de orden es updated_at (fecha), convierte el valor a un timestamp numérico para comparar correctamente
      let valB = sortBy === 'updated_at' ? new Date(b[sortBy]).getTime() : 
                b[sortBy] || ''; // Si es otro campo (title, word_count, reading_time), toma el valor directamente. Si no existe, usa cadena vacía para evitar errores
                
      // Si el valor es un string (por ejemplo, el título), lo convierte a minúsculas para que la comparación no dependa de mayúsculas/minúsculas          
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      return sortOrder === 'asc' 
        ? (valA > valB ? 1 : -1) // Si el orden es ascendente (asc), devuelve 1 si valA es mayor que valB, -1 si es menor
        : (valA < valB ? 1 : -1); // Si el orden es descendente (desc), invierte la comparación
    });

  const totalPages = Math.ceil(filteredAndSortedContent.length / itemsPerPage); // Calcula cuántas páginas hay en total, según la cantidad de elementos filtrados y el número de elementos por página. Usa Math.ceil para redondear hacia arriba y asegurar que todas las publicaciones se muestren

  const paginatedContent = filteredAndSortedContent.slice( // Usa .slice() para obtener solo los elementos que corresponden a la página actual
    (currentPage - 1) * itemsPerPage, // El primer parámetro es el índice inicial, el segundo es el índice final (no incluido)
    currentPage * itemsPerPage // Así se muestra solo el subconjunto de publicaciones que el usuario debe ver en esa página
  );

  const getReadingTimeLabel = (wordCount: number) => {
    const wordsPerMinute = 200; // Calcula el tiempo estimado de lectura en minutos, usando un promedio de 200 palabras por minuto
    const minutes = Math.max(1, Math.round(wordCount / wordsPerMinute)); // Usa Math.max(1, ...) para asegurar que nunca sea menos de 1 minuto
    return `${minutes} minuto${minutes > 1 ? 's' : ''} de lectura aproximado${minutes > 1 ? 's' : ''}`; // Devuelve una cadena amigable para mostrar al usuario, adaptando el plural según corresponda
  };

  return (
    <div className="py-4">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 text-blue-900">📋 Ver publicaciones</h2>
        <p className="text-gray-700">Analiza todas las publicaciones guardadas y publicadas por categorías o por títulos</p>
      </div>
      {isLoadingList ? (
        <LoadingSpinner /> // Indicador de carga mientras se consulta la lista
      ) : contentList.length === 0 ? (
        <div className="text-center py-8 text-gray-300">
          <p className="text-xl mb-2">📝</p>
          <p className="text-red-900 font-bold">No hay publicaciones creadas</p>
          {/* Botón para crear la primera publicación */}
          <button
            onClick={startCreating}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear primera publicación
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Contenedor de filtros */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-600">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              🔍 Filtros de búsqueda
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por tipo de contenido */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    const val = e.target.value as "all" | "post" | "page";
                    setTypeFilter(val);
                    if (val === "page") setActiveCategory("todas");
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-sm rounded border border-gray-500 bg-gray-800 text-white"
                >
                  <option value="all">Todos</option>
                  <option value="post">📄 Artículos</option>
                  <option value="page">📋 Páginas</option>
                </select>
              </div>

              {/* Filtro por categoría */}
              <div className={typeFilter === "page" ? "opacity-40 pointer-events-none" : ""}>
                <label className="block text-sm text-gray-300 mb-1">
                  Categoría {typeFilter === "page" && <span className="text-xs text-gray-500">(solo artículos)</span>}
                </label>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  disabled={typeFilter === "page"}
                  className="w-full px-2 py-1 text-sm rounded border border-gray-500 bg-gray-800 text-white"
                >
                  <option value="todas">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug ?? cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Búsqueda por título */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Buscar título</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título..."
                  className="w-full px-2 py-1 text-sm rounded border border-gray-500 bg-gray-800 text-white"
                />
              </div>

              {/* Filtro por fechas */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Fecha desde</label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({...prev, from: e.target.value}))}
                  className="w-full px-2 py-1 text-sm rounded border border-gray-500 bg-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Fecha hasta</label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter(prev => ({...prev, to: e.target.value}))}
                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-500 bg-gray-700 text-white"
                  />
                  <button
                    onClick={() => setDateFilter({from: "", to: ""})}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    title="Limpiar fechas"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Ordenamiento */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Ordenar por</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-sm rounded border border-gray-500 bg-gray-800 text-white"
                >
                  <option value="updated_at-desc">📅 Más reciente</option>
                  <option value="updated_at-asc">📅 Más antiguo</option>
                  <option value="title-asc">🔤 Título A-Z</option>
                  <option value="title-desc">🔤 Título Z-A</option>
                  <option value="word_count-desc">📝 Más palabras</option>
                  <option value="reading_time-desc">⏱️ Más tiempo lectura</option>
                </select>
              </div>

              {/* Elementos por página */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Por página</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-2 py-1 text-sm rounded border border-gray-500 bg-gray-800 text-white"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>
          </div>

          {/* Barra de información y acciones */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {showTrash ? "🗑️ Papelera" : "Publicaciones"} ({filteredAndSortedContent.length})
              {filteredAndSortedContent.length > itemsPerPage && (
                <span className="ml-2 text-sm font-normal">
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </h3>

            <div className="flex gap-2">
              {!showTrash ? (
                <button
                  onClick={() => setShowTrash(true)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ Ver Papelera ({contentList.filter(c => c.is_deleted).length})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowTrash(false);
                    loadContentList();
                  }}
                  
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  ⬅️ Salir de la Papelera
                </button>
              )}

              <button
                onClick={loadContentList}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {/* Lista principal de publicaciones filtradas */}
          {paginatedContent.map((content) => (
            <div key={content.id} className="bg-white/10 rounded-lg p-4 border-4 border-double border-gray-600">
              <div className="flex justify-between items-start relative">
                <div className="flex-1">
                  <h4 className="font-bold text-blue-700 mb-3 text-xl shadow-md ml-5" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.6)" }}>{content.title}</h4>

                  {/* Etiquetas visuales de tipo, estado y métricas */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-2">
                    <span className={`px-2 py-1 rounded text-xs text-gray-700 font-bold ${
                      content.type === "post" ? "bg-blue-400" : "bg-orange-200"
                    }`}>
                      {content.type === "post" ? "📄 Artículo" : "📋 Página"}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      content.status === "published" ? "bg-green-600" : "bg-yellow-700"
                    }`}>
                      {content.status === "published" ? "✅ Publicado" : "📝 Borrador"}
                    </span>
                    <span className="text-gray-700 text-xs">
                      {content.word_count} palabras / {getReadingTimeLabel(content.word_count)}
                    </span>
                  </div>

                  {/* Meta info detallada y campos opcionales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-300 mt-4">
                    {content.type === "post" && (
                      <div>
                        <p className="font-semibold text-gray-700 text-lg shadow-sm">Categoría</p>
                        <p className="text-gray-500">{getCategoryName(content.category) || "Sin categoría"}</p>
                      </div>
                    )}
                    <div className="max-w-64">
                      <p className="font-semibold text-gray-700 text-lg shadow-sm">Meta título</p>
                      <p className="text-gray-500">{content.meta_title || "Sin definir"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 text-lg shadow-sm">Meta descripción</p>
                      <p className="text-gray-500">{content.meta_description?.slice(0, 200) || "Sin definir"}</p>
                    </div>
                    {content.meta_keywords && (
                      <div>
                        <p className="font-semibold text-gray-700 text-lg shadow-sm">Palabras clave</p>
                        <p className="text-gray-500">{content.meta_keywords}</p>
                      </div>
                    )}
                    {content.featured_image && (
                      <div>
                        <p className="font-semibold text-gray-700 text-lg shadow-sm">Imagen destacada</p>
                        <div className="w-48 h-32 rounded border border-gray-700 mt-1 bg-gray-200">
                          <img
                            src={content.featured_image}
                            alt={`Imagen destacada: ${content.title}`}
                            className="w-48 h-32 object-cover rounded"
                            onError={(e) => {
                              // Intenta recargar la imagen una vez
                              const img = e.currentTarget as HTMLImageElement;
                              if (!img.dataset.retried) {
                                img.dataset.retried = 'true';
                                img.src = img.src + '?retry=' + Date.now();
                              } else {
                                const parent = img.parentElement; // Si falla después del reintento, mostrar placeholder mejorado con imagen por defecto
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-48 h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 border-2 border-dashed border-gray-400 rounded">
                                      <div class="text-center p-2">
                                        <div class="text-2xl mb-1">📷</div>
                                        <div class="text-xs font-medium">Sin imagen</div>
                                        <div class="text-xs opacity-75">No disponible</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }
                            }}
                            onLoad={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.dataset.retried = '';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-700 text-lg shadow-sm">URL</p>
                      {(() => {
                        const url = getContentUrl(content);
                        return url ? (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline underline break-all cursor-pointer"
                            style={{ cursor: 'pointer' }}
                          >
                            {url}
                          </a>
                        ) : (
                          <span className="text-gray-500">Sin slug definido</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Acciones de edición y borrado */}
                <div className="flex gap-2 ml-4">
                  {!showTrash ? (
                    <>
                      <button
                        onClick={() => startEditing(content)}
                        className="px-3 py-1 bg-blue-400 font-bold text-white rounded hover:bg-blue-400 transition-colors text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          setPendingDeleteId(content.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-400 transition-colors text-sm font-bold"
                      >
                        🗑️ Eliminar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          restoreContent(content.id);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition-colors text-sm"
                      >
                        ♻️ Restaurar
                      </button>
                      <button
                        onClick={() => {
                          // Eliminar definitivamente
                          setPendingDeleteId(content.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        ❌ Eliminar
                      </button>
                    </>
                  )}
                </div>

                <p className="text-blue-700 font-medium text-sm text-right w-full absolute bottom-0">
                {content.published_at ? "Publicado" : "Actualizado"}:{" "}
                {new Date(content.published_at || content.updated_at).toLocaleDateString("es-ES")} a las{" "}
                {new Date(content.published_at || content.updated_at).toLocaleTimeString("es-ES")}
                </p>
              </div>
            </div>
          ))}
          
          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                ⏮️ Primera
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                ◀️ Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const pageNum = start + i;
                  
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Siguiente ▶️
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Última ⏭️
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Diálogo de confirmación para eliminar publicación */}
      <EditorDialog
        open={deleteDialogOpen}
        title={
          <h3 className="text-lg font-bold text-red-700">
            {showTrash ? "¿Eliminar definitivamente?" : "¿Mover a la papelera?"}
          </h3>
        }
        message={
          showTrash 
          ? <p className="text-gray-700 mt-2">
              Esta acción <span className="font-bold text-red-600">no se puede deshacer</span>.<br />
              ¿Seguro que quieres eliminar esta publicación?
            </p>
          : <p>
              <span className="font-bold text-red-600">¿Seguro que quieres mover esta publicación a la papelera?</span>.<br />
              Podrás restaurarla más tarde si lo deseas.
          </p>
        }
        confirmLabel={
          <span className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white font-semibold">
            Sí, eliminar
          </span>
        }
        cancelLabel={
          <span className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800 font-semibold mr-2">
            Cancelar
          </span>
        }
        destructive
        onConfirm={() => {
          if (pendingDeleteId) {
            if (showTrash) {
              // Hard delete definitivo
              deleteContent(pendingDeleteId, true);
              showNotification("❌ Publicación eliminada definitivamente.", "success");
            } else {
              // Soft delete (mover a papelera)
              deleteContent(pendingDeleteId, false);
              showNotification("📥 Publicación movida a la papelera.", "success");
            }
        
            setDeleteDialogOpen(false);
            setPendingDeleteId(null);
          }
        }}       
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
};

export default ContentList;
