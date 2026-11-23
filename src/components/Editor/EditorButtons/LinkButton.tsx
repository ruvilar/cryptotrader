import React from 'react';
import { Link as LinkIcon, X } from 'lucide-react';
import { Editor as TipTapEditor } from '@tiptap/react';

/**
 * Props para el botón de enlaces.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface LinkButtonProps {
  editor: TipTapEditor | null;
  setLinkUrl: (value: string) => void;
  setLinkInputVisible: (value: boolean) => void;
  setSavedRange: (value: any) => void;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  editor,
  setLinkUrl,
  setLinkInputVisible,
  setSavedRange
}) => {
  // ⬇️ 1. Early return si no hay editor
  if (!editor) return null;

  // ⬇️ 2. Clases de estilo para los botones
  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition hover:scale-105 ${
      active ? 'bg-blue-500 text-white' : 'bg-white text-black'
    }`;

  return (
    <>
      {/* BOTÓN DE ENLACE DE TEXTO */}
      <button
        onClick={() => {
          // Si hay un enlace activo, editarlo
          if (editor.isActive('link')) {
            const currentUrl = editor.getAttributes('link').href;
            setLinkUrl(currentUrl || '');
            setLinkInputVisible(true);
            // No se guarda rango porque se edita el enlace existente
          } else {
            // Crear un nuevo enlace (requiere selección)
            const { from, to } = editor.state.selection;
            if (from !== to) {
              setSavedRange(editor.state.selection);
              setLinkInputVisible(true);
              setLinkUrl('');
            }
          }
        }}
        className={buttonStyle(editor.isActive('link'))}
        title="Insertar enlace"
        aria-label="Insertar enlace"
      >
        <LinkIcon size={16} />
      </button>

      {/* BOTÓN PARA ELIMINAR ENLACE */}
      <button
        onClick={() => editor.chain().focus().unsetLink().run()}
        className={buttonStyle(false)}
        title="Quitar enlace"
        aria-label="Quitar enlace"
      >
        <X size={16} />
      </button>
    </>
  );
};

export default LinkButton;