import React, { Fragment } from 'react';
import { Eraser } from 'lucide-react';
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Quote, Minus
} from 'lucide-react';
import { Editor as TipTapEditor } from "@tiptap/react";

/**
 * Props para los botones de formato de texto.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface FormatButtonsProps {
  editor: TipTapEditor | null;
  updateTrigger: number;
}

const FormatButtons: React.FC<FormatButtonsProps> = ({ editor, updateTrigger }) => {
  // ⬇️ 1. Early return si no hay editor
  if (!editor) return null;

  // ⬇️ 2. Clases de estilo para los botones de formato
  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition hover:scale-105 ${
      active ? 'bg-blue-500 text-white' : 'bg-white text-black'
    }`;

  // ⬇️ 3. Render principal de los botones de formato
  return (
    <Fragment key={updateTrigger}>
      {/* BOTONES BÁSICOS DE FORMATO */}
      {/* ⬇️ Negrita */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonStyle(editor.isActive('bold'))}
        title="Negrita"
        aria-label="Negrita"
      >
        <Bold size={16} />
      </button>

      {/* ⬇️ Cursiva */}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonStyle(editor.isActive('italic'))}
        title="Cursiva"
        aria-label="Cursiva"
      >
        <Italic size={16} />
      </button>

      {/* ⬇️ Tachado */}
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonStyle(editor.isActive('strike'))}
        title="Tachado"
        aria-label="Tachado"
      >
        <Strikethrough size={16} />
      </button>

      {/* ⬇️ Subrayado */}
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonStyle(editor.isActive('underline'))}
        title="Subrayado"
        aria-label="Subrayado"
      >
        <UnderlineIcon size={16} />
      </button>

      {/* ⬇️ Citar texto */}
      <button
        onClick={() => {
          if (editor.isActive('blockquote')) {
            editor.chain().focus().unsetBlockquote().run();
          } else {
            editor.chain().focus().setBlockquote().run();
          }
        }}
        className={buttonStyle(editor.isActive('blockquote'))}
        title="Citar texto"
        aria-label="Citar texto"
      >
        <Quote size={16} />
      </button>

      {/* ⬇️ Separador horizontal */}
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={buttonStyle(false)}
        title="Separador"
        aria-label="Separador"
      >
        <Minus size={16} />
      </button>

      {/* ⬇️ Limpiar formato */}
      <button
        onClick={() => {
          // Extraer el texto plano, borrar todo el contenido, y restaurar solo el texto sin formato
          const plainText = editor.getText().trim();

          editor.commands.clearContent();

          if (plainText) {
            editor.commands.setContent(`<p>${plainText}</p>`);
          } else {
            editor.commands.setContent("<p></p>");
          }
        }}
        className={buttonStyle(false)}
        title="Limpiar formato"
        aria-label="Limpiar formato"
      >
        <Eraser size={16} />
      </button>
    </Fragment>
  );
};

export default FormatButtons;