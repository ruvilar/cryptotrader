import React from 'react';
import {
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';
import { Editor as TipTapEditor } from '@tiptap/react';

/**
 * Props para los botones de deshacer/rehacer y alineación de texto.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface UndoRedoAlignsButtonsProps {
  editor: TipTapEditor | null;
}

const UndoRedoAlignsButtons: React.FC<UndoRedoAlignsButtonsProps> = ({ editor }) => {
  // ⬇️ 1. Early return si no hay editor
  if (!editor) return null;

  // ⬇️ 2. Clases de estilo para los botones
  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition hover:scale-105 ${
      active ? 'bg-blue-500 text-white' : 'bg-white text-black'
    }`;

  // ⬇️ 3. Render principal de los botones de edición y alineación
  return (
    <>
      {/* BOTONES DE DESHACER/REHACER */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className={buttonStyle(false)}
        title="Deshacer"
        aria-label="Deshacer"
      >
        <Undo2 size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().redo().run()}
        className={buttonStyle(false)}
        title="Rehacer"
        aria-label="Rehacer"
      >
        <Redo2 size={16} />
      </button>

      {/* BOTONES DE ALINEACIÓN DE TEXTO */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={buttonStyle(editor.isActive({ textAlign: 'left' }))}
        title="Izquierda"
        aria-label="Alinear a la izquierda"
      >
        <AlignLeft size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={buttonStyle(editor.isActive({ textAlign: 'center' }))}
        title="Centrar"
        aria-label="Alinear al centro"
      >
        <AlignCenter size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={buttonStyle(editor.isActive({ textAlign: 'right' }))}
        title="Derecha"
        aria-label="Alinear a la derecha"
      >
        <AlignRight size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={buttonStyle(editor.isActive({ textAlign: 'justify' }))}
        title="Justificar"
        aria-label="Justificar texto"
      >
        <AlignJustify size={16} />
      </button>
    </>
  );
};

export default UndoRedoAlignsButtons;