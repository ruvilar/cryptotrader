import { useMemo, useEffect, useRef } from 'react';

/**
 * ✅ Opciones de configuración para el renderizado de contenido
 */
interface UseContentRendererOptions {
  processLineBreaks?: boolean; // Convierte saltos de línea en <br> y párrafos
  customCss?: string; // CSS personalizado del post
  postId?: string; // ID único del post para aislar estilos
}

/**
 * ✅ Hook personalizado para procesar y renderizar contenido de posts/páginas
 * Centraliza la lógica de procesamiento de texto plano/HTML y aplicación de CSS personalizado
 * 
 * @param content - Contenido HTML o texto plano a procesar
 * @param options - Opciones de configuración
 * @returns Objeto con el contenido procesado y función de limpieza
 */
export const useContentRenderer = (
  content: string,
  options: UseContentRendererOptions = {}
) => {
  const { 
    processLineBreaks = true, 
    customCss = '',
    postId = ''
  } = options;

  const styleRef = useRef<HTMLStyleElement | null>(null);
  const scopedId = postId ? `content-${postId}` : '';

  /**
   * ✅ Procesa el contenido: detecta si es HTML o texto plano y lo formatea
   */
  const processedContent = useMemo(() => {
    if (!content) return '';

    // Detecta si ya contiene etiquetas HTML
    const hasHTMLTags = /<[^>]*>/g.test(content);
    
    if (hasHTMLTags) {
      return content; // Ya es HTML, retornar tal cual
    }

    // Es texto plano, procesarlo según configuración
    if (processLineBreaks) {
      return content
        .split('\n\n') // Divide por doble salto de línea (párrafos)
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }

    return content;
  }, [content, processLineBreaks]);

  /**
   * ✅ Aplica CSS personalizado con scope aislado (solo afecta a este post)
   */
  useEffect(() => {
    // Limpiar estilos previos si existen
    if (styleRef.current) {
      styleRef.current.remove();
      styleRef.current = null;
    }

    // Solo aplicar CSS si existe y hay un ID de post
    if (customCss && customCss.trim() && scopedId) {
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-post-id', postId);
      
      /**
       * ✅ Envolver el CSS con el ID del contenedor para aislarlo
       * Esto evita que afecte otros posts o elementos globales
       */
      const scopedCss = `
        /* CSS personalizado del post ID: ${postId} */
        #${scopedId} {
          ${customCss}
        }
        
        /* Aplicar estilos a selectores específicos dentro del post */
        ${customCss.replace(/([^{]+){/g, `#${scopedId} $1 {`)}
      `;
      
      styleElement.textContent = scopedCss;
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;
    }

    // Cleanup: eliminar estilos al desmontar el componente
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [customCss, postId, scopedId]);

  return {
    processedContent, // Contenido HTML procesado listo para renderizar
    scopedId, // ID único para el contenedor (usar en el atributo id del article/div)
  };
};