import React, { useState, useEffect } from 'react';
import { Editor as TipTapEditor } from '@tiptap/react';
import { X, Save, Trash2, GripVertical } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';

interface ButtonFloatingMenuProps {
  editor: TipTapEditor | null;
  buttonNode: HTMLElement | null;
  position: { x: number; y: number };
  onClose: () => void;
}

const ButtonFloatingMenu: React.FC<ButtonFloatingMenuProps> = ({
  editor,
  buttonNode,
  onClose,
}) => {
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonTitle, setButtonTitle] = useState('');
  const [openNewTab, setOpenNewTab] = useState(false);
  const [addNofollow, setAddNofollow] = useState(false);
  const [variant, setVariant] = useState('blue');
  const [buttonSize, setButtonSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [iconName, setIconName] = useState('');
  const [linkType, setLinkType] = useState<'external' | 'internal' | 'mailto' | 'tel'>('external');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [customWidth, setCustomWidth] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'link'>('general');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { isDragging, dragRef: menuRef, handleMouseDown: handlePointerDown } = useDraggable(menuPosition, setMenuPosition);

  // ✅ Centra el menú al abrirse
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: Math.max(100, (window.innerHeight - rect.height) / 2 - 50),
      });
    }
  }, []);

  // ✅ Carga los valores actuales del botón
  useEffect(() => {
    if (!buttonNode || !editor) return;

    const pos = editor.view.posAtDOM(buttonNode, 0);
    const node = editor.view.state.doc.nodeAt(pos);

    if (node && node.type.name === 'gradientButton') {
      setButtonText(node.attrs.text || '');
      setButtonUrl(node.attrs.href || '');
      setButtonTitle(node.attrs.title || '');
      setOpenNewTab(node.attrs.target === '_blank');
      setAddNofollow(node.attrs.rel?.includes('nofollow') || false);
      setVariant(node.attrs.variant || 'blue');
      setButtonSize(node.attrs.size || 'md');
      setIconName(node.attrs.icon || '');
      setLinkType(node.attrs.linkType || 'external');
      setAlign(node.attrs.align || 'left');
      setCustomWidth(node.attrs.width || '');
    }
  }, [buttonNode, editor]);

  // ✅ Guarda los cambios
  const handleSave = () => {
    if (!editor || !buttonNode) return;
  
    const pos = editor.view.posAtDOM(buttonNode, 0);
    
    let relValue = '';
    if (openNewTab) {
      relValue = 'noopener noreferrer';
    }
    if (addNofollow) {
      relValue = relValue ? `${relValue} nofollow` : 'nofollow';
    }
  
    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes('gradientButton', {
        text: buttonText,
        href: buttonUrl,
        title: buttonTitle,
        target: openNewTab ? '_blank' : '_self',
        rel: relValue,
        variant: variant,
        size: buttonSize,
        icon: iconName,
        linkType: linkType,
        align: align,
        width: customWidth,
      })
      .run();
  
    // Limpia el estado antes de cerrar
    setTimeout(() => {
      onClose();
    }, 50);
  };

  // Elimina el botón
  const handleDelete = () => {
    if (!editor || !buttonNode) return;

    const pos = editor.view.posAtDOM(buttonNode, 0);
    editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
    onClose();
  };

  const variants = [
    { value: 'blue', label: '🔵 Azul' },
    { value: 'orange', label: '🟠 Naranja' },
    { value: 'gray', label: '⚫ Gris' },
    { value: 'green', label: '🟢 Verde' },
    { value: 'brown', label: '🟤 Marrón' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white rounded-lg shadow-2xl border-2 border-gray-300 w-[320px]"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header arrastrable + pestañas */}
      <div
        className="flex items-center justify-between p-3 pb-2 border-b border-gray-200 cursor-grab active:cursor-grabbing bg-gradient-to-r from-blue-50 to-blue-100"
        onPointerDown={handlePointerDown}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">⚙️ Editar Botón</h3>
        </div>

        {/* Mini pestaña del menu flotante */}
        <div className="ml-3 flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setActiveTab('general'); }}
            className={`px-2 py-0.5 text-xs rounded ${activeTab === 'general' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-600 hover:bg-white'}`}
            aria-pressed={activeTab === 'general'}
            title="General"
          >
            General
          </button>

          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setActiveTab('link'); }}
            className={`px-2 py-0.5 text-xs rounded ${activeTab === 'link' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-600 hover:bg-white'}`}
            aria-pressed={activeTab === 'link'}
            title="Enlace & Layout"
          >
            Enlace
          </button>
        </div>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Contenido con pestañas */}
      <div className="p-3 space-y-3">
        {activeTab === 'general' ? (
          <>
            {/* Texto del botón */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Texto:</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 transition text-gray-800"
                placeholder="Ej: Más información"
              />
            </div>

            {/* Selector de color */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Color:</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white text-gray-800"
              >
                {variants.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Tamaño del botón */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tamaño:</label>
              <select
                value={buttonSize}
                onChange={e => setButtonSize(e.target.value as 'sm' | 'md' | 'lg')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white text-gray-800"
              >
                <option value="sm">Pequeño</option>
                <option value="md">Mediano</option>
                <option value="lg">Grande</option>
              </select>
            </div>

            {/* Icono opcional */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del icono (ej: arrow-right)</label>
              <input
                type="text"
                value={iconName}
                onChange={e => setIconName(e.target.value)}
                onBlur={() =>
                  setIconName(prev =>
                    prev.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  )
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 transition text-gray-800"
                placeholder="Ej: arrow-right (se convertirá a ArrowRight)"
              />
              <span className="text-[10px] text-gray-400">Usa palabras simples en minúsculas o kebab-case; se mapearán a lucide.</span>
            </div>
          </>
        ) : (
          <>
            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL:</label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 transition text-gray-800"
                placeholder="https://ejemplo.com"
              />
            </div>

            {/* Tooltip */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tooltip:</label>
              <input
                type="text"
                value={buttonTitle}
                onChange={(e) => setButtonTitle(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 transition text-gray-800"
                placeholder="Texto al pasar el mouse"
              />
            </div>

            {/* Link controls */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openNewTab}
                  onChange={(e) => setOpenNewTab(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">Abrir en nueva pestaña</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addNofollow}
                  onChange={(e) => setAddNofollow(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">Enlace 'nofollow'</span>
              </label>
            </div>

            {/* Tipo de enlace */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de enlace:</label>
              <select
                value={linkType}
                onChange={e => setLinkType(e.target.value as 'external' | 'internal' | 'mailto' | 'tel')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white text-gray-800"
              >
                <option value="external">Externo (https://...)</option>
                <option value="internal">Interno (/ruta)</option>
                <option value="mailto">Correo (mailto:...)</option>
                <option value="tel">Teléfono (tel:...)</option>
              </select>
            </div>

            {/* Alineación */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alineación:</label>
              <select
                value={align}
                onChange={e => setAlign(e.target.value as 'left' | 'center' | 'right')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white text-gray-800"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>

            {/* Ancho personalizado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ancho personalizado:</label>
              <input
                type="text"
                value={customWidth}
                onChange={e => setCustomWidth(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 transition text-gray-800"
                placeholder="Ej: 200px, 100%, auto"
              />
            </div>
          </>
        )}
      </div>

      {/* Botones de acción compactos */}
      <div className="flex items-center justify-between gap-2 p-3 pt-2 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition font-medium"
          title="Eliminar botón"
        >
          <Trash2 size={14} />
          Eliminar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition font-medium"
          >
            <Save size={14} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ButtonFloatingMenu;
