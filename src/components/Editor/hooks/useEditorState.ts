import { useState } from 'react';
import { MediaType } from "../FloatingMenus/MediaInputField";

// ✅ Hook para centralizar y organizar todos los estados relacionados con la UI y la interacción del editor en un solo lugar, facilitando su uso y mantenimiento
export const useEditorState = () => {
  // Estados para mostrar/ocultar menús de colores, highlight, modo HTML y tablas
  const [showColors, setShowColors] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [tableMenuPosition, setTableMenuPosition] = useState({ x: 0, y: 0 });

  // Estados para manejo de enlaces: visibilidad del input, URL y rango guardado
  const [linkInputVisible, setLinkInputVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<any>(null);

  // Estados para menú flotante de imagen: visibilidad, imagen seleccionada y posición
  const [imageMenuVisible, setImageMenuVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [imageMenuPosition, setImageMenuPosition] = useState({ x: 0, y: 0 });

  // Estados para manejo de medios: visibilidad de imagenes, tipos y medios
  const [mediaInputVisible, setMediaInputVisible] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [mediaUrl, setMediaUrl] = useState<string>('');

  // Estado para forzar actualizaciones UI
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Estado para input de imagen
  const [imageInputVisible, setImageInputVisible] = useState(false);
  
  return {
    ui: {
      showColors,
      setShowColors,
      showHighlight,
      setShowHighlight,
      isHtmlMode,
      setIsHtmlMode,
      updateTrigger,
      setUpdateTrigger,
      showTable,
      setShowTable,
      tableMenuPosition,
      setTableMenuPosition
    },
    link: {
      linkInputVisible,
      setLinkInputVisible,
      linkUrl,
      setLinkUrl,
      savedRange,
      setSavedRange
    },
    image: {
      imageMenuVisible,
      setImageMenuVisible,
      selectedImage,
      setSelectedImage,
      imageMenuPosition,
      setImageMenuPosition,
      imageInputVisible,
      setImageInputVisible
    },
    media: {
      mediaInputVisible,
      setMediaInputVisible,
      mediaType,
      setMediaType,
      mediaUrl,
      setMediaUrl
    }
  };
};