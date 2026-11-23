import React from 'react';
import { PencilLine, Highlighter, ChevronDown } from 'lucide-react';
import { Editor as TipTapEditor } from '@tiptap/react';
import { useDraggable } from '../hooks/useDraggable';
import { useNotifications } from '../hooks/useNotifications';

interface ColorTextButtonProps {
  editor: TipTapEditor | null;
  mode: 'color' | 'highlight';
  show: boolean;
  setShow: (value: boolean) => void;
}

const textColors = [
  { name: 'Negro', color: '#000000' },
  { name: 'Gris 900', color: '#111827' },
  { name: 'Gris 700', color: '#374151' },
  { name: 'Gris 600', color: '#4b5563' },
  { name: 'Gris 500', color: '#6b7280' },
  { name: 'Gris 400', color: '#9ca3af' },
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Azul 600', color: '#2563eb' },
  { name: 'Azul 700', color: '#1d4ed8' },
  { name: 'Índigo', color: '#6366f1' },
  { name: 'Violeta', color: '#8b5cf6' },
  { name: 'Púrpura', color: '#a855f7' },
  { name: 'Verde', color: '#22c55e' },
  { name: 'Esmeralda', color: '#10b981' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Cian', color: '#06b6d4' },
  { name: 'Lima', color: '#84cc16' },
  { name: 'Amarillo', color: '#eab308' },
  { name: 'Naranja', color: '#f97316' },
  { name: 'Ámbar', color: '#f59e0b' },
  { name: 'Rojo', color: '#ef4444' },
  { name: 'Rojo 600', color: '#dc2626' },
  { name: 'Rosa', color: '#ec4899' },
  { name: 'Fucsia', color: '#d946ef' },
  { name: 'Sin color', color: null, isTransparent: true },
  { name: 'Blanco', color: '#ffffff' },
];

const highlightColors = [
  { name: 'Sin resaltado', color: null, isTransparent: true },
  { name: 'Blanco', color: '#ffffff' },
  { name: 'Amarillo claro', color: '#fef3c7' },
  { name: 'Amarillo', color: '#fde047' },
  { name: 'Amarillo intenso', color: '#facc15' },
  { name: 'Verde claro', color: '#d1fae5' },
  { name: 'Verde', color: '#86efac' },
  { name: 'Verde intenso', color: '#4ade80' },
  { name: 'Azul claro', color: '#dbeafe' },
  { name: 'Azul', color: '#93c5fd' },
  { name: 'Azul intenso', color: '#60a5fa' },
  { name: 'Púrpura claro', color: '#e9d5ff' },
  { name: 'Púrpura', color: '#c4b5fd' },
  { name: 'Púrpura intenso', color: '#a78bfa' },
  { name: 'Rosa claro', color: '#fce7f3' },
  { name: 'Rosa', color: '#f9a8d4' },
  { name: 'Rosa intenso', color: '#f472b6' },
  { name: 'Rojo claro', color: '#fee2e2' },
  { name: 'Rojo', color: '#fca5a5' },
  { name: 'Rojo intenso', color: '#f87171' },
  { name: 'Naranja claro', color: '#fed7aa' },
  { name: 'Naranja', color: '#fdba74' },
  { name: 'Naranja intenso', color: '#fb923c' },
  { name: 'Gris claro', color: '#f3f4f6' },
  { name: 'Gris', color: '#d1d5db' },
];

const ColorTextButton: React.FC<ColorTextButtonProps> = ({
  editor,
  mode,
  show,
  setShow
}) => {
  if (!editor) return null;

  const { position, isDragging, dragRef, handleMouseDown } = useDraggable();
  const { showNotification } = useNotifications();

  const isColor = mode === 'color';
  const palette = isColor ? textColors : highlightColors;
  const title = isColor ? 'Color de texto' : 'Resaltar texto';
  const errorMsg = isColor ? 'Error al aplicar el color de texto' : 'Error al aplicar resaltado de color de texto';

  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition-all duration-200 hover:scale-105 ${
      active ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-50'
    }`;

  const handleColorClick = (colorObj: any) => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      setShow(false);
      return;
    }
    try {
      if (colorObj.isTransparent || colorObj.color === null) {
        isColor
          ? editor.chain().focus().unsetColor().run()
          : editor.chain().focus().unsetHighlight().run();
      } else {
        isColor
          ? editor.chain().focus().setColor(colorObj.color).run()
          : editor.chain().focus().setHighlight({ color: colorObj.color }).run();
      }
    } catch {
      showNotification(errorMsg, 'error');
    }
    setShow(false);
  };

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className={buttonStyle(show)}
        title={title}
      >
        {isColor ? <PencilLine size={16} /> : <Highlighter size={16} />}
        <ChevronDown size={14} className={`transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>

      {show && (
        <div
          ref={dragRef}
          onMouseDown={(e) => e.stopPropagation()}
          className={`fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 ${isColor ? 'color-palette' : 'highlight-palette'} ${isDragging ? 'cursor-move' : ''}`}
          style={{
            top: `${60 + position.y}px`,
            left: `calc(50% + ${position.x}px)`,
            transform: 'translateX(-50%)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between mb-4 cursor-move bg-gray-50 -mx-4 -mt-4 px-4 py-2 rounded-t-xl border-b"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500">Selecciona texto primero</p>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-gray-500 hover:text-red-500 text-xl px-2"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {palette.map((colorObj, i) => (
              <div key={i} className="group relative">
                <div
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-400 transition-all hover:scale-110 shadow-sm flex items-center justify-center"
                  style={{
                    backgroundColor: colorObj.isTransparent ? '#ffffff' : colorObj.color,
                    backgroundImage: colorObj.isTransparent
                      ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)'
                      : 'none',
                    backgroundSize: colorObj.isTransparent ? '8px 8px' : 'auto',
                    backgroundPosition: colorObj.isTransparent ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                  }}
                  onClick={() => handleColorClick(colorObj)}
                  title={colorObj.name}
                >
                  {colorObj.isTransparent && (
                    <span className="text-red-500 font-bold text-base">×</span>
                  )}
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {colorObj.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ColorTextButton;