// ✅ Define las opciones configurables para la función de validación de URLs. Permite que la función sea flexible y se adapte a distintos escenarios de uso
export interface UrlValidationOptions {
  allowedProtocols?: string[];
  allowRelative?: boolean;
  requireProtocol?: boolean;
  allowLocalhost?: boolean;
  allowIP?: boolean;
  maxLength?: number;
  customDomains?: string[];
}

export interface UrlValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  sanitizedUrl?: string;
}

// ✅ Función robusta para validar URLs con múltiples opciones configurables. Permite que la validación sea granular y adaptable según el contexto del editor o del formulario
export function validateUrl(url: string, options: UrlValidationOptions = {}): UrlValidationResult {
  const {
    allowedProtocols = ['http', 'https'], // Lista de protocolos permitidos (ej: ['http', 'https'])
    allowRelative = false, // Permite URLs relativas (ej: /ruta)
    requireProtocol = true, // Obliga a que la URL tenga protocolo (http://, https://)
    allowLocalhost = false, // Permite URLs que apunten a localhost o IPs locales
    allowIP = false, // Permite URLs con direcciones IP
    maxLength = 2048, // Longitud máxima permitida para la URL
    customDomains = [] // Lista blanca de dominios permitidos
  } = options;

  const issues: string[] = []; // Array donde se almacenarán los mensajes de error encontrados durante la validación
  const suggestions: string[] = []; // Array para sugerencias de corrección que se mostrarán al usuario si la URL no es válida
  let sanitizedUrl: string | undefined; // Variable que contendrá la versión "limpia" y normalizada de la URL si pasa todas las validaciones

  // Comprueba si el parámetro url es undefined, null o una cadena vacía (después de eliminar espacios). Si la URL está vacía, retorna inmediatamente un objeto de resultado indicando que la URL no es válida, con un mensaje de error y una sugerencia clara
  if (!url || url.trim().length === 0) {
    return {
      isValid: false,
      issues: ['La URL no puede estar vacía'],
      suggestions: ['Proporciona una URL válida (ej: https://ejemplo.com)']
    };
  }

  const trimmedUrl = url.trim(); // Elimina espacios en blanco al inicio y final de la cadena de la URL

  // Comprueba si la URL (ya sin espacios) supera el límite de caracteres permitido (maxLength). Si es así, agrega un mensaje de error al array issues
  if (trimmedUrl.length > maxLength) {
    issues.push(`La URL excede el límite de ${maxLength} caracteres`);
  }

  // Detecta si la URL no tiene un protocolo explícito (http://, https://, etc.) ni es una URL de protocolo relativo (//ejemplo.com). Permite distinguir entre URLs absolutas y relativas, y decidir cómo tratarlas según la configuración
  if (!trimmedUrl.includes('://') && !trimmedUrl.startsWith('//')) {
    // Si la opción allowRelative está activada, acepta la URL tal cual, la considera válida y termina la función. Útil para rutas internas de la web, como /articulos/bitcoin
    if (allowRelative) {
      return {
        isValid: true, // Las URLs relativas se consideran válidas
        issues: [], // No hay problemas con URLs relativas
        suggestions: [], // No hay sugerencias necesarias
        sanitizedUrl: trimmedUrl // La URL relativa se devuelve tal cual
      };
      // Si no se requiere protocolo, intenta validar la URL agregando https:// al inicio y vuelve a llamar a la función
    } else if (!requireProtocol) {
      return validateUrl(`https://${trimmedUrl}`, options); // Intentar agregar https por defecto
    } else {
      issues.push('La URL debe incluir un protocolo (http:// o https://)'); // Mensaje de error si se requiere protocolo
      suggestions.push(`Intenta: https://${trimmedUrl}`); // Sugerencia para agregar https://
    }
  }

  try {
    const urlObj = new URL(trimmedUrl); // Intenta crear un objeto URL a partir de la cadena. Si la URL es inválida, lanzará una excepción que será capturada más adelante. Permite acceder fácilmente a partes de la URL (protocolo, hostname, pathname, etc.) y asegura que la URL tiene un formato estándar
    
    const protocol = urlObj.protocol.slice(0, -1); // Extrae el protocolo (sin el : final) y verifica si está en la lista de permitidos (allowedProtocols)
    if (!allowedProtocols.includes(protocol)) { // Si no está permitido, agrega un mensaje de error
      issues.push(`Protocolo '${protocol}' no permitido. Protocolos permitidos: ${allowedProtocols.join(', ')}`);
      if (protocol === 'http' && allowedProtocols.includes('https')) { // Si el protocolo es http y se permite https, sugiere cambiar a HTTPS
        suggestions.push(`Usa HTTPS: ${trimmedUrl.replace('http:', 'https:')}`);
      }
    }

    // Verifica si el hostname es localhost, 127.0.0.1 o termina en .localhost, y si la opción allowLocalhost está desactivada, agrega un mensaje de error
    if (!allowLocalhost && (
      urlObj.hostname === 'localhost' || 
      urlObj.hostname === '127.0.0.1' ||
      urlObj.hostname.endsWith('.localhost')
    )) {
      issues.push('URLs localhost no están permitidas'); // Si no se permite localhost (allowLocalhost es false), agrega un mensaje de error
    }

    // Verifica si el hostname de la URL es una dirección IP (ejemplo: 192.168.1.1) y si la opción allowIP es false, agrega un mensaje de error y una sugerencia
    if (!allowIP && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
      issues.push('Direcciones IP no están permitidas'); // Si no se permiten IPs (allowIP es false), agrega un mensaje de error
      suggestions.push('Usa un nombre de dominio en lugar de una dirección IP'); // Sugerencia para usar un dominio
    }

    // Si se ha definido una lista blanca de dominios (customDomains), verifica que el dominio de la URL esté en esa lista o sea un subdominio permitido
    if (customDomains.length > 0) {
      // Verifica si el hostname coincide exactamente con algún dominio permitido o es un subdominio de uno de ellos (en caso de dominios como ejemplo.com, sub.ejemplo.com sería válido)
      const isAllowedDomain = customDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      // Si el dominio no está en la lista blanca, agrega un mensaje de error indicando los dominios permitidos
      if (!isAllowedDomain) {
        issues.push(`Dominio no permitido. Dominios permitidos: ${customDomains.join(', ')}`);
      }
    }

    // Si el hostname está vacío (por ejemplo, si la URL es solo el protocolo o está mal formada), agrega un error. Garantiza que la URL apunte a un dominio real, evitando entradas incompletas o mal formateadas
    if (!urlObj.hostname) {
      issues.push('La URL debe tener un dominio válido');
    }

    // Si no se detectaron problemas (issues.length === 0), convierte la URL a su forma canónica y la guarda como sanitizedUrl. Permite devolver una versión limpia y estandarizada de la URL, útil para guardar en base de datos o mostrar en la UI
    if (issues.length === 0) {
      sanitizedUrl = urlObj.toString();
    }

  } catch (error) { // Ayuda al usuario a corregir errores comunes de tipeo o formato, mejorando la experiencia y reduciendo frustraciones. Si ocurre un error al crear el objeto URL (por formato inválido), agrega un error general y sugiere correcciones típicas:
    issues.push('Formato de URL inválido');
    
    // Agrega protocolo si falta
    if (!trimmedUrl.includes('://')) {
      suggestions.push(`Intenta: https://${trimmedUrl}`);
    }
    // Elimina espacios
    if (trimmedUrl.includes(' ')) {
      suggestions.push('Elimina los espacios de la URL');
    }
    // Revisa puntos dobles
    if (trimmedUrl.includes('..')) {
      suggestions.push('Verifica que no haya puntos dobles en la URL');
    }
  }
  // Devuelve el resultado de la validación, incluyendo:
  return {
    isValid: issues.length === 0, // Si la URL es válida
    issues, // Problemas encontrados
    suggestions, // Sugerencias de corrección
    sanitizedUrl // La URL sanitizada (si es válida)
  };
}

export const UrlUtils = {
  isValidUrl,
  normalizeUrl,
  areUrlsEquivalent,
  isValidHttpsUrl,
  sanitizeUrl,
  extractDomain,
};

// ✅ Función simple para validar URLs básicas (https y dominios específicos)
function isValidUrl(url: string) { // Intenta crear un objeto URL a partir de la cadena recibida
  try {
    const parsed = new URL(url.startsWith("http") ? url : "https://" + url); // Si la URL no empieza con "http", le agrega "https://" por defecto para asegurar que sea parseable. Permite validar URLs aunque el usuario no haya escrito el protocolo
    if (!parsed.hostname || parsed.hostname.length === 0) return false; // Verifica que el hostname no esté vacío y tenga un formato válido
    // Rechaza hostnames sin puntos (a menos que sea localhost o una IP), o que terminen en punto. Evita aceptar entradas inválidas o mal formateadas
    if (parsed.hostname !== 'localhost' && // Permite localhost
      parsed.hostname !== '127.0.0.1' && // Permite IPs locales
      !parsed.hostname.includes('.')) { // Requiere al menos un punto en el hostname para dominios válidos
    return false; // Ejemplos inválidos: "example", "localhost." o "example..com"
  }
  if (parsed.hostname.endsWith('.')) return false; // Rechaza hostnames que terminan en punto (ej: "example.")
    
    // ✅ Valida caracteres válidos en el hostname
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/; // Permite letras, números, guiones y puntos, pero no caracteres especiales o espacios. Asegura que el dominio tenga un formato estándar y válido
    if (!hostnameRegex.test(parsed.hostname)) return false; // Ejemplos inválidos: "exa mple.com", "exam!ple.com", "-example.com", "example-.com"
    
    return true; // Si todas las validaciones pasan, la URL es considerada válida
  } catch {
    return false; // Si ocurre cualquier error (por ejemplo, la URL es mal formada), retorna false
  }
}

// ✅ Función que normaliza una URL para asegurar que siempre tenga un protocolo (https:// por defecto). Evita errores al parsear URLs que el usuario ingresa sin protocolo. Garantiza que todas las URLs tengan un formato estándar antes de validarlas o guardarlas. Es especialmente útil en formularios donde los usuarios suelen omitir el protocolo
function normalizeUrl(url: string) {
  if (!url) return ""; // Si la URL está vacía, retorna una cadena vacía
  // Si la URL no comienza con http:// o https://, le antepone https://
  if (!/^https?:\/\//.test(url)) {
    return "https://" + url;
  }
  return url; // Si ya tiene protocolo, la retorna tal cual
}

// ✅ Función que valida que una URL sea HTTPS y no relativa. Permite comprobar rápidamente si una URL cumple con los requisitos de seguridad y formato para enlaces externos. Útil para validar enlaces en formularios, editores o integraciones donde solo se aceptan URLs HTTPS
function isValidHttpsUrl(url: string) {
  return validateUrl(url, { // Llama a la función validateUrl con opciones estrictas:
    allowedProtocols: ['https'], // Solo permite el protocolo https
    requireProtocol: true, // Requiere que la URL tenga protocolo
    allowRelative: false // No permite URLs relativas
  }).isValid;
}

// ✅ Función que limpia y sanitiza una URL, asegurando que tenga un formato correcto y agregando https:// si falta. Permite transformar URLs ingresadas por usuarios en un formato estándar y seguro antes de validarlas o almacenarlas. Mejora la experiencia del usuario al corregir automáticamente errores comunes como la falta de protocolo o espacios en blanco
function sanitizeUrl(url: string | undefined) {
  if (!url) return undefined; // Si la URL es undefined o vacía, retorna undefined inmediatamente. Evita errores posteriores y permite que la función sea segura ante entradas nulas

  let cleaned = url.trim().replace(/[\s\u200B-\u200D\uFEFF]/g, ''); // Elimina espacios en blanco al inicio y final, y también caracteres invisibles Unicode (como espacios de ancho cero). Previene errores de validación y problemas de formato que pueden ser difíciles de detectar visualmente
  
  // Si la URL no comienza con http://, https:// o //, le antepone https://. Normaliza la URL para asegurar que sea parseable y segura, incluso si el usuario olvidó el protocolo
  if (!/^https?:\/\//.test(cleaned) && !cleaned.startsWith('//')) {
    cleaned = `https://${cleaned}`;
  }
  // Llama a la función robusta validateUrl para validar y obtener la versión "limpia" y estandarizada de la URL. Garantiza que la URL devuelta es válida y está lista para usarse en la base de datos, UI o lógica de negocio
  const result = validateUrl(cleaned, { requireProtocol: false });
  return result.sanitizedUrl;
}

// ✅ Función que extrae el dominio de una URL dada. Permite obtener rápidamente el dominio principal de una URL, útil para validaciones, análisis o visualización en la interfaz de usuario. Maneja URLs con o sin protocolo, y retorna undefined si la URL es inválida
function extractDomain(url: string | undefined) {
  try {
    const urlObj = new URL(url.includes('://') ? url : `https://${url}`); // Si la URL no tiene protocolo, le antepone https:// para asegurar que sea parseable
    return urlObj.hostname; // Retorna solo el hostname (dominio) de la URL
  } catch {
    return undefined; // Si la URL es inválida, retorna undefined
  }
}

// ✅ Función que compara dos URLs para determinar si son equivalentes, ignorando diferencias menores como trailing slashes o el protocolo (http vs https). Permite verificar si dos URLs apuntan al mismo recurso, útil para evitar duplicados o validar enlaces. Normaliza ambas URLs antes de compararlas, asegurando una comparación justa y precisa
function areUrlsEquivalent(url1: string, url2: string) {
  try {
    // Limpia y normaliza ambas URLs usando la función sanitizeUrl. Asegura que la comparación se haga sobre URLs en formato estándar, evitando errores por diferencias de formato, espacios, o falta de protocolo
    const normalized1 = sanitizeUrl(url1);
    const normalized2 = sanitizeUrl(url2);

    if (!normalized1 || !normalized2) return false; // Si alguna no es válida, retorna false

    // Convierte las cadenas normalizadas en objetos URL para acceder fácilmente a sus partes (dominio, protocolo, path, query, etc.)
    const obj1 = new URL(normalized1);
    const obj2 = new URL(normalized2);
    
    // Elimina el slash final (/) de los paths para que /ruta y /ruta/ se consideren equivalentes. Evita falsos negativos por diferencias menores en la escritura de la URL
    const path1 = obj1.pathname.replace(/\/$/, '') || '/';
    const path2 = obj2.pathname.replace(/\/$/, '') || '/';
    // Compara: dominio, protocolo, path y query. Si todos coinciden, las URLs son equivalentes
    return obj1.hostname === obj2.hostname && // Dominio (hostname)
           obj1.protocol === obj2.protocol && // Protocolo (protocol)
           path1 === path2 && // Path normalizado (pathname)
           obj1.search === obj2.search; // Query string (search)
  } catch {
    return false; // Solo retorna true si ambas URLs apuntan exactamente al mismo recurso, ignorando detalles menores como el slash final. Si ocurre cualquier error (por ejemplo, URLs mal formadas), retorna false
  }
}
