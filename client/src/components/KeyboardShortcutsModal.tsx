import { useEffect, useRef } from 'react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'n', description: 'Focus add todo input' },
  { key: '/', description: 'Focus search input' },
  { key: 'Escape', description: 'Blur focused input' },
];

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleClose() {
      onClose();
    }
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="shortcuts-modal" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal-content">
        <div className="shortcuts-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button type="button" className="shortcuts-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <ul className="shortcuts-list">
          {shortcuts.map((s) => (
            <li key={s.key} className="shortcuts-list-item">
              <kbd>{s.key}</kbd>
              <span>{s.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
