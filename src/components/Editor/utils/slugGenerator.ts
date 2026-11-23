// ✅ Define las opciones configurables para la generación de slugs. Permite personalizar longitud máxima/mínima, si se preservan números, reemplazos personalizados y un sufijo opcional
export interface SlugOptions {
  maxLength?: number; // Define la longitud máxima permitida para el slug generado. Limita el slug a, por ejemplo, 60 caracteres para SEO
  minLength?: number; // Define la longitud mínima que debe tener el slug. Evita slugs demasiado cortos que puedan ser poco descriptivos o causar conflictos
  preserveNumbers?: boolean; // Indica si los números deben conservarse en el slug. Si es true, los números del título original se mantienen; si es false, se eliminan
  customReplacements?: Record<string, string>; // Permite definir reemplazos personalizados de texto antes de la generación del slug. Cambia palabras clave, símbolos o caracteres específicos por otros valores según necesidades del proyecto
  suffix?: string; // Permite añadir un sufijo personalizado al final del slug. Diferencia slugs similares o añadir información extra (por ejemplo, un año o identificador)
}

// ✅ Función que recibe un title (string) y un objeto de opciones (SlugOptions). Devuelve un string que será el slug generado
export const generateSlug = (title: string, options: SlugOptions = {}): string => {
  // Extrae de options los parámetros configurables, asignando valores por defecto si no se pasan:
  const {
    maxLength = 60, // El slug no superará 60 caracteres
    minLength = 3, // El slug tendrá al menos 3 caracteres
    preserveNumbers = true,  // Por defecto, se conservan los números en el slug
    customReplacements = {}, // No hay reemplazos personalizados, salvo que se indique
    suffix = "" // No se añade sufijo, salvo que se indique
  } = options;

  // Si el título es vacío o solo contiene espacios, retorna un string vacío. Esto previene errores y slugs vacíos
  if (!title || title.trim().length === 0) {
    return "";
  }

  let slug = title.trim(); // Se crea la variable slug con el título ya recortado de espacios al inicio y final, así se asegura que el procesamiento posterior parte de un string limpio

  // Recorre cada entrada de customReplacements y reemplaza todas las coincidencias (insensible a mayúsculas/minúsculas) en el string. Permite adaptar el slug a reglas de negocio o SEO específicas
  Object.entries(customReplacements).forEach(([search, replace]) => {
    slug = slug.replace(new RegExp(search, 'gi'), replace);
  });

  // Normaliza y limpia el string
  slug = slug
    .toLowerCase()
    .normalize("NFD") // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos
    .replace(/[ñ]/g, "n") // Maneja ñ específicamente
    .replace(/[ç]/g, "c") // Maneja ç
    .replace(/[ß]/g, "ss") // Maneja ß alemán
    .replace(/[æ]/g, "ae") // Maneja æ
    .replace(/[œ]/g, "oe") // Maneja œ
    .replace(/[ø]/g, "o"); // Maneja ø

  if (preserveNumbers) {
    slug = slug.replace(/[^\w\s\d-]/g, ""); // Si preserveNumbers es true, elimina todo excepto letras, números, guiones y espacios
  } else {
    slug = slug.replace(/[^\w\s-]/g, ""); // Si es false, elimina también los números
  }

  slug = slug
    .replace(/\s+/g, "-") // Convierte todos los espacios a guiones
    .replace(/-+/g, "-") // Reemplaza múltiples guiones seguidos por uno solo
    .replace(/^-+|-+$/g, ""); // Elimina guiones al principio y al final del slug

  // Si se pasa un suffix, lo añade al final del slug, separado por guión. Útil para diferenciar slugs similares o añadir información extra (por ejemplo, año, id, etc)
  if (suffix) {
    slug = `${slug}-${suffix}`;
  }

  // Valida la longitud mínima
  if (slug.length < minLength) { // Si el slug es más corto que minLength...
    const words = title.split(/\s+/).filter(word => word.length >= 3); // ...intenta reconstruir el slug usando solo palabras del título que tengan al menos 3 caracteres, para hacerlo más descriptivo
    if (words.length > 0) { // Si hay palabras válidas...
      slug = generateSlug(words.join(" "), { ...options, suffix: "" }); // ...llama recursivamente a generateSlug con las palabras filtradas, sin añadir el sufijo esta vez
    }
    
    // Si aún así sigue siendo corto, asigna un valor por defecto (content) y le agrega un sufijo numérico basado en la fecha actual para asegurar que sea único y evitar conflictos
    if (slug.length < minLength) {
      slug = slug || "content";
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  // Valida la longitud máxima
  if (slug.length > maxLength) { // Si el slug supera maxLength...
    const truncated = slug.substring(0, maxLength); // ...lo recorta hasta el máximo permitido
    const lastDash = truncated.lastIndexOf("-"); // ...intenta cortar en el último guion para no dejar palabras incompletas, siempre que ese guion esté en la última parte del slug (más del 70% de la longitud máxima)
    slug = lastDash > maxLength * 0.7 ? truncated.substring(0, lastDash) : truncated; // Si no hay guion adecuado, simplemente usa el acortado
  }
  return slug; // Devuelve el slug ya validado, limpio y ajustado a las restricciones de longitud
};

// ✅ Función que garantiza que el slug generado sea único dentro de una lista de slugs existentes (por ejemplo, URLs de artículos o productos)
export const generateUniqueSlug = (
  title: string, 
  existingSlugs: string[] = [], 
  options: SlugOptions = {}
): string => {
  const baseSlug = generateSlug(title, options); // Llama a generateSlug con el título y opciones dadas para obtener el slug inicial
  // Si el slug base no existe en existingSlugs, lo retorna directamente
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1; // Si el slug base ya existe, inicia un contador (counter = 1)...
  let uniqueSlug = `${baseSlug}-${counter}`; // ...y va probando con sufijos numéricos (baseSlug-1, baseSlug-2, etc.) hasta encontrar uno que no esté en la lista
  
  // El bucle se detiene si encuentra un slug único o si el contador llega a 1000 (para evitar bucles infinitos)
  while (existingSlugs.includes(uniqueSlug) && counter < 1000) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  return uniqueSlug; // Devuelve el primer slug disponible que no esté en la lista
};

// ✅ Función que valida que un slug cumpla con las reglas SEO y de usabilidad más comunes antes de ser usado en URLs o guardado en la base de datos
export const validateSlug = (slug: string) => {
  const issues: string[] = []; // Inicializa un array de problemas (issues)

  // Si está vacío, agrega un mensaje de error
  if (!slug || slug.length === 0) {
    issues.push("El slug no puede estar vacío");
  }
  // Valida longitud mínima y máxima
  if (slug.length < 3) {
    issues.push("El slug debe tener al menos 3 caracteres");
  }
  // Valida el formato de caracteres permitidos
  if (slug.length > 60) {
    issues.push("El slug no debe exceder 60 caracteres");
  }
  // Valida guiones al inicio o final
  if (!/^[a-z0-9-]+$/.test(slug)) {
    issues.push("El slug solo puede contener letras minúsculas, números y guiones");
  }
  // Valida guiones dobles
  if (slug.startsWith("-") || slug.endsWith("-")) {
    issues.push("El slug no puede empezar o terminar con guión");
  }
  // Valida palabras reservadas
  if (slug.includes("--")) {
    issues.push("El slug no puede contener guiones dobles");
  }

  // Valida palabras reservadas
  const reservedWords = ["admin", "api", "www", "mail", "ftp", "localhost", "edit", "delete", "create", "update"]; // No puede ser una palabra reservada del sistema (como "admin", "api", "edit", etc.)
  if (reservedWords.includes(slug)) { // Si el slug coincide con alguna palabra reservada...
    issues.push("El slug no puede ser una palabra reservada del sistema"); // ...agrega un mensaje de error
  }

  // Devuelve un objeto con:
  return {
    isValid: issues.length === 0, // Booleano, si no hay errores
    issues, // Array de problemas encontrados
    suggestions: issues.length > 0 ? [ // Sugerencias generales si hay errores
      "Usa solo letras minúsculas, números y guiones",
      "Mantén entre 3-60 caracteres",
      "Evita guiones al inicio/final",
      "No uses palabras reservadas"
    ] : []
  };
};

// ✅ Función que genera varias sugerencias de slugs alternativos a partir de un título y las opciones configurables. Es útil para ofrecer al usuario varias opciones si el slug preferido ya está en uso
export const suggestSlugs = (title: string, options: SlugOptions = {}): string[] => {
  const baseSlug = generateSlug(title, options); // Genera el slug principal usando el título y las opciones dadas
  const suggestions = [baseSlug]; // Inicia un array de sugerencias con el slug principal

  // Agrega una variante que incluye el año actual, útil para diferenciar contenidos similares por año (ejemplo: "bitcoin-2025")
  const currentYear = new Date().getFullYear();
  suggestions.push(generateSlug(`${title} ${currentYear}`, options));

  // Versión abreviada (solo primeras palabras)
  const words = title.split(/\s+/).slice(0, 3); // Usa solo las primeras 3 palabras del título para crear una versión más corta, ideal para títulos largos
  if (words.length > 1) { // Solo si hay al menos 2 palabras...
    suggestions.push(generateSlug(words.join(" "), options)); // ...agrega esa versión abreviada a las sugerencias
  }

  // ✅ Filtra palabras del título que tengan más de 4 letras y que no sean palabras comunes (stopwords como "para", "con", "los", etc.), y genera un slug con hasta 4 de esas palabras. Esto ayuda a crear slugs más relevantes para SEO
  const importantWords = title.split(/\s+/).filter(word => 
    word.length > 4 && 
    !["para", "con", "los", "las", "del", "una", "este", "esta"].includes(word.toLowerCase())
  );
  if (importantWords.length > 0) { // Si hay palabras importantes...
    suggestions.push(generateSlug(importantWords.slice(0, 4).join(" "), options)); // ...usa hasta las primeras 4 para crear otro slug sugerido
  }

  return [...new Set(suggestions)]; // Usa Set para asegurarse de que no haya sugerencias repetidas y devuelve un array con todas las variantes generadas, listas para mostrar al usuario
};
