import React from 'react';
import { Editor as TipTapEditor } from '@tiptap/react';

/**
 * Props para el selector de tamaño de texto.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface TextSizeButtonProps {
  editor: TipTapEditor | null;
}

const TextSizeButton: React.FC<TextSizeButtonProps> = ({ editor }) => {
  // ⬇️ 1. Early return si no hay editor
  if (!editor) return null;

  /**
   * Cambia el tamaño de fuente del texto seleccionado.
   * Si se selecciona "default", elimina el estilo de tamaño.
   */
  const handleFontSizeChange = (fontSize: string) => {
    if (fontSize === 'default') {
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain()
        .focus()
        .setMark('textStyle', { fontSize })
        .run();
    }
  };

  // ⬇️ 2. Render principal del selector de tamaño de texto
  return (
    <select
      onChange={(e) => handleFontSizeChange(e.target.value)}
      defaultValue="16px"
      className="p-2 rounded-xl bg-white text-black text-sm cursor-pointer min-w-[80px]"
      title="Tamaño de texto"
      aria-label="Tamaño de texto"
    >
      <option value="10px">10px</option>
      <option value="12px">12px</option>
      <option value="14px">14px</option>
      <option value="16px">16px</option>
      <option value="18px">18px</option>
      <option value="20px">20px</option>
      <option value="24px">24px</option>
      <option value="28px">28px</option>
      <option value="32px">32px</option>
      <option value="36px">36px</option>
      <option value="48px">48px</option>
      <option value="60px">60px</option>
      <option value="72px">72px</option>
    </select>
  );
};

export default TextSizeButton;