import React from "react";
import EditorDialog from "./EditorDialog";
import PostPage from "../../templates/PostPage";
import StaticPage from "../../templates/StaticPage";
import { Button } from "./ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { ContentTypeEnum } from "./types/content.types";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: any; // Tipar según el tipo de contenido si lo prefieres
  type: ContentTypeEnum;
}

const deviceSizes = [
  { name: "Desktop", width: "100%", icon: <Monitor className="w-4 h-4" /> },
  { name: "Tablet", width: "768px", icon: <Tablet className="w-4 h-4" /> },
  { name: "Mobile", width: "375px", icon: <Smartphone className="w-4 h-4" /> },
];

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  formData,
  type,
}) => {
  const [device, setDevice] = React.useState(deviceSizes[0]);

  // Resetea el modo al abrir el modal
  React.useEffect(() => {
    if (open) setDevice(deviceSizes[0]);
  }, [open]);

  // El ancho del modal se adapta al dispositivo
  const dialogWidth = device.width === "100%" ? "95%" : device.width;

  // Renderiza el contenido de la página según el tipo
  const renderContent = () => (
    <div
      className="mx-auto bg-gray-50 border rounded-lg w-full"
      style={{
        maxWidth: device.width,
        minHeight: "400px",
        transition: "max-width 0.2s",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {type === "post" ? (
        <PostPage
          title={formData.title}
          content={formData.content}
          date={new Date(
            formData.publishedAt || formData.createdAt || new Date()
          ).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          author={formData.authorName}
          category={formData.category}
          featuredImage={formData.featuredImage}
          commentsCount={formData.commentsCount}
          rating={formData.rating}
          customCss={formData.customCss}
          postId={formData.id || `preview-${Date.now()}`}
          metaTitle={formData.metaTitle}
          metaDescription={formData.metaDescription}
          metaKeywords={formData.metaKeywords}
          canonicalUrl={formData.canonicalUrl}
          metaRobots={formData.metaRobots}
          ogTitle={formData.ogTitle}
          ogDescription={formData.ogDescription}
          ogImage={formData.ogImage}
          twitterTitle={formData.twitterTitle}
          twitterDescription={formData.twitterDescription}
          twitterImage={formData.twitterImage}
          contentType={formData.contentType}
          wordCount={formData.wordCount}
      />
      ) : (
        <StaticPage
          title={formData.title}
          content={formData.content}
          featuredImage={formData.featuredImage}
          customCss={formData.customCss}
          postId={formData.id || `preview-${Date.now()}`}
          metaTitle={formData.metaTitle}
          metaDescription={formData.metaDescription}
          metaKeywords={formData.metaKeywords}
          canonicalUrl={formData.canonicalUrl}
          metaRobots={formData.metaRobots}
          ogTitle={formData.ogTitle}
          ogDescription={formData.ogDescription}
          ogImage={formData.ogImage}
          twitterTitle={formData.twitterTitle}
          twitterDescription={formData.twitterDescription}
          twitterImage={formData.twitterImage}
          contentType={formData.contentType}
        />
      )}
    </div>
  );

  return (
    <EditorDialog
      open={open}
      title="Vista previa"
      message={
        <div>
          <div className="flex flex-wrap gap-2 mb-4 justify-center items-center px-4 w-full">
            {deviceSizes.map((d) => (
              <Button
                key={d.name}
                variant={device.name === d.name ? "default" : "outline"}
                size="sm"
                onClick={() => setDevice(d)}
                className="flex items-center gap-1 text-xs sm:text-sm"
              >
                {d.icon}
                <span className="hidden sm:inline">{d.name}</span>
                <span className="sm:hidden">{d.name.slice(0, 1)}</span>
              </Button>
            ))}
          </div>
          {renderContent()}
        </div>
      }
      confirmLabel="Cerrar"
      cancelLabel={null}
      onConfirm={onClose}
      onCancel={onClose}
      dialogWidth={dialogWidth}
      showActions={false}
    />
  );
};