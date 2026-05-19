import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import type { Group as KonvaGroup } from "konva/lib/Group";

import type { UiFeedback } from "../app/constants";
import {
  createSceneElement,
  type SceneElement,
  type SceneElementStatus,
  type SceneElementType,
  type SceneZoneType
} from "../types/scene";

type UseSceneElementEditorParams = {
  elements: SceneElement[];
  setElements: Dispatch<SetStateAction<SceneElement[]>>;
  selectedElementId: string | null;
  setSelectedElementId: Dispatch<SetStateAction<string | null>>;
  onFeedback: (feedback: UiFeedback) => void;
};

type UseSceneElementEditorResult = {
  selectedElement: SceneElement | null;
  elementsSorted: SceneElement[];
  addElement: (type: SceneElementType) => void;
  updateElementFromNode: (id: string, node: KonvaGroup) => void;
  updateSelectedTransform: (
    patch: Partial<Pick<SceneElement, "x" | "y" | "rotation" | "scaleX" | "scaleY">>
  ) => void;
  updateSelectedLabel: (nextLabel: string) => void;
  updateSelectedColor: (nextColor: string) => void;
  updateSelectedStatus: (nextStatus: SceneElementStatus) => void;
  updateSelectedZoneType: (nextZoneType: SceneZoneType) => void;
  updateSelectedVehicleDimension: (
    dimension: "width" | "height",
    nextValue: number
  ) => void;
  updateSelectedObstacleRadius: (nextValue: number) => void;
  updateSelectedReferenceLength: (nextValue: number) => void;
  bringSelectedToFront: () => void;
  toggleSelectedLocked: () => void;
};

export function useSceneElementEditor({
  elements,
  setElements,
  selectedElementId,
  setSelectedElementId,
  onFeedback
}: UseSceneElementEditorParams): UseSceneElementEditorResult {
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  const elementsSorted = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  const patchElement = useCallback(
    (id: string, updater: (element: SceneElement) => SceneElement) => {
      setElements((prev) =>
        prev.map((element) => (element.id === id ? updater(element) : element))
      );
    },
    [setElements]
  );

  const addElement = useCallback(
    (type: SceneElementType) => {
      const nextElement = createSceneElement(type, elements.length);

      setElements((prev) => [...prev, nextElement]);
      setSelectedElementId(nextElement.id);
    },
    [elements.length, setElements, setSelectedElementId]
  );

  const updateElementFromNode = useCallback(
    (id: string, node: KonvaGroup) => {
      patchElement(id, (element) => ({
        ...element,
        x: Number(node.x().toFixed(2)),
        y: Number(node.y().toFixed(2)),
        rotation: Number(node.rotation().toFixed(2)),
        scaleX: Math.max(0.2, Number(node.scaleX().toFixed(2))),
        scaleY: Math.max(0.2, Number(node.scaleY().toFixed(2))),
        updatedAt: new Date().toISOString()
      }));
    },
    [patchElement]
  );

  const updateSelectedTransform = useCallback(
    (patch: Partial<Pick<SceneElement, "x" | "y" | "rotation" | "scaleX" | "scaleY">>) => {
      if (!selectedElement) {
        return;
      }

      patchElement(selectedElement.id, (element) => ({
        ...element,
        ...patch,
        updatedAt: new Date().toISOString()
      }));
    },
    [patchElement, selectedElement]
  );

  const updateSelectedLabel = useCallback(
    (nextLabel: string) => {
      if (!selectedElement) {
        return;
      }

      patchElement(selectedElement.id, (element) => {
        const updatedAt = new Date().toISOString();

        if (element.type === "vehicle") {
          return {
            ...element,
            properties: {
              ...element.properties,
              label: nextLabel
            },
            updatedAt
          };
        }

        if (element.type === "obstacle") {
          return {
            ...element,
            properties: {
              ...element.properties,
              label: nextLabel
            },
            updatedAt
          };
        }

        return {
          ...element,
          properties: {
            ...element.properties,
            label: nextLabel
          },
          updatedAt
        };
      });
    },
    [patchElement, selectedElement]
  );

  const updateSelectedColor = useCallback(
    (nextColor: string) => {
      if (!selectedElement) {
        return;
      }

      patchElement(selectedElement.id, (element) => {
        const updatedAt = new Date().toISOString();

        if (element.type === "vehicle") {
          return {
            ...element,
            properties: {
              ...element.properties,
              color: nextColor
            },
            updatedAt
          };
        }

        if (element.type === "obstacle") {
          return {
            ...element,
            properties: {
              ...element.properties,
              color: nextColor
            },
            updatedAt
          };
        }

        return {
          ...element,
          properties: {
            ...element.properties,
            color: nextColor
          },
          updatedAt
        };
      });
    },
    [patchElement, selectedElement]
  );

  const updateSelectedStatus = useCallback(
    (nextStatus: SceneElementStatus) => {
      if (!selectedElement) {
        return;
      }

      patchElement(selectedElement.id, (element) => ({
        ...element,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      }));
    },
    [patchElement, selectedElement]
  );

  const updateSelectedZoneType = useCallback(
    (nextZoneType: SceneZoneType) => {
      if (!selectedElement) {
        return;
      }

      patchElement(selectedElement.id, (element) => ({
        ...element,
        zoneType: nextZoneType,
        updatedAt: new Date().toISOString()
      }));
    },
    [patchElement, selectedElement]
  );

  const updateSelectedVehicleDimension = useCallback(
    (dimension: "width" | "height", nextValue: number) => {
      if (!selectedElement || selectedElement.type !== "vehicle") {
        return;
      }

      const safeValue = Math.max(12, nextValue);

      patchElement(selectedElement.id, (element) => {
        if (element.type !== "vehicle") {
          return element;
        }

        return {
          ...element,
          properties: {
            ...element.properties,
            [dimension]: safeValue
          },
          updatedAt: new Date().toISOString()
        };
      });
    },
    [patchElement, selectedElement]
  );

  const updateSelectedObstacleRadius = useCallback(
    (nextValue: number) => {
      if (!selectedElement || selectedElement.type !== "obstacle") {
        return;
      }

      const safeValue = Math.max(8, nextValue);

      patchElement(selectedElement.id, (element) => {
        if (element.type !== "obstacle") {
          return element;
        }

        return {
          ...element,
          properties: {
            ...element.properties,
            radius: safeValue
          },
          updatedAt: new Date().toISOString()
        };
      });
    },
    [patchElement, selectedElement]
  );

  const updateSelectedReferenceLength = useCallback(
    (nextValue: number) => {
      if (!selectedElement || selectedElement.type !== "reference") {
        return;
      }

      const safeValue = Math.max(20, nextValue);

      patchElement(selectedElement.id, (element) => {
        if (element.type !== "reference") {
          return element;
        }

        return {
          ...element,
          properties: {
            ...element.properties,
            length: safeValue
          },
          updatedAt: new Date().toISOString()
        };
      });
    },
    [patchElement, selectedElement]
  );

  const bringSelectedToFront = useCallback(() => {
    if (!selectedElement) {
      onFeedback({ kind: "warning", text: "Selecciona un elemento para enviarlo al frente." });
      return;
    }

    const nextZIndex =
      elements.reduce((maxZIndex, element) => Math.max(maxZIndex, element.zIndex), -1) +
      1;

    patchElement(selectedElement.id, (element) => ({
      ...element,
      zIndex: nextZIndex,
      updatedAt: new Date().toISOString()
    }));

    onFeedback({ kind: "info", text: `Elemento ${selectedElement.id} enviado al frente.` });
  }, [elements, onFeedback, patchElement, selectedElement]);

  const toggleSelectedLocked = useCallback(() => {
    if (!selectedElement) {
      onFeedback({
        kind: "warning",
        text: "Selecciona un elemento para bloquearlo o desbloquearlo."
      });
      return;
    }

    const nextLocked = !selectedElement.locked;

    patchElement(selectedElement.id, (element) => ({
      ...element,
      locked: nextLocked,
      updatedAt: new Date().toISOString()
    }));

    onFeedback({
      kind: "info",
      text: nextLocked ? "Elemento bloqueado." : "Elemento desbloqueado."
    });
  }, [onFeedback, patchElement, selectedElement]);

  return {
    selectedElement,
    elementsSorted,
    addElement,
    updateElementFromNode,
    updateSelectedTransform,
    updateSelectedLabel,
    updateSelectedColor,
    updateSelectedStatus,
    updateSelectedZoneType,
    updateSelectedVehicleDimension,
    updateSelectedObstacleRadius,
    updateSelectedReferenceLength,
    bringSelectedToFront,
    toggleSelectedLocked
  };
}
