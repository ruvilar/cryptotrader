import React, { useState } from "react";
import { UrlUtils } from "./utils/validateUrl";

// ✅ Define los tipos de las props que recibirá el componente. Así, TypeScript ayuda a evitar errores y asegura que los datos sean correctos. Cada campo representa un dato SEO/social que se mostrará en la vista previa
type SocialPreviewProps = {
  url: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
};

// ✅ Declara el componente como una función de React que recibe las props tipadas. Permite reutilizar el componente y tener autocompletado/validación de tipos
export const SocialPreview: React.FC<SocialPreviewProps> = ({
  url,
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
}) => {
  // Crea dos estados locales para saber si hubo un error al cargar la imagen de OG o Twitter. Si hay error, se muestra un placeholder en vez de la imagen
  const [ogImageError, setOgImageError] = useState(false);
  const [twitterImageError, setTwitterImageError] = useState(false);
  const safeFallback = (value: string, fallback: string) => value?.trim() || fallback; // Devuelve el valor si existe y no está vacío, o un texto alternativo si está vacío. Evita mostrar campos vacíos en la UI
  const displayUrl = url?.trim() || "https://tudominio.com/url-de-ejemplo"; // Usa la URL recibida o un ejemplo si está vacía
  const shortUrl = displayUrl.replace(/^https?:\/\//, "").substring(0, 50) + (displayUrl.length > 50 ? "..." : ""); // Quita el protocolo (https://) y la recorta a 50 caracteres para mostrarla compacta
  const truncateText = (text: string, maxLength: number) => // Recorta el texto si supera el máximo permitido y agrega puntos suspensivos. Mejora la visualización y evita desbordes en la UI
    text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
  // ✅ Muestra un bloque visual cuando la imagen no carga o no existe. El mensaje y tamaño recomendado cambian según el tipo de red social
  const ImagePlaceholder: React.FC<{ type: "og" | "twitter" }> = ({ type }) => (
    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded border flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-3xl mb-2">🖼️</div>
        <div className="text-sm font-medium">Sin imagen {type === "og" ? "OG" : "Twitter"}</div>
        <div className="text-xs">1200x{type === "og" ? "630" : "600"}px recomendado</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mt-8">
      {!UrlUtils.isValidUrl(url?.trim()) && (
        <div className="text-xs text-red-500 mb-2">
          ⚠️ La URL proporcionada no es válida. Se muestra un ejemplo.
        </div>
      )}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-400/30">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          👁️ Vista Previa en Redes Sociales
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Open Graph (Facebook/LinkedIn) */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
            <div className="p-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Facebook / LinkedIn</span>
              </div>
            </div>
            
            <div className="relative">
              {ogImage && !ogImageError ? (
                <img
                  src={ogImage}
                  alt="Open Graph preview"
                  className="w-full h-48 object-cover"
                  onError={() => setOgImageError(true)}
                  onLoad={() => setOgImageError(false)}
                />
              ) : (
                <ImagePlaceholder type="og" />
              )}
            </div>
            
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                {shortUrl}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                {truncateText(safeFallback(ogTitle, "Título no configurado"), 80)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {truncateText(safeFallback(ogDescription, "Descripción no configurada para Open Graph"), 120)}
              </p>
            </div>
          </div>

          {/* Twitter Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
            <div className="p-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">𝕏</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Twitter / X</span>
              </div>
            </div>
            
            <div className="relative">
              {twitterImage && !twitterImageError ? (
                <img
                  src={twitterImage}
                  alt="Twitter Card preview"
                  className="w-full h-48 object-cover"
                  onError={() => setTwitterImageError(true)}
                  onLoad={() => setTwitterImageError(false)}
                />
              ) : (
                <ImagePlaceholder type="twitter" />
              )}
            </div>
            
            <div className="p-4">
              <div className="text-xs text-sky-600 mb-2 font-medium">
                {shortUrl}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                {truncateText(safeFallback(twitterTitle, "Título no configurado"), 70)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {truncateText(safeFallback(twitterDescription, "Descripción no configurada para Twitter"), 125)}
              </p>
            </div>
          </div>
        </div>

        {/* Métricas y consejos */}
        <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-gray-600">
          <h5 className="text-sm font-semibold text-yellow-400 mb-2">📊 Métricas de vista previa</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center">
              <div className="text-gray-400">Título OG</div>
              <div className={`font-bold ${ogTitle.length <= 80 ? 'text-green-400' : 'text-red-400'}`}>
                {ogTitle.length}/80
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Desc. OG</div>
              <div className={`font-bold ${ogDescription.length <= 120 ? 'text-green-400' : 'text-red-400'}`}>
                {ogDescription.length}/120
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Título Twitter</div>
              <div className={`font-bold ${twitterTitle.length <= 70 ? 'text-green-400' : 'text-red-400'}`}>
                {twitterTitle.length}/70
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Desc. Twitter</div>
              <div className={`font-bold ${twitterDescription.length <= 125 ? 'text-green-400' : 'text-red-400'}`}>
                {twitterDescription.length}/125
              </div>
            </div>
          </div>
        </div>

        {/* Consejos de optimización */}
        <div className="mt-4 space-y-2">
          {ogTitle.length > 80 && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>El título de Facebook es muy largo y puede acortarse</span>
            </div>
          )}
          {twitterTitle.length > 70 && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>El título de Twitter es muy largo y puede acortarse</span>
            </div>
          )}
          {!ogImage && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <span>💡</span>
              <span>Agrega una imagen OG para mejor engagement en Facebook/LinkedIn</span>
            </div>
          )}
          {!twitterImage && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <span>💡</span>
              <span>Agrega una imagen Twitter para mejor engagement en X/Twitter</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
