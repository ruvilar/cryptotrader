import { Editor as TipTapEditor } from "@tiptap/react";
import HeadersButton from './EditorButtons/HeadersButton';
import FormatButtons from './EditorButtons/FormatButtons';
import ListButtons from './EditorButtons/ListButtons';
import CodeHtmlTextButton from './EditorButtons/CodeHtmlTextButton';
import LinkButton from './EditorButtons/LinkButton';
import UndoRedoAlignsButtons from './EditorButtons/UndoRedoAlignsButtons';
import ColorTextButton from './EditorButtons/ColorTextButton';
import TextSizeButton from './EditorButtons/TextSizeButton';
import FontButton from './EditorButtons/FontButton';
import AddMediaButton from './EditorButtons/AddMediaButton';
import TableButton from './EditorButtons/TableButton';
import { useEditorState } from "./hooks/useEditorState";
import { GradientButtonDropdown } from "./EditorButtons/GradientButtonsGroup";

// Permite que los botones del toolbar interactúen directamente con el editor (por ejemplo, aplicar formato, insertar elementos)
interface EditorToolbarProps {
  editor: TipTapEditor | null; // Recibe la instancia del editor TipTap, o null si aún no está inicializado
  ui: ReturnType<typeof useEditorState>['ui']; // Este objeto contiene estados y funciones para controlar la interfaz del editor (por ejemplo, mostrar colores, modo HTML, triggers de actualización). Recibe el objeto 'ui' del hook useEditorState
  link: ReturnType<typeof useEditorState>['link']; // Gestiona todo lo relacionado con los enlaces: mostrar el input, guardar el rango de selección, establecer la URL. Recibe el objeto 'link'
  image: ReturnType<typeof useEditorState>['image']; // Maneja la lógica para insertar y gestionar imágenes en el editor. Recibe el objeto 'image'
  media: ReturnType<typeof useEditorState>['media']; // Permite controlar la inserción y gestión de otros medios (videos, audios, etc.). Recibe el objeto 'media'
}

// ✅ Es un componente funcional de React con props tipadas. Recibe la instancia del editor y varios objetos de estado y acciones (ui, link, image, media) provenientes del hook useEditorState
const EditorToolbar = ({ editor, ui, link, image, media }: EditorToolbarProps) => {
  if (!editor) return null; // Si el editor aún no está inicializado, no se muestra el toolbar. Evita errores por intentar interactuar con un editor inexistente
  return (
    <div key={ui.updateTrigger} className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">{/* El atributo key={ui.updateTrigger} fuerza el re-render del toolbar cuando cambia el trigger, útil para actualizar el estado visual tras cambios en el editor */}
      <div className="flex justify-center flex-wrap gap-2 p-2 bg-gradient-to-r from-white-700 to-black-600">
      {/* Botones de edición de texto: Encabezados, fuente, tamaño, formato, listas, código HTML, enlaces, deshacer/rehacer/alinear. Cada botón recibe props específicas para interactuar con el editor y actualizar el estado */}
        <HeadersButton editor={editor} updateTrigger={ui.updateTrigger} setUpdateTrigger={ui.setUpdateTrigger} />
        <FontButton editor={editor} />
        <TextSizeButton editor={editor} />
        <FormatButtons editor={editor} updateTrigger={ui.updateTrigger} />
        <ListButtons editor={editor} />
        <CodeHtmlTextButton editor={editor} isHtmlMode={ui.isHtmlMode} setIsHtmlMode={ui.setIsHtmlMode} />
        <LinkButton editor={editor} setLinkUrl={link.setLinkUrl} setLinkInputVisible={link.setLinkInputVisible} setSavedRange={link.setSavedRange} />
        <UndoRedoAlignsButtons editor={editor} />
      </div>
      <div className="flex justify-center flex-wrap gap-2 p-2 bg-gradient-to-r from-white-700 to-black-600">
        {/* Botones para color, resaltado, medios y tablas. Permiten abrir menús flotantes para seleccionar color, resaltar texto, insertar imágenes/videos y crear tablas */}
        <ColorTextButton editor={editor} mode="color" show={ui.showColors} setShow={ui.setShowColors} />
        <ColorTextButton editor={editor} mode="highlight" show={ui.showHighlight} setShow={ui.setShowHighlight} />
        <AddMediaButton editor={editor} setMediaInputVisible={media.setMediaInputVisible} setImageInputVisible={image.setImageInputVisible} setSavedRange={link.setSavedRange} />
        <TableButton editor={editor} showTable={ui.showTable} setShowTable={ui.setShowTable} tableMenuPosition={ui.tableMenuPosition} setTableMenuPosition={ui.setTableMenuPosition} />
        <GradientButtonDropdown editor={editor} />
      </div>
    </div>
  );
};

export default EditorToolbar;