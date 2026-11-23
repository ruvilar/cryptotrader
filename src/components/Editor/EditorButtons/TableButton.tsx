import React, { useState, useEffect } from 'react';
import { Table, ChevronDown, Plus, Minus, Merge, Split, Palette, Trash2 } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { Editor } from '@tiptap/react';

/**
 * Props para el botón de tabla.
 * Mejor tipar editor con TipTapEditor si es posible.
 */
interface TableButtonProps {
  editor: Editor | null;
  showTable: boolean;
  setShowTable: (value: boolean) => void;
  tableMenuPosition: { x: number; y: number };
  setTableMenuPosition: (pos: { x: number; y: number }) => void;
}

// ⬇️ Paleta de colores para el fondo de celdas
const cellColors = [
  { name: 'Sin color', color: 'transparent', isTransparent: true },
  { name: 'Gris claro', color: '#f9fafb' },
  { name: 'Azul claro', color: '#dbeafe' },
  { name: 'Verde claro', color: '#dcfce7' },
  { name: 'Amarillo claro', color: '#fefce8' },
  { name: 'Rojo claro', color: '#fee2e2' },
  { name: 'Púrpura claro', color: '#f3e8ff' },
  { name: 'Rosa claro', color: '#fdf2f8' },
];

const TableButton: React.FC<TableButtonProps> = ({
  editor,
  showTable,
  setShowTable,
  tableMenuPosition,
  setTableMenuPosition
}) => {
  // ⬇️ Estado para el tamaño de la nueva tabla
  const [tableSize, setTableSize] = useState({ rows: 3, cols: 3 });
  // ⬇️ Estado para mostrar/ocultar paleta de color de celda
  const [showColorPalette, setShowColorPalette] = useState(false);
  // ✅ Estado para detectar si está en móvil
  const [isMobile, setIsMobile] = useState(false);
  
  // ⬇️ Si no hay editor, no renderiza nada
  if (!editor) return null;
  
  // ⬇️ Hook para arrastrar el menú flotante
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable(tableMenuPosition, setTableMenuPosition);

  // ✅ Detecta si está en modo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ⬇️ Clases de estilo para el botón principal
  const buttonStyle = (active: boolean) =>
    `p-2 rounded-xl flex items-center gap-1 transition-all duration-200 hover:scale-105 ${
      active ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-50'
    }`;

  /**
   * Inserta una nueva tabla según el tamaño seleccionado.
   */
  const insertTable = () => {
    editor.chain().focus().insertTable({
      rows: tableSize.rows,
      cols: tableSize.cols,
      withHeaderRow: true
    }).run();
    setShowTable(false);
  };

  // ⬇️ Acciones de manipulación de tabla
  const addRowBefore = () => editor.chain().focus().addRowBefore().run();
  const addRowAfter = () => editor.chain().focus().addRowAfter().run();
  const deleteRow = () => editor.chain().focus().deleteRow().run();
  const addColumnBefore = () => editor.chain().focus().addColumnBefore().run();
  const addColumnAfter = () => editor.chain().focus().addColumnAfter().run();
  const deleteColumn = () => editor.chain().focus().deleteColumn().run();
  const deleteTable = () => editor.chain().focus().deleteTable().run();
  const mergeCells = () => editor.chain().focus().mergeCells().run();
  const splitCell = () => editor.chain().focus().splitCell().run();
  const toggleHeaderRow = () => editor.chain().focus().toggleHeaderRow().run();
  const toggleHeaderColumn = () => editor.chain().focus().toggleHeaderColumn().run();

  /**
   * Aplica color de fondo a la celda seleccionada.
   */
  const setCellBackground = (color: string) => {
    if (color === 'transparent') {
      editor.chain().focus().setCellAttribute('backgroundColor', null).run();
    } else {
      editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    }
    setShowColorPalette(false);
  };

  // ⬇️ Verifica si el cursor está en una tabla.
  const isInTable = editor.can().addRowAfter();

  /**
   * Renderiza el grid responsive para seleccionar el tamaño de la nueva tabla.
   */
  const renderTableSizeSelector = () => {
    // En móvil, mostrar grid más pequeño y botones incrementales
    if (isMobile) {
      return (
        <div className="p-3">
          <div className="text-center mb-3">
            <div className="text-lg font-bold text-gray-800">
              {tableSize.rows} × {tableSize.cols}
            </div>
            <div className="text-xs text-gray-500">Filas × Columnas</div>
          </div>
          
          {/* Controles móviles para filas */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Filas</label>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTableSize(prev => ({ ...prev, rows: Math.max(1, prev.rows - 1) }))}
                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded-full flex items-center justify-center text-lg font-bold"
                disabled={tableSize.rows <= 1}
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{tableSize.rows}</span>
              <button
                onClick={() => setTableSize(prev => ({ ...prev, rows: Math.min(10, prev.rows + 1) }))}
                className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center text-lg font-bold"
                disabled={tableSize.rows >= 10}
              >
                +
              </button>
            </div>
          </div>

          {/* Controles móviles para columnas */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Columnas</label>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTableSize(prev => ({ ...prev, cols: Math.max(1, prev.cols - 1) }))}
                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded-full flex items-center justify-center text-lg font-bold"
                disabled={tableSize.cols <= 1}
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{tableSize.cols}</span>
              <button
                onClick={() => setTableSize(prev => ({ ...prev, cols: Math.min(8, prev.cols + 1) }))}
                className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center text-lg font-bold"
                disabled={tableSize.cols >= 8}
              >
                +
              </button>
            </div>
          </div>

          {/* Botón crear tabla móvil */}
          <button
            onClick={insertTable}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
          >
            Crear Tabla {tableSize.rows}×{tableSize.cols}
          </button>
        </div>
      );
    }

    // Grid original para escritorio
    const cells = [];
    for (let row = 1; row <= 8; row++) {
      for (let col = 1; col <= 8; col++) {
        const isSelected = row <= tableSize.rows && col <= tableSize.cols;
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`w-4 h-4 border border-gray-300 cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-500' : 'bg-white hover:bg-blue-200'
            }`}
            onMouseEnter={() => setTableSize({ rows: row, cols: col })}
            onClick={insertTable}
            aria-label={`Selecciona ${row} filas y ${col} columnas`}
          />
        );
      }
    }
    return (
      <div className="grid grid-cols-8 gap-1 p-2">
        {cells}
        <div className="col-span-8 text-center text-xs text-gray-600 mt-2">
          {tableSize.rows} x {tableSize.cols}
        </div>
      </div>
    );
  };

  // ✅ Posicionamiento responsivo del menú
  const getMenuStyle = () => {
    const baseStyle = {
      top: `${60 + position.y}px`,
      zIndex: 40,
      maxHeight: isMobile ? '85vh' : '500px',
      overflowY: 'auto' as const
    };

    if (isMobile) {
      return {
        ...baseStyle,
        position: 'fixed' as const,
        top: '10vh',
        left: '5vw',
        right: '5vw',
        width: 'auto',
        transform: 'none'
      };
    }

    return {
      ...baseStyle,
      position: 'fixed' as const,
      left: `calc(50% + ${position.x}px)`,
      transform: 'translateX(-50%)',
      width: '384px' // w-96
    };
  };

  return (
    <>
      {/* BOTÓN DE TABLA */}
      <button
        onClick={() => setShowTable(!showTable)}
        className={buttonStyle(showTable)}
        title="Agregar/Editar tabla"
        aria-label="Agregar/Editar tabla"
      >
        <Table size={16} />
        {/* Flecha rotada si está abierta */}
        <ChevronDown size={14} className={`transition-transform ${showTable ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú flotante de tabla */}
      {showTable && (
        <div
          ref={dragRef}
          onMouseDown={(e) => e.stopPropagation()}
          className={`fixed z-40 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-96 table-palette ${isDragging ? 'cursor-move' : ''}`}
          style={{
            top: `${60 + position.y}px`,
            left: `calc(50% + ${position.x}px)`,
            transform: 'translateX(-50%)',
            maxHeight: '500px',
            overflowY: 'auto'
          }}
          aria-modal="true"
          role="dialog"
        >
          {/* Cabececera del menú */}
          <div
            onMouseDown={isMobile ? undefined : handleMouseDown}
            className="flex items-center justify-between mb-4 cursor-move bg-gray-50 -mx-4 -mt-4 px-4 py-2 rounded-t-xl border-b"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                {!isInTable ? 'Insertar tabla' : 'Editar tabla'}
              </h3>
              <p className="text-xs text-gray-500">
                {!isInTable ? 'Selecciona el tamaño de la tabla' : 'Herramientas para modificar la tabla'}
              </p>
            </div>
            {/* Botón de cierre */}
            <button
              onClick={() => setShowTable(false)}
              className="text-gray-500 hover:text-red-500 text-xl px-2"
            >
              ×
            </button>
          </div>

          {!isInTable ? (
            // ⬇️ Selector de tamaño de nueva tabla
            <div>
              {renderTableSizeSelector()}
            </div>
          ) : (
            // ⬇️ Herramientas de edición de tabla existente
            <div>
              {/* FILAS */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Filas</h4>
                <div className="flex gap-2">
                  <button
                    onClick={addRowBefore}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    title="Agregar fila arriba"
                    aria-label="Agregar fila arriba"
                  >
                    <Plus size={12} />
                    Arriba
                  </button>
                  <button
                    onClick={addRowAfter}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    title="Agregar fila abajo"
                    aria-label="Agregar fila abajo"
                  >
                    <Plus size={12} />
                    Abajo
                  </button>
                  <button
                    onClick={deleteRow}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="Eliminar fila"
                    aria-label="Eliminar fila"
                  >
                    <Minus size={12} />
                    Eliminar
                  </button>
                </div>
              </div>

              {/* COLUMNAS */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Columnas</h4>
                <div className="flex gap-2">
                  <button
                    onClick={addColumnBefore}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    title="Agregar columna izquierda"
                    aria-label="Agregar columna izquierda"
                  >
                    <Plus size={12} />
                    Izquierda
                  </button>
                  <button
                    onClick={addColumnAfter}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    title="Agregar columna derecha"
                    aria-label="Agregar columna derecha"
                  >
                    <Plus size={12} />
                    Derecha
                  </button>
                  <button
                    onClick={deleteColumn}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="Eliminar columna"
                    aria-label="Eliminar columna"
                  >
                    <Minus size={12} />
                    Eliminar
                  </button>
                </div>
              </div>

              {/* CELDAS */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Celdas</h4>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={mergeCells}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                    title="Fusionar celdas"
                    aria-label="Fusionar celdas"
                  >
                    <Merge size={12} />
                    Fusionar
                  </button>
                  <button
                    onClick={splitCell}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                    title="Dividir celda"
                    aria-label="Dividir celda"
                  >
                    <Split size={12} />
                    Dividir
                  </button>
                  <button
                    onClick={() => setShowColorPalette(!showColorPalette)}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
                    title="Color de fondo"
                    aria-label="Color de fondo"
                  >
                    <Palette size={12} />
                    Color
                  </button>
                </div>
              </div>

              {/* ENCABEZADOS */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Encabezados</h4>
                <div className="flex gap-2">
                  <button
                    onClick={toggleHeaderRow}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    title="Alternar fila de encabezado"
                    aria-label="Alternar fila de encabezado"
                  >
                    Fila
                  </button>
                  <button
                    onClick={toggleHeaderColumn}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    title="Alternar columna de encabezado"
                    aria-label="Alternar columna de encabezado"
                  >
                    Columna
                  </button>
                </div>
              </div>

              {/* PALETA DE COLORES */}
              {showColorPalette && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Color de fondo de celda</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {cellColors.map((colorObj, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-400 transition-all hover:scale-110 shadow-sm flex items-center justify-center"
                        style={{
                          backgroundColor: colorObj.color,
                          backgroundImage: colorObj.isTransparent ?
                            'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)' : 'none',
                          backgroundSize: colorObj.isTransparent ? '4px 4px' : 'auto',
                          backgroundPosition: colorObj.isTransparent ? '0 0, 0 2px, 2px -2px, -2px 0px' : 'auto'
                        }}
                        onClick={() => setCellBackground(colorObj.color)}
                        title={colorObj.name}
                        aria-label={`Color ${colorObj.name}`}
                      >
                        {colorObj.isTransparent && (
                          <span className="text-red-500 font-bold text-xs">×</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ELIMINAR TABLA */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={deleteTable}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors w-full justify-center"
                  title="Eliminar tabla completa"
                  aria-label="Eliminar tabla completa"
                >
                  <Trash2 size={12} />
                  Eliminar tabla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TableButton;