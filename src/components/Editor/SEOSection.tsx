import React, { useState, useEffect } from "react";
import { ContentFormData } from "./types/content.types";
import { SEOExportButton } from "./EditorButtons/SEOExportButton";
import { SocialPreview } from "./SocialPreview";
import { UrlUtils } from "./utils/validateUrl";

interface Props { // Define qué datos y funciones recibe el componente desde su padre
  formData: ContentFormData; // Objeto con todos los campos del formulario de contenido (título, descripción, SEO, etc.)
  updateField: (field: keyof ContentFormData, value: string) => void; // Función para actualizar cualquier campo del formulario
  contentList: any[]; // Lista de contenidos, útil para exportar o comparar
}

const SEOSection: React.FC<Props> = ({ formData, updateField, contentList }) => {
  const [seoScore, setSeoScore] = useState(0); // Puntaje SEO calculado dinámicamente
  const [seoTips, setSeoTips] = useState<string[]>([]); // Lista de recomendaciones para mejorar el SEO
  const [canonicalUrlError, setCanonicalUrlError] = useState(""); // Mensaje de error si la URL canónica es inválida
  const [keywordsWarning, setKeywordsWarning] = useState(""); // Advertencias sobre las palabras clave

  // ✅ Declara una función que se ejecuta cada vez que el usuario escribe o modifica el campo de la URL canónica en el formulario
  const handleCanonicalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Recibe el evento de cambio (e) del input de tipo texto
    const value = e.target.value; // Extrae el valor actual del input (lo que el usuario ha escrito)
    updateField("canonicalUrl", value); // Llama a la función updateField (recibida por props) para actualizar el campo canonicalUrl en el estado global del formulario. Así, el valor se sincroniza con el resto del editor y se guarda correctamente
    if (!value) { // Si el campo está vacío, limpia cualquier mensaje de error anterior
      setCanonicalUrlError("");
    } else if (!UrlUtils.isValidUrl(value)) { // Si el campo no está vacío y la función isValidUrl (de tu utilitario UrlUtils) indica que la URL no es válida, muestra un mensaje de error. Esto ayuda a guiar al usuario para que escriba una URL correcta (por ejemplo, debe empezar por https:// y tener un dominio válido)
      setCanonicalUrlError("La URL no es válida.");
    } else { // Si la URL es válida, limpia cualquier mensaje de error
      setCanonicalUrlError("");
    }
  };

  // ✅ Declara una función que se ejecuta cada vez que el usuario escribe o modifica el campo de palabras clave en el formulario
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Recibe el evento de cambio (e) del input de tipo texto
    const value = e.target.value; // Extrae el valor actual del input (lo que el usuario ha escrito)
    updateField("metaKeywords", value); // Llama a la función updateField (recibida por props) para actualizar el campo metaKeywords en el estado global del formulario. Así, el valor se sincroniza con el resto del editor y se guarda correctamente

    const keywordsArr = value // Convierte la cadena de palabras clave en un array
      .split(",") // Separa las palabras clave por comas
      .map(k => k.trim()) // Elimina espacios antes y después de cada palabra
      .filter(k => k); // Elimina elementos vacíos (por si hay comas seguidas o espacios)

    // Realiza validaciones sobre las palabras clave ingresadas por el usuario en el campo metaKeywords y muestra advertencias si no cumplen ciertos criterios SEO recomendados  
    if (!value || keywordsArr.length === 0) {
      setKeywordsWarning("Agrega al menos una palabra clave.");
    } else if (keywordsArr.length < 3) {
      setKeywordsWarning("Recomendado: al menos 3 palabras clave.");
    } else if (keywordsArr.length > 10) {
      setKeywordsWarning("Demasiadas palabras clave (Máximo 10 recomendado).");
    } else if ((new Set(keywordsArr)).size < keywordsArr.length) {
      setKeywordsWarning("Hay palabras clave repetidas.");
    } else if (keywordsArr.some(k => k.length > 32)) {
      setKeywordsWarning("Algunas palabras clave son demasiado largas (32 caracteres máximo).");
    } else {
      setKeywordsWarning("");
    }
  };

  // ✅ Esta función genera sugerencias automáticas de palabras clave (keywords) a partir del título y la descripción SEO que el usuario ya escribió en el formulario
  const getKeywordSuggestions = () => {
    const text = `${formData.metaTitle} ${formData.metaDescription}`; // Combina el meta título y la meta descripción en un solo texto. Junta ambos campos en un solo string para analizarlo
    if (!text) return []; // Si no hay texto, retorna un array vacío. Así evita errores si ambos campos están vacíos
    const words = text // Procesa el texto para extraer palabras relevantes
      .toLowerCase() // Convierte todo a minúsculas para evitar duplicados por mayúsculas/minúsculas
      .replace(/[.,;:!¡¿?()\[\]{}"']/g, "") // Elimina signos de puntuación comunes
      .split(/\s+/) // Separa el texto en palabras usando espacios como delimitadores
      .filter(w => w.length > 3 && ![ // Filtra palabras muy cortas (≤3 letras) y palabras comunes (stopwords) que no aportan valor SEO
        "para", "con", "los", "las", "del", "una", "este", "esta", "que", "por", "como", "más", "muy", "entre", "sobre", "sus", "pero", "sin", "son", "han", "desde", "hasta", "porque", "cuando", "donde", "todo", "toda"
      ].includes(w));
    const current = (formData.metaKeywords || "").toLowerCase().split(",").map(k => k.trim()); // Obtiene las palabras clave ya usadas en el campo metaKeywords para evitar sugerir duplicados. Convierte las palabras clave actuales a minúsculas y las separa en un array
    const uniqueWords = [...new Set(words)].filter(w => w && !current.includes(w)); // Filtra palabras únicas y que no estén ya en las keywords actuales. Elimina duplicados y descarta las que ya están en las palabras clave del usuario
    return uniqueWords.slice(0, 8); // Devuelve hasta 8 sugerencias. Limita el número de sugerencias para no saturar la interfaz
  };

  // ✅ Es una función interna que calcula el puntaje SEO (score) y genera una lista de recomendaciones (tips) según los campos completados y sus valores
  useEffect(() => {
    const analyzeSEO = () => {
      let score = 0; // Empieza en 0
      const tips: string[] = []; // Es un array vacío donde se irán agregando recomendaciones

      // Si existe metaTitle:
      if (formData.metaTitle) {
        if (formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60) { // Si tiene entre 30 y 60 caracteres...
          score += 20; // ...suma 20 puntos al score
        } else {
          tips.push(`Título SEO: ${formData.metaTitle.length < 30 ? 'muy corto' : 'muy largo'} (${formData.metaTitle.length} caracteres)`); // Si no, agrega un tip indicando si es muy corto o muy largo y cuántos caracteres tiene
        }
      } else if (formData.title) { // Si no hay metaTitle pero sí title, sugiere usar el título principal para SEO
        tips.push("Usa el título principal para SEO o personalízalo");
      } else { // Si no hay ninguno, avisa que falta el título SEO
        tips.push("Falta el título SEO");
      }

      if (formData.metaDescription) {
        if (formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160) { // Si tiene entre 120 y 160 caracteres...
          score += 20; // ...suma 20 puntos al score
        } else {
          tips.push(`Descripción SEO: ${formData.metaDescription.length < 120 ? 'muy corta' : 'muy larga'} (${formData.metaDescription.length} caracteres)`); // Si no, agrega un tip indicando si es muy corta o muy larga y cuántos caracteres tiene
        }
      } else { // Si no hay ninguna, avisa que falta la descripción SEO
        tips.push("Falta la descripción SEO");
      }

      if (formData.metaKeywords && formData.metaKeywords.split(',').filter(k => k.trim()).length >= 3) { // Verifica si hay al menos 3 palabras clave (separadas por coma y no vacías)
        score += 15; // Si cumple, suma 15 puntos al score SEO
      } else {
        tips.push("Agrega al menos 3 palabras clave separadas por coma"); // Si no, agrega una recomendación para que el usuario agregue más palabras clave
      }

      if (formData.featuredImage) { // Si hay una imagen destacada
        score += 15; // ...suma 15 puntos
      } else {
        tips.push("Agrega una imagen destacada"); // Si no, recomienda agregar una imagen destacada (importante para SEO y redes sociales)
      }

      if (formData.ogTitle && formData.ogDescription) { // Si ambos campos de Open Graph están completos...
        score += 15; // ...suma 15 puntos
      } else {
        tips.push("Completa los datos de Open Graph para redes sociales"); // Si falta alguno, recomienda completarlos (mejora la apariencia al compartir en Facebook/LinkedIn)
      }

      if (formData.twitterTitle && formData.twitterDescription) { // Si ambos campos de Twitter están completos...
        score += 15; // ...suma 15 puntos
      } else {
        tips.push("Completa los datos de Twitter Cards"); // Si falta alguno, recomienda completarlos (mejora la apariencia al compartir en Twitter)
      }

      setSeoScore(score); // Actualiza el estado local del componente con el puntaje SEO calculado...
      setSeoTips(tips); // ...y la lista de recomendaciones generadas
    };

    analyzeSEO(); // Esto permite mostrar el puntaje y los tips en la interfaz en tiempo real
  }, [formData]);

  // ✅ Son funciones auxiliares (helpers) que devuelven estilos y emojis según el puntaje SEO (seoScore). Se usan para dar feedback visual inmediato al usuario sobre la calidad SEO de su contenido
  const getScoreColor = () => { // Devuelve una cadena de clases Tailwind CSS para colorear el widget del puntaje SEO según el valor de seoScore
    if (seoScore >= 80) return "text-green-400 bg-green-900/30 border-green-400";
    if (seoScore >= 60) return "text-yellow-400 bg-yellow-900/30 border-yellow-400";
    return "text-red-400 bg-red-900/30 border-red-400";
  };
  const getScoreEmoji = () => { // Devuelve un emoji representativo del nivel de optimización SEO según el valor de seoScore
    if (seoScore >= 80) return "🎉";
    if (seoScore >= 60) return "⚡";
    return "⚠️";
  };

  return (
    <div className="py-4 space-y-6">
      {/* Header de sección y exportación SEO */}
      <div className="flex items-center justify-between mb-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-blue-900">🔍 SEO y Metadatos</h2>
          <p className="text-gray-700">Optimiza tu contenido para motores de búsqueda y redes sociales</p>
        </div>
        <SEOExportButton contentList={contentList} />
      </div>

      {/* Widget de puntaje SEO y recomendaciones */}
      <div className={`rounded-lg p-4 border-2 ${getScoreColor()}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            {getScoreEmoji()} Análisis SEO
          </h3>
          <div className={`px-4 py-2 rounded-full text-lg font-bold bg-red-900 ${getScoreColor()}`}>
            {seoScore}/100
          </div>
        </div>
        {seoTips.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-blue-800 font-medium">📋 Recomendaciones:</p>
            <div className="space-y-1">
              {seoTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span className="text-gray-200">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {seoScore >= 80 && (
          <div className="mt-3 p-3 bg-green-900/20 rounded-lg border border-green-400/30">
            <p className="text-green-400 text-sm font-medium">
              ✨ ¡Excelente! Tu contenido está bien optimizado para SEO
            </p>
          </div>
        )}
      </div>

      {/* Acciones rápidas para autocompletar campos SEO */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-400/30">
        <h3 className="text-lg font-semibold mb-3 text-white">🚀 Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-2">
          {/* Autocompletar títulos SEO/social */}
          <button
            onClick={() => {
              if (formData.title && !formData.metaTitle) {
                updateField("metaTitle", formData.title);
              }
              if (formData.title && !formData.ogTitle) {
                updateField("ogTitle", formData.title);
              }
              if (formData.title && !formData.twitterTitle) {
                updateField("twitterTitle", formData.title);
              }
            }}
            disabled={!formData.title}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📝 Autocompletar títulos
          </button>

          {/* Usar imagen destacada en OG/Twitter */}
          <button
            onClick={() => {
              if (formData.featuredImage && !formData.ogImage) {
                updateField("ogImage", formData.featuredImage);
              }
              if (formData.featuredImage && !formData.twitterImage) {
                updateField("twitterImage", formData.featuredImage);
              }
            }}
            disabled={!formData.featuredImage}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🖼️ Usar imagen destacada
          </button>

          {/* Usar descripción SEO en OG/Twitter */}
          <button
            onClick={() => {
              if (formData.metaDescription && !formData.ogDescription) {
                updateField("ogDescription", formData.metaDescription);
              }
              if (formData.metaDescription && !formData.twitterDescription) {
                updateField("twitterDescription", formData.metaDescription);
              }
            }}
            disabled={!formData.metaDescription}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📄 Usar descripción SEO
          </button>

          {/* Sugerencia de palabras clave */}
          <button
            onClick={() => {
              const suggestions = getKeywordSuggestions();
              if (suggestions.length) {
                const current = (formData.metaKeywords || "")
                  .split(",")
                  .map(k => k.trim())
                  .filter(Boolean);
                const all = Array.from(new Set([...current, ...suggestions])).slice(0, 10);
                updateField("metaKeywords", all.join(", "));
              }
            }}
            disabled={getKeywordSuggestions().length === 0}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💡 Sugerir palabras clave
          </button>
        </div>
      </div>

      {/* Formulario de metadatos básicos */}
      <div className="bg-white/10 rounded-lg p-4 border border-gray-600">
        <h3 className="text-xl font-semibold mb-4 text-yellow-900 border-b border-yellow-300/30 pb-2">
          📝 Metadatos básicos
        </h3>
        <div className="space-y-4">
          {/* Campo meta título con contador de caracteres */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
              <span>Meta Título *</span>
              <span className={`text-xs px-2 py-1 rounded bg-yellow-50 ${
                formData.metaTitle.length >= 30 && formData.metaTitle.length <= 60 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {formData.metaTitle.length}/60
              </span>
            </label>
            <input
              type="text"
              placeholder="Título optimizado para SEO (30-60 caracteres)"
              value={formData.metaTitle}
              onChange={e => updateField("metaTitle", e.target.value)}
              className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">Aparecerá como título en los resultados de Google</p>
          </div>

          {/* Campo meta descripción con contador */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
              <span>Meta Descripción *</span>
              <span className={`text-xs px-2 py-1 rounded bg-yellow-50 ${
                formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {formData.metaDescription.length}/160
              </span>
            </label>
            <textarea
              placeholder="Descripción atractiva que aparecerá en Google (120-160 caracteres)"
              value={formData.metaDescription}
              onChange={e => updateField("metaDescription", e.target.value)}
              className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">Descripción que verán los usuarios en los buscadores</p>
          </div>
          
          {/* Campo palabras clave */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Palabras clave
            </label>
            <input
              type="text"
              value={formData.metaKeywords || ""}
              onChange={handleKeywordsChange}
              className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
              placeholder="Cada palabra clave separada por coma"
            />
            {keywordsWarning && (
              <p className="text-gray-500 text-xs mt-1">{keywordsWarning}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {getKeywordSuggestions().map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs hover:bg-blue-300 transition"
                  onClick={() => {
                    const arr = (formData.metaKeywords || "")
                      .split(",")
                      .map(k => k.trim())
                      .filter(Boolean);
                    if (!arr.includes(kw)) {
                      updateField("metaKeywords", [...arr, kw].join(", "));
                    }
                  }}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Campo URL canónica con validación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">URL Canónica</label>
                <input
                  type="text"
                  value={formData.canonicalUrl || ""}
                  onChange={handleCanonicalUrlChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-black ${
                    canonicalUrlError
                      ? "border-red-500 bg-red-50"
                      : formData.canonicalUrl
                      ? "border-green-500"
                      : "border-gray-300"
                  }`}
                  placeholder="https://tudominio.com/url-canonica"
                />
                {canonicalUrlError && (
                  <p className="text-red-500 text-xs mt-1">{canonicalUrlError}</p>
                )}
              {formData.canonicalUrl && !/^https:\/\/.+\..+/.test(formData.canonicalUrl) && (
                <p className="text-xs text-red-600 mt-1">
                  La URL canónica debe comenzar con "https://" y ser una URL válida.
                </p>
              )}
            </div>
            {/* Meta Robots */}
            <div> 
              <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
                Meta Robots
                <span className="relative group cursor-pointer">
                  <svg width="16" height="16" fill="currentColor" className="text-gray-400 hover:text-gray-700">
                    <circle cx="8" cy="8" r="8" fill="#f1c40f"/>
                    <text x="8" y="12" textAnchor="middle" fontSize="11" fill="#222">?</text>
                  </svg>
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-64 px-3 py-2 rounded bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                    Indica a los motores de búsqueda si deben indexar esta página y/o seguir los enlaces internos. Por ejemplo:<br/><br/>  
                    <b>- Index, Follow: </b>Indexa y sigue enlaces. (Recomendado)<br/> 
                    <b>- No Index, Follow: </b> No indexa, pero sigue enlaces.<br/>
                    <b>- Index, No Follow: </b> Indexa, pero no sigue enlaces.<br/>
                    <b>- No Index, No Follow: </b> No indexa ni sigue enlaces.
                  </span>
                </span>
              </label>
              <select
                value={formData.metaRobots}
                onChange={e => updateField("metaRobots", e.target.value)}
                className="w-full border rounded-lg p-2 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
              >
                <option value="index,follow">Index, Follow (Recomendado)</option>
                <option value="noindex,follow">No Index, Follow</option>
                <option value="index,nofollow">Index, No Follow</option>
                <option value="noindex,nofollow">No Index, No Follow</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Metadatos Open Graph */}
      <div className="bg-white/10 rounded-lg p-4 border border-gray-600">
        <h3 className="text-xl font-semibold mb-4 text-blue-700 border-b border-blue-300/30 pb-2">
          📘 Open Graph (Facebook/LinkedIn)
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Título para Facebook/LinkedIn (Opcional. Usa el meta título por defecto)"
            value={formData.ogTitle}
            onChange={e => updateField("ogTitle", e.target.value)}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
          />
          <textarea
            placeholder="Descripción para Facebook/LinkedIn"
            value={formData.ogDescription}
            onChange={e => updateField("ogDescription", e.target.value)}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
            rows={2}
          />
          <input
            type="url"
            placeholder="Imagen para Facebook/LinkedIn (1200x630px recomendado)"
            value={formData.ogImage}
            onChange={e => updateField("ogImage", e.target.value)}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
          />
        </div>
      </div>

      {/* Metadatos Twitter Cards */}
      <div className="bg-white/10 rounded-lg p-4 border border-gray-600">
        <h3 className="text-xl font-semibold mb-4 text-cyan-700 border-b border-cyan-300/30 pb-2">
          🐦 Twitter Cards
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Título para Twitter"
            value={formData.twitterTitle}
            onChange={e => updateField("twitterTitle", e.target.value)}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
          />
          <textarea
            placeholder="Descripción para Twitter"
            value={formData.twitterDescription}
            onChange={e => updateField("twitterDescription", e.target.value)}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
            rows={2}
          />
          <input
            type="url"
            placeholder="Imagen para Twitter (1200x600px recomendado)"
            value={formData.twitterImage}
            onChange={e => updateField("twitterImage", e.target.value)}
            className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
          />
        </div>
      </div>

      {/* Datos estructurados Schema.org */}
      <div className="bg-white/10 rounded-lg p-4 border border-gray-600">
        <h3 className="text-xl font-semibold mb-4 text-green-700 border-b border-green-300/30 pb-2">
          🏗️ Datos Estructurados (Schema.org)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de Contenido</label>
            <select
              value={formData.contentType}
              onChange={e => updateField("contentType", e.target.value)}
              className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
            >
              <option value="Article">Artículo</option>
              <option value="BlogPosting">Post de Blog</option>
              <option value="NewsArticle">Noticia</option>
              <option value="WebPage">Página Web</option>
              <option value="HowTo">Guía/Tutorial</option>
              <option value="Review">Reseña</option>
              <option value="TechArticle">Artículo Técnico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Autor</label>
            <input
              type="text"
              placeholder="Nombre del autor"
              value={formData.authorName}
              onChange={e => updateField("authorName", e.target.value)}
              className="w-full border rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 shadow-bitcoin"
            />
          </div>
        </div>
      </div>

      {/* Vista previa Google y social */}
      {(formData.metaTitle || formData.title) && (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-gray-600">
          <h4 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            🔍 Vista Previa en Google
          </h4>
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="text-blue-600 text-xl hover:underline cursor-pointer font-medium">
              {formData.metaTitle || formData.title}
            </div>
            <div className="text-green-700 text-sm mt-1">
              https://tudominio.com/{formData.slug || 'url-del-contenido'}
            </div>
            <div className="text-gray-600 text-sm mt-2 leading-relaxed">
              {formData.metaDescription || 'Meta descripción no configurada. Se mostrará un extracto automático del contenido.'}
            </div>
          </div>
        </div>
      )}
      {/* Vista previa Open Graph y Twitter */}
      {(!formData.ogTitle && !formData.metaTitle) ? (
        <div className="bg-gray-100 text-gray-400 p-6 rounded-md text-center">
          Completa el título o la descripción para ver la vista previa de Google, OpenGraph y Twitter.
        </div>
      ) : (
        <SocialPreview
          url={`https://tudominio.com/${formData.slug || ""}`}
          ogTitle={formData.ogTitle || formData.metaTitle || formData.title}
          ogDescription={formData.ogDescription || formData.metaDescription}
          ogImage={formData.ogImage || formData.featuredImage}
          twitterTitle={formData.twitterTitle || formData.metaTitle || formData.title}
          twitterDescription={formData.twitterDescription || formData.metaDescription}
          twitterImage={formData.twitterImage || formData.featuredImage}
        />
      )}
    </div>
  );
};

export default SEOSection;