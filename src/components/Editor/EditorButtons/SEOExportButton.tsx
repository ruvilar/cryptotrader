import React, { useState } from "react";
import { arrayToCSV, downloadFile } from "../utils/seoExport";

const SEO_FIELDS = [
  // Campos básicos en BD
  "id",
  "title", 
  "slug",
  "category",
  "type",
  "status", 
  "content",
  "word_count",
  "reading_time",
  "author_id",
  "created_at",
  "updated_at", 
  "is_deleted",
  // Campos SEO básicos en BD
  "meta_title",
  "meta_description", 
  "meta_keywords",
  "featured_image",
  "custom_css",
  // Campos SEO avanzados en BD
  "canonical_url",
  "meta_robots",
  "og_title",
  "og_description", 
  "og_image",
  "twitter_title",
  "twitter_description",
  "twitter_image", 
  "content_type",
  "author_name",
];

function getNowDateString() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

type SEOExportButtonProps = {
  contentList: any[];
};

export const SEOExportButton: React.FC<SEOExportButtonProps> = ({ contentList }) => {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const sanitize = (item: any) =>
    Object.fromEntries(
      SEO_FIELDS.map((k) => [k, item[k] !== undefined ? item[k] : ""])
    );

  const handleExport = async (type: "csv" | "json") => {
    setIsExporting(true);
    setOpen(false);
    
    try {
      const data = contentList.map(sanitize);
      const date = getNowDateString();
      
      if (type === "csv") {
        const csv = arrayToCSV(data);
        downloadFile(csv, `seo-publicaciones-${date}.csv`, "text/csv");
      } else {
        downloadFile(
          JSON.stringify(data, null, 2),
          `seo-publicaciones-${date}.json`,
          "application/json"
        );
      }
      
    } catch (error: any) {
      setExportError(`Error al exportar ${type.toUpperCase()}. Intenta nuevamente.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white px-4 py-2 rounded shadow font-semibold"
        onClick={() => setOpen((o) => !o)}
      >
        {isExporting ? "Exportando..." : `Exportar SEO (${contentList.length}) ▼`}
      </button>

      {exportError && (
        <div className="absolute mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {exportError}
        </div>
      )}

      {open && !isExporting && (
        <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-50">
          <button
            className="text-left text-xs block w-full px-4 py-2 text-red-800 bg-yellow-200 hover:bg-yellow-100"
            onClick={() => handleExport("csv")}
          >
            Exportar a CSV
          </button>
          <button
            className="block w-full text-xs text-left px-4 py-2 text-red-800 bg-yellow-200 hover:bg-yellow-100"
            onClick={() => handleExport("json")}
          >
            Exportar a JSON
          </button>
        </div>
      )}
    </div>
  );
};
