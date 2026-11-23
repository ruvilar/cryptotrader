import { useEffect, useState } from "react";
import { useEditorState } from "./hooks/useEditorState";
import { useTipTapEditor } from "./utils/editorExtensions";
import { EditorContent as TipTapContent } from "@tiptap/react";
import EditorToolbar from "./EditorToolbar";
import LinkInputField from "./FloatingMenus/LinkInputField";
import ImageFloatingMenu from "./FloatingMenus/ImageFloatingMenu";
import { applyLink } from "./utils/insertMedia";
import ButtonFloatingMenu from "./FloatingMenus/ButtonFloatingMenu";
import "./assets/editor.css";

// Define los props que acepta el componente Editor.
interface EditorProps {
  onFeaturedImageSelect?: (imageUrl: string) => void;
}

// ✅ Define el componente principal del editor.
export default function Editor({ onFeaturedImageSelect }: EditorProps) {
  const { ui, link, image, media } = useEditorState(); // Usa un hook personalizado para obtener el estado del editor, incluyendo la UI, enlaces, imágenes y media
  const [forceEmpty, setForceEmpty] = useState(false); // Estado local para forzar el vaciado del contenido del editor
  const [buttonMenuVisible, setButtonMenuVisible] = useState(false); // Estado para controlar la visibilidad del menú flotante de edición de botones
  const [selectedButton, setSelectedButton] = useState<HTMLElement | null>(null); // Estado para almacenar el botón actualmente seleccionado en el editor
  const [buttonMenuPosition, setButtonMenuPosition] = useState({ x: 0, y: 0 }); // Estado para almacenar la posición del menú flotante de edición de botones

  const editor = useTipTapEditor(() => ui.setUpdateTrigger(Date.now())); // Inicializa el editor TipTap usando el custom hook, pasando una función que actualiza el trigger de la UI cada vez que el contenido cambia

  // ✅ Ejecuta el efecto cada vez que cambia la instancia del editor
  useEffect(() => {
    const handleContentUpdate = (event: CustomEvent) => { // Define la función que maneja el evento personalizado editor-content-updated
    if (!editor) return; // Si el editor no está inicializado, no hace nada
    
    if (event.detail?.forceEmpty) { // Si el evento contiene la propiedad forceEmpty...
      setForceEmpty(true); // ...fuerza el vaciado del contenido del editor
      editor.commands.clearContent(); // Limpia el contenido del editor
      localStorage.removeItem("editor-content"); // Elimina el contenido guardado en localStorage
      return; // Sale de la función
    }

    if (event.detail?.json && typeof event.detail.json === 'object') { // Verifica si el evento contiene una propiedad json y si es un objeto
      editor.commands.setContent(event.detail.json); // Actualiza el contenido del editor con el JSON recibido. Útil para restaurar el estado del editor desde una copia guardada, una base de datos, o importar contenido estructurado
    }
    else if (event.detail?.html) { // Si no hay JSON pero sí una propiedad html, se actualiza el contenido usando HTML plano
      editor.commands.setContent(event.detail.html, {  // Actualiza el contenido del editor con el HTML recibido
        emitUpdate: false // Este parámetro evita que se dispare el evento de actualización del editor (previene bucles o actualizaciones innecesarias)
      });
      
      setTimeout(() => { // Ejecuta el bloque de código después de 100 milisegundos. Esto da tiempo a que el editor procese el nuevo contenido antes de sincronizar y notificar
        const content = editor.getHTML(); // Obtiene el contenido actual del editor en formato HTML, ya actualizado
        localStorage.setItem("editor-content", content); // Guarda el contenido actualizado en localStorage para persistencia temporal. Así, si el usuario recarga la página, no pierde su trabajo
        window.dispatchEvent(new CustomEvent("editor-content-changed", { // Dispara un evento personalizado en el navegador, permitiendo que otros componentes o scripts escuchen y reaccionen al cambio de contenido (por ejemplo, para actualizar una vista previa o sincronizar datos)
          detail: { content } 
        }));
      }, 100);
    }
  };
    window.addEventListener("editor-content-updated", handleContentUpdate as EventListener); // Agrega un listener global al objeto window para el evento personalizado 'editor-content-updated'. Cuando se dispara este evento, ejecuta la función handleContentUpdate, que puede vaciar el editor, cargar contenido JSON/HTML, o sincronizar el estado.
    return () => window.removeEventListener("editor-content-updated", handleContentUpdate as EventListener); // Cuando el componente se desmonta o el editor cambia, elimina el listener para evitar fugas de memoria y comportamientos inesperados
  }, [editor]);

  // ✅ Permite vaciar el contenido del editor y limpiar el almacenamiento temporal cuando se activa el estado forceEmpty
  useEffect(() => {
    if (forceEmpty && editor) { // Verifica si el estado forceEmpty está activado y si el editor está inicializado
      editor.commands.clearContent(); // Limpia el contenido del editor, dejándolo vacío
      localStorage.removeItem("editor-content"); // Elimina el contenido guardado en localStorage para evitar que se restaure al recargar la página
      setForceEmpty(false); // Resetea el estado forceEmpty para evitar bucles y dejar el editor listo para futuras acciones
    }
  }, [forceEmpty, editor]);

  // ✅ Handler para aplicar enlaces
  const handleApplyLink = () => {
    applyLink(editor, link.linkUrl, link.savedRange); // Llama a la función utilitaria applyLink (definida en insertMedia.ts). Inserta o actualiza el enlace en el contenido del editor usando la URL (link.linkUrl) y el rango de selección guardado (link.savedRange)
    link.setLinkInputVisible(false); // Oculta el campo de entrada de enlace en la UI
    link.setLinkUrl(""); // Limpia el valor del campo de URL del enlace
    link.setSavedRange(null); // Limpia el rango de selección guardado, dejando el editor listo para futuras inserciones de enlaces
  };

  // ✅ Handler para cancelar enlaces
  const handleCancelLink = () => {
    link.setLinkInputVisible(false); // Oculta el campo de entrada de enlace en la UI
    link.setLinkUrl(""); // Limpia el valor del campo de URL del enlace
    link.setSavedRange(null); // Limpia el rango de selección guardado, dejando el editor listo para futuras inserciones de enlaces
  };

  // ✅ Permite mostrar el menú flotante de edición de imagen en la posición correcta y seleccionar la imagen sobre la que se hizo clic
  useEffect(() => {
    const handleImageClick = (event: any) => { // Define la función que maneja el clic sobre cualquier elemento del documento
      if (event.target.tagName === "IMG" && event.target.closest(".editor-content")) { // Verifica si el elemento clickeado es una imagen (IMG) y si está dentro del área del editor (.editor-content)
        event.preventDefault(); // Previene el comportamiento por defecto del navegador (por ejemplo, arrastrar la imagen)
        event.stopPropagation(); // Detiene la propagación del evento para evitar que otros handlers lo capturen
        const imgRect = event.target.getBoundingClientRect(); // Obtiene las coordenadas y dimensiones de la imagen clickeada en la pantalla
        const editorContainer = event.target.closest(".relative"); // Busca el contenedor principal del editor (usualmente con posición relativa)
        const editorRect = editorContainer ? editorContainer.getBoundingClientRect() : null; // Si existe el contenedor, obtiene sus coordenadas y dimensiones

        if (editorRect) { // Si existe el contenedor principal del editor, calcula la posición relativa de la imagen respecto a ese contenedor
          const relativeX = imgRect.left - editorRect.left + imgRect.width / 2; // Calcula la posición horizontal (X) del centro de la imagen respecto al editor
          const relativeY = imgRect.top - editorRect.top; // Calcula la posición vertical (Y) de la parte superior de la imagen respecto al editor
          image.setImageMenuPosition({ x: relativeX, y: relativeY - 50 }); // Actualiza el estado con la posición donde debe aparecer el menú flotante, desplazando 50px hacia arriba para que no tape la imagen
        }
        image.setSelectedImage(event.target); // Guarda la referencia a la imagen seleccionada para editarla
        image.setImageMenuVisible(true); // Muestra el menú flotante de edición de imagen
      }
    };
    document.addEventListener("click", handleImageClick); // Agrega el listener global para detectar clics en imágenes dentro del editor
    return () => document.removeEventListener("click", handleImageClick); // Elimina el listener de clics para evitar fugas de memoria
  }, []);

  // ✅ Detecta clics en botones de gradiente para editarlos
  useEffect(() => {
    const handleButtonClick = (event: any) => {
      const buttonElement = event.target.closest('button[data-gradient-button], a[data-gradient-button]') as HTMLElement;
      if (!buttonElement) return;
      
      const isInEditor = buttonElement.closest('.editor-content');
      const href = buttonElement.getAttribute('data-href') || buttonElement.getAttribute('href');
      const hasHref = !!href;
      
      // Si está en el editor, abrir menú de edición
      if (isInEditor) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const buttonRect = buttonElement.getBoundingClientRect();
        const editorContainer = buttonElement.closest('.relative');
        const editorRect = editorContainer ? editorContainer.getBoundingClientRect() : null;

        if (editorRect) {
          const relativeX = buttonRect.left - editorRect.left + buttonRect.width / 2;
          const relativeY = buttonRect.top - editorRect.top;
          setButtonMenuPosition({ x: relativeX, y: relativeY - 10 });
        }
        setSelectedButton(buttonElement);
        setButtonMenuVisible(true);
      } 
      // Si NO está en el editor Y tiene href, navegar
      else if (hasHref) {
        event.preventDefault();
        const target = buttonElement.getAttribute('data-target') || buttonElement.getAttribute('target');
        
        if (target === '_blank') {
          window.open(href!, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = href!;
        }
      }
    };
    document.addEventListener('mousedown', handleButtonClick, true);
    return () => document.removeEventListener('mousedown', handleButtonClick, true);
  }, []);

  // Función para cerrar y limpiar el menu flotante de botones
  const closeButtonMenu = () => {
    setButtonMenuVisible(false);
    setSelectedButton(null);
  };

  // ✅ Detecta clics en enlaces para editarlos. Permite posicionar el cursor en el enlace y abrir el campo de edición con la URL actual
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement; // Obtiene el elemento HTML que fue clicado
      
      // Verifica si se hizo clic en un enlace dentro del editor (.editor-content)
      const linkElement = target.tagName === 'A' ? target : target.closest('a');
      // Si se hizo clic en un enlace dentro del editor, previene el comportamiento por defecto y muestra el campo de edición
      if (linkElement && linkElement.closest('.editor-content')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const href = linkElement.getAttribute('href') || ''; // Obtiene la URL del enlace clicado

        // Posiciona el cursor en el enlace y abre el campo de edición con la URL actual
        if (editor) {
          const pos = editor.view.posAtDOM(linkElement, 0); // Posiciona el cursor en el enlace clicado
          editor.chain().focus().setTextSelection(pos).run(); // Mueve el foco al editor y posiciona el cursor en la posición del enlace
          
          link.setLinkUrl(href); // Muestra el campo de edición con la URL actual del enlace
          link.setLinkInputVisible(true); // Abre el campo de edición del enlace
        }
        return false; // Detiene la propagación del evento para evitar que otros handlers lo capturen
      }
    };
    document.addEventListener('mousedown', handleLinkClick, true);
    return () => document.removeEventListener('mousedown', handleLinkClick, true);
  }, [editor, link]);

  // ✅ Gestiona el cierre de las paletas de color, resaltado, tabla y el menú flotante de imagen en el editor. Permite que estos elementos se cierren solo cuando el usuario realiza una acción específica (como hacer clic en el botón de cerrar o seleccionar un color/resaltado)
  useEffect(() => {
    const handlePaletteAction = (event: any) => { // Define la función que maneja el cierre de las paletas y menús flotantes según la acción del usuario
      if (ui.showColors) { // Si la paleta de colores está visible:
        const palette = document.querySelector(".color-palette"); // Busca el elemento .color-palette en el DOM
        if (palette && palette.contains(event.target)) { // Si el clic ocurre dentro de la paleta:
          if (event.target.classList.contains("palette-close")) ui.setShowColors(false); // Si el target tiene la clase palette-close, cierra la paleta
          if (event.target.classList.contains("palette-color")) ui.setShowColors(false); // Si el target tiene la clase palette-color, cierra la paleta tras seleccionar un color
        }
      }

      if (ui.showHighlight) { // Verifica si la paleta de resaltado está visible
        const palette = document.querySelector(".highlight-palette"); // Busca el elemento .highlight-palette en el DOM
        if (palette && palette.contains(event.target)) { // Si el clic ocurre dentro de la paleta de resaltado:
          if (event.target.classList.contains("palette-close")) ui.setShowHighlight(false); // Si el elemento clickeado tiene la clase palette-close, cierra la paleta
          if (event.target.classList.contains("palette-highlight")) ui.setShowHighlight(false); // Si el elemento clickeado tiene la clase palette-highlight, también cierra la paleta tras seleccionar un color de resaltado
        }
      }

      // Si la paleta de la tabla está visible y el clic ocurre fuera de .table-palette, permanece activa
      if (ui.showTable) {
        const palette = document.querySelector(".table-palette"); // Busca el elemento .table-palette en el DOM
        if (palette && palette.contains(event.target)) { // Si el clic ocurre dentro de la paleta de tabla:
          if (event.target.classList.contains("palette-close")) ui.setShowTable(false); // Si el target tiene la clase palette-close, cierra la paleta
        }
      }
    };
    document.addEventListener("mousedown", handlePaletteAction); // Agrega el listener global para detectar clics y gestionar el cierre de las paletas y menús
    return () => document.removeEventListener("mousedown", handlePaletteAction); // Elimina el listener cuando el componente se desmonta o cambian las dependencias, evitando fugas de memoria
  }, [ui.showColors, ui.showHighlight, ui.showTable, image.imageMenuVisible]); // El efecto se ejecuta cada vez que cambian los estados de visibilidad de las paletas y el menú flotante de imagen

  // ✅ Permite exportar el contenido actual del editor (en HTML y JSON) cuando se dispara el evento personalizado editor-request-content. Es útil para integraciones con otros componentes, automatizaciones o para guardar el contenido en la base de datos
  useEffect(() => {
    const handleRequest = () => { // Define la función que maneja la petición de exportar el contenido del editor
      const html = editor.getHTML(); // Obtiene el contenido actual del editor en formato HTML
      const json = editor.getJSON(); // Obtiene el contenido actual del editor en formato JSON (estructura interna TipTap)
      window.dispatchEvent(new CustomEvent("editor-content-ready", { detail: { html, json } })); // Dispara un evento personalizado en el navegador con el contenido HTML y JSON. Permite que otros componentes o scripts escuchen y reciban el contenido actualizado (por ejemplo, para guardarlo en la base de datos, mostrar una vista previa, etc.)
    };
    window.addEventListener("editor-request-content", handleRequest); // Escucha el evento editor-request-content para activar la exportación de contenido
    return () => window.removeEventListener("editor-request-content", handleRequest); // Elimina el listener cuando el componente se desmonta o el editor cambia, evitando fugas de memoria
  }, [editor]);

  // Renderiza iconos de lucide cuando cambia el contenido
  useEffect(() => {
    if (!editor) return;
    // Tracking de iconos ya renderizados para evitar renderizados duplicados
    const renderedIcons = new WeakSet();
    
    const renderIcons = async () => {
      const iconElements = document.querySelectorAll('[data-lucide]:not([data-icon-rendered])');
      if (iconElements.length === 0) return;
      
      try {
        const { icons } = await import('lucide-react');
        const { createElement } = await import('react');
        const { createRoot } = await import('react-dom/client');
        
        iconElements.forEach((el) => {
          if (renderedIcons.has(el)) return; // Ya fue renderizado
          
          const iconName = el.getAttribute('data-lucide');
          if (!iconName) return;
          
          const IconComponent = (icons as any)[iconName];
          if (!IconComponent) {
            return;
          }
          
          // Marcar como renderizado ANTES de renderizar
          el.setAttribute('data-icon-rendered', 'true');
          renderedIcons.add(el);
          
          el.innerHTML = '';
          const root = createRoot(el);
          root.render(createElement(IconComponent, { size: 16 }));
        });
      } catch (err) {
        alert('Error al renderizar iconos:' + err);
      }
    };

    // Renderizar solo una vez al inicio
    renderIcons();
    
    // Observer solo para NUEVOS iconos
    const observer = new MutationObserver((mutations) => {
      const hasNewIcons = mutations.some(m => 
        Array.from(m.addedNodes).some(node => 
          node instanceof Element && 
          (node.hasAttribute('data-lucide') || node.querySelector('[data-lucide]'))
        )
      );
      
      if (hasNewIcons) {
        setTimeout(renderIcons, 100);
      }
    });
    
    const editorEl = document.querySelector('.ProseMirror');
    if (editorEl) {
      observer.observe(editorEl, { childList: true, subtree: true });
    }
    
    return () => observer.disconnect();
  }, [editor]);

  return (
    <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-blue-800 text-white rounded-2xl shadow-2xl w-full">
      <EditorToolbar
      editor={editor}
      ui={ui}
      link={link}
      image={image}
      media={media}
      />

      <LinkInputField
        visible={link.linkInputVisible}
        url={link.linkUrl}
        setUrl={link.setLinkUrl}
        onApply={handleApplyLink}
        onCancel={handleCancelLink}
      />

      {image.imageMenuVisible && (
        <ImageFloatingMenu
          editor={editor}
          imageNode={image.selectedImage}
          position={image.imageMenuPosition}
          onClose={() => image.setImageMenuVisible(false)}
          onFeaturedImageSelect={onFeaturedImageSelect}
        />
      )}

      {buttonMenuVisible && (
        <ButtonFloatingMenu
          editor={editor}
          buttonNode={selectedButton}
          position={buttonMenuPosition}
          onClose={closeButtonMenu}
        />
      )}

      {ui.isHtmlMode ? (
        <textarea
          key="html-editor" // Agregado
          defaultValue={editor?.getHTML() || ''} // Agregado
          onBlur={e => { // Agregado
            const newContent = e.target.value;
            editor?.commands.setContent(newContent, {
              emitUpdate: false
            });
            localStorage.setItem('editor-content', newContent); // Agregado
            window.dispatchEvent(new CustomEvent('editor-content-changed', { // Agregado
              detail: { content: newContent }
            }));
          }}
          className="w-full h-full min-h-[450px] p-2 font-mono text-sm border-gray-300 outline-none resize-none bg-gray-100 text-black"
          placeholder="Editar código HTML..."
          spellCheck={false}
        />
        ) : (
          <div
          className="relative bg-white text-black p-4 min-h-[500px] cursor-text editor-content prose max-w-full overflow-x-hidden"
          onClick={() => !ui.isHtmlMode && editor?.chain().focus().run()}
        >
          <div className="absolute right-3 top-3 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow pointer-events-none z-10 select-none">
            {ui.isHtmlMode ? 'HTML' : 'Texto'}
          </div>
          {ui.isHtmlMode ? (
            <textarea
              key="html-editor"
              defaultValue={editor?.getHTML() || ''}
              onBlur={e => {
                const newContent = e.target.value;
                editor?.commands.setContent(newContent, { emitUpdate: false });
                localStorage.setItem('editor-content', newContent);
                window.dispatchEvent(new CustomEvent('editor-content-changed', {
                  detail: { content: newContent }
                }));
              }}
              className="w-full h-full min-h-[450px] p-2 font-mono text-sm border-0 outline-0 resize-none bg-gray-50"
              placeholder="Editar código HTML..."
              spellCheck={false}
            />
          ) : (
            <TipTapContent editor={editor} />
          )}
        </div>
      )}
    </div>
  );
}
