import { useState, useEffect } from "react";
import { List } from "lucide-react";

type TOCItem = {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
};

interface ContentTOCProps {
  content: string;
}

// Construye el árbol jerárquico de encabezados
function buildTOCTree(items: TOCItem[]): TOCItem[] {
  const tree: TOCItem[] = [];
  const stack: TOCItem[] = [];

  items.forEach(item => {
    while (stack.length && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    if (stack.length) {
      const parent = stack[stack.length - 1];
      parent.children = parent.children || [];
      parent.children.push(item);
    } else {
      tree.push(item);
    }
    stack.push(item);
  });

  return tree;
}

// Renderiza la lista jerárquica con numeración tipo 1., 1.1., 1.2., 2., 2.1., etc.
function renderTOC(items: TOCItem[], prefix: string[] = []): React.ReactNode {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: "smooth", 
        block: "start",
        inline: "nearest"
      });
      // Actualizar URL sin recargar página
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <ol className="ml-4 list-none space-y-1">
      {items.map((item, idx) => {
        const currentPrefix = [...prefix, (idx + 1).toString()];
        const number = currentPrefix.join(".") + ".";
        return (
          <li key={`${item.id}-${idx}`} className="font-medium">
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className="text-[#2A6EBB] hover:underline transition-all duration-300 ease-in-out inline-block"
            >
              <span className="mr-2 text-gray-500">{number}</span>
              {item.text}
            </a>
            {item.children && item.children.length > 0 && (
              <div className="mt-1">
                {renderTOC(item.children, currentPrefix)}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export const ContentTOC: React.FC<ContentTOCProps> = ({ content }) => {
  const [showTOC, setShowTOC] = useState(true);

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  
  const tocItems: TOCItem[] = headings.map((heading) => {
    let id = heading.id;
    if (!id) {
      id = heading.textContent
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
        .replace(/[^a-z0-9\s]/gi, "") // Solo letras, números y espacios
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase() || "";
    }
    return {
      id,
      text: heading.textContent || "",
      level: Number(heading.tagName[1]),
    };
  });

  const tocTree = buildTOCTree(tocItems);

  // Agrega IDs a los encabezados reales en el DOM
  useEffect(() => {
    if (typeof window === 'undefined' || tocItems.length === 0) return;
    
    // Esperar a que el contenido se haya renderizado
    setTimeout(() => {
      const realHeadings = document.querySelectorAll(`article h1, article h2, article h3, article h4, article h5, article h6`);
      
      realHeadings.forEach((heading, index) => {
        if (!heading.id && tocItems[index]) {
          heading.id = tocItems[index].id;
        }
      });
    }, 100);
  }, [content]);

  // Si no hay encabezados, no mostrar el TOC
  if (tocItems.length === 0) return null;

  return (
    <aside className="relative rounded-lg shadow-xl p-3 mb-2 max-w-xl mx-auto">
      {/* Botón para mostrar/ocultar el índice */}
      <button
        type="button"
        aria-label={showTOC ? "Ocultar índice de contenidos" : "Mostrar índice de contenidos"}
        className="absolute top-4 right-4 p-2 rounded hover:bg-gray-100 transition-colors duration-200"
        onClick={() => setShowTOC((prev) => !prev)}
      >
        <List 
          className={`w-6 h-6 ${showTOC ? "text-[#A36A2E]" : "text-gray-400"}`}
          style={{
            transform: showTOC ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.3s ease-in-out, color 0.3s ease-in-out"
          }}
        />
      </button>
      
      {/* Título */}
      <h2 className="text-xl text-[#A36A2E] mb-4 font-semibold">ÍNDICE DE CONTENIDOS</h2>
      
      {/* Contenido con animación de deslizamiento */}
      <div
        style={{
          maxHeight: showTOC ? "2000px" : "0",
          opacity: showTOC ? 1 : 0,
          transition: "max-height 0.5s ease-in-out, opacity 0.3s ease-in-out",
          overflow: "hidden"
        }}
      >
        <nav>
          {renderTOC(tocTree)}
        </nav>
      </div>
    </aside>
  );
};