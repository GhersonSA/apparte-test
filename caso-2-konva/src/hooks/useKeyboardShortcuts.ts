import { useEffect, type MutableRefObject } from "react";

import type { ConfirmDialogState } from "../app/constants";
import { isTypingTarget } from "../app/replayUtils";

export type ShortcutActions = {
  removeSelectedElement: (skipConfirmation?: boolean) => void;
  saveDraftToLocalStorage: () => void;
  loadDraftFromLocalStorage: (silentWhenMissing?: boolean) => void;
  exportSceneJson: () => void;
  exportReplayVideo: () => void;
  playReplay: () => void;
  stopReplay: (notify?: boolean) => void;
};

type UseKeyboardShortcutsParams = {
  shortcutActionsRef: MutableRefObject<ShortcutActions>;
  replayRunningRef: MutableRefObject<boolean>;
  confirmDialogRef: MutableRefObject<ConfirmDialogState>;
  onCloseConfirmDialog: () => void;
};

export function useKeyboardShortcuts({
  shortcutActionsRef,
  replayRunningRef,
  confirmDialogRef,
  onCloseConfirmDialog
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        shortcutActionsRef.current.removeSelectedElement(true);
        return;
      }

      if (ctrlOrMeta && key === "s") {
        event.preventDefault();
        shortcutActionsRef.current.saveDraftToLocalStorage();
        return;
      }

      if (ctrlOrMeta && key === "e") {
        event.preventDefault();
        shortcutActionsRef.current.exportSceneJson();
        return;
      }

      if (ctrlOrMeta && event.shiftKey && key === "v") {
        event.preventDefault();
        shortcutActionsRef.current.exportReplayVideo();
        return;
      }

      if (ctrlOrMeta && key === "l") {
        event.preventDefault();
        shortcutActionsRef.current.loadDraftFromLocalStorage(false);
        return;
      }

      if (ctrlOrMeta && key === "p") {
        event.preventDefault();

        if (replayRunningRef.current) {
          shortcutActionsRef.current.stopReplay(true);
        } else {
          shortcutActionsRef.current.playReplay();
        }
        return;
      }

      if (key === "escape" && confirmDialogRef.current) {
        event.preventDefault();
        onCloseConfirmDialog();
        return;
      }

      if (key === "escape" && replayRunningRef.current) {
        event.preventDefault();
        shortcutActionsRef.current.stopReplay(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmDialogRef, onCloseConfirmDialog, replayRunningRef, shortcutActionsRef]);
}
