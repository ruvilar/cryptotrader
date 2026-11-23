import { useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, Mark } from "@tiptap/core";
import { GradientButtonNode } from "../EditorButtons/GradientButtonsGroup";

// Extensión para elementos en bloque <div>. Preserva class, style e id al parsear y renderizar HTML.
const CustomDiv = Node.create({
  name: 'customDiv',
  group: 'block',
  content: 'block*',
  draggable: false,
  parseHTML() {
    return [{
      tag: 'div',
      getAttrs: (node) => {
        if (typeof node === 'string') return false;
        const element = node as HTMLElement;
        return {
          class: element.getAttribute('class') || null,
          style: element.getAttribute('style') || null,
          id: element.getAttribute('id') || null,
        };
      },
    }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => attributes.class ? { class: attributes.class } : {},
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => attributes.style ? { style: attributes.style } : {},
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) => attributes.id ? { id: attributes.id } : {},
      },
    };
  },
});

// Extensión para elementos inline <span>. Preserva class, style e id al parsear y renderizar HTML.
const CustomSpan = Mark.create({
  name: 'customSpan',
  parseHTML() {
    return [{
      tag: 'span',
      getAttrs: (node) => {
        if (typeof node === 'string') return false;
        const element = node as HTMLElement;
        return {
          class: element.getAttribute('class') || null,
          style: element.getAttribute('style') || null,
          id: element.getAttribute('id') || null,
        };
      },
    }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => attributes.class ? { class: attributes.class } : {},
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => attributes.style ? { style: attributes.style } : {},
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) => attributes.id ? { id: attributes.id } : {},
      },
    };
  },
});

// Extensión para iframes (embeds de YouTube y similares).
const IframeNode = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: '0' },
      allowfullscreen: { default: true },
      allow: { default: null },
      style: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'iframe' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['iframe', HTMLAttributes];
  },
});

// Extensión de Image extendida con soporte de style, width, height y comandos setImageSize / alignImage.
const CustomImage = Image.configure({
  inline: true,
  allowBase64: true,
  HTMLAttributes: { class: "editor-image" },
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style") || null,
        renderHTML: attributes => attributes.style ? { style: attributes.style } : {},
      },
      width: {
        default: null,
        parseHTML: element =>
          element.getAttribute("width") ||
          element.style.width ||
          (element.getAttribute("style")?.match(/width:\s*([^;]+)/)?.[1] ?? null),
        renderHTML: attributes => attributes.width ? { width: attributes.width } : {},
      },
      height: {
        default: null,
        parseHTML: element =>
          element.getAttribute("height") ||
          element.style.height ||
          (element.getAttribute("style")?.match(/height:\s*([^;]+)/)?.[1] ?? null),
        renderHTML: attributes => attributes.height ? { height: attributes.height } : {},
      },
    };
  },
  addCommands() {
    // Fusiona estilos CSS eliminando alineaciones previas para evitar conflictos.
    const mergeStyles = (base: string, fragment: string) => {
      const clean = (s: string) => (s || "").replace(/\s+/g, " ").replace(/;(?=\s*;)/g, "").trim();
      const stripAlign = (s: string) =>
        clean(s)
          .replace(/float:\s*(left|right)\s*;?/gi, "")
          .replace(/display:\s*block\s*;?/gi, "")
          .replace(/margin:\s*0\s*auto\s*;?/gi, "")
          .replace(/margin:\s*0\s*1rem\s*1rem\s*0\s*;?/gi, "")
          .replace(/margin:\s*0\s*0\s*1rem\s*1rem\s*;?/gi, "");
      const joined = [stripAlign(base || ""), clean(fragment || "")].filter(Boolean).join("; ");
      return joined.replace(/;+\s*$/g, "").concat(";");
    };

    return {
      ...this.parent?.(),

      // Actualiza width y height de la imagen como atributos HTML, limpiando el style previo.
      setImageSize:
        (options: { width?: string | number; height?: string | number }) =>
        ({ editor, commands }) => {
          const attrs = editor.getAttributes(this.name);
          const cleaned = ((attrs?.style as string) || "")
            .replace(/(?:^|;)\s*width\s*:\s*[^;]+/gi, "")
            .replace(/(?:^|;)\s*height\s*:\s*[^;]+/gi, "")
            .replace(/;+\s*$/g, "")
            .trim();
          const next: Record<string, any> = {};
          if (cleaned) next.style = cleaned + ";";
          if (options.width != null) next.width = String(options.width);
          if (options.height != null) next.height = String(options.height);
          return commands.updateAttributes(this.name, next);
        },

      // Aplica alineación (left / center / right) fusionando estilos sin acumular conflictos.
      alignImage:
        (alignment: "left" | "center" | "right") =>
        ({ editor, commands }) => {
          const alignmentStyles: Record<string, string> = {
            left: "float: left; margin: 0 1rem 1rem 0;",
            center: "display: block; margin: 0 auto;",
            right: "float: right; margin: 0 0 1rem 1rem;",
          };
          const attrs = editor.getAttributes(this.name);
          const newStyle = mergeStyles((attrs?.style as string) || "", alignmentStyles[alignment]);
          return commands.updateAttributes(this.name, { style: newStyle });
        },
    };
  },
});

// Hook que inicializa y configura el editor TipTap con todas las extensiones.
// Carga el contenido guardado en localStorage y dispara eventos ante cada cambio.
export function useTipTapEditor(onUpdate: (content: string) => void) {
  const loadSavedContent = () => localStorage.getItem('editor-content');

  return useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      IframeNode,
      GradientButtonNode,
      CustomDiv,
      CustomSpan,
      Link.configure({ openOnClick: false }),
      Underline,
      Strike,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            fontSize: {
              default: null,
              parseHTML: element => element.style.fontSize || null,
              renderHTML: attributes => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
            },
            fontFamily: {
              default: null,
              parseHTML: element => element.style.fontFamily || null,
              renderHTML: attributes => attributes.fontFamily ? { style: `font-family: ${attributes.fontFamily}` } : {},
            },
          };
        },
      }),
      Color,
      Highlight.configure({ multicolor: true }),
      HorizontalRule,
      CodeBlockLowlight.configure({ lowlight }),
      CustomImage,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
          style: 'border: 2px solid #000;',
        },
      }),
      TableRow,
      TableHeader,
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {};
                return { style: `background-color: ${attributes.backgroundColor}` };
              },
            },
          };
        },
      }),
      Placeholder.configure({
        placeholder: "Escribe nuevo contenido aquí...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        emptyNodeClass: "is-editor-empty",
      }),
    ],
    content: loadSavedContent(),
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      localStorage.setItem("editor-content", content);
      window.dispatchEvent(new CustomEvent("editor-content-changed", { detail: { content } }));
      if (onUpdate) onUpdate(content);
    },
  });
}