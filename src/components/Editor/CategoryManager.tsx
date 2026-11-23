import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabaseClient";
import { debounce } from "./utils/editorUtils";

interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  path: string;
  is_active?: boolean;
  sort_order?: number;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [savedSlugId, setSavedSlugId] = useState<string | null>(null);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});

  // Carga categorías existentes
  useEffect(() => {
    const loadCategories = async () => {
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, path, is_active, sort_order")
        .order("sort_order", { ascending: true });
      
      if (error) {
        alert(`Error al cargar categorías: ${error.message}`);
        return;
      }
      setCategories(data || []);
  
      const counts = await fetchPostCounts();
      setPostCounts(counts);
    };
    
    loadCategories();
  
    const onUpdate = () => {
      loadCategories();
    };
    window.addEventListener("categories-updated", onUpdate);
    return () => window.removeEventListener("categories-updated", onUpdate);
  }, []);

  // Función auxiliar para generar slugs
  const specialSlug = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Crea una nueva categoría
  const handleCreate = async () => {
    const name = (newCategory.name || "").trim();

    if (!name) {
      alert("El nombre es obligatorio");
      return;
    }

    const slug = specialSlug(name);
    const path = `/${slug}/`;
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, slug, description: newCategory.description, path }])
      .select();
  
    if (error) {
      alert("Error al crear la categoría");
      return;
    }
  
    setCategories(prev => [...prev, data[0]]);
    setNewCategory({ name: "", description: "" });
  };    

  // Edita el nombre o la descripción (Guarda automáticamente)
  const handleEdit = async (id: string, field: string, value: string) => {
    // Actualiza en el estado local inmediatamente
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );

    // Genera 'slug' y 'path' automáticamente a partir del nombre
    if (field === "name") {
      const slug = specialSlug(value);
      const path = `/${slug}/`;

      // Refleja cambios en el estado
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, name: value, slug, path } : c))
      );

      // Guarda con debounce (espera 1.5 s sin más cambios)
      debouncedSave(id, { name: value, slug, path });
    } else if (field === "slug") {
      const clean = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const path = `/${clean}/`;

      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, slug: clean, path } : c))
      );

      debouncedSave(id, { slug: clean, path });
    } else {
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
      );
      debouncedSave(id, { [field]: value });
    }
  };

  // Elimina una categoría definitivamente
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    await supabase.from("categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Copia URL al portapapeles
  const handleCopyUrl = (path: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    alert("URL copiada al portapapeles");
  };

  // Alterna estado activo/oculto de la categoría
  const handleToggleActive = async (id: string, value: boolean) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: value } : c))
    );
    await supabase.from("categories").update({ is_active: value }).eq("id", id);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
  
    const updated = Array.from(categories);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
  
    // Actualiza orden en memoria
    const reordered = updated.map((cat, index) => ({ ...cat, sort_order: index }));
    setCategories(reordered);
  
    // Guarda en Supabase
    for (const cat of reordered) {
      await supabase
        .from("categories")
        .update({ sort_order: cat.sort_order })
        .eq("id", cat.id);
    }
  };

  const debouncedSave = debounce(async (id: string, updates: Record<string, any>) => {
    await supabase.from("categories").update(updates).eq("id", id);
    
    // 🟢 Muestra “Guardado exitoso” automáticamente
    setSavedSlugId(id);
    setTimeout(() => setSavedSlugId(null), 5000);
  }, 1500);

  const fetchPostCounts = async () => {
    const { data, error } = await supabase
      .from("content")
      .select("category", { count: "exact", head: false });
  
    if (error || !data) {
      return {};
    }
  
    // Agrupa por categoría
    const counts: Record<string, number> = {};

    data.forEach((item: any) => {
      const catVal = (item.category ?? "").toString();
      if (!catVal) return;
      counts[catVal] = (counts[catVal] || 0) + 1; // Cuenta por el valor tal cual (puede ser slug o name según el historial)
    });
  
    return counts;
  };  

  return (
    <div className="p-4 rounded-lg shadow-inner">
      <h2 className="text-xl font-bold mb-3 text-blue-800">Gestor de Categorías</h2>

      <div className="flex flex-col md:flex-row gap-2 mb-4 bg-gray-500 p-3 rounded">
        <input
          type="text"
          placeholder="Nombre de la categoría"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          className="border rounded p-2 flex-1 text-gray-900"
        />
        <input
          type="text"
          placeholder="Descripción (Opcional)"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          className="border text-gray-700 rounded p-2 flex-1"
        />
        <button type="button" onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">
          Crear
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {categories.length === 0 ? (
                <p className="text-center text-gray-500 italic">
                  No hay categorías creadas todavía.
                </p>
              ) : (
                categories
                  .filter(cat => cat.id) // ✅ Filtrar solo las que tienen ID
                  .map((cat, index) => (
                    <Draggable key={cat.id!} draggableId={cat.id!} index={index}>
                    {(prov) => (
                      <li
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-300 border rounded p-3 gap-2 shadow-md"
                      >
                        <div className="flex-1">
                          {/* Nombre */}
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => handleEdit(cat.id!, "name", e.target.value)}
                            className="font-bold text-yellow-900 border-b focus:border-blue-400 outline-none w-full bg-transparent"
                          />

                          {/* Slug editable */}
                          <input
                            type="text"
                            value={cat.slug || ""}
                            onChange={(e) => handleEdit(cat.id!, "slug", e.target.value)}
                            className="text-sm text-gray-700 border-b focus:border-blue-400 outline-none bg-transparent flex-1"
                          />
                            {savedSlugId === cat.id && (
                              <span className="text-green-600 text-xs ml-1">💾 ¡Guardado exitoso!</span>
                            )}

                          <span className="text-xs text-yellow-900 ml-5">
                            {(() => {
                              const count = postCounts[cat.slug] ?? postCounts[cat.name] ?? 0;
                              if (count === 0) return "No hay publicaciones";
                              if (count === 1) return "1 publicación";
                              return `${count} publicaciones`;
                            })()}
                          </span>

                          {/* Descripción */}
                          <textarea
                            value={cat.description || ""}
                            onChange={(e) => handleEdit(cat.id!, "description", e.target.value)}
                            className="text-sm text-gray-600 border-b focus:border-blue-400 outline-none w-full bg-transparent resize-none mt-1"
                            rows={1}
                            placeholder="Descripción..."
                          />
                          <p className="text-xs text-blue-600 mt-1">{cat.path}</p>
                        </div>

                        {/* Estado y acciones */}
                        <label className="text-gray-900 flex items-center gap-1 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cat.is_active ?? true}
                            onChange={(e) => handleToggleActive(cat.id!, e.target.checked)}
                          />
                          {cat.is_active ? "Activa" : "Oculta"}
                        </label>

                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <button onClick={() => handleCopyUrl(cat.path)} title="Copiar URL">🔗</button>
                          <button onClick={() => window.open(cat.path, "_blank")} title="Abrir URL">🌐</button>
                          <button onClick={() => handleDelete(cat.id!)} title="Eliminar">🗑️</button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
