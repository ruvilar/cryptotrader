import React, { useState, useEffect } from "react";
import { Editor as TipTapEditor } from "@tiptap/react";
import { Node, mergeAttributes } from '@tiptap/core';
import { ChevronDown } from "lucide-react";
import { useNotifications } from '../hooks/useNotifications';

// ✅ Helper que normaliza nombres "amigables" a nombres PascalCase compatible con lucide
function normalizeIconNameToLucide(input: string): string {
  if (!input) return '';
  const key = input.trim().toLowerCase();

  // Alias comunes
  const ICON_ALIAS: Record<string, string> = {
    'chevron-down': 'ChevronDown',
    'chevrondown': 'ChevronDown',
    'arrow-right': 'ArrowRight',
    'arrowright': 'ArrowRight',
    'arrow-left': 'ArrowLeft',
    'arrowleft': 'ArrowLeft',
    'external-link': 'ExternalLink',
    'external': 'ExternalLink',
    'mail': 'Mail',
    'email': 'Mail',
    'phone': 'Phone',
    'search': 'Search',
    // ...agrega más alias útiles según tu proyecto...
  };

  if (ICON_ALIAS[key]) return ICON_ALIAS[key];

  // Convertir kebab_case / snake_case / espacios en PascalCase
  const parts = key.split(/[^a-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

// ===== EXTENSIÓN DE TIPTAP PARA BOTONES DE GRADIENTE =====
export const GradientButtonNode = Node.create({
  name: 'gradientButton',
  group: 'block',
  atom: true,
  draggable: true,
  
  addAttributes() {
    return {
      variant: { default: 'blue' },
      text: { default: 'Botón' },
      href: { default: '' },
      title: { default: '' },
      target: { default: '_self' },
      rel: { default: '' },
      size: { default: 'md' },
      icon: { default: '' },
      linkType: { default: 'external' },
      align: { default: 'left' },
      width: { default: '' },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'button[data-gradient-button]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const el = node as HTMLElement;
          return {
            variant: el.getAttribute('data-variant') || 'blue',
            icon: el.getAttribute('data-icon') || '',
            size: el.getAttribute('data-size') || 'md',
          };
        },
      },
      {
        tag: 'a[data-gradient-button]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const el = node as HTMLElement;
          return {
            variant: el.getAttribute('data-variant') || 'blue',
            icon: el.getAttribute('data-icon') || '',
            size: el.getAttribute('data-size') || 'md',
            href: el.getAttribute('href') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const variant = HTMLAttributes.variant || 'blue';
    const text = HTMLAttributes.text || 'Botón';
    const size = HTMLAttributes.size || 'md';
    const rawIcon = HTMLAttributes.icon || '';
    const linkType = HTMLAttributes.linkType || 'external';
    const align = HTMLAttributes.align || 'left';
    const width = HTMLAttributes.width || '';
    const hrefAttr = HTMLAttributes.href || '';
    const titleAttr = HTMLAttributes.title || '';
    const targetAttr = HTMLAttributes.target || '_self';
    const relAttr = HTMLAttributes.rel || '';
  
    // Normaliza a nombre lucide (PascalCase)
    const lucideIcon = normalizeIconNameToLucide(rawIcon);
    
    const variantClasses: Record<string, string> = {
      blue: 'bg-gradient-to-r from-blue-500 via-blue-700 to-blue-900 text-white',
      orange: 'bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 text-white',
      gray: 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-900 text-white',
      green: 'bg-gradient-to-r from-green-400 via-green-600 to-lime-500 text-white',
      brown: 'bg-gradient-to-r from-yellow-900 via-amber-700 to-orange-900 text-white',
    };
  
    const sizeClasses: Record<string, string> = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
  
    // Wrapper controla alineación del bloque
    const wrapperClass =
      align === 'center' ? 'text-center'
      : align === 'right' ? 'text-right'
      : 'text-left';
  
    const style = width ? `width: ${width};` : undefined;
  
    // Normaliza href según tipo de enlace
    let hrefValue = hrefAttr || '';
    if (hrefValue) {
      if (linkType === 'mailto' && !hrefValue.startsWith('mailto:')) {
        hrefValue = `mailto:${hrefValue}`;
      } else if (linkType === 'tel' && !hrefValue.startsWith('tel:')) {
        hrefValue = `tel:${hrefValue}`;
      } else if (linkType === 'internal') {
        if (!hrefValue.startsWith('/')) hrefValue = `/${hrefValue}`;
      } else if (linkType === 'external') {
        if (!/^https?:\/\//i.test(hrefValue)) hrefValue = `https://${hrefValue}`;
      }
    }
  
    // Icono: spec de nodos (no string HTML)
    const iconNode = lucideIcon
      ? ['span', { class: 'inline-block align-middle mr-2', 'aria-hidden': 'true' }, 
         ['i', { 'data-lucide': lucideIcon, class: 'w-4 h-4' }]]
      : null;
  
    // El interior debe ser inline-block para que el wrapper (text-*) funcione
    const innerClasses = `${variantClasses[variant] || variantClasses.blue} ${sizeClasses[size] || sizeClasses.md} inline-flex items-center gap-2 font-medium rounded-lg shadow hover:scale-105 transition-all duration-200`;
  
    const mergedInnerAttrs = mergeAttributes(HTMLAttributes, {
      class: innerClasses,
      style,
      'data-gradient-button': '',
      'data-variant': variant,
      'data-size': size,
      'data-link-type': linkType,
      'data-icon': rawIcon || undefined,
      rel: relAttr || undefined,
      target: targetAttr || undefined,
      title: titleAttr || (hrefValue ? hrefValue : undefined),
      'data-href': hrefValue || undefined,
      'data-target': targetAttr || undefined,
    });
  
    // Construir children evitando valores null directos
    const children: any[] = [];
    if (iconNode) children.push(iconNode);
    children.push(['span', { class: 'align-middle' }, text]);
  
    if (hrefValue) {
      // enlace semántico dentro del wrapper
      (mergedInnerAttrs as any).href = hrefValue;
      return ['div', { class: wrapperClass }, ['a', mergedInnerAttrs, ...children]];
    }
  
    // botón dentro del wrapper (editable)
    const mergedButtonAttrs = mergeAttributes(mergedInnerAttrs, {
      contenteditable: 'true',
      type: 'button',
    });
  
    return ['div', { class: wrapperClass }, ['button', mergedButtonAttrs, ...children]];
  },
});

// ===== TIPOS Y COMPONENTES VISUALES =====
export type GradientButtonProps = {
  text: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

// Botones individuales con degradados y estilos
export const BlueGradientButton: React.FC<GradientButtonProps> = ({
  text,
  onClick,
  className,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-blue-500 via-blue-700 to-blue-900 text-white font-medium px-4 py-2 rounded-lg shadow hover:scale-105 transition-all duration-200 focus:outline-none ${className}`}
  >
    {text}
  </button>
);

export const OrangeGradientButton: React.FC<GradientButtonProps> = ({
  text,
  onClick,
  className,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 text-white font-medium px-4 py-2 rounded-lg shadow hover:scale-105 transition-all duration-200 focus:outline-none ${className}`}
  >
    {text}
  </button>
);

export const GrayGradientButton: React.FC<GradientButtonProps> = ({
  text,
  onClick,
  className,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-gray-600 via-gray-700 to-gray-900 text-white font-medium px-4 py-2 rounded-lg shadow hover:scale-105 transition-all duration-200 focus:outline-none ${className}`}
  >
    {text}
  </button>
);

export const GreenGradientButton: React.FC<GradientButtonProps> = ({
  text,
  onClick,
  className,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-green-400 via-green-600 to-lime-500 text-white font-medium px-4 py-2 rounded-lg shadow hover:scale-105 transition-all duration-200 focus:outline-none ${className}`}
  >
    {text}
  </button>
);

export const BrownGradientButton: React.FC<GradientButtonProps> = ({
  text,
  onClick,
  className,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-yellow-900 via-amber-700 to-orange-900 text-white font-medium px-4 py-2 rounded-lg shadow hover:scale-105 transition-all duration-200 focus:outline-none ${className}`}
  >
    {text}
  </button>
);

// Grupo visual de botones (puedes usarlo como preview)
export const GradientButtonsGroup: React.FC = () => (
  <div className="flex gap-3 flex-wrap">
    <BlueGradientButton text="Azul" />
    <OrangeGradientButton text="Naranja" />
    <GrayGradientButton text="Gris" />
    <GreenGradientButton text="Verde" />
    <BrownGradientButton text="Marrón" />
  </div>
);

// ===== MENÚ DESPLEGABLE PARA EL EDITOR =====
const BUTTONS = [
  {
    label: "Botón Azul",
    variant: "blue",
    render: (props: GradientButtonProps) => <BlueGradientButton {...props} />,
  },
  {
    label: "Botón Naranja",
    variant: "orange",
    render: (props: GradientButtonProps) => <OrangeGradientButton {...props} />,
  },
  {
    label: "Botón Gris",
    variant: "gray",
    render: (props: GradientButtonProps) => <GrayGradientButton {...props} />,
  },
  {
    label: "Botón Verde",
    variant: "green",
    render: (props: GradientButtonProps) => <GreenGradientButton {...props} />,
  },
  {
    label: "Botón Marrón",
    variant: "brown",
    render: (props: GradientButtonProps) => <BrownGradientButton {...props} />,
  },
];

export interface GradientButtonDropdownProps {
  editor: TipTapEditor;
}

export const GradientButtonDropdown: React.FC<GradientButtonDropdownProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const { showNotification } = useNotifications();

  const handleInsert = (variant: string, text: string) => {
    editor.chain().focus().insertContent({
      type: 'gradientButton',
      attrs: {
        variant,
        text,
        href: '',
        title: '',
        target: '_self',
        rel: '',
      },
    }).run();

    // Renderizar iconos lucide
    void import('lucide-react')
      .then((mod) => {
        const anyMod = mod as any;
        const replaceFn =
          anyMod?.replace ?? anyMod?.Replace ?? anyMod?.default?.replace ?? anyMod?.default?.Replace;
        if (typeof replaceFn === 'function') {
          replaceFn();
        }
      })
      .catch(() => { 
        showNotification?.('No se pudieron renderizar los iconos en este momento', 'warning');
      });
    
    setOpen(false);
    
    // Abrir el menú flotante automáticamente después de insertar
    setTimeout(() => {
      const buttons = document.querySelectorAll('button[data-gradient-button]');
      const lastButton = buttons[buttons.length - 1] as HTMLElement;
      
      if (lastButton) {
        lastButton.click();
      }
    }, 100);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-2 rounded bg-white text-gray-700 font-medium shadow hover:bg-gray-50 transition border border-gray-300"
        onClick={() => setOpen((v) => !v)}
        aria-label="Insertar botón destacado"
      >
        Botones <ChevronDown size={16} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded shadow-lg p-3 flex flex-col gap-3 min-w-[200px] left-0">
          {BUTTONS.map(({ label, render, variant }) => (
            <div
              key={label}
              className="flex items-center justify-center hover:bg-gray-50 rounded px-2 py-2 cursor-pointer transition"
              onClick={() => handleInsert(variant, label)}
            >
              {render({ text: label })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== 🔥 HOOK PARA DETECTAR CLICS EN BOTONES EXISTENTES =====
export const useGradientButtonClick = (
  editor: TipTapEditor | null,
  onButtonClick: (buttonNode: HTMLElement) => void
) => {
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Buscar el botón clickeado (puede ser el botón o un elemento hijo)
      const buttonElement = target.closest('[data-gradient-button]') as HTMLElement;
      
      if (buttonElement) {
        event.preventDefault();
        event.stopPropagation();
        onButtonClick(buttonElement);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, onButtonClick]);
};