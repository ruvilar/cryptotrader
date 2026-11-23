import React from 'react';
import { Editor as TipTapEditor } from "@tiptap/react";

/**
 * Props para el selector de encabezados.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface HeadersButtonProps {
  editor: TipTapEditor | null;
  updateTrigger: number;
  setUpdateTrigger: (value: number | ((prev: number) => number)) => void;
}

const HeadersButton: React.FC<HeadersButtonProps> = ({
  editor,
  updateTrigger,
  setUpdateTrigger
}) => {
  // ⬇️ 1. Early return si no hay editor
  if (!editor) return null;

  // ⬇️ 2. Render principal del selector de encabezado
  return (
    <select
      onChange={(e) => {
        const value = e.target.value;
        // Cambia el tipo de bloque según el valor seleccionado
        editor.chain().focus();

        if (value === 'paragraph') {
          editor.chain().focus().setParagraph().run();
        } else {
          const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6;
          editor.chain().focus().setHeading({ level }).run();
        }

        // Fuerza re-render inmediato
        setUpdateTrigger(prev => prev + 1);
      }}
      value={(() => {
        // Determina el valor seleccionado según el estado actual
        if (!editor) return 'paragraph';
        for (let i = 1; i <= 6; i++) {
          if (editor.isActive('heading', { level: i })) {
            return i.toString();
          }
        }
        return 'paragraph';
      })()}
      key={updateTrigger} // Fuerza re-render cuando cambia updateTrigger
      className="p-2 rounded-xl bg-white text-black text-sm cursor-pointer"
      title="Encabezado"
      aria-label="Encabezado"
    >
      <option value="paragraph">Párrafo</option>
      <option value="1">🔸 Título 1 (H1)</option>
      <option value="2">🔹 Título 2 (H2)</option>
      <option value="3">▪️ Título 3 (H3)</option>
      <option value="4">▫️ Título 4 (H4)</option>
      <option value="5">• Título 5 (H5)</option>
      <option value="6">∘ Título 6 (H6)</option>
    </select>
  );
};

export default HeadersButton;