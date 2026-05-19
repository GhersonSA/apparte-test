import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

import type { ConfirmDialogState, UiFeedback } from "../app/constants";
import type { SceneElement } from "../types/scene";

type UseSceneDangerActionsParams = {
  elementsCount: number;
  selectedElement: SceneElement | null;
  setElements: Dispatch<SetStateAction<SceneElement[]>>;
  setSelectedElementId: Dispatch<SetStateAction<string | null>>;
  removeKeyframesForElement: (elementId: string) => void;
  resetReplayData: () => void;
  onFeedback: (feedback: UiFeedback) => void;
};

type UseSceneDangerActionsResult = {
  confirmDialog: ConfirmDialogState;
  closeConfirmDialog: () => void;
  confirmDialogAction: () => void;
  removeSelectedElement: (skipConfirmation?: boolean) => void;
  clearScene: (skipConfirmation?: boolean) => void;
};

export function useSceneDangerActions({
  elementsCount,
  selectedElement,
  setElements,
  setSelectedElementId,
  removeKeyframesForElement,
  resetReplayData,
  onFeedback
}: UseSceneDangerActionsParams): UseSceneDangerActionsResult {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);

  const removeElementById = useCallback(
    (elementId: string) => {
      setElements((prev) => prev.filter((element) => element.id !== elementId));
      removeKeyframesForElement(elementId);
      setSelectedElementId((prev) => (prev === elementId ? null : prev));
      onFeedback({ kind: "info", text: "Elemento eliminado de la escena." });
    },
    [onFeedback, removeKeyframesForElement, setElements, setSelectedElementId]
  );

  const clearSceneData = useCallback(() => {
    setElements([]);
    setSelectedElementId(null);
    resetReplayData();
    onFeedback({ kind: "info", text: "Escena reiniciada correctamente." });
  }, [onFeedback, resetReplayData, setElements, setSelectedElementId]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const confirmDialogAction = useCallback(() => {
    if (!confirmDialog) {
      return;
    }

    if (confirmDialog.kind === "remove-selected") {
      removeElementById(confirmDialog.elementId);
    } else {
      clearSceneData();
    }

    closeConfirmDialog();
  }, [clearSceneData, closeConfirmDialog, confirmDialog, removeElementById]);

  const removeSelectedElement = useCallback(
    (skipConfirmation = false) => {
      if (!selectedElement) {
        onFeedback({ kind: "warning", text: "No hay un elemento seleccionado para eliminar." });
        return;
      }

      if (!skipConfirmation) {
        setConfirmDialog({
          kind: "remove-selected",
          elementId: selectedElement.id,
          elementLabel: selectedElement.properties.label
        });
        return;
      }

      removeElementById(selectedElement.id);
    },
    [onFeedback, removeElementById, selectedElement]
  );

  const clearScene = useCallback(
    (skipConfirmation = false) => {
      if (elementsCount === 0) {
        onFeedback({ kind: "warning", text: "La escena ya esta vacia." });
        return;
      }

      if (!skipConfirmation) {
        setConfirmDialog({ kind: "clear-scene", elementsCount });
        return;
      }

      clearSceneData();
    },
    [clearSceneData, elementsCount, onFeedback]
  );

  return {
    confirmDialog,
    closeConfirmDialog,
    confirmDialogAction,
    removeSelectedElement,
    clearScene
  };
}
