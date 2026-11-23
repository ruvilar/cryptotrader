import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "./ui/dialog";

interface EditorDialogProps {
  open: boolean;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  dialogWidth?: string;
  showActions?: boolean;
}

const EditorDialog: React.FC<EditorDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  destructive,
  dialogWidth,
  cancelLabel,
  confirmLabel,
  showActions = true
}) => (
  <Dialog open={open} onOpenChange={open => !open && onCancel()}>
    <DialogContent
      style={{
        width: dialogWidth || "900px",
        maxWidth: "100vw",
        minWidth: "320px",
        margin: "0 auto",
        padding: "0",
        maxHeight: "90vh", // Limita el alto del modal
        overflowY: "auto", // Permite el scroll vertical
        overflowX: "hidden", // Evita el scroll horizontal
      }}
      className="!p-0"
    >
      <DialogHeader className="px-6 pt-6 pb-2 py-6">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="py-4">{message}</DialogDescription>
      </DialogHeader>

      {/* Botones de acción */}
      {showActions && (
        <div className="flex justify-end gap-4 px-6 pb-6">
          <button
            type="button"
            className={`btn btn-outline rounded-md text-sm font-medium ${
              destructive ? "text-blue-600" : ""
            }`}
            onClick={onCancel}
          >
            {cancelLabel || "Cancelar"}
          </button>
          <button
            type="button"
            className={`btn rounded-md text-sm font-medium`}
            onClick={onConfirm}
          >
            {confirmLabel || "Salir sin guardar"}
          </button>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default EditorDialog;