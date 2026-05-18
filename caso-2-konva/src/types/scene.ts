export type SceneElementType = "vehicle" | "obstacle" | "reference";

type BaseSceneElement<TType extends SceneElementType, TProperties> = {
  id: string;
  type: TType;
  x: number;
  y: number;
  rotation: number;
  properties: TProperties;
};

export type VehicleSceneElement = BaseSceneElement<
  "vehicle",
  {
    label: string;
    color: string;
    width: number;
    height: number;
  }
>;

export type ObstacleSceneElement = BaseSceneElement<
  "obstacle",
  {
    label: string;
    color: string;
    radius: number;
  }
>;

export type ReferenceSceneElement = BaseSceneElement<
  "reference",
  {
    label: string;
    color: string;
    length: number;
  }
>;

export type SceneElement =
  | VehicleSceneElement
  | ObstacleSceneElement
  | ReferenceSceneElement;

export type SceneSnapshot = {
  version: number;
  generatedAt: string;
  elements: SceneElement[];
};

const elementOffsets: Record<SceneElementType, { x: number; y: number }> = {
  vehicle: { x: 0, y: 0 },
  obstacle: { x: 30, y: 30 },
  reference: { x: -25, y: 48 }
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `element-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function createSceneElement(
  type: SceneElementType,
  existingCount: number
): SceneElement {
  const row = Math.floor(existingCount / 4);
  const column = existingCount % 4;

  const baseX = 150 + column * 160 + elementOffsets[type].x;
  const baseY = 120 + row * 100 + elementOffsets[type].y;

  if (type === "vehicle") {
    return {
      id: createId(),
      type,
      x: baseX,
      y: baseY,
      rotation: 0,
      properties: {
        label: `Vehiculo ${existingCount + 1}`,
        color: "#38bdf8",
        width: 76,
        height: 36
      }
    };
  }

  if (type === "obstacle") {
    return {
      id: createId(),
      type,
      x: baseX,
      y: baseY,
      rotation: 0,
      properties: {
        label: `Obstaculo ${existingCount + 1}`,
        color: "#f97316",
        radius: 17
      }
    };
  }

  return {
    id: createId(),
    type,
    x: baseX,
    y: baseY,
    rotation: 0,
    properties: {
      label: `Referencia ${existingCount + 1}`,
      color: "#22c55e",
      length: 90
    }
  };
}
