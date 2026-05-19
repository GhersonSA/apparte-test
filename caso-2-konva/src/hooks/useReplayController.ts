import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction
} from "react";

import {
  KEYFRAME_SLOTS,
  REPLAY_CAPTURE_FPS,
  REPLAY_SEGMENT_MS,
  REPLAY_VIDEO_MIME_TYPES,
  type ElementKeyframe,
  type KeyframeSlot,
  type KeyframesByElement,
  type ReplayStartOptions,
  type UiFeedback
} from "../app/constants";
import {
  cloneSceneElements,
  interpolateElementsForReplay
} from "../app/replayUtils";
import type { SceneElement } from "../types/scene";

type UseReplayControllerParams = {
  elements: SceneElement[];
  setElements: Dispatch<SetStateAction<SceneElement[]>>;
  selectedElement: SceneElement | null;
  selectedElementId: string | null;
  setSelectedElementId: Dispatch<SetStateAction<string | null>>;
  stageContainerRef: RefObject<HTMLDivElement | null>;
  onFeedback: (feedback: UiFeedback) => void;
};

type UseReplayControllerResult = {
  keyframesByElement: KeyframesByElement;
  selectedKeyframes: Partial<Record<KeyframeSlot, ElementKeyframe>>;
  selectedKeyframesCount: number;
  isReplayRunning: boolean;
  activeReplaySegment: string | null;
  isVideoExporting: boolean;
  replayReadyElementIds: string[];
  replayTransitionsLabel: string;
  replayRunningRef: MutableRefObject<boolean>;
  captureKeyframe: (slot: KeyframeSlot) => void;
  clearKeyframes: () => void;
  removeKeyframesForElement: (elementId: string) => void;
  resetReplayData: () => void;
  stopReplay: (notify?: boolean) => void;
  playReplay: (options?: ReplayStartOptions) => boolean;
  exportReplayVideo: () => Promise<void>;
};

export function useReplayController({
  elements,
  setElements,
  selectedElement,
  selectedElementId,
  setSelectedElementId,
  stageContainerRef,
  onFeedback
}: UseReplayControllerParams): UseReplayControllerResult {
  const [keyframesByElement, setKeyframesByElement] = useState<KeyframesByElement>({});
  const [isReplayRunning, setIsReplayRunning] = useState(false);
  const [activeReplaySegment, setActiveReplaySegment] = useState<string | null>(null);
  const [isVideoExporting, setIsVideoExporting] = useState(false);

  const replayFrameRef = useRef<number | null>(null);
  const replayCancelledRef = useRef(false);
  const replayRunningRef = useRef(false);
  const replayFinishedCallbackRef = useRef<((completed: boolean) => void) | null>(null);

  useEffect(() => {
    replayRunningRef.current = isReplayRunning;
  }, [isReplayRunning]);

  useEffect(() => {
    return () => {
      if (replayFrameRef.current !== null) {
        window.cancelAnimationFrame(replayFrameRef.current);
      }
    };
  }, []);

  const keyframeTransitions = useMemo<Array<[KeyframeSlot, KeyframeSlot]>>(
    () =>
      KEYFRAME_SLOTS.slice(0, -1).map((slot, index) => [
        slot,
        KEYFRAME_SLOTS[index + 1]
      ] as [KeyframeSlot, KeyframeSlot]),
    []
  );

  const replayTransitionsLabel = useMemo(
    () => keyframeTransitions.map(([fromSlot, toSlot]) => `${fromSlot}->${toSlot}`).join(", "),
    [keyframeTransitions]
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

  const selectedKeyframes = useMemo<Partial<Record<KeyframeSlot, ElementKeyframe>>>(
    () => (selectedElementId ? keyframesByElement[selectedElementId] ?? {} : {}),
    [keyframesByElement, selectedElementId]
  );

  const selectedKeyframesCount = useMemo(
    () => KEYFRAME_SLOTS.filter((slot) => Boolean(selectedKeyframes[slot])).length,
    [selectedKeyframes]
  );

  const captureKeyframe = useCallback(
    (slot: KeyframeSlot) => {
      if (!selectedElement) {
        onFeedback({
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

      onFeedback({ kind: "success", text: `Keyframe ${slot} guardado para ${selectedElement.id}.` });
    },
    [onFeedback, selectedElement]
  );

  const clearKeyframes = useCallback(() => {
    if (!selectedElement) {
      onFeedback({ kind: "warning", text: "Selecciona un objeto para limpiar su timeline." });
      return;
    }

    if (selectedKeyframesCount === 0) {
      onFeedback({ kind: "warning", text: "El objeto seleccionado no tiene keyframes guardados." });
      return;
    }

    if (isReplayRunning) {
      onFeedback({ kind: "warning", text: "Deten el replay antes de limpiar keyframes." });
      return;
    }

    setKeyframesByElement((prev) => {
      const next = { ...prev };
      delete next[selectedElement.id];
      return next;
    });
    onFeedback({ kind: "info", text: `Timeline eliminado para ${selectedElement.id}.` });
  }, [isReplayRunning, onFeedback, selectedElement, selectedKeyframesCount]);

  const removeKeyframesForElement = useCallback((elementId: string) => {
    setKeyframesByElement((prev) => {
      const next = { ...prev };
      delete next[elementId];
      return next;
    });
  }, []);

  const resetReplayData = useCallback(() => {
    setKeyframesByElement({});
    setActiveReplaySegment(null);
  }, []);

  const stopReplay = useCallback(
    (notify = false) => {
      const finishedCallback = replayFinishedCallbackRef.current;
      replayFinishedCallbackRef.current = null;

      replayCancelledRef.current = true;

      if (replayFrameRef.current !== null) {
        window.cancelAnimationFrame(replayFrameRef.current);
        replayFrameRef.current = null;
      }

      if (replayRunningRef.current) {
        setIsReplayRunning(false);
        setActiveReplaySegment(null);
      }

      if (finishedCallback) {
        finishedCallback(false);
      }

      if (notify) {
        onFeedback({ kind: "info", text: "Replay detenido." });
      }
    },
    [onFeedback]
  );

  const playReplay = useCallback(
    (options: ReplayStartOptions = {}) => {
      const {
        onFinished,
        suppressStartFeedback = false,
        suppressCompletionFeedback = false,
        suppressNoReadyFeedback = false
      } = options;

      if (replayRunningRef.current) {
        return false;
      }

      if (replayReadyElementIds.length === 0) {
        if (!suppressNoReadyFeedback) {
          onFeedback({
            kind: "warning",
            text: `No hay objetos con transiciones completas (${replayTransitionsLabel}).`
          });
        }

        return false;
      }

      replayFinishedCallbackRef.current = onFinished ?? null;
      replayCancelledRef.current = false;
      setSelectedElementId(null);
      setIsReplayRunning(true);

      if (!suppressStartFeedback) {
        onFeedback({ kind: "info", text: "Replay iniciado." });
      }

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
          const finishedCallback = replayFinishedCallbackRef.current;
          replayFinishedCallbackRef.current = null;

          if (!suppressCompletionFeedback) {
            onFeedback({ kind: "success", text: "Replay completado." });
          }

          if (finishedCallback) {
            finishedCallback(true);
          }

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

      return true;
    },
    [
      elements,
      keyframeTransitions,
      keyframesByElement,
      onFeedback,
      replayReadyElementIds.length,
      replayTransitionsLabel,
      setElements,
      setSelectedElementId
    ]
  );

  const exportReplayVideo = useCallback(async () => {
    if (isVideoExporting) {
      return;
    }

    if (replayRunningRef.current) {
      onFeedback({
        kind: "warning",
        text: "Deten el replay actual antes de exportar video."
      });
      return;
    }

    if (replayReadyElementIds.length === 0) {
      onFeedback({
        kind: "warning",
        text: `No hay objetos con transiciones completas (${replayTransitionsLabel}).`
      });
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      onFeedback({
        kind: "error",
        text: "Tu navegador no soporta exportacion de video con MediaRecorder."
      });
      return;
    }

    const stageCanvas = stageContainerRef.current?.querySelector("canvas");

    if (!(stageCanvas instanceof HTMLCanvasElement) || typeof stageCanvas.captureStream !== "function") {
      onFeedback({
        kind: "error",
        text: "No fue posible capturar el lienzo para exportar video."
      });
      return;
    }

    const stream = stageCanvas.captureStream(REPLAY_CAPTURE_FPS);
    const mimeType = REPLAY_VIDEO_MIME_TYPES.find((candidate) =>
      typeof MediaRecorder.isTypeSupported === "function"
        ? MediaRecorder.isTypeSupported(candidate)
        : candidate === "video/webm"
    );

    let recorder: MediaRecorder;

    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      onFeedback({
        kind: "error",
        text: "No se pudo iniciar la captura de video del replay."
      });
      return;
    }

    const chunks: BlobPart[] = [];
    const recordingDone = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        reject(new Error("media-recorder-error"));
      };

      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType ?? "video/webm" }));
      };
    });

    setIsVideoExporting(true);
    onFeedback({ kind: "info", text: "Exportando replay a video..." });

    try {
      recorder.start(200);

      let replayStarted = false;
      const replayFinished = new Promise<boolean>((resolve) => {
        replayStarted = playReplay({
          onFinished: (completed) => {
            resolve(completed);

            if (recorder.state !== "inactive") {
              recorder.stop();
            }
          },
          suppressStartFeedback: true,
          suppressCompletionFeedback: true,
          suppressNoReadyFeedback: true
        });

        if (!replayStarted) {
          resolve(false);
        }
      });

      if (!replayStarted) {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }

        await recordingDone;

        onFeedback({
          kind: "warning",
          text: `No hay objetos con transiciones completas (${replayTransitionsLabel}).`
        });

        return;
      }

      const replayCompleted = await replayFinished;
      const videoBlob = await recordingDone;

      if (!replayCompleted) {
        onFeedback({
          kind: "warning",
          text: "Exportacion cancelada: el replay se detuvo antes de completarse."
        });
        return;
      }

      if (videoBlob.size === 0) {
        onFeedback({
          kind: "error",
          text: "No se pudo generar contenido de video para el replay."
        });
        return;
      }

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const videoUrl = URL.createObjectURL(videoBlob);
      const anchor = document.createElement("a");

      anchor.href = videoUrl;
      anchor.download = `case2-replay-${stamp}.webm`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(videoUrl);

      onFeedback({ kind: "success", text: "Replay exportado a video correctamente." });
    } catch {
      if (replayRunningRef.current) {
        stopReplay(false);
      }

      if (recorder.state !== "inactive") {
        recorder.stop();
      }

      onFeedback({
        kind: "error",
        text: "Ocurrio un error al exportar el replay en video."
      });
    } finally {
      stream.getTracks().forEach((track) => track.stop());
      setIsVideoExporting(false);
    }
  }, [
    isVideoExporting,
    onFeedback,
    playReplay,
    replayReadyElementIds.length,
    replayTransitionsLabel,
    stageContainerRef,
    stopReplay
  ]);

  return {
    keyframesByElement,
    selectedKeyframes,
    selectedKeyframesCount,
    isReplayRunning,
    activeReplaySegment,
    isVideoExporting,
    replayReadyElementIds,
    replayTransitionsLabel,
    replayRunningRef,
    captureKeyframe,
    clearKeyframes,
    removeKeyframesForElement,
    resetReplayData,
    stopReplay,
    playReplay,
    exportReplayVideo
  };
}
