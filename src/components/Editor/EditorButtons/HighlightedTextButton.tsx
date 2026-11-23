import React from 'react';
import { Highlighter, ChevronDown } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { useNotifications } from '../hooks/useNotifications';
import { Editor as TipTapEditor } from "@tiptap/react";

/**
 * Props del botón de resaltado de texto.
 * editor: instancia de TipTap.
 * showHighlight: estado para mostrar/ocultar la paleta.
 * setShowHighlight: función para cambiar el estado de la paleta.
 */
interface HighlightedTextButtonProps {
  editor: TipTapEditor | null;
  showHighlight: boolean;
  setShowHighlight: (value: boolean) => void;
}

// Paleta profesional de colores de resaltado Tailwind
const highlightColors = [
  // Cada objeto representa un color de fondo para resaltar texto.
  { name: 'Sin resaltado', color: null, tailwind: null, isTransparent: true },
  { name: 'Blanco', color: '#ffffff', tailwind: 'bg-white' },

  { name: 'Amarillo claro', color: '#fef3c7', tailwind: 'bg-yellow-100' },
  { name: 'Amarillo', color: '#fde047', tailwind: 'bg-yellow-300' },
  { name: 'Amarillo intenso', color: '#facc15', tailwind: 'bg-yellow-400' },

  { name: 'Verde claro', color: '#d1fae5', tailwind: 'bg-green-100' },
  { name: 'Verde', color: '#86efac', tailwind: 'bg-green-300' },
  { name: 'Verde intenso', color: '#4ade80', tailwind: 'bg-green-400' },

  { name: 'Azul claro', color: '#dbeafe', tailwind: 'bg-blue-100' },
  { name: 'Azul', color: '#93c5fd', tailwind: 'bg-blue-300' },
  { name: 'Azul intenso', color: '#60a5fa', tailwind: 'bg-blue-400' },

  { name: 'Púrpura claro', color: '#e9d5ff', tailwind: 'bg-purple-100' },
  { name: 'Púrpura', color: '#c4b5fd', tailwind: 'bg-purple-300' },
  { name: 'Púrpura intenso', color: '#a78bfa', tailwind: 'bg-purple-400' },

  { name: 'Rosa claro', color: '#fce7f3', tailwind: 'bg-pink-100' },
  { name: 'Rosa', color: '#f9a8d4', tailwind: 'bg-pink-300' },
  { name: 'Rosa intenso', color: '#f472b6', tailwind: 'bg-pink-400' },

  { name: 'Rojo claro', color: '#fee2e2', tailwind: 'bg-red-100' },
  { name: 'Rojo', color: '#fca5a5', tailwind: 'bg-red-300' },
  { name: 'Rojo intenso', color: '#f87171', tailwind: 'bg-red-400' },

  { name: 'Naranja claro', color: '#fed7aa', tailwind: 'bg-orange-100' },
  { name: 'Naranja', color: '#fdba74', tailwind: 'bg-orange-300' },
  { name: 'Naranja intenso', color: '#fb923c', tailwind: 'bg-orange-400' },

  { name: 'Gris claro', color: '#f3f4f6', tailwind: 'bg-gray-100' },
  { name: 'Gris', color: '#d1d5db', tailwind: 'bg-gray-300' },
];

const HighlightedTextButton: React.FC<HighlightedTextButtonProps> = ({ 
  editor, 
  showHighlight, 
  setShowHighlight 
}) => {
  // ⬇️ Si no hay editor, no renderiza nada.
  if (!editor) return null;

  const { position, isDragging, dragRef, handleMouseDown } = useDraggable(); // Hook para que el menú flotante pueda arrastrarse
  const { showNotification } = useNotifications(); // Hook para mostrar notificaciones

  // Estilo de botón, cambia si el menú está activo.
  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition-all duration-200 hover:scale-105 ${
      active ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-50'
    }`;

  /**
   * Aplica o quita resaltado al texto seleccionado.
   * Si no hay selección, solo cierra el menú.
   */
  const handleHighlightClick = (colorObj: any) => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      // No hay texto seleccionado
      setShowHighlight(false);
      return;
    }

    try {
      if (colorObj.isTransparent || colorObj.color === null) {
        // Quitar resaltado
        editor.chain().focus().unsetHighlight().run();
      } else {
        // Aplicar resaltado con color
        editor.chain().focus().setHighlight({ color: colorObj.color }).run();
      }
    } catch (error) {
        if (showNotification) {
          showNotification('Error al aplicar resaltado de color de texto', 'error');
        }
    }
    setShowHighlight(false);
  };

  return (
    <>
      {/* Botón principal para abrir/cerrar la paleta */}
      <button 
        onClick={() => setShowHighlight(!showHighlight)} 
        className={buttonStyle(showHighlight)}
        title="Resaltar texto"
      >
        <Highlighter size={16} />
        {/* Flecha rotada si está abierta */}
        <ChevronDown size={14} className={`transition-transform ${showHighlight ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Menú flotante de colores de resaltado */}
      {showHighlight && (
        <div 
          ref={dragRef}
          // Evita que el menú cierre al hacer clic dentro
          onMouseDown={(e) => e.stopPropagation()}
          className={`fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 highlight-palette ${isDragging ? 'cursor-move' : ''}`}
          style={{
            top: `${60 + position.y}px`,
            left: `calc(50% + ${position.x}px)`,
            transform: 'translateX(-50%)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>

          {/* Cabecera para arrastrar y cerrar */}
          <div 
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between mb-4 cursor-move bg-gray-50 -mx-4 -mt-4 px-4 py-2 rounded-t-xl border-b"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-800">Resaltar texto</h3>
              <p className="text-xs text-gray-500">Selecciona texto primero</p>
            </div>
            {/* Botón de cierre */}
            <button
              onClick={() => setShowHighlight(false)}
              className="text-gray-500 hover:text-red-500 text-xl px-2"
            >
              ×
            </button>
          </div>
          
          {/* Grid de colores */}
          <div className="grid grid-cols-6 gap-2">
            {highlightColors.map((colorObj, i) => (
              <div key={i} className="group relative">
                <div
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-400 transition-all hover:scale-110 shadow-sm flex items-center justify-center"
                  style={{ 
                    backgroundColor: colorObj.isTransparent ? '#ffffff' : colorObj.color,
                    backgroundImage: colorObj.isTransparent ? 
                      'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)' : 'none',
                    backgroundSize: colorObj.isTransparent ? '8px 8px' : 'auto',
                    backgroundPosition: colorObj.isTransparent ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                  }}
                  onClick={() => handleHighlightClick(colorObj)}
                  title={colorObj.name}
                >
                  {colorObj.isTransparent && (
                    <span className="text-red-500 font-bold text-base">×</span>
                  )}
                </div>
                {/* Nombre del color (tooltip al pasar el mouse) */}
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

export default HighlightedTextButton;