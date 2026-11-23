import React from 'react';
import { Editor as TipTapEditor } from "@tiptap/react";

/* Props para el selector de tipo de fuente */
interface FontButtonProps {
  editor: TipTapEditor | null;
}

const FontButton: React.FC<FontButtonProps> = ({ editor }) => {
  // ⬇1. Si no hay editor, no renderiza nada
  if (!editor) return null;

  /* Cambia la familia de fuente del texto seleccionado */
  const handleFontFamilyChange = (fontFamily: string) => {
    if (fontFamily === 'default') {
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain()
        .focus()
        .setMark('textStyle', { fontFamily })
        .run();
    }
  };

  // ⬇2. Render principal del selector de fuente
  return (
    <select
      onChange={(e) => handleFontFamilyChange(e.target.value)}
      defaultValue="default"
      className="p-2 rounded-xl bg-white text-black text-sm cursor-pointer min-w-[120px]"
      title="Tipo de fuente"
      aria-label="Tipo de fuente"
    >
      <option value="Arial, sans-serif">Arial</option>
      <option value="'Times New Roman', serif">Times New Roman</option>
      <option value="'Courier New', monospace">Courier New</option>
      <option value="Helvetica, sans-serif">Helvetica</option>
      <option value="Georgia, serif">Georgia</option>
      <option value="Verdana, sans-serif">Verdana</option>
      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
      <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
      <option value="Impact, sans-serif">Impact</option>
      <option value="'Lucida Console', monospace">Lucida Console</option>
      <option value="Tahoma, sans-serif">Tahoma</option>
      <option value="'Palatino Linotype', serif">Palatino</option>
      <option value="'Book Antiqua', serif">Book Antiqua</option>
      <option value="'Century Gothic', sans-serif">Century Gothic</option>
      <option value="'Franklin Gothic Medium', sans-serif">Franklin Gothic</option>
    </select>
  );
};

export default FontButton;