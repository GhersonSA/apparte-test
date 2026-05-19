import { useEffect, useRef } from "react";

import type { ConfirmDialogState } from "../app/constants";

type ConfirmDialogProps = {
  dialog: ConfirmDialogState;
  onCancel: () => void;
  onConfirm: () => void;
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled"));
}

function ConfirmDialog({ dialog, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!dialog) {
      return;
    }

    const modalNode = dialogRef.current;

    if (!modalNode) {
      return;
    }

    previousFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const focusableElements = getFocusableElements(modalNode);
    (focusableElements[0] ?? modalNode).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusableElements = getFocusableElements(modalNode);

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        modalNode.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const isActiveInsideModal = activeElement ? modalNode.contains(activeElement) : false;

      if (event.shiftKey) {
        if (!isActiveInsideModal || activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!isActiveInsideModal || activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    modalNode.addEventListener("keydown", handleKeyDown);

    return () => {
      modalNode.removeEventListener("keydown", handleKeyDown);

      if (previousFocusedElementRef.current?.isConnected) {
        previousFocusedElementRef.current.focus();
      }
    };
  }, [dialog, onCancel]);

  if (!dialog) {
    return null;
  }

  return (
    <div className="confirm-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="confirm-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="confirm-modal__title">
          {dialog.kind === "remove-selected" ? "Eliminar elemento" : "Limpiar escena"}
        </h3>

        <p className="confirm-modal__message">
          {dialog.kind === "remove-selected"
            ? `Se eliminara "${dialog.elementLabel}" (${dialog.elementId}). Esta accion no se puede deshacer.`
            : `Se eliminaran ${dialog.elementsCount} elementos de la escena. Esta accion no se puede deshacer.`}
        </p>

        <div className="confirm-modal__actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancelar
          </button>

          <button type="button" className="btn danger" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
