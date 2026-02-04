import { useEffect, useState } from 'react';

export interface ToastItem {
  id: number;
  todoId: number;
  message: string;
}

interface ToastProps {
  toast: ToastItem;
  onUndo: (toast: ToastItem) => void;
  onDismiss: (toastId: number) => void;
  duration?: number;
}

export default function Toast({ toast, onUndo, onDismiss, duration = 5000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  function handleAnimationEnd() {
    if (exiting) {
      onDismiss(toast.id);
    }
  }

  function handleUndo() {
    onUndo(toast);
  }

  return (
    <div
      className={`toast${exiting ? ' toast--exit' : ''}`}
      role="alert"
      onAnimationEnd={handleAnimationEnd}
      data-testid={`toast-${toast.id}`}
    >
      <span className="toast-message">{toast.message}</span>
      <button
        type="button"
        className="toast-undo-btn"
        onClick={handleUndo}
        aria-label="Undo delete"
      >
        Undo
      </button>
    </div>
  );
}
