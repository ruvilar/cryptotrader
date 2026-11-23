import { useState } from "react";
import CategoryManager from "./CategoryManager";
import MenuManager from "./MenuManager";
import LinkManager from "./LinkManager";

export default function SiteStructurePanel() {
  const [activeSubTab, setActiveSubTab] = useState<"categories" | "menus" | "links">("categories");

  return (
    <div className="bg-gray-400 rounded-xl shadow p-4">
      {/* Encabezado de subpestañas */}
      <div className="flex gap-3 mb-4 border-b pb-2">

        {/* ✅ Botón de Categorías */}
        <button
          onClick={() => setActiveSubTab("categories")}
          className={`px-3 py-1 rounded font-bold ${
            activeSubTab === "categories" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Categorías
        </button>

        {/* ✅ Botón de Menús */}
        <button
          onClick={() => setActiveSubTab("menus")}
          className={`px-3 py-1 rounded font-bold ${
            activeSubTab === "menus" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Menús
        </button>

        {/* ✅ Botón de Enlaces */}
        <button
          onClick={() => setActiveSubTab("links")}
          className={`px-3 py-1 rounded font-bold ${
            activeSubTab === "links" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Enlaces
        </button>
      </div>

      {/* Contenido dinámico */}
      {activeSubTab === "categories" && <CategoryManager />}
      {activeSubTab === "menus" && <MenuManager />}
      {activeSubTab === "links" && <LinkManager />}
    </div>
  );
}