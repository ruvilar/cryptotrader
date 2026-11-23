import { ContentItem, ContentFormData } from "../types/content.types";

export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type ExportableContent = ContentItem | ContentFormData;

// ✅ Define interfaces TypeScript para estructurar y tipar las opciones y metadatos de exportación de contenido. Son fundamentales para asegurar que las funciones de exportación reciban y manejen correctamente los parámetros y la información relevante. 
export interface ExportOptions {
  delimiter?: string; // Separador de columnas (por defecto suele ser, para CSV, pero puede ser otro)
  encoding?: string; // Codificación del archivo (ejemplo: "utf-8")
  includeHeaders?: boolean; // Si se deben incluir los nombres de las columnas como primera fila
  dateFormat?: string; // Formato de fecha a usar en la exportación (ejemplo: "YYYY-MM-DD")
  filename?: string; // Nombre personalizado para el archivo exportado
  selectedFields?: string[]; // Lista de campos específicos a exportar (permite exportar solo ciertas columnas)
}

// ✅ Define los metadatos que acompañan a una exportación, útiles para auditoría, trazabilidad o para incluir información adicional en el archivo exportado
export interface ExportMetadata {
  exportedBy: string; // Quién realizó la exportación (nombre de usuario, email, etc.)
  exportDate: string; // Fecha y hora de la exportación
  totalRecords: number; // Número total de registros exportados
  filterApplied?: string; // Filtro aplicado a los datos exportados (si corresponde)
}

// ✅ Define la función principal para convertir un array de objetos en un string CSV configurable. Es fundamental para exportar datos en formato compatible con Excel, Google Sheets, etc.
export function arrayToCSV<T extends Record<string, any>>( // Permite que la función acepte cualquier array de objetos, siempre que tengan claves string
  items: T[], // Array de objetos a exportar
  options: ExportOptions = {} // Opciones de exportación (pueden venir vacías, por eso el valor por defecto {})
): string {
  const {
    delimiter = ",", // Separador de columnas (por defecto ,)
    includeHeaders = true, //  Si se incluyen cabeceras (por defecto true)
    selectedFields, // Campos específicos a exportar (si no se pasa, exporta todos)
    dateFormat = "YYYY-MM-DD HH:mm:ss" // Formato de fecha (por defecto "YYYY-MM-DD HH:mm:ss")
  } = options;

  if (!items || items.length === 0) {
    return includeHeaders ? "Sin datos para exportar" : ""; // Si includeHeaders es true, retorna el mensaje "Sin datos para exportar". Si no, retorna un string vacío
  }

  const allFields = Object.keys(items[0]); // Obtiene todas las claves (nombres de propiedades) del primer objeto del array. Se asume que todos los objetos tienen la misma estructura
  const fields = selectedFields?.filter(f => allFields.includes(f)) || allFields; // Si el usuario especificó selectedFields, filtra solo los campos que existen en los datos. Si no, exporta todos los campos

  // Función que sirve para preparar cada valor antes de insertarlo en el CSV. Garantiza que cada celda del CSV sea válida y no rompa el formato, evitando errores al abrir el archivo en Excel o Google Sheets
  const escapeValue = (val: any): string => {
    if (val == null) return ""; // Si el valor es null o undefined, retorna una celda vacía
    
    const str = String(val); // Convierte cualquier valor a string para procesarlo
    
    // Si el valor tiene formato ISO de fecha (YYYY-MM-DDTHH:mm:ss), lo convierte a formato local y lo encierra entre comillas
    if (str.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return `"${new Date(str).toLocaleString()}"`;
    }
    
    // Si el valor contiene el delimitador, comillas dobles o saltos de línea, lo encierra entre comillas dobles y duplica las comillas internas (regla estándar CSV)
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str; // Si no hay caracteres especiales, retorna el valor tal cual
  };

  const rows: string[] = []; // Se crea un array vacío donde se irán agregando las filas del CSV, una por cada registro y una para la cabecera si corresponde
  
  // Agregar header si está habilitado
  if (includeHeaders) {
    const headers = fields.map(field => // Cada nombre de campo se transforma para ser más legible:
      field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    ); // Inserta un espacio antes de cada mayúscula (metaTitle → Meta Title). Pone en mayúscula la primera letra
    rows.push(headers.join(delimiter)); // Los nombres de los campos se unen usando el delimitador (por defecto ,). Se agrega la cabecera como la primera fila del CSV
  }

  // Se recorre cada objeto del array items y se crea una fila en el CSV
  items.forEach(item => {
    const row = fields.map(field => escapeValue(item[field])); // Para cada campo seleccionado, se toma el valor y se pasa por la función escapeValue (analizada antes) para asegurar que sea seguro para CSV
    rows.push(row.join(delimiter)); // Los valores de cada fila se unen usando el delimitador
  });
  return rows.join('\r\n'); // Cada fila resultante se agrega al array rows
}

// ✅ Función que permite descargar archivos generados en el frontend (por ejemplo, un CSV o JSON exportado) directamente desde el navegador, sin necesidad de backend
export function downloadFile(
  content: string, // El contenido del archivo (texto plano, CSV, JSON, etc.)
  filename: string, // Nombre del archivo a descargar
  mimeType: string = 'text/plain', // Tipo MIME del archivo (por defecto text/plain)
  encoding: string = 'utf-8' // Codificación (por defecto utf-8)
): Promise<boolean> { // Usa una Promise para permitir manejo asíncrono y saber si la descarga fue exitosa o falló
  return new Promise((resolve, reject) => {
    try {
      const bom = encoding === 'utf-8' ? '\uFEFF' : ''; // Si la codificación es UTF-8, agrega un BOM (\uFEFF) al inicio. Esto es importante para que Excel reconozca correctamente los caracteres especiales
      // Crea un objeto Blob con el contenido y el tipo MIME adecuado
      const blob = new Blob([bom + content], { 
        type: `${mimeType};charset=${encoding}` 
      });
      
      const url = window.URL.createObjectURL(blob); // Crea una URL temporal para el archivo Blob
      const link = document.createElement('a'); // Crea un elemento <a> invisible, le asigna la URL y el nombre de archivo
      
      link.href = url; // Asigna al enlace (<a>) la URL temporal generada para el archivo Blob. Esto le dice al navegador qué archivo debe descargar
      link.download = filename; // Especifica el nombre con el que se descargará el archivo. Así, el usuario verá el nombre correcto en su carpeta de descargas
      link.style.display = 'none'; // Oculta el enlace en la página. El usuario nunca ve este <a>, solo se usa para disparar la descarga
      
      document.body.appendChild(link); // Agrega el enlace al DOM. Es necesario para que el click funcione en todos los navegadores
      link.click(); // Simula un click en el enlace, lo que inicia la descarga del archivo de forma automática
      
      // Espera 100 milisegundos antes de ejecutar la limpieza. Esto asegura que la descarga haya comenzado antes de eliminar el enlace y liberar la URL temporal
      setTimeout(() => {
        try {
          document.body.removeChild(link); // Elimina el elemento <a> del DOM, ya que solo se creó para disparar la descarga y no debe permanecer en la página
          window.URL.revokeObjectURL(url); // Libera la URL temporal creada para el Blob, evitando fugas de memoria
          resolve(true); // Indica que la descarga fue exitosa
        } catch (cleanupError) { // Si ocurre algún error al limpiar (por ejemplo, si el enlace ya fue eliminado), igualmente se resuelve la promesa como exitosa, porque la descarga ya se habrá iniciado
          resolve(true);
        }
      }, 100);
      
    } catch (error) { // Si ocurre cualquier error en el proceso principal (antes del cleanup), la promesa se rechaza y puedes manejar el error donde llames a la función
      reject(error);
    }
  });
}

// ✅ Exporta un array de objetos ContentItem a un string CSV, incluyendo solo los campos relevantes para SEO y contenido
export function exportContentToCSV(
  items: ContentItem[], // Recibe un array de items de contenido y opciones de exportación
  options: ExportOptions = {} // Devuelve un string CSV listo para descargar o mostrar
): string {
  // Lista de campos que se consideran importantes para SEO y gestión de contenido. Así se asegura que el CSV exportado tenga solo la información relevante y no datos internos innecesarios
  const seoFields = [
    'title', 'slug', 'type', 'status',
    'meta_title', 'meta_description', 'meta_keywords',
    'canonical_url', 'word_count', 'reading_time',
    'created_at', 'updated_at', 'author_name'
  ];
  // Llama a la función utilitaria arrayToCSV para generar el CSV, pasando las opciones recibidas y la lista de campos SEO. Usa las opciones recibidas, pero si no se especifican campos (selectedFields), utiliza por defecto los campos SEO definidos
  return arrayToCSV(items, {
    ...options,
    selectedFields: options.selectedFields || seoFields
  });
}

// ✅ Exporta un array de objetos ContentItem a un string JSON, incluyendo metadatos útiles para auditoría y trazabilidad
export function exportContentToJSON(
  items: ContentItem[], // Recibe un array de items de contenido y opcionalmente metadatos de exportación
  metadata?: ExportMetadata // Devuelve un string JSON listo para descargar o mostrar
): string {
  const exportData = {
    metadata: {
      exportedBy: metadata?.exportedBy || "Admin", // Quién realizó la exportación (por defecto "Admin") si no se especifica
      exportDate: new Date().toISOString(), // Fecha y hora actual en formato ISO
      totalRecords: items.length, // Número de registros exportados
      filterApplied: metadata?.filterApplied || "Ninguno", // Filtro aplicado (por defecto "Ninguno") si no se especifica
      version: "1.0" // Versión del formato de exportación (útil para futuras migraciones)
    },
    data: items // El array de items exportados
  };
  
  return JSON.stringify(exportData, null, 2); // Convierte el objeto exportData a un string JSON, con indentación de 2 espacios para mejor legibilidad
}

// ✅ Función orquestadora: centraliza todo el proceso de exportación de datos, eligiendo el formato, generando el contenido y disparando la descarga. Permite exportar tanto en formato CSV como JSON (y está preparada para más formatos en el futuro)
export async function exportContent(
  items: ExportableContent[], // Array de contenido a exportar (puede ser ContentItem o ContentFormData)
  format: ExportFormat, // Formato de exportación (csv, json, xlsx)
  options: ExportOptions = {} // Opciones de exportación (personalización de campos, nombre, etc)
): Promise<boolean> {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-'); // Crea un timestamp legible y seguro para nombres de archivo
  const baseFilename = options.filename || `contenido-export-${timestamp}`; // Usa el nombre personalizado si se pasa, si no, uno por defecto con fecha/hora
    
  // Se preparan para almacenar el contenido, nombre y tipo MIME según el formato
  let content: string;
  let filename: string;
  let mimeType: string;
    
  // Un switch que elige el formato de exportación. Actualmente soporta CSV y JSON, pero se puede ampliar fácilmente
  switch (format) {
    // Si es csv, llama a exportContentToCSV, pone extensión .csv y tipo MIME text/csv
    case 'csv':
      content = exportContentToCSV(items as ContentItem[], options);
      filename = `${baseFilename}.csv`;
      mimeType = 'text/csv';
      break;
    // Si es json, llama a exportContentToJSON, pone extensión .json y tipo MIME application/json
    case 'json':
      content = exportContentToJSON(items as ContentItem[]);
      filename = `${baseFilename}.json`;
      mimeType = 'application/json';
      break;
    // Si es otro formato, lanza un error
    default:
      throw new Error(`Formato de exportación no soportado: ${format}`);
  }
  return await downloadFile(content, filename, mimeType); // Finalmente, llama a downloadFile con el contenido, nombre y tipo, y retorna el resultado
}

// ✅ Genera un nombre de archivo para exportaciones, que es descriptivo, único y seguro para cualquier sistema operativo
export function generateExportFilename(
  baseType: string, // Tipo base del archivo (ejemplo: "contenido", "seo", "usuarios")
  filter?: string, // (opcional) Un filtro o etiqueta para distinguir el archivo (ejemplo: "publicados", "borradores")
  extension: string = 'csv' // (opcional, por defecto "csv") Extensión del archivo
): string {
  const timestamp = new Date().toISOString().slice(0, 10); // Toma la fecha actual en formato ISO (YYYY-MM-DDTHH:mm:ss...) y la recorta a solo la fecha (YYYY-MM-DD)
  const filterSuffix = filter ? `-${filter.toLowerCase().replace(/\s+/g, '-')}` : ''; // Si hay filtro, lo convierte a minúsculas y reemplaza espacios por guiones para que sea seguro en nombres de archivo
  return `${baseType}${filterSuffix}-${timestamp}.${extension}`; // Une el tipo base, el filtro (si existe), la fecha y la extensión
}

// ✅ Valida que los datos a exportar sean correctos antes de iniciar la exportación
export function validateExportData<T>(items: T[]): { isValid: boolean; issues: string[] } { // Devuelve un objeto con: isValid: booleano que indica si los datos son válidos. issues: array de strings con los problemas encontrados
  const issues: string[] = []; // Inicializa el array de problemas
  
  // Verifica que sea un array. Si no es un array, agrega un mensaje de error
  if (!Array.isArray(items)) {
    issues.push('Los datos deben ser un array');
  }

  // Verifica que no esté vacío. Si el array está vacío, agrega un mensaje de advertencia
  if (items.length === 0) {
    issues.push('No hay datos para exportar');
  }
  
  // Límite de registros. Si hay más de 10,000 registros, agrega un mensaje para evitar exportaciones demasiado grandes (buena práctica para rendimiento y experiencia de usuario)
  if (items.length > 10000) {
    issues.push('Demasiados registros (máximo 10.000). Considera filtrar los datos.');
  }
  
  return { // Si no hay problemas, isValid será true; si hay, será false y se listan los problemas
    isValid: issues.length === 0,
    issues
  };
}