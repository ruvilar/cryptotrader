/**
 * Componente principal todo-en-uno para gestión de contenidos multimedia.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useMediaOperations } from './hooks/useMediaOperations';
import { formatBytes } from '@/lib/supabaseServices';
import type { MediaItem, MediaType, MediaFilter } from './types/media.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Label } from './ui/label';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Search,
  Filter,
  Copy,
  Trash2,
  Download,
  Edit,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface MediaManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: MediaItem) => void;
  allowedTypes?: MediaType[];
  maxFileSize?: number;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  isOpen,
  onClose,
  onSelect,
  allowedTypes
}) => {
  // ===========================
  // HOOKS Y ESTADO
  // ===========================
  
  const {
    media,
    selectedMedia,
    loading,
    uploading,
    error,
    filters,
    stats,
    hasMore,
    loadMore,
    uploadMultipleFiles,
    deleteMedia,
    updateMediaMetadata,
    searchMedia,
    applyFilters,
    clearFilters,
    selectMedia,
    clearSelection,
    getMediaUsage,
    copyUrlToClipboard,
    downloadMedia
  } = useMediaOperations();

  // Estado local del componente
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Formulario de metadatos
  const [metadataForm, setMetadataForm] = useState({
    title: '',
    alt_text: '',
    caption: ''
  });

  // ===========================
  // MANEJADORES DE DRAG & DROP
  // ===========================

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadMultipleFiles(files);
    }
  }, [uploadMultipleFiles]);

  // ===========================
  // MANEJADORES DE ARCHIVOS
  // ===========================

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadMultipleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadMultipleFiles]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ===========================
  // MANEJADORES DE BÚSQUEDA Y FILTROS
  // ===========================

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    await searchMedia(term);
  }, [searchMedia]);

  const handleApplyFilters = useCallback(async (newFilters: MediaFilter) => {
    await applyFilters(newFilters);
  }, [applyFilters]);

  const handleClearFilters = useCallback(async () => {
    setSearchTerm('');
    await clearFilters();
  }, [clearFilters]);

  // ===========================
  // MANEJADORES DE SELECCIÓN
  // ===========================

  const handleSelectMedia = useCallback(async (mediaId: string) => {
    await selectMedia(mediaId);
    await getMediaUsage(mediaId);
  }, [selectMedia, getMediaUsage]);

  const handleInsertMedia = useCallback(() => {
    if (selectedMedia && onSelect) {
      onSelect(selectedMedia);
      onClose();
    }
  }, [selectedMedia, onSelect, onClose]);

  // ===========================
  // MANEJADORES DE METADATOS
  // ===========================

  const handleEditMetadata = useCallback(() => {
    if (selectedMedia) {
      setMetadataForm({
        title: selectedMedia.title || '',
        alt_text: selectedMedia.alt_text || '',
        caption: selectedMedia.caption || ''
      });
      setEditingMetadata(true);
    }
  }, [selectedMedia]);

  const handleSaveMetadata = useCallback(async () => {
    if (!selectedMedia) return;
    
    try {
      await updateMediaMetadata(selectedMedia.id, metadataForm);
      setEditingMetadata(false);
    } catch (err) {
      alert("Error al guardar los metadatos. Intenta nuevamente.");
    }
  }, [selectedMedia, metadataForm, updateMediaMetadata]);

  // ===========================
  // MANEJADORES DE ACCIONES
  // ===========================

  const handleCopyUrl = useCallback(async (url: string) => {
    const success = await copyUrlToClipboard(url);
    if (success) {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  }, [copyUrlToClipboard]);

  const handleDelete = useCallback(async () => {
    if (!selectedMedia) return;
    
    setShowDeleteConfirm(false); // Cierra primero el modal
    
    try {
      await deleteMedia(selectedMedia.id, true);
      clearSelection();
    } catch (err) {
      alert("Error al eliminar el medio. Intenta nuevamente.");
    }
  }, [selectedMedia, deleteMedia, clearSelection]);

  const handleDownload = useCallback(() => {
    if (selectedMedia) {
      downloadMedia(selectedMedia);
    }
  }, [selectedMedia, downloadMedia]);

  // ===========================
  // MANEJADORES DE SCROLL
  // ===========================

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // ===========================
  // UTILIDADES DE RENDERIZADO
  // ===========================

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
    }
  };

  const renderMediaPreview = (item: typeof media[0]) => {
    if (item.mediaType === 'image') {
      return (
        <img
          src={item.publicUrl}
          alt={item.originalFilename}
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        {getMediaIcon(item.mediaType)}
      </div>
    );
  };

  // ===========================
  // RENDERIZADO PRINCIPAL
  // ===========================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Gestor de Medios</DialogTitle>
          <DialogDescription>
            Gestiona imágenes, videos, audios y archivos de tu sitio web
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Panel Izquierdo: Lista/Grid de Medios */}
          <div className="flex-1 flex flex-col border-r">
            {/* Barra de Búsqueda y Acciones */}
            <div className="p-4 border-b space-y-3">
              {/* Búsqueda */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 text-gray-800"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>

              {/* Botón de Subir */}
              <Button
                onClick={triggerFileSelect}
                disabled={uploading}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-gray-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir archivos
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept={allowedTypes?.map(t => {
                  if (t === 'image') return 'image/*';
                  if (t === 'video') return 'video/*';
                  if (t === 'audio') return 'audio/*';
                  return '*/*';
                }).join(',')}
              />

              {/* Estadísticas */}
              {stats && (
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{stats.totalFiles} archivos</span>
                  <span>{stats.totalSizeFormatted}</span>
                </div>
              )}
            </div>

            {/* Filtros Expandibles */}
            {showFilters && (
              <div className="p-4 border-b space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className='text-blue-300 text-md'>Tipo de medio</Label>
                    <Select
                      value={filters.mediaType || 'all'}
                      onValueChange={(value) => handleApplyFilters({
                        ...filters,
                        mediaType: value === 'all' ? undefined : (value as MediaType)
                      })}
                    >
                      <option className="text-sm" value="all">Todos</option>
                      <option className="text-sm" value="image">Imágenes</option>
                      <option className="text-sm" value="video">Videos</option>
                      <option className="text-sm" value="audio">Audios</option>
                      <option className="text-sm" value="file">Archivos</option>
                    </Select>
                  </div>
                  <div>
                    <Label className='text-blue-300 text-md'>Tamaño</Label>
                    <Select>
                      <option className="text-sm" value="all">Todos</option>
                      <option className="text-sm" value="small">Menos de 1MB</option>
                      <option className="text-sm" value="medium">1-5MB</option>
                      <option className="text-sm" value="large">Más de 5MB</option>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}

            {/* Grid/Lista de Medios con Drag & Drop */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 overflow-y-auto p-4 ${dragActive ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''}`}
            >
              {/* Zona de Drop Visual */}
              {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10 pointer-events-none">
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <p className="text-lg font-medium text-blue-600">Suelta los archivos aquí</p>
                  </div>
                </div>
              )}

              {/* Mensaje de Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Loading */}
              {loading && media.length === 0 && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {/* Empty State */}
              {!loading && media.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Upload className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No hay medios</p>
                  <p className="text-sm">Arrastra archivos aquí o haz clic en "Subir archivos"</p>
                </div>
              )}

              {/* Grid de Medios */}
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectMedia(item.id)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia?.id === item.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Preview */}
                      <div className="aspect-square">
                        {renderMediaPreview(item)}
                      </div>

                      {/* Overlay con Info */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                          <p className="text-xs font-medium truncate">{item.originalFilename}</p>
                          <p className="text-xs">{formatBytes(item.fileSize)}</p>
                        </div>
                      </div>

                      {/* Badge de Tipo */}
                      <div className="absolute top-2 left-2 bg-white rounded-full p-1.5 shadow-sm">
                        {getMediaIcon(item.mediaType)}
                      </div>

                      {/* Check si está seleccionado */}
                      {selectedMedia?.id === item.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMore && !loading && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={loadMore}>
                    Cargar más
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Detalles y Acciones */}
          <div className="w-96 flex flex-col bg-gray-50">
            {selectedMedia ? (
              <>
                {/* Preview Grande */}
                <div className="p-4 border-b">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {selectedMedia.media_type === 'image' ? (
                      <img
                        src={selectedMedia.public_url}
                        alt={selectedMedia.alt_text || selectedMedia.original_filename}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      getMediaIcon(selectedMedia.media_type)
                    )}
                  </div>
                </div>

                {/* Información y Metadatos */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-gray-700">
                  {/* Información básica */}
                  <div>
                    <h3 className="font-semibold mb-2 text-lg text-blue-500">Información</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Nombre:</span>
                        <p className="font-medium break-all">{selectedMedia.original_filename}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tamaño:</span>
                        <p className="font-medium">{formatBytes(selectedMedia.file_size)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tipo:</span>
                        <p className="font-medium">{selectedMedia.mime_type}</p>
                      </div>
                      {selectedMedia.width && selectedMedia.height && (
                        <div>
                          <span className="text-gray-500">Dimensiones:</span>
                          <p className="font-medium">{selectedMedia.width} × {selectedMedia.height}px</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Subido:</span>
                        <p className="font-medium">{new Date(selectedMedia.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Metadatos Editables */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-blue-500">Metadatos</h3>
                      {!editingMetadata && (
                        <Button size="sm" variant="outline" onClick={handleEditMetadata}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {editingMetadata ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={metadataForm.title}
                            onChange={(e) => setMetadataForm({ ...metadataForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Texto alternativo (ALT)</Label>
                          <Input
                            value={metadataForm.alt_text}
                            onChange={(e) => setMetadataForm({ ...metadataForm, alt_text: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Input
                            value={metadataForm.caption}
                            onChange={(e) => setMetadataForm({ ...metadataForm, caption: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveMetadata} className="flex-1">
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingMetadata(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Título:</span>
                          <p className="font-medium">{selectedMedia.title || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">ALT:</span>
                          <p className="font-medium">{selectedMedia.alt_text || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Descripción:</span>
                          <p className="font-medium">{selectedMedia.caption || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* URL */}
                  <div>
                    <Label>URL pública</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={selectedMedia.public_url}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyUrl(selectedMedia.public_url)}
                      >
                        {copiedUrl === selectedMedia.public_url ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-4 border-t bg-gray-900 space-y-2">
                  {onSelect && (
                    <Button onClick={handleInsertMedia} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                      Insertar multimedia
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleDownload} className="gap-2 hover:bg-gray-800">
                      <Download className="w-4 h-4" />
                      Abrir
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-2 text-red-400 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Selecciona un medio</p>
                <p className="text-sm text-center px-4">
                  Haz clic en cualquier archivo para ver sus detalles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Diálogo de Confirmación de Eliminación */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-2">¿Eliminar medio?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Esta acción no se puede deshacer. El archivo se eliminará permanentemente del servidor.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};