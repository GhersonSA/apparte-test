import { useCallback } from "react";

import { DRAFT_STORAGE_KEY, type UiFeedback } from "../app/constants";
import {
  buildSceneExportPayload,
  hydrateSceneSnapshot,
  validateSceneSnapshot
} from "../app/scenePersistence";
import type { SceneSnapshot } from "../types/scene";

type UseScenePersistenceActionsParams = {
  sceneSnapshot: SceneSnapshot;
  onFeedback: (feedback: UiFeedback) => void;
  onSnapshotLoaded: (snapshot: SceneSnapshot) => void;
};

type UseScenePersistenceActionsResult = {
  saveDraftToLocalStorage: () => void;
  loadDraftFromLocalStorage: (silentWhenMissing?: boolean) => void;
  clearDraftFromLocalStorage: () => void;
  exportSceneJson: () => void;
};

export function useScenePersistenceActions({
  sceneSnapshot,
  onFeedback,
  onSnapshotLoaded
}: UseScenePersistenceActionsParams): UseScenePersistenceActionsResult {
  const saveDraftToLocalStorage = useCallback(() => {
    const issues = validateSceneSnapshot(sceneSnapshot);

    if (issues.length > 0) {
      onFeedback({
        kind: "error",
        text: `No se pudo guardar borrador: ${issues[0]}`
      });
      return;
    }

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(sceneSnapshot));
      onFeedback({ kind: "success", text: "Borrador guardado en localStorage." });
    } catch {
      onFeedback({
        kind: "error",
        text: "No se pudo guardar el borrador en localStorage."
      });
    }
  }, [onFeedback, sceneSnapshot]);

  const loadDraftFromLocalStorage = useCallback(
    (silentWhenMissing = false) => {
      try {
        const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

        if (!rawDraft) {
          if (!silentWhenMissing) {
            onFeedback({ kind: "warning", text: "No hay borrador guardado." });
          }
          return;
        }

        const parsedDraft: unknown = JSON.parse(rawDraft);
        const hydratedSnapshot = hydrateSceneSnapshot(parsedDraft);

        if (!hydratedSnapshot) {
          onFeedback({
            kind: "error",
            text: "El borrador guardado es invalido y no se puede cargar."
          });
          return;
        }

        const issues = validateSceneSnapshot(hydratedSnapshot);

        if (issues.length > 0) {
          onFeedback({
            kind: "error",
            text: `El borrador no paso validacion: ${issues[0]}`
          });
          return;
        }

        onSnapshotLoaded(hydratedSnapshot);
        onFeedback({ kind: "success", text: "Borrador cargado correctamente." });
      } catch {
        onFeedback({
          kind: "error",
          text: "No se pudo cargar el borrador desde localStorage."
        });
      }
    },
    [onFeedback, onSnapshotLoaded]
  );

  const clearDraftFromLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      onFeedback({ kind: "success", text: "Borrador local eliminado." });
    } catch {
      onFeedback({
        kind: "error",
        text: "No se pudo eliminar el borrador local."
      });
    }
  }, [onFeedback]);

  const exportSceneJson = useCallback(() => {
    const issues = validateSceneSnapshot(sceneSnapshot);

    if (issues.length > 0) {
      onFeedback({
        kind: "error",
        text: `No se pudo exportar JSON: ${issues[0]}`
      });
      return;
    }

    const exportPayload = buildSceneExportPayload(sceneSnapshot);

    try {
      const serializedExport = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([serializedExport], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");

      anchor.href = url;
      anchor.download = `case2-scene-${stamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      onFeedback({ kind: "success", text: "Escena exportada a JSON correctamente." });
    } catch {
      onFeedback({
        kind: "error",
        text: "Ocurrio un error al generar el archivo JSON."
      });
    }
  }, [onFeedback, sceneSnapshot]);

  return {
    saveDraftToLocalStorage,
    loadDraftFromLocalStorage,
    clearDraftFromLocalStorage,
    exportSceneJson
  };
}
