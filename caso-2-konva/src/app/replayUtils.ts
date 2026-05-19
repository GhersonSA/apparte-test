import type { SceneElement } from "../types/scene";

export function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function cloneSceneElements(elements: SceneElement[]) {
  if (typeof structuredClone === "function") {
    return structuredClone(elements) as SceneElement[];
  }

  return JSON.parse(JSON.stringify(elements)) as SceneElement[];
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

export function interpolateElementsForReplay(
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

export function formatKeyframeTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}
