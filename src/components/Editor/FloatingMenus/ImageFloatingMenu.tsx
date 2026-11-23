import React, { useState, useEffect, useRef, useCallback } from "react";
import { Editor as TipTapEditor } from "@tiptap/react";
import EditorDialog from "../EditorDialog";

// ✅ Define los props que recibe el componente
interface Props {
  editor: TipTapEditor | null; // instancia del editor Tiptap (permite manipular el contenido)
  imageNode: HTMLImageElement | null; // Referencia al nodo <img> sobre el que se abre el menú
  position: { x: number; y: number }; // Coordenadas {x, y} para posicionar el menú flotante
  onClose: () => void; // Función para cerrar el menú
  onFeaturedImageSelect: (imageUrl: string) => void; // Función para marcar la imagen como destacada (no se usa en el render actual, pero está tipada)
}

// ✅ Define los estilos CSS predefinidos para alineación, tamaño, borde y sombra de la imagen. Esto permite aplicar estilos rápidamente según la opción elegida por el usuario
const STYLES = {
  alignment: {
    left: "float: left; margin: 0 15px 15px 0; max-width: 100%;",
    center: "display: block; margin: 15px auto; max-width: 100%;",
    right: "float: right; margin: 0 0 15px 15px; max-width: 100%;"
  },
  sizes: {
    small: "200px",
    medium: "400px", 
    large: "600px",
    full: "100%"
  },
  borders: {
    none: "",
    thin: "border: 1px solid #ddd;",
    thick: "border: 3px solid #333;",
    rounded: "border: 2px solid #ddd; border-radius: 8px;"
  },
  shadows: {
    none: "",
    light: "box-shadow: 0 2px 4px rgba(0,0,0,0.1);",
    medium: "box-shadow: 0 4px 8px rgba(0,0,0,0.15);",
    heavy: "box-shadow: 0 8px 16px rgba(0,0,0,0.2);"
  }
} as const;

const ImageFloatingMenu: React.FC<Props> = ({ editor, imageNode, position, onClose }) => {
  const [activeTab, setActiveTab] = useState<"align" | "size" | "style">("align"); // Pestaña activa del menú (alinear, tamaño, estilo)
  const [altText, setAltText] = useState(""); // Texto alternativo temporal para la imagen
  const [showAltEditor, setShowAltEditor] = useState(false); // Muestra el editor de texto alternativo
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Muestra el diálogo de confirmación para eliminar la imagen
  const menuRef = useRef<HTMLDivElement>(null); // Referencia al div del menú (para manejar el foco)
  const altInputRef = useRef<HTMLInputElement>(null); // Referencia al input del texto alternativo (para manejar el foco)
  const imageNodeRef = useRef(imageNode); // Referencia mutable al nodo de imagen (para mantenerlo actualizado)

  // ✅ Mantiene la referencia actualizada de la imagen
  useEffect(() => {
    imageNodeRef.current = imageNode; // Actualiza la referencia interna a la imagen cada vez que cambia el prop imageNode. Esto es útil para manipular el DOM de la imagen seleccionada.
  }, [imageNode]);

  // ✅ Garantiza que, cada vez que el usuario cambia de pestaña en el menú flotante o abre/cierra el editor de texto alternativo (ALT), el foco del teclado se coloque automáticamente en el elemento adecuado (el menú o el input del ALT). Esto mejora la accesibilidad y la experiencia de usuario, permitiendo navegar y editar rápidamente sin usar el ratón
  useEffect(() => {
    const setInitialFocus = () => { // Define una función que decide dónde poner el foco
      const targetElement = showAltEditor ? altInputRef.current : menuRef.current; // Si el editor de ALT está abierto (showAltEditor es true), enfoca el input de texto alternativo (altInputRef.current). Si no, enfoca el menú principal (menuRef.current)
      if (targetElement) { // Si existe el elemento, le da el foco
        targetElement.focus({ preventScroll: true }); // El parámetro { preventScroll: true } evita que la página haga scroll automáticamente al enfocar
      }
    };

    const timeoutId = setTimeout(setInitialFocus, 100); // Usa un pequeño retraso de 100 ms para asegurarse de que el DOM ya está renderizado antes de intentar enfocar
    return () => clearTimeout(timeoutId); // Limpia el timeout si el efecto se vuelve a ejecutar antes de que pase el tiempo, evitando efectos secundarios o errores
  }, [showAltEditor, activeTab]); // Se ejecuta cada vez que cambia el estado de showAltEditor (si se muestra el input ALT) o activeTab (la pestaña activa del menú)

  // ✅ Es una función utilitaria que centraliza la ejecución de cualquier acción sobre la imagen (por ejemplo, cambiar alineación, tamaño, borde, sombra, alt, etc. Define la función como un callback memorizado para evitar recrearla en cada render
  const executeImageAction = useCallback((action: () => void, actionName: string) => {
    if (!editor || !imageNodeRef.current) return; // Si no hay editor o imagen seleccionada, no hace nada (previene errores)
    const { from, to } = editor.state.selection; // Guarda la posición actual de la selección en el editor (inicio y fin)
    action(); // Ejecuta la acción recibida como parámetro (por ejemplo, cambiar el estilo de la imagen)
    editor.chain()
      .focus() // Asegura que el editor esté enfocado tras la acción
      .setTextSelection({ from, to }) // Restaura la selección previa, para que el usuario no pierda el contexto
      .run(); // Ejecuta la cadena de comandos en el editor

    requestAnimationFrame(() => { // Garantiza que el elemento ya existe y está visible antes de intentar enfocar, evitando errores y asegurando una experiencia fluida
      const targetElement = showAltEditor ? altInputRef.current : menuRef.current; // Si el editor de ALT está abierto (showAltEditor es true), enfoca el input de texto alternativo (altInputRef.current). Si no, enfoca el menú principal (menuRef.current)
      if (targetElement) {  // Si existe el elemento al que se quiere enfocar (targetElement), le da el foco usando .focus({ preventScroll: true })
        targetElement.focus({ preventScroll: true }); // El parámetro preventScroll: true evita que la página haga scroll automáticamente al enfocar el elemento
      }
    });
  }, [editor, showAltEditor]);

  // ✅ Esta función busca y devuelve el nodo <img> correspondiente a la imagen actualmente seleccionada en el editor. Es fundamental para aplicar cambios de estilo, atributos o eliminar la imagen correcta, ya que el DOM puede cambiar dinámicamente
  const findCurrentImageNode = useCallback(() => { // Define la función como un callback memorizado para evitar recrearla en cada render
    if (!editor || !imageNodeRef.current) return null; // Si no hay editor o imagen seleccionada, retorna null para evitar errores

    const container = editor.view.dom as HTMLElement; // Obtiene el contenedor principal del editor en el DOM
    const originalSrc = imageNodeRef.current.src; // Guarda el atributo 'src' de la imagen seleccionada
    const originalAlt = imageNodeRef.current.alt; // Guarda el atributo 'alt' de la imagen seleccionada

    let foundNode = container.querySelector(`img[src="${originalSrc}"]`) as HTMLImageElement; // Busca en el DOM del editor una imagen con el mismo 'src' que la imagen seleccionada
    
    if (!foundNode && originalAlt) {
      foundNode = container.querySelector(`img[alt="${originalAlt}"]`) as HTMLImageElement; // Si no encuentra la imagen por 'src', la función (en el resto del código) intentará buscar por 'alt' o por la primera imagen visible, cubriendo varios escenarios
    }

    if (!foundNode) { // Si no se encontró la imagen por 'src' ni por 'alt', este bloque busca la primera imagen visible dentro del editor como último recurso
      const allImages = container.querySelectorAll('img') as NodeListOf<HTMLImageElement>; // Selecciona todas las imágenes dentro del contenedor del editor
      for (const img of allImages) { // Recorre todas las imágenes encontradas
        if (img.offsetParent !== null) { // Verifica que la imagen sea visible (no oculta por CSS/display)
          foundNode = img; // Si encuentra una imagen visible, la asigna a foundNode y termina el bucle
          break;
        }
      }
    }

    return foundNode; // Devuelve el nodo de imagen encontrado (o null si no hay ninguna)
  }, [editor]);

  // ✅ Centraliza la lógica para actualizar los estilos y atributos de una imagen seleccionada en el editor. Permite modificar el CSS (alineación, tamaño, borde, sombra, etc.) y atributos como alt o width de forma robusta y reutilizable
  const updateImageStyle = useCallback((
    styleUpdater: (currentStyle: string) => string, // Función que recibe el estilo actual y devuelve el nuevo estilo
    extraAttrs: Record<string, any> = {} // Objeto con atributos extra a actualizar (por ejemplo, { alt: "nueva descripción" })
  ) => {
    if (!editor) return; // Si no hay instancia del editor, no hace nada

    const imageNode = findCurrentImageNode(); // Busca el nodo <img> correspondiente en el DOM del editor

    if (!imageNode) { // Si no encuentra la imagen, muestra un warning y termina la función
      return;
    }

    const src = imageNode.src; // Obtiene la URL de la imagen actual
    const alt = imageNode.alt || ""; // Obtiene el texto alternativo actual, o una cadena vacía si no existe
    const newStyle = styleUpdater(imageNode.style.cssText || ""); // Calcula el nuevo string de estilos CSS usando la función recibida por parámetro

    editor.chain() // Permite encadenar varios comandos en Tiptap
      .updateAttributes('image', { // Actualiza los atributos del nodo de tipo 'image' seleccionado
        // Actualiza src, alt, style y cualquier otro atributo extra pasado
        src,
        alt,
        style: newStyle,
        ...extraAttrs
      })
      .run(); // Ejecuta la cadena de comandos

    // ✅ Después de actualizar los atributos de la imagen en el estado del editor (Tiptap), este bloque asegura que el DOM real del navegador también refleje esos cambios inmediatamente
    imageNode.style.cssText = newStyle; // Aplica el nuevo string de estilos CSS directamente al nodo <img> en el DOM. Así, el usuario ve el cambio de estilo (alineación, tamaño, borde, sombra, etc.) de forma instantánea
    Object.keys(extraAttrs).forEach(key => { // Recorre todos los atributos extra que se quieren actualizar (por ejemplo, alt, width)
      if (key === 'width' && extraAttrs[key]) { // Si el atributo es 'width' y tiene valor, lo aplica directamente al atributo HTML de la imagen
        imageNode.setAttribute('width', extraAttrs[key]);
      } else if (key === 'alt') { // Si el atributo es 'alt', lo actualiza en el DOM para que el texto alternativo esté sincronizado
        imageNode.setAttribute('alt', extraAttrs[key]);
      }
    });

  }, [editor, findCurrentImageNode]); // Indica que la función updateImageStyle solo debe volver a crearse si cambia la instancia de editor o la función findCurrentImageNode

  // ✅ Handler que se encarga de aplicar la alineación seleccionada (izquierda, centro, derecha) a la imagen desde el menú flotante
  const handleAlign = useCallback((alignment: keyof typeof STYLES.alignment) => { // Memoriza la función para que solo se cree de nuevo si cambian sus dependencias. Recibe como parámetro el tipo de alineación (left, center, right)
    executeImageAction(() => { // Centraliza la ejecución de la acción y asegura el foco y la selección en el editor tras el cambio
      updateImageStyle(style => { // Modifica el string de estilos CSS de la imagen
        const cleanStyle = style.replace(/(float:[^;]*;|display:[^;]*;|margin:[^;]*;)/g, ''); // Elimina cualquier estilo previo de alineación (float, display, margin) para evitar conflictos
        const newStyle = STYLES.alignment[alignment] + cleanStyle; // Aplica el nuevo estilo de alineación seleccionado y concatena el resto de estilos que ya tenía la imagen
        return newStyle; // Devuelve el nuevo string de estilos CSS generado para la imagen después de limpiar los estilos antiguos
      });
    }, `align-${alignment}`); // Aplica la alineación seleccionada
  }, [executeImageAction, updateImageStyle]); // Indica que handleAlign solo se volverá a crear si cambian estas funciones, optimizando el rendimiento

  // ✅ Permite cambiar el tamaño de la imagen seleccionada en el editor, aplicando uno de los tamaños predefinidos (small, medium, large, full) desde el menú flotante
  const handleResize = useCallback((size: keyof typeof STYLES.sizes) => { // Memoriza la función para que solo se cree de nuevo si cambian sus dependencias. Recibe como parámetro el tamaño seleccionado
    executeImageAction(() => { // Centraliza la ejecución de la acción y asegura el foco y la selección en el editor tras el cambio
      updateImageStyle(style => { // Modifica el string de estilos CSS de la imagen y actualiza el atributo width si corresponde
        // Elimina cualquier regla previa de width, min-width y max-width para evitar conflictos y acumulación de estilos. Limpia puntos y comas sobrantes y espacios
        const cleanStyle = style
          .replace(/\bwidth\s*:\s*[^;]+\s*;?/gi, '')
          .replace(/\bmin-width\s*:\s*[^;]+\s*;?/gi, '')
          .replace(/\bmax-width\s*:\s*[^;]+\s*;?/gi, '')
          .replace(/;\s*;+/g, ';')
          .replace(/^\s*;\s*|\s*;\s*$/g, '')
          .trim();
        
        const sizeValue = STYLES.sizes[size]; // Si hay otros estilos, los conserva y añade el nuevo ancho
        // Siempre fuerza max-width: 100% para que la imagen nunca desborde su contenedor
        const newStyle = cleanStyle 
          ? `${cleanStyle}; width: ${sizeValue}; max-width: 100%;` 
          : `width: ${sizeValue}; max-width: 100%;`;

        return newStyle;
      }, {
        width: STYLES.sizes[size] === '100%' ? null : STYLES.sizes[size] // Si el tamaño es full (100%), elimina el atributo width del HTML (para que sea responsive). Si es otro tamaño, lo establece explícitamente
      });
    }, `resize-${size}`); // Aplica el tamaño seleccionado
  }, [executeImageAction, updateImageStyle]);

  // ✅ Permite aplicar un estilo de borde predefinido (ninguno, fino, grueso, redondeado) a la imagen seleccionada en el editor desde el menú flotante
  const handleBorder = useCallback((borderType: keyof typeof STYLES.borders) => { // Recibe como parámetro el tipo de borde a aplicar (none, thin, thick, rounded)
    executeImageAction(() => { // Centraliza la ejecución de la acción y asegura el foco y la selección en el editor tras el cambio
      updateImageStyle(style => { // Modifica el string de estilos CSS de la imagen
        const cleanStyle = style.replace(/(border[^;]*;|border-radius[^;]*;)/g, ''); // Elimina cualquier estilo previo de borde o radio de borde para evitar acumulación o conflictos
        const newStyle = cleanStyle + STYLES.borders[borderType]; // Aplica el nuevo estilo de borde seleccionado y concatena el resto de estilos que ya tenía la imagen

        return newStyle;
      });
    }, `border-${borderType}`); // Aplica el tipo de borde seleccionado
  }, [executeImageAction, updateImageStyle]);

  // ✅ Permite aplicar un estilo de sombra predefinido (ninguna, ligera, media, fuerte) a la imagen seleccionada en el editor desde el menú flotante
  const handleShadow = useCallback((shadowType: keyof typeof STYLES.shadows) => { // Recibe como parámetro el tipo de sombra a aplicar (none, light, medium, heavy)
    executeImageAction(() => {
      updateImageStyle(style => {
        const cleanStyle = style.replace(/box-shadow[^;]*;/g, ''); // Elimina cualquier estilo previo de sombra (box-shadow) para evitar acumulación o conflictos
        const newStyle = cleanStyle + STYLES.shadows[shadowType]; // Aplica el nuevo estilo de sombra seleccionado y concatena el resto de estilos que ya tenía la imagen

        return newStyle;
      });
    }, `shadow-${shadowType}`); // Aplica el tipo de sombra seleccionado
  }, [executeImageAction, updateImageStyle]);

  // ✅ Permite actualizar el texto alternativo (atributo alt) de la imagen seleccionada en el editor, usando el valor que el usuario escribe en el input del menú flotante
  const handleAltTextUpdate = useCallback(() => {
    executeImageAction(() => {
      updateImageStyle(style => style, { alt: altText.trim() }); // No modifica el string de estilos CSS (lo deja igual). Actualiza el atributo 'alt' de la imagen con el valor de altText (eliminando espacios al inicio y final)
      setShowAltEditor(false); // Cierra el editor de texto alternativo (oculta el input)
      setAltText(''); // Limpia el estado temporal del texto alternativo
    }, 'alt-update'); // Aplica el texto alternativo actualizado
  }, [executeImageAction, updateImageStyle, altText]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);
  
  const confirmDelete = useCallback(() => {
    if (!editor) return;
    
    const imageNode = findCurrentImageNode();
    if (!imageNode) return;
  
    const { view } = editor;
    const pos = view.posAtDOM(imageNode, 0);
    
    if (pos !== null && pos !== undefined) {
      editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
    }
    
    setShowDeleteConfirm(false);
    onClose();
  }, [editor, findCurrentImageNode, onClose]);
  
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // ✅ Permite eliminar la imagen seleccionada en el editor, mostrando primero una confirmación al usuario para evitar borrados accidentales
  // const handleDelete = useCallback(() => {
  //   if (confirm("¿Estás seguro de que quieres eliminar esta imagen?")) { // Muestra un cuadro de confirmación nativo del navegador. Solo si el usuario acepta, continúa con la eliminación
  //     editor?.chain().focus().deleteSelection().run(); // Se asegura de que el editor esté enfocado y elimina la imagen seleccionada
  //     onClose(); // Cierra el menú flotante después de eliminar la imagen
  //   }
  // }, [editor, onClose]);

  // ✅ Permite cambiar la pestaña activa del menú flotante (entre "Alinear", "Tamaño" y "Estilo") y, tras el cambio, restaura el foco en el menú para mejorar la accesibilidad y la experiencia de usuario
  const handleTabChange = useCallback((tab: "align" | "size" | "style") => { // Memoriza la función para que no se recree en cada render (no tiene dependencias porque solo usa setters y refs locales)
    setActiveTab(tab); // Cambia el estado de la pestaña activa, lo que provoca que se muestre el contenido correspondiente
    setTimeout(() => { // Usa un pequeño retraso (0 ms) para esperar a que React termine de renderizar el nuevo contenido de la pestaña antes de intentar enfocar el menú
      if (menuRef.current) { // Si el menú existe, le da el foco, evitando que la página haga scroll inesperado
        menuRef.current.focus({ preventScroll: true });
      }
    }, 0);
  }, []);

  // ✅ Intercepta la tecla Supr/Delete cuando el menú flotante está abierto para mostrar confirmación de eliminación de imagen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Si se presiona Delete o Backspace y hay una imagen seleccionada
      if ((event.key === 'Delete' || event.key === 'Backspace') && imageNode) {
        event.preventDefault(); // Previene el comportamiento por defecto (eliminar sin confirmar)
        event.stopPropagation(); // Evita que el evento se propague a otros listeners
        setShowDeleteConfirm(true); // Muestra el diálogo de confirmación personalizado
      }
    };
    document.addEventListener('keydown', handleKeyDown); // Solo agregar el listener si el menú está montado y visible
    return () => {
      document.removeEventListener('keydown', handleKeyDown); // Limpia el listener al desmontar
    };
  }, [imageNode]); // Se ejecuta cada vez que cambia la imagen seleccionada

  // ✅ Define los estilos en línea (inline styles) que se aplican al menú flotante de la imagen, controlando su posición y visibilidad sobre el editor
  const menuStyle: React.CSSProperties = {
    position: 'absolute', // El menú se posiciona de forma absoluta respecto a su contenedor más cercano con posición relativa
    left: position.x, // Coloca el menú horizontalmente en la coordenada X recibida por props (donde el usuario hizo clic o seleccionó la imagen)
    top: Math.max(50, position.y), // Coloca el menú verticalmente en la coordenada Y recibida por props, pero nunca por encima de 50px desde arriba (evita que el menú quede fuera de la pantalla)
    zIndex: 1000, // Asegura que el menú flote por encima de otros elementos del editor
    transform: 'translateX(-50%)', // Centra el menú horizontalmente respecto a la posición X (el punto de referencia es el centro del menú, no la esquina izquierda)
    pointerEvents: 'auto', // Permite que el menú reciba eventos de mouse y teclado (clics, foco, etc.)
  };

  return (
    <div
      ref={menuRef}
      tabIndex={-1}
      className="image-floating-menu bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-white"
      style={menuStyle}
    >
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-600">
        {(['align', 'size', 'style'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg ${
              activeTab === tab ? "bg-blue-600 text-white" : "hover:bg-gray-700"
            }`}
          >
            {tab === 'align' ? 'Alinear' : tab === 'size' ? 'Tamaño' : 'Estilo'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-2">
        {activeTab === "align" && (
          <div className="flex items-center gap-1">
            <button onClick={() => handleAlign('left')} className="px-2 py-1 hover:bg-gray-700 rounded text-sm" title="Izquierda">⬅️</button>
            <button onClick={() => handleAlign('center')} className="px-2 py-1 hover:bg-gray-700 rounded text-sm" title="Centro">⬜</button>
            <button onClick={() => handleAlign('right')} className="px-2 py-1 hover:bg-gray-700 rounded text-sm" title="Derecha">➡️</button>
          </div>
        )}

        {activeTab === "size" && (
          <div className="flex items-center gap-1">
            <button onClick={() => handleResize('small')} className="px-2 py-1 hover:bg-gray-700 rounded text-xs font-bold" title="Pequeño">S</button>
            <button onClick={() => handleResize('medium')} className="px-2 py-1 hover:bg-gray-700 rounded text-xs font-bold" title="Mediano">M</button>
            <button onClick={() => handleResize('large')} className="px-2 py-1 hover:bg-gray-700 rounded text-xs font-bold" title="Grande">L</button>
            <button onClick={() => handleResize('full')} className="px-2 py-1 hover:bg-gray-700 rounded text-xs font-bold" title="Completo">XL</button>
          </div>
        )}

        {activeTab === "style" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-12">Borde:</span>
              <button onClick={() => handleBorder('none')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Sin borde">⭕</button>
              <button onClick={() => handleBorder('thin')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Fino">⬜</button>
              <button onClick={() => handleBorder('thick')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs font-bold" title="Grueso">⬛</button>
              <button onClick={() => handleBorder('rounded')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Redondeado">🔲</button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-12">Sombra:</span>
              <button onClick={() => handleShadow('none')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Sin sombra">⌀</button>
              <button onClick={() => handleShadow('light')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Ligera">🌫️</button>
              <button onClick={() => handleShadow('medium')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Media">☁️</button>
              <button onClick={() => handleShadow('heavy')} className="px-1 py-1 hover:bg-gray-700 rounded text-xs" title="Intensa">⛅</button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-2 border-t border-gray-600">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAltEditor(!showAltEditor)}
            className="px-2 py-1 hover:bg-blue-600 rounded text-xs font-medium"
            title="Texto alternativo"
          >
            ALT
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 hover:bg-red-600 rounded text-xs font-medium text-red-400 hover:text-white"
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
        <button
          onClick={onClose}
          className="px-2 py-1 hover:bg-gray-700 rounded text-sm font-bold"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Alt Text Editor */}
      {showAltEditor && (
        <div className="p-2 border-t border-gray-600 bg-gray-800">
          <label className="block text-xs text-gray-400 mb-1">Texto alternativo:</label>
          <input
            ref={altInputRef}
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder={imageNode?.alt || "Describe la imagen..."}
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            maxLength={125}
          />
          <div className="flex justify-end gap-1 mt-2">
            <button
              onClick={() => {
                setShowAltEditor(false);
                setAltText('');
              }}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleAltTextUpdate}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <EditorDialog
        open={showDeleteConfirm}
        title="🗑️ Eliminar imagen"
        message="¿Estás seguro de que quieres eliminar esta imagen del contenido?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default ImageFloatingMenu;
