import React from "react";
import { Code2 } from "lucide-react";
import { Editor as TipTapEditor } from "@tiptap/react";

interface CodeHtmlTextButtonProps {
  editor: TipTapEditor | null;
  isHtmlMode: boolean;
  setIsHtmlMode: (value: boolean) => void;
}

/**
 * Botón para conmutar entre modo visual (Texto enriquecido) y modo HTML.
 * Cambia el estado del editor a modo HTML o visual.
 * El icono puede actualizarse para diferenciar ambos estados si lo deseas.
 */
const CodeHtmlTextButton: React.FC<CodeHtmlTextButtonProps> = ({ 
  editor, 
  isHtmlMode,
  setIsHtmlMode
}) => {
  if (!editor) return null;

  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition hover:scale-105 ${
      active ? "bg-blue-500 text-white" : "bg-white text-black"
    }`;

  return (
    <button
      onClick={() => setIsHtmlMode(!isHtmlMode)}
      className={buttonStyle(isHtmlMode)}
      title={isHtmlMode ? "Modo Texto (Visual)" : "Modo HTML"}
    >
      <Code2 size={16} />
      <span className="text-xs font-medium">
        {isHtmlMode ? "Texto" : "HTML"}
      </span>
    </button>
  );
};

export default CodeHtmlTextButton;