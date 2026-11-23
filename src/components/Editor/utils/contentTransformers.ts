import { 
  ContentFormData, 
  ContentItem, 
  ContentMetrics, 
  ProcessedSEOData
 } from "../types/content.types";

// ✅ Convierte un objeto de la base de datos (ContentItem) en un objeto listo para usar en el formulario del editor (ContentFormData). Permite que el formulario del editor muestre y edite el contenido correctamente
function transformContentItemToFormData(item: ContentItem): ContentFormData {
  return {
    // Campos básicos del contenido
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    type: item.type,
    status: item.status,
    content: item.content || "",
    
    // Campos SEO básicos
    metaTitle: item.meta_title || "",
    metaDescription: item.meta_description || "",
    metaKeywords: item.meta_keywords || "",
    
    // Campos SEO avanzados
    canonicalUrl: item.canonical_url || "",
    metaRobots: item.meta_robots || "index, follow",
    ogTitle: item.og_title || "",
    ogDescription: item.og_description || "",
    ogImage: item.og_image || "",
    twitterTitle: item.twitter_title || "",
    twitterDescription: item.twitter_description || "",
    twitterImage: item.twitter_image || "",
    
    // Campos adicionales del contenido
    featuredImage: item.featured_image || "",
    customCss: item.custom_css || "",
    
    // Campos de metadatos (solo de lectura en formulario)
    contentType: item.content_type || "article",
    authorName: item.author_name || "Admin",
    
    // Campos de cálculo (solo de lectura en formulario)
    readingTime: item.reading_time || 0,
    wordCount: item.word_count || 0,
    
    // Campos de sistema (solo de lectura en formulario)
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    publishedAt: item.published_at,
    isDeleted: item.is_deleted || false
  }
};

// ✅ Esta función es clave en el flujo de edición y guardado de contenido en tu editor. Su función es transformar los datos del formulario del editor (que usa camelCase y estructura amigable para React) en un payload listo para guardar en la base de datos (que espera snake_case y ciertos formatos)
function transformFormDataToPayload(
  formData: ContentFormData, // Los datos del formulario del editor (campos editados por el usuario)
  processedContent: string, // El contenido ya procesado (por ejemplo, HTML limpio o enriquecido)
  processedSEO: ProcessedSEOData, // Los datos SEO procesados (títulos, descripciones, etc.)
  calculatedMetrics: ContentMetrics, // Métricas calculadas del contenido (palabras, tiempo de lectura, etc.)
  contentJson?: any // (opcional) Representación estructurada del contenido (útil para editores ricos como Tiptap)
) {
  return {
    ...(formData.id && { id: formData.id }),
    // Campos básicos: Se preparan los campos principales del contenido. Se limpian los espacios de title y slug. Se incluye el contenido procesado y, si existe, el JSON estructurado
    title: formData.title.trim(),
    slug: formData.slug.trim(),
    category: formData.category,
    type: formData.type,
    status: formData.status === "scheduled" && formData.publishedAt && new Date(formData.publishedAt) <= new Date()
    ? "published"
    : formData.status,
    published_at: formData.status === "scheduled" && formData.publishedAt
    ? formData.publishedAt
    : formData.status === "published" && !formData.publishedAt
      ? new Date().toISOString()
      : (formData as any).publishedAt ?? null,
    content: processedContent,
    content_json: contentJson ?? null,
    
    // SEO: Se renombran los campos SEO a snake_case, como espera la base de datos. Esto mantiene la compatibilidad con el backend y las buenas prácticas SEO
    meta_title: processedSEO.metaTitle,
    meta_description: processedSEO.metaDescription,
    meta_keywords: processedSEO.metaKeywords,
    canonical_url: processedSEO.canonicalUrl,
    meta_robots: processedSEO.metaRobots,
    
    // Campos para compartir en redes sociales (Facebook, LinkedIn, Twitter, etc.)
    og_title: processedSEO.ogTitle,
    og_description: processedSEO.ogDescription,
    og_image: processedSEO.ogImage,
    twitter_title: processedSEO.twitterTitle,
    twitter_description: processedSEO.twitterDescription,
    twitter_image: processedSEO.twitterImage,
    
    // Imagen destacada y CSS personalizado, si existen
    featured_image: formData.featuredImage || "",
    custom_css: formData.customCss?.trim() || "",
    
    // Tipo de contenido, nombre y ID del autor. Se da un valor por defecto si no existe
    content_type: formData.contentType || "Article",
    author_name: formData.authorName || "Admin",
    author_id: (formData as any).authorId ?? null,
    
    // Palabras y tiempo de lectura, calculados automáticamente
    word_count: calculatedMetrics.wordCount,
    reading_time: calculatedMetrics.readingTime,
    
    // Estado de borrado, fecha de actualización y usuario que actualiza (por defecto "Admin")
    is_deleted: formData.isDeleted || false,
    updated_at: new Date().toISOString(),
    updated_by: "Admin"
  }
};

// ✅ Permite mostrar y guardar métricas automáticas del contenido, útiles tanto para el usuario como para SEO y UX
function calculateContentMetrics(content: string) {
  // Limpieza del HTML. Esencial para evitar contar código o etiquetas como palabras
  const textContent = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Se eliminan scripts...
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // ...estilos...
    .replace(/<[^>]*>/g, '') // ...y todas las etiquetas HTML...
    .replace(/\s+/g, ' ') // ...para obtener solo el texto plano
    .trim(); // Se reemplazan múltiples espacios por uno solo y se eliminan espacios al inicio y final

  // Se divide el texto en palabras usando espacios y se filtran solo las que contienen letras (incluyendo acentos y ñ). Esto evita contar números o símbolos como palabras
  const words = textContent
    .split(/\s+/)
    .filter(word => word.length > 0 && /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(word));
  
  const wordCount = words.length; // Se obtiene la cantidad total de palabras reales

  const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // Se estima el tiempo de lectura suponiendo 200 palabras por minuto. Siempre retorna al menos 1 minuto

  return {
    wordCount,
    readingTime,
    characterCount: textContent.length, // Se cuenta la longitud total del texto plano
    paragraphs: content.split(/<\/p>/gi).length - 1 // Se cuentan los párrafos buscando la etiqueta </p> en el HTML original
  };
};

// ✅ Esta función valida que el objeto de contenido que se va a guardar cumpla con los requisitos mínimos y buenas prácticas, tanto para la base de datos como para SEO
function validateContentPayload(payload: any) {
  const requiredFields = ['title', 'slug', 'type', 'status']; // Campos requeridos: Se define un array con los campos mínimos que debe tener el contenido (title, slug, type, status)
  const missingFields = requiredFields.filter(field => !payload[field]); // Búsqueda de faltantes: Se filtran los campos requeridos que no están presentes en el payload
  const issues: string[] = []; // Inicialización de errores: Se crea un array issues para almacenar los problemas encontrados
  // Validación de campos obligatorios: Si falta algún campo requerido, se agrega un mensaje de error
  if (missingFields.length > 0) {
    issues.push(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
  }
  // Validación de longitud del título: Si el título existe pero tiene menos de 3 caracteres, se agrega un error
  if (payload.title && payload.title.length < 3) {
    issues.push('El título debe tener al menos 3 caracteres');
  }
  // Validación de formato del slug: El slug solo puede tener minúsculas, números y guiones. Si no cumple, se agrega un error
  if (payload.slug && !/^[a-z0-9-]+$/.test(payload.slug)) {
    issues.push('El slug debe contener solo letras minúsculas, números y guiones');
  }
  // Validación de longitud de meta título: Si el meta título supera los 60 caracteres, se agrega un error (buena práctica SEO)
  if (payload.meta_title && payload.meta_title.length > 60) {
    issues.push('El meta título no debe exceder 60 caracteres');
  }
  // Validación de longitud de meta descripción: Si la meta descripción supera los 160 caracteres, se agrega un error (buena práctica SEO)
  if (payload.meta_description && payload.meta_description.length > 160) {
    issues.push('La meta descripción no debe exceder 160 caracteres');
  }
  // Devuelve un objeto con:
  return {
    isValid: issues.length === 0, // Booleano, indica si no hay errores
    issues // Array de mensajes de error encontrados
  };
};

// ✅ Limpia y normaliza los valores del objeto antes de enviarlo a la base de datos.
function sanitizePayload(payload: any) {
  return {
    // Elimina espacios extra en strings. Fuerza el slug a minúsculas. Asegura que los números y booleanos sean del tipo correcto. Si algún campo está vacío, asigna un valor seguro por defecto
    ...payload,
    title: payload.title?.trim() || '',
    slug: payload.slug?.toLowerCase().trim() || '',
    meta_title: payload.meta_title?.trim() || '',
    meta_description: payload.meta_description?.trim() || '',
    meta_keywords: payload.meta_keywords?.trim() || '',
    canonical_url: payload.canonical_url?.trim() || '',
    custom_css: payload.custom_css?.trim() || '',
    
    // Asegura que los campos numéricos sean números
    word_count: Number(payload.word_count) || 0,
    reading_time: Number(payload.reading_time) || 0,
    
    // Asegura que los booleanos sean booleanos
    is_deleted: Boolean(payload.is_deleted),
    
    // Timestamps de creación y actualización
    updated_at: payload.updated_at || new Date().toISOString(),
    published_at: payload.published_at || null,
  }
};

// ✅ Elimina etiquetas y atributos peligrosos del HTML para evitar ataques XSS y otros problemas de seguridad. Es una sanitización básica. Nota: Para producción, se recomienda usar una librería especializada como DOMPurify
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Elimina scripts...
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // ...estilos...
    .replace(/on\w+="[^"]*"/gi, '') // ...iframes...
    .replace(/on\w+='[^']*'/gi, '') // ...objetos...
    .replace(/javascript:/gi, '') // ...embeds...
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '') // ...atributos de eventos inline (onClick, onLoad, etc.)...
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '') // ...y enlaces javascript...
    .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, ''); // Devuelve el HTML limpio
}
// Exportación de todas las funciones en un solo objeto para facilitar su importación y uso en otras partes de la aplicación
export const ContTrans = {
  transformContentItemToFormData,
  transformFormDataToPayload,
  calculateContentMetrics,
  validateContentPayload,
  sanitizePayload,
  sanitizeHtml,
};