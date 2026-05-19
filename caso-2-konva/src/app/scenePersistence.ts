import {
  createSceneElement,
  type SceneElement,
  type SceneElementStatus,
  type SceneElementType,
  type SceneSnapshot,
  type SceneZoneType
} from "../types/scene";
import {
  GRID_SIZE,
  HEX_COLOR_REGEX,
  SCENE_BACKGROUND,
  type SceneExportPayload
} from "./constants";

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

export function hydrateSceneSnapshot(rawSnapshot: unknown): SceneSnapshot | null {
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

export function validateSceneSnapshot(snapshot: SceneSnapshot) {
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

export function buildSceneExportPayload(snapshot: SceneSnapshot): SceneExportPayload {
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
