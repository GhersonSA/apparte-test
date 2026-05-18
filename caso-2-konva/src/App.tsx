import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type { Group as KonvaGroup } from "konva/lib/Group";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";

import {
  createSceneElement,
  type SceneElement,
  type SceneElementStatus,
  type SceneMeta,
  type SceneElementType,
  type SceneZoneType,
  type SceneSnapshot
} from "./types/scene";

const GRID_SIZE = 40;
const SCENE_BACKGROUND = "#111827";
const DRAFT_STORAGE_KEY = "case2-scene-draft-v4";
const FEEDBACK_TIMEOUT_MS = 2600;
const REPLAY_SEGMENT_MS = 1200;
const KEYFRAME_SLOTS = ["T1", "T2", "T3", "T4", "T5"] as const;

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const defaultStatusByType: Record<SceneElementType, SceneElementStatus> = {
  vehicle: "free",
  obstacle: "occupied",
  reference: "free"
};

const defaultZoneByType: Record<SceneElementType, SceneZoneType> = {
  vehicle: "vehicle-zone",
  obstacle: "obstacle-zone",
  reference: "reference-zone"
};

type SceneExportPayload = {
  version: 4;
  generatedAt: string;
  selectedElementId: string | null;
  meta: SceneMeta;
  elements: Array<{
    id: string;
    type: SceneElementType;
    status: SceneElementStatus;
    zoneType: SceneZoneType;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    zIndex: number;
    locked: boolean;
    properties: SceneElement["properties"];
  }>;
};

type UiFeedback = {
  kind: "success" | "error" | "info" | "warning";
  text: string;
};

type KeyframeSlot = (typeof KEYFRAME_SLOTS)[number];

type ElementKeyframe = {
  slot: KeyframeSlot;
  capturedAt: string;
  element: SceneElement;
};

type KeyframesByElement = Record<string, Partial<Record<KeyframeSlot, ElementKeyframe>>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSceneElementType(value: unknown): value is SceneElementType {
  return value === "vehicle" || value === "obstacle" || value === "reference";
}

function isSceneElementStatus(value: unknown): value is SceneElementStatus {
  return value === "free" || value === "occupied";
}

function isSceneZoneType(value: unknown): value is SceneZoneType {
  return (
    value === "vehicle-zone" ||
    value === "obstacle-zone" ||
    value === "reference-zone"
  );
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function toHexColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value) ? value : fallback;
}

function toIsoDate(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function hydrateSceneElement(rawElement: unknown): SceneElement | null {
  if (!isRecord(rawElement)) {
    return null;
  }

  const type = rawElement.type;

  if (!isSceneElementType(type)) {
    return null;
  }

  const now = new Date().toISOString();
  const rawProperties = isRecord(rawElement.properties) ? rawElement.properties : {};

  const baseElement = {
    id: toString(rawElement.id, createSceneElement(type, 0).id),
    type,
    status: isSceneElementStatus(rawElement.status)
      ? rawElement.status
      : defaultStatusByType[type],
    zoneType: isSceneZoneType(rawElement.zoneType)
      ? rawElement.zoneType
      : defaultZoneByType[type],
    x: toNumber(rawElement.x, 0),
    y: toNumber(rawElement.y, 0),
    rotation: toNumber(rawElement.rotation, 0),
    scaleX: Math.max(0.2, toNumber(rawElement.scaleX, 1)),
    scaleY: Math.max(0.2, toNumber(rawElement.scaleY, 1)),
    zIndex: Math.round(toNumber(rawElement.zIndex, 0)),
    locked: Boolean(rawElement.locked),
    createdAt: toIsoDate(rawElement.createdAt, now),
    updatedAt: toIsoDate(rawElement.updatedAt, now)
  };

  if (type === "vehicle") {
    return {
      ...baseElement,
      type,
      properties: {
        label: toString(rawProperties.label, "Vehiculo"),
        color: toHexColor(rawProperties.color, "#38bdf8"),
        width: Math.max(12, toNumber(rawProperties.width, 76)),
        height: Math.max(12, toNumber(rawProperties.height, 36))
      }
    };
  }

  if (type === "obstacle") {
    return {
      ...baseElement,
      type,
      properties: {
        label: toString(rawProperties.label, "Obstaculo"),
        color: toHexColor(rawProperties.color, "#f97316"),
        radius: Math.max(8, toNumber(rawProperties.radius, 17))
      }
    };
  }

  return {
    ...baseElement,
    type,
    properties: {
      label: toString(rawProperties.label, "Referencia"),
      color: toHexColor(rawProperties.color, "#22c55e"),
      length: Math.max(20, toNumber(rawProperties.length, 90))
    }
  };
}

function hydrateSceneSnapshot(rawSnapshot: unknown): SceneSnapshot | null {
  if (!isRecord(rawSnapshot) || !Array.isArray(rawSnapshot.elements)) {
    return null;
  }

  const rawMeta = isRecord(rawSnapshot.meta) ? rawSnapshot.meta : {};
  const hydratedElements = rawSnapshot.elements
    .map((rawElement) => hydrateSceneElement(rawElement))
    .filter((element): element is SceneElement => element !== null);

  if (hydratedElements.length !== rawSnapshot.elements.length) {
    return null;
  }

  const selectedElementId =
    typeof rawSnapshot.selectedElementId === "string"
      ? rawSnapshot.selectedElementId
      : null;

  return {
    version: 4,
    generatedAt: toIsoDate(rawSnapshot.generatedAt, new Date().toISOString()),
    selectedElementId: hydratedElements.some((element) => element.id === selectedElementId)
      ? selectedElementId
      : null,
    meta: {
      canvasWidth: Math.max(1, toNumber(rawMeta.canvasWidth, 960)),
      canvasHeight: Math.max(1, toNumber(rawMeta.canvasHeight, 580)),
      gridSize: Math.max(1, toNumber(rawMeta.gridSize, GRID_SIZE)),
      background: toString(rawMeta.background, SCENE_BACKGROUND)
    },
    elements: hydratedElements
  };
}

function validateSceneSnapshot(snapshot: SceneSnapshot) {
  const issues: string[] = [];

  if (snapshot.elements.length === 0) {
    issues.push("La escena no tiene elementos para exportar.");
  }

  snapshot.elements.forEach((element, index) => {
    if (!element.id) {
      issues.push(`Elemento ${index + 1} sin id.`);
    }

    if (!Number.isFinite(element.x) || !Number.isFinite(element.y)) {
      issues.push(`Elemento ${element.id} con posicion invalida.`);
    }

    if (!isSceneElementStatus(element.status)) {
      issues.push(`Elemento ${element.id} con estado invalido.`);
    }

    if (!isSceneZoneType(element.zoneType)) {
      issues.push(`Elemento ${element.id} con zona invalida.`);
    }

    if (element.type === "vehicle") {
      if (element.properties.width <= 0 || element.properties.height <= 0) {
        issues.push(`Elemento ${element.id} con dimensiones invalidas.`);
      }
      return;
    }

    if (element.type === "obstacle") {
      if (element.properties.radius <= 0) {
        issues.push(`Elemento ${element.id} con radio invalido.`);
      }
      return;
    }

    if (element.properties.length <= 0) {
      issues.push(`Elemento ${element.id} con longitud invalida.`);
    }
  });

  return issues;
}

function buildSceneExportPayload(snapshot: SceneSnapshot): SceneExportPayload {
  return {
    version: 4,
    generatedAt: snapshot.generatedAt,
    selectedElementId: snapshot.selectedElementId,
    meta: snapshot.meta,
    elements: snapshot.elements.map((element) => ({
      id: element.id,
      type: element.type,
      status: element.status,
      zoneType: element.zoneType,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      zIndex: element.zIndex,
      locked: element.locked,
      properties: element.properties
    }))
  };
}

const toolbarOptions: Array<{ type: SceneElementType; label: string }> = [
  { type: "vehicle", label: "Vehiculo" },
  { type: "obstacle", label: "Obstaculo" },
  { type: "reference", label: "Referencia" }
];

function renderElementShape(element: SceneElement) {
  if (element.type === "vehicle") {
    const { color, height, label, width } = element.properties;

    return (
      <>
        <Rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          cornerRadius={8}
          fill={color}
          stroke="#0f172a"
          strokeWidth={2}
          shadowColor="rgba(0, 0, 0, 0.45)"
          shadowBlur={8}
          shadowOffset={{ x: 0, y: 3 }}
        />
        <Rect
          x={-width / 4}
          y={-height / 2 + 6}
          width={width / 2}
          height={height - 12}
          cornerRadius={6}
          fill="rgba(255, 255, 255, 0.28)"
        />
        <Text
          text={label}
          x={-width / 2}
          y={height / 2 + 4}
          width={width}
          align="center"
          fontSize={12}
          fill="#e2e8f0"
        />
      </>
    );
  }

  if (element.type === "obstacle") {
    const { color, label, radius } = element.properties;

    return (
      <>
        <Circle
          radius={radius}
          fill={color}
          stroke="#0f172a"
          strokeWidth={2}
          shadowColor="rgba(0, 0, 0, 0.35)"
          shadowBlur={6}
          shadowOffset={{ x: 0, y: 2 }}
        />
        <Text
          text={label}
          x={-radius}
          y={radius + 4}
          width={radius * 2}
          align="center"
          fontSize={11}
          fill="#e2e8f0"
        />
      </>
    );
  }

  const { color, label, length } = element.properties;

  return (
    <>
      <Line
        points={[-length / 2, 0, length / 2, 0]}
        stroke={color}
        strokeWidth={3}
        dash={[12, 7]}
      />
      <Line points={[0, -length / 3, 0, length / 3]} stroke={color} strokeWidth={2} />
      <Text
        text={label}
        x={-length / 2}
        y={8}
        width={length}
        align="center"
        fontSize={11}
        fill="#e2e8f0"
      />
    </>
  );
}

function renderSelectionOutline(element: SceneElement) {
  if (element.type === "vehicle") {
    const { width, height } = element.properties;

    return (
      <Rect
        x={-width / 2 - 6}
        y={-height / 2 - 6}
        width={width + 12}
        height={height + 12}
        cornerRadius={12}
        stroke="#22c55e"
        strokeWidth={2}
        dash={[6, 4]}
      />
    );
  }

  if (element.type === "obstacle") {
    return (
      <Circle
        radius={element.properties.radius + 8}
        stroke="#22c55e"
        strokeWidth={2}
        dash={[6, 4]}
      />
    );
  }

  return (
    <Rect
      x={-element.properties.length / 2 - 10}
      y={-12}
      width={element.properties.length + 20}
      height={24}
      cornerRadius={8}
      stroke="#22c55e"
      strokeWidth={2}
      dash={[6, 4]}
    />
  );
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cloneSceneElements(elements: SceneElement[]) {
  if (typeof structuredClone === "function") {
    return structuredClone(elements) as SceneElement[];
  }

  return JSON.parse(JSON.stringify(elements)) as SceneElement[];
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function interpolateElementsForReplay(
  fromElements: SceneElement[],
  toElements: SceneElement[],
  progress: number
): SceneElement[] {
  const toById = new Map(toElements.map((element) => [element.id, element]));
  const now = new Date().toISOString();

  return fromElements
    .map((fromElement) => {
      const toElement = toById.get(fromElement.id);

      if (!toElement) {
        return fromElement;
      }

      if (fromElement.type === "vehicle" && toElement.type === "vehicle") {
        return {
          ...fromElement,
          x: Number(lerp(fromElement.x, toElement.x, progress).toFixed(2)),
          y: Number(lerp(fromElement.y, toElement.y, progress).toFixed(2)),
          rotation: Number(lerp(fromElement.rotation, toElement.rotation, progress).toFixed(2)),
          scaleX: Number(lerp(fromElement.scaleX, toElement.scaleX, progress).toFixed(2)),
          scaleY: Number(lerp(fromElement.scaleY, toElement.scaleY, progress).toFixed(2)),
          zIndex: progress < 1 ? fromElement.zIndex : toElement.zIndex,
          locked: progress < 1 ? fromElement.locked : toElement.locked,
          status: progress < 1 ? fromElement.status : toElement.status,
          zoneType: progress < 1 ? fromElement.zoneType : toElement.zoneType,
          properties: progress < 1 ? fromElement.properties : toElement.properties,
          updatedAt: now
        };
      }

      if (fromElement.type === "obstacle" && toElement.type === "obstacle") {
        return {
          ...fromElement,
          x: Number(lerp(fromElement.x, toElement.x, progress).toFixed(2)),
          y: Number(lerp(fromElement.y, toElement.y, progress).toFixed(2)),
          rotation: Number(lerp(fromElement.rotation, toElement.rotation, progress).toFixed(2)),
          scaleX: Number(lerp(fromElement.scaleX, toElement.scaleX, progress).toFixed(2)),
          scaleY: Number(lerp(fromElement.scaleY, toElement.scaleY, progress).toFixed(2)),
          zIndex: progress < 1 ? fromElement.zIndex : toElement.zIndex,
          locked: progress < 1 ? fromElement.locked : toElement.locked,
          status: progress < 1 ? fromElement.status : toElement.status,
          zoneType: progress < 1 ? fromElement.zoneType : toElement.zoneType,
          properties: progress < 1 ? fromElement.properties : toElement.properties,
          updatedAt: now
        };
      }

      if (fromElement.type === "reference" && toElement.type === "reference") {
        return {
          ...fromElement,
          x: Number(lerp(fromElement.x, toElement.x, progress).toFixed(2)),
          y: Number(lerp(fromElement.y, toElement.y, progress).toFixed(2)),
          rotation: Number(lerp(fromElement.rotation, toElement.rotation, progress).toFixed(2)),
          scaleX: Number(lerp(fromElement.scaleX, toElement.scaleX, progress).toFixed(2)),
          scaleY: Number(lerp(fromElement.scaleY, toElement.scaleY, progress).toFixed(2)),
          zIndex: progress < 1 ? fromElement.zIndex : toElement.zIndex,
          locked: progress < 1 ? fromElement.locked : toElement.locked,
          status: progress < 1 ? fromElement.status : toElement.status,
          zoneType: progress < 1 ? fromElement.zoneType : toElement.zoneType,
          properties: progress < 1 ? fromElement.properties : toElement.properties,
          updatedAt: now
        };
      }

      return fromElement;
    })
    .sort((a, b) => a.zIndex - b.zIndex);
}

function formatKeyframeTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function App() {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<KonvaTransformer | null>(null);
  const elementNodeRefs = useRef<Record<string, KonvaGroup | null>>({});
  const replayFrameRef = useRef<number | null>(null);
  const replayCancelledRef = useRef(false);
  const replayRunningRef = useRef(false);
  const shortcutActionsRef = useRef<{
    removeSelectedElement: (skipConfirmation?: boolean) => void;
    saveDraftToLocalStorage: () => void;
    loadDraftFromLocalStorage: (silentWhenMissing?: boolean) => void;
    exportSceneJson: () => void;
    playReplay: () => void;
    stopReplay: (notify?: boolean) => void;
  }>({
    removeSelectedElement: () => undefined,
    saveDraftToLocalStorage: () => undefined,
    loadDraftFromLocalStorage: () => undefined,
    exportSceneJson: () => undefined,
    playReplay: () => undefined,
    stopReplay: () => undefined
  });

  const [selectedType, setSelectedType] = useState<SceneElementType>("vehicle");
  const [elements, setElements] = useState<SceneElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 960, height: 580 });
  const [uiFeedback, setUiFeedback] = useState<UiFeedback | null>(null);
  const [keyframesByElement, setKeyframesByElement] = useState<KeyframesByElement>({});
  const [isReplayRunning, setIsReplayRunning] = useState(false);
  const [activeReplaySegment, setActiveReplaySegment] = useState<string | null>(null);

  replayRunningRef.current = isReplayRunning;

  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) {
      return;
    }

    const updateSize = () => {
      const nextWidth = Math.max(320, Math.floor(container.clientWidth));
      const computedHeight = Math.floor(nextWidth * 0.62);
      const nextHeight = Math.max(360, Math.min(640, computedHeight));

      setStageSize({ width: nextWidth, height: nextHeight });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    loadDraftFromLocalStorage(true);
  }, []);

  useEffect(() => {
    if (!uiFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setUiFeedback(null);
    }, FEEDBACK_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [uiFeedback]);

  useEffect(() => {
    return () => {
      if (replayFrameRef.current !== null) {
        window.cancelAnimationFrame(replayFrameRef.current);
      }
    };
  }, []);

  const sceneMeta = useMemo<SceneMeta>(
    () => ({
      canvasWidth: stageSize.width,
      canvasHeight: stageSize.height,
      gridSize: GRID_SIZE,
      background: SCENE_BACKGROUND
    }),
    [stageSize]
  );

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  const elementsSorted = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  const selectedKeyframes = useMemo<Partial<Record<KeyframeSlot, ElementKeyframe>>>(
    () => (selectedElementId ? keyframesByElement[selectedElementId] ?? {} : {}),
    [keyframesByElement, selectedElementId]
  );

  const selectedKeyframesCount = useMemo(
    () => KEYFRAME_SLOTS.filter((slot) => Boolean(selectedKeyframes[slot])).length,
    [selectedKeyframes]
  );

  const keyframeTransitions = useMemo<Array<[KeyframeSlot, KeyframeSlot]>>(
    () =>
      KEYFRAME_SLOTS.slice(0, -1).map((slot, index) => [
        slot,
        KEYFRAME_SLOTS[index + 1]
      ] as [KeyframeSlot, KeyframeSlot]),
    []
  );

  const replayReadyElementIds = useMemo(
    () =>
      Object.entries(keyframesByElement)
        .filter(([, timeline]) =>
          keyframeTransitions.some(([fromSlot, toSlot]) =>
            Boolean(timeline[fromSlot] && timeline[toSlot])
          )
        )
        .map(([elementId]) => elementId),
    [keyframeTransitions, keyframesByElement]
  );

  useEffect(() => {
    const currentIds = new Set(elements.map((element) => element.id));

    Object.keys(elementNodeRefs.current).forEach((id) => {
      if (!currentIds.has(id)) {
        delete elementNodeRefs.current[id];
      }
    });
  }, [elements]);

  useLayoutEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer) {
      return;
    }

    if (!selectedElement || selectedElement.locked) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = elementNodeRefs.current[selectedElement.id];

    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [selectedElement, elementsSorted]);

  const sceneSnapshot = useMemo<SceneSnapshot>(
    () => ({
      version: 4,
      generatedAt: new Date().toISOString(),
      selectedElementId,
      meta: sceneMeta,
      elements
    }),
    [elements, sceneMeta, selectedElementId]
  );

  const jsonPreview = useMemo(
    () => JSON.stringify(sceneSnapshot, null, 2),
    [sceneSnapshot]
  );

  function addElement(type: SceneElementType) {
    const nextElement = createSceneElement(type, elements.length);

    setElements((prev) => [...prev, nextElement]);
    setSelectedElementId(nextElement.id);
  }

  function patchElement(
    id: string,
    updater: (element: SceneElement) => SceneElement
  ) {
    setElements((prev) =>
      prev.map((element) => (element.id === id ? updater(element) : element))
    );
  }

  function updateElementFromNode(id: string, node: KonvaGroup) {
    patchElement(id, (element) => ({
      ...element,
      x: Number(node.x().toFixed(2)),
      y: Number(node.y().toFixed(2)),
      rotation: Number(node.rotation().toFixed(2)),
      scaleX: Math.max(0.2, Number(node.scaleX().toFixed(2))),
      scaleY: Math.max(0.2, Number(node.scaleY().toFixed(2))),
      updatedAt: new Date().toISOString()
    }));
  }

  function updateSelectedTransform(
    patch: Partial<Pick<SceneElement, "x" | "y" | "rotation" | "scaleX" | "scaleY">>
  ) {
    if (!selectedElement) {
      return;
    }

    patchElement(selectedElement.id, (element) => ({
      ...element,
      ...patch,
      updatedAt: new Date().toISOString()
    }));
  }

  function updateSelectedLabel(nextLabel: string) {
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
  }

  function updateSelectedColor(nextColor: string) {
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
  }

  function updateSelectedStatus(nextStatus: SceneElementStatus) {
    if (!selectedElement) {
      return;
    }

    patchElement(selectedElement.id, (element) => ({
      ...element,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    }));
  }

  function updateSelectedZoneType(nextZoneType: SceneZoneType) {
    if (!selectedElement) {
      return;
    }

    patchElement(selectedElement.id, (element) => ({
      ...element,
      zoneType: nextZoneType,
      updatedAt: new Date().toISOString()
    }));
  }

  function updateSelectedVehicleDimension(
    dimension: "width" | "height",
    nextValue: number
  ) {
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
  }

  function updateSelectedObstacleRadius(nextValue: number) {
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
  }

  function updateSelectedReferenceLength(nextValue: number) {
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
  }

  function bringSelectedToFront() {
    if (!selectedElement) {
      setUiFeedback({ kind: "warning", text: "Selecciona un elemento para enviarlo al frente." });
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

    setUiFeedback({ kind: "info", text: `Elemento ${selectedElement.id} enviado al frente.` });
  }

  function toggleSelectedLocked() {
    if (!selectedElement) {
      setUiFeedback({ kind: "warning", text: "Selecciona un elemento para bloquearlo o desbloquearlo." });
      return;
    }

    const nextLocked = !selectedElement.locked;

    patchElement(selectedElement.id, (element) => ({
      ...element,
      locked: nextLocked,
      updatedAt: new Date().toISOString()
    }));

    setUiFeedback({
      kind: "info",
      text: nextLocked ? "Elemento bloqueado." : "Elemento desbloqueado."
    });
  }

  function removeSelectedElement(skipConfirmation = false) {
    if (!selectedElement) {
      setUiFeedback({ kind: "warning", text: "No hay un elemento seleccionado para eliminar." });
      return;
    }

    if (!skipConfirmation) {
      const confirmed = window.confirm(
        "Se eliminara el elemento seleccionado. Esta accion no se puede deshacer."
      );

      if (!confirmed) {
        return;
      }
    }

    setElements((prev) => prev.filter((element) => element.id !== selectedElement.id));
    setKeyframesByElement((prev) => {
      const next = { ...prev };
      delete next[selectedElement.id];
      return next;
    });
    setSelectedElementId(null);
    setUiFeedback({ kind: "info", text: "Elemento eliminado de la escena." });
  }

  function clearScene(skipConfirmation = false) {
    if (elements.length === 0) {
      setUiFeedback({ kind: "warning", text: "La escena ya esta vacia." });
      return;
    }

    if (!skipConfirmation) {
      const confirmed = window.confirm(
        "Se eliminaran todos los elementos de la escena. Esta accion no se puede deshacer."
      );

      if (!confirmed) {
        return;
      }
    }

    setElements([]);
    setKeyframesByElement({});
    setSelectedElementId(null);
    setActiveReplaySegment(null);
    setUiFeedback({ kind: "info", text: "Escena reiniciada correctamente." });
  }

  function saveDraftToLocalStorage() {
    const issues = validateSceneSnapshot(sceneSnapshot);

    if (issues.length > 0) {
      setUiFeedback({
        kind: "error",
        text: `No se pudo guardar borrador: ${issues[0]}`
      });
      return;
    }

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(sceneSnapshot));
      setUiFeedback({ kind: "success", text: "Borrador guardado en localStorage." });
    } catch {
      setUiFeedback({
        kind: "error",
        text: "No se pudo guardar el borrador en localStorage."
      });
    }
  }

  function loadDraftFromLocalStorage(silentWhenMissing = false) {
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

      if (!rawDraft) {
        if (!silentWhenMissing) {
          setUiFeedback({ kind: "warning", text: "No hay borrador guardado." });
        }
        return;
      }

      const parsedDraft: unknown = JSON.parse(rawDraft);
      const hydratedSnapshot = hydrateSceneSnapshot(parsedDraft);

      if (!hydratedSnapshot) {
        setUiFeedback({
          kind: "error",
          text: "El borrador guardado es invalido y no se puede cargar."
        });
        return;
      }

      const issues = validateSceneSnapshot(hydratedSnapshot);

      if (issues.length > 0) {
        setUiFeedback({
          kind: "error",
          text: `El borrador no paso validacion: ${issues[0]}`
        });
        return;
      }

      setElements(hydratedSnapshot.elements);
      setKeyframesByElement({});
      setSelectedElementId(hydratedSnapshot.selectedElementId);
      setActiveReplaySegment(null);
      setUiFeedback({ kind: "success", text: "Borrador cargado correctamente." });
    } catch {
      setUiFeedback({
        kind: "error",
        text: "No se pudo cargar el borrador desde localStorage."
      });
    }
  }

  function clearDraftFromLocalStorage() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setUiFeedback({ kind: "success", text: "Borrador local eliminado." });
    } catch {
      setUiFeedback({
        kind: "error",
        text: "No se pudo eliminar el borrador local."
      });
    }
  }

  function exportSceneJson() {
    const issues = validateSceneSnapshot(sceneSnapshot);

    if (issues.length > 0) {
      setUiFeedback({
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

      setUiFeedback({ kind: "success", text: "Escena exportada a JSON correctamente." });
    } catch {
      setUiFeedback({
        kind: "error",
        text: "Ocurrio un error al generar el archivo JSON."
      });
    }
  }

  function captureKeyframe(slot: KeyframeSlot) {
    if (!selectedElement) {
      setUiFeedback({
        kind: "warning",
        text: `Selecciona un objeto para guardar ${slot}.`
      });
      return;
    }

    const selectedElementSnapshot = cloneSceneElements([selectedElement])[0];

    setKeyframesByElement((prev) => ({
      ...prev,
      [selectedElement.id]: {
        ...(prev[selectedElement.id] ?? {}),
        [slot]: {
          slot,
          capturedAt: new Date().toISOString(),
          element: selectedElementSnapshot
        }
      }
    }));

    setUiFeedback({ kind: "success", text: `Keyframe ${slot} guardado para ${selectedElement.id}.` });
  }

  function clearKeyframes() {
    if (!selectedElement) {
      setUiFeedback({ kind: "warning", text: "Selecciona un objeto para limpiar su timeline." });
      return;
    }

    if (selectedKeyframesCount === 0) {
      setUiFeedback({ kind: "warning", text: "El objeto seleccionado no tiene keyframes guardados." });
      return;
    }

    if (isReplayRunning) {
      setUiFeedback({ kind: "warning", text: "Deten el replay antes de limpiar keyframes." });
      return;
    }

    setKeyframesByElement((prev) => {
      const next = { ...prev };
      delete next[selectedElement.id];
      return next;
    });
    setUiFeedback({ kind: "info", text: `Timeline eliminado para ${selectedElement.id}.` });
  }

  function stopReplay(notify = false) {
    replayCancelledRef.current = true;

    if (replayFrameRef.current !== null) {
      window.cancelAnimationFrame(replayFrameRef.current);
      replayFrameRef.current = null;
    }

    if (isReplayRunning) {
      setIsReplayRunning(false);
      setActiveReplaySegment(null);
    }

    if (notify) {
      setUiFeedback({ kind: "info", text: "Replay detenido." });
    }
  }

  function playReplay() {
    if (isReplayRunning) {
      return;
    }

    if (replayReadyElementIds.length === 0) {
      const transitionsLabel = keyframeTransitions
        .map(([fromSlot, toSlot]) => `${fromSlot}->${toSlot}`)
        .join(", ");

      setUiFeedback({
        kind: "warning",
        text: `No hay objetos con transiciones completas (${transitionsLabel}).`
      });
      return;
    }

    replayCancelledRef.current = false;
    setSelectedElementId(null);
    setIsReplayRunning(true);
    setUiFeedback({ kind: "info", text: "Replay iniciado." });

    const segmentPairs = keyframeTransitions;

    let workingScene = cloneSceneElements(elements);
    const firstSlot = KEYFRAME_SLOTS[0];
    const firstSlotElementsById = new Map<string, SceneElement>();

    Object.values(keyframesByElement).forEach((timeline) => {
      const firstSlotKeyframe = timeline[firstSlot];

      if (firstSlotKeyframe) {
        firstSlotElementsById.set(
          firstSlotKeyframe.element.id,
          cloneSceneElements([firstSlotKeyframe.element])[0]
        );
      }
    });

    if (firstSlotElementsById.size > 0) {
      const sceneById = new Map(workingScene.map((element) => [element.id, element]));
      firstSlotElementsById.forEach((element, elementId) => {
        sceneById.set(elementId, element);
      });

      workingScene = Array.from(sceneById.values()).sort((a, b) => a.zIndex - b.zIndex);
      setElements(workingScene);
    }

    let segmentIndex = 0;

    const runNextSegment = () => {
      if (replayCancelledRef.current) {
        return;
      }

      if (segmentIndex >= segmentPairs.length) {
        setIsReplayRunning(false);
        setActiveReplaySegment(null);
        replayFrameRef.current = null;
        setUiFeedback({ kind: "success", text: "Replay completado." });
        return;
      }

      const [fromSlot, toSlot] = segmentPairs[segmentIndex];
      const fromElements: SceneElement[] = [];
      const toElements: SceneElement[] = [];

      Object.values(keyframesByElement).forEach((timeline) => {
        const fromKeyframe = timeline[fromSlot];
        const toKeyframe = timeline[toSlot];

        if (fromKeyframe && toKeyframe) {
          fromElements.push(fromKeyframe.element);
          toElements.push(toKeyframe.element);
        }
      });

      if (fromElements.length === 0) {
        segmentIndex += 1;
        runNextSegment();
        return;
      }

      const segmentLabel = `${fromSlot} -> ${toSlot}`;
      const startedAt = performance.now();
      const segmentBaseScene = cloneSceneElements(workingScene);

      setActiveReplaySegment(segmentLabel);

      const animateStep = (now: number) => {
        if (replayCancelledRef.current) {
          replayFrameRef.current = null;
          return;
        }

        const progress = Math.min((now - startedAt) / REPLAY_SEGMENT_MS, 1);
        const interpolatedParticipants = interpolateElementsForReplay(
          fromElements,
          toElements,
          progress
        );
        const interpolatedById = new Map(
          interpolatedParticipants.map((element) => [element.id, element])
        );
        const nextSceneById = new Map(segmentBaseScene.map((element) => [element.id, element]));

        interpolatedById.forEach((element, elementId) => {
          nextSceneById.set(elementId, element);
        });

        const nextScene = Array.from(nextSceneById.values()).sort((a, b) => a.zIndex - b.zIndex);

        setElements(nextScene);

        if (progress < 1) {
          replayFrameRef.current = window.requestAnimationFrame(animateStep);
          return;
        }

        const settledById = new Map(segmentBaseScene.map((element) => [element.id, element]));

        toElements.forEach((element) => {
          settledById.set(element.id, cloneSceneElements([element])[0]);
        });

        workingScene = Array.from(settledById.values()).sort((a, b) => a.zIndex - b.zIndex);
        setElements(workingScene);
        segmentIndex += 1;
        runNextSegment();
      };

      replayFrameRef.current = window.requestAnimationFrame(animateStep);
    };

    runNextSegment();
  }

  shortcutActionsRef.current = {
    removeSelectedElement,
    saveDraftToLocalStorage,
    loadDraftFromLocalStorage,
    exportSceneJson,
    playReplay,
    stopReplay
  };

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

      if (key === "escape" && replayRunningRef.current) {
        event.preventDefault();
        shortcutActionsRef.current.stopReplay(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <p className="eyebrow">Caso Practico 2 · Fase 7 (Bonus)</p>
        <h1>Representacion visual interactiva de accidentes</h1>
        <p className="subtitle">
          Replay tipo VAR por keyframes (T1 a T5) con interpolacion de
          movimiento para reconstruir el accidente en el lienzo.
        </p>
      </header>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>Lienzo interactivo</h2>
            <span className="badge">Elementos: {elements.length}</span>
          </div>

          <div className="toolbar">
            {toolbarOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                className={`btn ${selectedType === option.type ? "active" : "ghost"}`}
                onClick={() => setSelectedType(option.type)}
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              className="btn primary"
              onClick={() => addElement(selectedType)}
              disabled={isReplayRunning}
            >
              Anadir seleccionado
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => clearScene(false)}
              disabled={elements.length === 0 || isReplayRunning}
            >
              Limpiar escena
            </button>
          </div>

          <p className="hint compact keyboard-hints">
            Atajos: Supr/Backspace eliminar seleccionado, Ctrl+S guardar
            borrador, Ctrl+L cargar borrador, Ctrl+E exportar JSON y Ctrl+P
            iniciar/detener replay.
          </p>

          <section className="timeline-panel">
            <div className="panel-head">
              <h3>Replay timeline</h3>
              <span className="badge">
                {selectedElementId
                  ? `Seleccionado: ${selectedKeyframesCount}/${KEYFRAME_SLOTS.length}`
                  : "Selecciona un objeto"}
              </span>
            </div>

            <p className="hint compact">
              {selectedElement
                ? `Objeto activo para timeline: ${selectedElement.properties.label} (${selectedElement.id}).`
                : `Selecciona un elemento del lienzo para gestionar sus ${KEYFRAME_SLOTS.join("/")}.`}
            </p>

            <div className="actions">
              {KEYFRAME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className="btn ghost"
                  onClick={() => captureKeyframe(slot)}
                  disabled={isReplayRunning || !selectedElement}
                >
                  Guardar {slot}
                </button>
              ))}

              <button
                type="button"
                className="btn ghost"
                onClick={clearKeyframes}
                disabled={selectedKeyframesCount === 0 || isReplayRunning || !selectedElement}
              >
                Limpiar keyframes
              </button>

              <button
                type="button"
                className={`btn ${isReplayRunning ? "danger" : "primary"}`}
                onClick={() => {
                  if (isReplayRunning) {
                    stopReplay(true);
                  } else {
                    playReplay();
                  }
                }}
                disabled={!isReplayRunning && replayReadyElementIds.length === 0}
              >
                {isReplayRunning ? "Detener replay" : "Play replay"}
              </button>
            </div>

            <p className="hint compact">
              Objetos listos para replay: {replayReadyElementIds.length}
            </p>

            <div className="timeline-slots">
              {KEYFRAME_SLOTS.map((slot) => {
                const keyframe = selectedKeyframes[slot];

                return (
                  <article key={slot} className={`timeline-card ${keyframe ? "saved" : "empty"}`}>
                    <strong>{slot}</strong>
                    <span>
                      {keyframe
                        ? `Guardado ${formatKeyframeTime(keyframe.capturedAt)}`
                        : "No guardado"}
                    </span>
                  </article>
                );
              })}
            </div>

            {activeReplaySegment ? (
              <p className="hint compact hint-info">Segmento activo: {activeReplaySegment}</p>
            ) : null}
          </section>

          <div ref={stageContainerRef} className="canvas-host">
            <div className="stage-wrapper">
              <Stage
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={(event) => {
                  const clickedOnEmpty = event.target === event.target.getStage();

                  if (clickedOnEmpty) {
                    setSelectedElementId(null);
                  }
                }}
                onTouchStart={(event) => {
                  const clickedOnEmpty = event.target === event.target.getStage();

                  if (clickedOnEmpty) {
                    setSelectedElementId(null);
                  }
                }}
              >
                <Layer>
                  <Rect
                    x={0}
                    y={0}
                    width={stageSize.width}
                    height={stageSize.height}
                    fill={SCENE_BACKGROUND}
                  />

                  {Array.from({ length: Math.floor(stageSize.width / GRID_SIZE) }).map(
                    (_, index) => (
                      <Line
                        key={`grid-v-${index}`}
                        points={[
                          index * GRID_SIZE,
                          0,
                          index * GRID_SIZE,
                          stageSize.height
                        ]}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth={1}
                      />
                    )
                  )}

                  {Array.from({ length: Math.floor(stageSize.height / GRID_SIZE) }).map(
                    (_, index) => (
                      <Line
                        key={`grid-h-${index}`}
                        points={[
                          0,
                          index * GRID_SIZE,
                          stageSize.width,
                          index * GRID_SIZE
                        ]}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth={1}
                      />
                    )
                  )}

                  {elementsSorted.map((element) => (
                    <Group
                      key={element.id}
                      ref={(node) => {
                        elementNodeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      rotation={element.rotation}
                      scaleX={element.scaleX}
                      scaleY={element.scaleY}
                      draggable={!element.locked && !isReplayRunning}
                      onClick={() => {
                        if (isReplayRunning) {
                          return;
                        }

                        setSelectedElementId(element.id);
                      }}
                      onTap={() => {
                        if (isReplayRunning) {
                          return;
                        }

                        setSelectedElementId(element.id);
                      }}
                      onDragEnd={(event) =>
                        updateElementFromNode(element.id, event.target as KonvaGroup)
                      }
                      onTransformEnd={(event) =>
                        updateElementFromNode(element.id, event.target as KonvaGroup)
                      }
                    >
                      {selectedElementId === element.id && element.locked
                        ? renderSelectionOutline(element)
                        : null}
                      {renderElementShape(element)}
                    </Group>
                  ))}

                  <Transformer
                    ref={transformerRef}
                    rotateEnabled={Boolean(selectedElement && !selectedElement.locked && !isReplayRunning)}
                    resizeEnabled={Boolean(selectedElement && !selectedElement.locked && !isReplayRunning)}
                    enabledAnchors={
                      selectedElement && !selectedElement.locked && !isReplayRunning
                        ? ["top-left", "top-right", "bottom-left", "bottom-right"]
                        : []
                    }
                    borderStroke="#22c55e"
                    borderStrokeWidth={2}
                    borderDash={[5, 4]}
                    anchorFill="#22c55e"
                    anchorStroke="#052e16"
                    anchorSize={9}
                    rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                    rotationSnapTolerance={8}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (
                        Math.abs(newBox.width) < 18 ||
                        Math.abs(newBox.height) < 18
                      ) {
                        return oldBox;
                      }

                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>
            </div>
          </div>

          <p className="hint">
            Tip: selecciona un tipo y pulsa "Anadir seleccionado". Todos los
            elementos son arrastrables, y los desbloqueados se pueden rotar o
            escalar con los handlers del Transformer.
          </p>
        </article>

        <aside className="panel json-panel">
          <div className="panel-head">
            <h2>Inspector de escena</h2>
            <span className="badge">v4</span>
          </div>

          {selectedElement ? (
            <section className="inspector-grid">
              <label className="field">
                <span>ID</span>
                <input value={selectedElement.id} readOnly />
              </label>

              <label className="field">
                <span>Tipo</span>
                <input value={selectedElement.type} readOnly />
              </label>

              <label className="field">
                <span>Estado</span>
                <select
                  value={selectedElement.status}
                  onChange={(event) =>
                    updateSelectedStatus(event.target.value as SceneElementStatus)
                  }
                >
                  <option value="free">free</option>
                  <option value="occupied">occupied</option>
                </select>
              </label>

              <label className="field">
                <span>Zone Type</span>
                <select
                  value={selectedElement.zoneType}
                  onChange={(event) =>
                    updateSelectedZoneType(event.target.value as SceneZoneType)
                  }
                >
                  <option value="vehicle-zone">vehicle-zone</option>
                  <option value="obstacle-zone">obstacle-zone</option>
                  <option value="reference-zone">reference-zone</option>
                </select>
              </label>

              <label className="field">
                <span>Label</span>
                <input
                  value={selectedElement.properties.label}
                  onChange={(event) => updateSelectedLabel(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Color</span>
                <input
                  type="color"
                  value={selectedElement.properties.color}
                  onChange={(event) => updateSelectedColor(event.target.value)}
                />
              </label>

              <label className="field">
                <span>X</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(event) =>
                    updateSelectedTransform({
                      x: parseNumber(event.target.value, selectedElement.x)
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Y</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(event) =>
                    updateSelectedTransform({
                      y: parseNumber(event.target.value, selectedElement.y)
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Rotacion</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.rotation)}
                  onChange={(event) =>
                    updateSelectedTransform({
                      rotation: parseNumber(event.target.value, selectedElement.rotation)
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Scale X</span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedElement.scaleX}
                  onChange={(event) =>
                    updateSelectedTransform({
                      scaleX: Math.max(0.2, parseNumber(event.target.value, selectedElement.scaleX))
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Scale Y</span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedElement.scaleY}
                  onChange={(event) =>
                    updateSelectedTransform({
                      scaleY: Math.max(0.2, parseNumber(event.target.value, selectedElement.scaleY))
                    })
                  }
                />
              </label>

              {selectedElement.type === "vehicle" ? (
                <>
                  <label className="field">
                    <span>Ancho</span>
                    <input
                      type="number"
                      value={selectedElement.properties.width}
                      onChange={(event) =>
                        updateSelectedVehicleDimension(
                          "width",
                          parseNumber(event.target.value, selectedElement.properties.width)
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Alto</span>
                    <input
                      type="number"
                      value={selectedElement.properties.height}
                      onChange={(event) =>
                        updateSelectedVehicleDimension(
                          "height",
                          parseNumber(event.target.value, selectedElement.properties.height)
                        )
                      }
                    />
                  </label>
                </>
              ) : null}

              {selectedElement.type === "obstacle" ? (
                <label className="field">
                  <span>Radio</span>
                  <input
                    type="number"
                    value={selectedElement.properties.radius}
                    onChange={(event) =>
                      updateSelectedObstacleRadius(
                        parseNumber(event.target.value, selectedElement.properties.radius)
                      )
                    }
                  />
                </label>
              ) : null}

              {selectedElement.type === "reference" ? (
                <label className="field">
                  <span>Longitud</span>
                  <input
                    type="number"
                    value={selectedElement.properties.length}
                    onChange={(event) =>
                      updateSelectedReferenceLength(
                        parseNumber(event.target.value, selectedElement.properties.length)
                      )
                    }
                  />
                </label>
              ) : null}

              <label className="field field-toggle">
                <span>Bloqueado</span>
                <input
                  type="checkbox"
                  checked={selectedElement.locked}
                  onChange={toggleSelectedLocked}
                />
              </label>
            </section>
          ) : (
            <p className="hint compact">
              Selecciona un elemento del lienzo para editar sus propiedades.
            </p>
          )}

          <div className="actions">
            <button
              type="button"
              className="btn ghost"
              onClick={bringSelectedToFront}
              disabled={!selectedElement || isReplayRunning}
            >
              Enviar al frente
            </button>

            <button
              type="button"
              className="btn danger"
              onClick={() => removeSelectedElement(false)}
              disabled={!selectedElement || isReplayRunning}
            >
              Eliminar seleccionado
            </button>
          </div>

          <div className="panel-head">
            <h2>Modelo JSON en vivo</h2>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn ghost"
              onClick={saveDraftToLocalStorage}
              disabled={elements.length === 0 || isReplayRunning}
            >
              Guardar borrador
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => loadDraftFromLocalStorage(false)}
              disabled={isReplayRunning}
            >
              Cargar borrador
            </button>

            <button
              type="button"
              className="btn danger"
              onClick={clearDraftFromLocalStorage}
              disabled={isReplayRunning}
            >
              Eliminar borrador
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={exportSceneJson}
              disabled={elements.length === 0 || isReplayRunning}
            >
              Exportar JSON
            </button>
          </div>

          {uiFeedback ? (
            <p className={`hint compact hint-${uiFeedback.kind}`}>
              {uiFeedback.text}
            </p>
          ) : null}

          <pre>{jsonPreview}</pre>
        </aside>
      </section>
    </main>
  );
}

export default App;
