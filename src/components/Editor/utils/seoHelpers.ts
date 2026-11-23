// ✅ Declara una función exportada llamada generateSEODefaults que genera metadatos SEO a partir de un título y contenido
export const generateSEODefaults = (title: string, content: string, options?: { // title: El título del contenido (string). content: El contenido, puede ser HTML o texto plano (string). options: Opciones avanzadas para personalizar el resultado (longitud máxima, palabras a excluir, cantidad de keywords, URL base, slug). Extrae las propiedades del objeto options usando desestructuración. Si alguna propiedad no está definida, usa el valor por defecto
  maxDescriptionLength?: number; // Longitud máxima de la descripción SEO (por defecto 160)
  excludeWords?: string[]; // Palabras que se deben excluir al generar keywords (lista de palabras comunes en español)
  keywordCount?: number; // Número máximo de palabras clave a generar (por defecto 5)
  baseUrl?: string; // URL base para generar la canónica
  slug?: string; // Slug para la URL canónica
}) => {
  const { 
    maxDescriptionLength = 160, 
    excludeWords = ["para", "con", "los", "las", "del", "una", "este", "esta", "que", "por", "como", "más", "muy", "entre", "sobre", "sus", "pero", "sin", "son", "han", "desde", "hasta", "porque", "cuando", "donde", "todo", "toda", "esto", "eso", "muy", "tan", "bien", "mal", "aquí", "allí", "ahora", "antes", "después", "siempre", "nunca"],
    keywordCount = 5,
    baseUrl = "",
    slug = ""
  } = options || {};

  const cleanTitle = title.trim(); // Elimina espacios en blanco al inicio y final del título. Evita errores y asegura que el título sea limpio para mostrar y procesar
  const cleanContent = content
    .replace(/<[^>]*>/g, "") // Elimina cualquier etiqueta HTML para trabajar solo con texto plano
    .replace(/\s+/g, " ") // Convierte múltiples espacios en uno solo
    .trim(); // Elimina espacios al inicio y final

  // Si el contenido limpio supera la longitud máxima, lo recorta y añade "...". Si no, usa el contenido tal cual. Garantiza que la descripción SEO no exceda el límite recomendado por Google
  const description = cleanContent.length > maxDescriptionLength 
    ? cleanContent.substring(0, maxDescriptionLength - 3) + "..."
    : cleanContent;

  // Genera palabras clave a partir del título y contenido
  const titleWords = cleanTitle
    .toLowerCase() // Convierte a minúsculas para uniformidad
    .replace(/[^\w\sáéíóúñü]/g, "") // Solo deja letras y números
    .split(/\s+/) // Divide en palabras
    .filter(word => word.length > 3 && !excludeWords.includes(word)); // Filtra solo palabras de más de 3 letras y que no estén en la lista de exclusión

  // Procesa el contenido de forma similar para extraer palabras relevantes
  const contentWords = cleanContent
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 4 && !excludeWords.includes(word));

  const wordFreq: Record<string, number> = {}; // Crea un objeto wordFreq donde cada palabra relevante del contenido es una clave y su valor es la cantidad de veces que aparece
  contentWords.forEach(word => { // Permite identificar cuáles palabras son más frecuentes y, por lo tanto, más representativas del contenido
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const topContentWords = Object.entries(wordFreq) // Convierte el objeto de frecuencias en un array de pares [palabra, frecuencia]
    .sort(([,a], [,b]) => b - a) // Ordena el array de mayor a menor frecuencia
    .slice(0, keywordCount) // Selecciona las keywordCount palabras más frecuentes
    .map(([word]) => word); // Extrae solo la palabra (no la frecuencia)

  const keywords = [...new Set([...titleWords, ...topContentWords])] // Combina las palabras clave extraídas del título (titleWords) y las más frecuentes del contenido (topContentWords). Usa Set para eliminar duplicados
    .slice(0, keywordCount) // Limita el total a keywordCount
    .join(", "); // Une las palabras en una cadena separada por comas

  // Devuelve todos los metadatos SEO y sociales listos para usar. Incluye campos para Open Graph, Twitter, robots, tipo de contenido y autor. Permite que el editor y el backend tengan toda la información SEO necesaria para indexar y compartir el contenido correctamente
  return {
    metaTitle: cleanTitle,
    metaDescription: description,
    metaKeywords: keywords,
    canonicalUrl: baseUrl && slug ? generateCanonicalUrl(baseUrl, slug) : "",
    metaRobots: "index, follow",
    ogTitle: cleanTitle,
    ogDescription: description,
    twitterTitle: cleanTitle,
    twitterDescription: description,
    contentType: "Article",
    authorName: "Admin"
  };
};

// ✅ Define una función que genera una URL canónica limpia y optimizada para SEO
export const generateCanonicalUrl = (baseUrl: string, slug: string) => { // baseUrl: la URL base del sitio. slug: el identificador del contenido (puede contener caracteres especiales)
  const cleanSlug = slug.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"); // Limpia el slug eliminando caracteres no válidos y normaliza los guiones. Elimina la barra final de la baseUrl si existe
  return `${baseUrl.replace(/\/$/, "")}/${cleanSlug}`; // Devuelve la URL canónica final, lista para usarse en metadatos SEO
};

// ✅ Define una función que genera los metadatos sociales (Open Graph y Twitter) a partir de los datos del formulario de contenido
export const generateSocialDefaults = (formData: { // Recibe un objeto formData con posibles campos SEO y de contenido. Todos los campos son opcionales, lo que permite flexibilidad según el origen de los datos
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  title?: string;
}) => {
  const title = formData.metaTitle || formData.title || ""; // Para el título, primero usa metaTitle, si no existe usa title, y si tampoco existe, una cadena vacía
  const description = formData.metaDescription || ""; // Para la descripción y la imagen, toma el valor si existe, o una cadena vacía
  const image = formData.featuredImage || ""; // Para la imagen, también toma el valor si existe, o una cadena vacía. Así siempre hay un valor definido, evitando campos vacíos en los metadatos sociales

  // Devuelve un objeto con los campos sociales para Open Graph y Twitter. Los valores se repiten para ambos protocolos, asegurando coherencia en la vista previa social
  return {
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image
  };
};

// ✅ Función que valida la calidad de los metadatos SEO antes de guardar o publicar contenido. Es fundamental para asegurar que los campos cumplen con las buenas prácticas de SEO y evitar errores comunes
export const validateSEO = (data: { // Recibe un objeto data con los campos SEO a validar, todos opcionales
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) => {
  const issues: string[] = []; // Inicializa un array issues para registrar los problemas encontrados
  // Si no hay título, lo reporta. Menos de 30 caracteres, lo reporta. Más de 60 caracteres, lo reporta
  if (!data.metaTitle) {
    issues.push("Falta el meta título");
  } else if (data.metaTitle.length < 30) {
    issues.push("Meta título muy corto (mínimo 30 caracteres)");
  } else if (data.metaTitle.length > 60) {
    issues.push("Meta título muy largo (máximo 60 caracteres)");
  }

  // Si no hay descripción, lo reporta. Menos de 120 caracteres, lo reporta. Más de 160 caracteres, lo reporta
  if (!data.metaDescription) {
    issues.push("Falta la meta descripción");
  } else if (data.metaDescription.length < 120) {
    issues.push("Meta descripción muy corta (mínimo 120 caracteres)");
  } else if (data.metaDescription.length > 160) {
    issues.push("Meta descripción muy larga (máximo 160 caracteres)");
  }

  // Si existen, las separa por comas y limpia espacios. Menos de 3, lo reporta. Más de 10, lo reporta
  if (data.metaKeywords) {
    const keywords = data.metaKeywords.split(",").map(k => k.trim()).filter(Boolean);
    if (keywords.length < 3) {
      issues.push("Pocas palabras clave (recomendado: al menos 3)");
    } else if (keywords.length > 10) {
      issues.push("Demasiadas palabras clave (máximo recomendado: 10)");
    }
  }

  return {
    isValid: issues.length === 0, // true si no hay problemas, false si hay alguno
    issues, // Lista de problemas encontrados
    score: Math.max(0, 100 - (issues.length * 20)) // Puntuación SEO (100 menos 20 puntos por cada problema, nunca menor a 0)
  };
};
