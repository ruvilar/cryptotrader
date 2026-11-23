import React from 'react';
import { List, ListOrdered } from 'lucide-react';
import { Editor as TipTapEditor } from '@tiptap/react';

/**
 * Props para los botones de listas.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface ListButtonsProps {
  editor: TipTapEditor | null;
}

const ListButtons: React.FC<ListButtonsProps> = ({ editor }) => {
  // ⬇️ 1. Early return si no hay editor
  if (!editor) return null;

  // ⬇️ 2. Clases de estilo para los botones de lista
  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition hover:scale-105 ${
      active ? 'bg-blue-500 text-white' : 'bg-white text-black'
    }`;

  // ⬇️ 3. Render principal de los botones de listas
  return (
    <>
      {/* BOTÓN DE LISTA CON VIÑETAS */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonStyle(editor.isActive('bulletList'))}
        title="Lista con viñetas"
        aria-label="Lista con viñetas"
      >
        <List size={16} />
      </button>

      {/* BOTÓN DE LISTA NUMERADA */}
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonStyle(editor.isActive('orderedList'))}
        title="Lista numerada"
        aria-label="Lista numerada"
      >
        <ListOrdered size={16} />
      </button>
    </>
  );
};

export default ListButtons;