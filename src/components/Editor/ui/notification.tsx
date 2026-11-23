import React, { useEffect } from "react";

export interface NotificationProps {
  message: string;
  type: "success" | "warning" | "error" | "info";
  onClose: () => void;
  autoClose?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  autoClose = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, autoClose);
    return () => clearTimeout(timer);
  }, [onClose, autoClose]);

  const style = {
    success: "bg-green-50 border-green-500 text-green-800",
    error: "bg-red-50 border-red-500 text-red-800",
    warning: "bg-yellow-50 border-yellow-500 text-yellow-800",
  }[type];

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2
        z-[999] p-4 rounded-lg shadow-lg border-l-4
        ${style}
      `}
    >
      <div className="flex items-center justify-center">
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Notification;