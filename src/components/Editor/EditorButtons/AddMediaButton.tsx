import React, { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Editor } from '@tiptap/react';
import MediaInputField from '../FloatingMenus/MediaInputField';
import LinkInputField from '../FloatingMenus/LinkInputField';
import { MediaManager } from '../MediaManager';
import { UrlUtils } from '../utils/validateUrl';
import { extractYouTubeId, insertMedia, MediaType, ActiveTab } from '../utils/insertMedia';
import type { MediaItem } from '../../Editor/types/media.types';

interface AddMediaButtonProps {
  editor: Editor | null;
  setImageInputVisible: (visible: boolean) => void;
  setMediaInputVisible: (value: boolean) => void;
  setSavedRange: (value: any) => void;
}

const AddMediaButton: React.FC<AddMediaButtonProps> = ({
  editor,
  setMediaInputVisible,
  setSavedRange
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('media');
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [showMediaManager, setShowMediaManager] = useState(false);

  if (!editor) return null;

  const handleMenuOpen = () => {
    // Guarda rango de selección
    setSavedRange(editor.state.tr.setSelection(editor.state.selection));
    setMediaInputVisible(true);
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
    setMediaInputVisible(false);
    setUrl('');
    setActiveTab('media');
  };

  // Insertar media desde archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }
    insertMedia(editor, file, mediaType, activeTab, { filename: file.name });
    handleMenuClose();
  };

  // Inserta desde URL
  const handleUrlInsert = () => {
    const finalUrl = UrlUtils.sanitizeUrl(url);
    if (!finalUrl || !UrlUtils.isValidUrl(finalUrl)) {
      alert('URL inválida');
      return;
    }

    if (activeTab === 'link') {
      // Inserta como enlace
      editor.chain().focus().setLink({ href: finalUrl }).run();
    }
    insertMedia(editor, finalUrl, mediaType, activeTab);
    handleMenuClose();
  };

  // ✅ Abre la biblioteca de medios
  const handleOpenLibrary = () => {
    setShowMediaManager(true);
  };

  // ✅ Maneja la selección de un medio desde MediaManager
  const handleSelectMedia = (media: MediaItem) => {
    insertMedia(editor, media.public_url, media.media_type as MediaType, undefined, { filename: media.original_filename });
    setShowMediaManager(false);
    handleMenuClose();
  };

  // Extrae el ID de YouTube
  const youtubeId = extractYouTubeId(url);

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={handleMenuOpen}
        className="p-2 rounded-xl bg-white text-black hover:bg-gray-100 transition-colors"
        title="Insertar multimedia"
        aria-label="Insertar multimedia"
      >
        <Paperclip size={20} />
      </button>

      {/* OVERLAY Y HELPERS */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Selector de tipo de contenido */}
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Tabs */}
            <div className="flex border-b bg-gray-50 rounded-t-xl">
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-tl-xl ${
                  activeTab === 'media' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📎 Multimedia
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'link' 
                    ? 'text-green-600 border-b-2 border-green-600 bg-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔗 Enlace
              </button>
              <button
                onClick={() => {
                  setActiveTab('media');
                  setMediaType('video');
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-tr-xl ${
                  activeTab === 'media' && mediaType === 'video'
                    ? 'text-red-600 border-b-2 border-red-600 bg-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎬 YouTube
              </button>
            </div>

            {/* Contenido multimedia */}
            {activeTab === 'media' && (
              <MediaInputField
                visible={true}
                url={url}
                type={mediaType}
                setUrl={setUrl}
                setType={setMediaType}
                onApply={handleUrlInsert}
                onCancel={handleMenuClose}
                onFileSelect={handleFileSelect}
                onOpenLibrary={handleOpenLibrary}
              />
            )}
            {/* Contenido enlace */}
            {activeTab === 'link' && (
              <LinkInputField
                visible={true}
                url={url}
                setUrl={setUrl}
                onApply={handleUrlInsert}
                onCancel={handleMenuClose}
              />
            )}
          </div>
        </div>
      )}
      
      <MediaManager
        isOpen={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onSelect={handleSelectMedia}
      />
    </>
  );
};

export default AddMediaButton;