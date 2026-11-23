import { useState } from "react";

// ✅ Define los tipos válidos de notificación: éxito, error, advertencia e informativo. Esto permite tipar correctamente las notificaciones y controlar su aspecto visual
export type NotificationType = 'success' | 'warning' | 'error' | 'info';

// ✅ Función de utilidad para validar y normalizar el tipo de notificación recibido como argumento
export function getNormalizedType(type: string): NotificationType { // El parámetro type es un string, pero la función garantiza que el valor devuelto será uno de los tipos válidos (NotificationType)
  const allowedTypes: NotificationType[] = ['success', 'error', 'warning', 'info']; // Define un array con los únicos valores aceptados como tipos de notificación
  return allowedTypes.includes(type as NotificationType) ? (type as NotificationType) : 'success'; // Comprueba si el valor recibido (type) está dentro de los tipos permitidos. Si es válido, lo devuelve tal cual (haciendo un type cast). Si no es válido, devuelve 'success' como valor por defecto
}

// ✅ Define la estructura y los tipos de datos que debe tener cada notificación tipo toast en la aplicación
export interface ToastNotification {
  id: string; // Identificador único (usualmente un string generado por timestamp o UUID). Permite distinguir y manipular cada notificación individualmente
  message: string; // Texto que se mostrará al usuario en el toast
  type: NotificationType; // Define el estilo visual y semántico de la notificación. Usa el tipo NotificationType ('success', 'error', 'warning', 'info')
  open: boolean; // Booleano que indica si la notificación está visible. Permite animaciones de entrada/salida y control de ciclo de vida
  duration?: number; // (Opcional) Tiempo en milisegundos que la notificación permanecerá visible antes de cerrarse automáticamente
}

const TOAST_LIMIT = 1; // Limita la cantidad máxima de notificaciones visibles simultáneamente. Solo una notificación a la vez
const TOAST_REMOVE_DELAY = 4000; // Define el tiempo por defecto (en milisegundos) que una notificación permanece visible antes de cerrarse automáticamente. Permanece 4 segundos

// ✅ Hook personalizado de React para gestionar notificaciones tipo "toast" en la aplicación
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]); // Usa un estado para mantener un array de notificaciones activas

  // ✅ Función que permite mostrar una nueva notificación toast en pantalla
  function showNotification(
    message: string, // Texto que se mostrará al usuario
    type: NotificationType = "success", // Tipo de notificación. Por defecto 'success'
    duration = TOAST_REMOVE_DELAY // Tiempo visible en milisegundos, por defecto el valor global TOAST_REMOVE_DELAY
  ) {
    const id = Date.now().toString(); // Genera un id único usando el timestamp actual
    const newNotification: ToastNotification = { id, message, type, open: true, duration }; // Crea un objeto ToastNotification con los datos recibidos y lo marca como visible (open: true)
    setNotifications((prev) => [newNotification, ...prev].slice(0, TOAST_LIMIT)); // Actualiza el estado agregando la nueva notificación al principio del array y limita el número de toasts activos según TOAST_LIMIT

    // Programa el cierre automático de la notificación usando setTimeout, llamando a closeNotification tras el tiempo indicado
    setTimeout(() => {
      closeNotification(id);
    }, duration);
  }

  // ✅ Función que cierra una notificación específica, identificada por su id
  function closeNotification(id: string) {
    // Recorre todas las notificaciones activas. Si encuentra la que coincide con el id, la marca como open: false (esto permite animar la salida visual del toast). Las demás notificaciones permanecen igual
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, open: false } : n))
    );
    // Espera 300 ms (tiempo suficiente para que termine la animación de salida). Elimina la notificación del estado, quitándola completamente del array
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 300);
  }

  // ✅ Función que limpia el array de notificaciones, útil para reiniciar el estado o al navegar entre páginas
  function clearNotifications() {
    setNotifications([]);
  }

  // Devuelve el estado y las funciones de control para usar en componentes
  return { notifications, showNotification, closeNotification, clearNotifications };
};