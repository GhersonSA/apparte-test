import type {
  SceneElement,
  SceneElementStatus,
  SceneElementType,
  SceneMeta,
  SceneZoneType
} from "../types/scene";

export const GRID_SIZE = 40;
export const SCENE_BACKGROUND = "#111827";
export const DRAFT_STORAGE_KEY = "case2-scene-draft-v4";
export const FEEDBACK_TIMEOUT_MS = 2600;
export const REPLAY_SEGMENT_MS = 1200;
export const REPLAY_CAPTURE_FPS = 30;
export const REPLAY_VIDEO_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm"
] as const;
export const KEYFRAME_SLOTS = ["T1", "T2", "T3", "T4", "T5"] as const;

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export type SceneExportPayload = {
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

export type UiFeedback = {
  kind: "success" | "error" | "info" | "warning";
  text: string;
};

export type KeyframeSlot = (typeof KEYFRAME_SLOTS)[number];

export type ElementKeyframe = {
  slot: KeyframeSlot;
  capturedAt: string;
  element: SceneElement;
};

export type KeyframesByElement = Record<string, Partial<Record<KeyframeSlot, ElementKeyframe>>>;

export type ReplayStartOptions = {
  onFinished?: (completed: boolean) => void;
  suppressStartFeedback?: boolean;
  suppressCompletionFeedback?: boolean;
  suppressNoReadyFeedback?: boolean;
};

export type ConfirmDialogState =
  | {
      kind: "remove-selected";
      elementId: string;
      elementLabel: string;
    }
  | {
      kind: "clear-scene";
      elementsCount: number;
    }
  | null;
