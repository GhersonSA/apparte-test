import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import type { Group as KonvaGroup } from "konva/lib/Group";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";

import {
  type SceneElement,
  type SceneElementStatus,
  type SceneMeta,
  type SceneElementType,
  type SceneZoneType,
  type SceneSnapshot
} from "./types/scene";
import {
  FEEDBACK_TIMEOUT_MS,
  GRID_SIZE,
  KEYFRAME_SLOTS,
  SCENE_BACKGROUND,
  type ConfirmDialogState,
  type UiFeedback
} from "./app/constants";
import { renderElementShape, renderSelectionOutline, toolbarOptions } from "./app/renderUtils";
import { formatKeyframeTime, parseNumber } from "./app/replayUtils";
import BrandWatermark from "./components/BrandWatermark";
import ConfirmDialog from "./components/ConfirmDialog";
import { type ShortcutActions, useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSceneDangerActions } from "./hooks/useSceneDangerActions";
import { useReplayController } from "./hooks/useReplayController";
import { useSceneElementEditor } from "./hooks/useSceneElementEditor";
import { useScenePersistenceActions } from "./hooks/useScenePersistenceActions";
import { useStageSize } from "./hooks/useStageSize";

function App() {
  const transformerRef = useRef<KonvaTransformer | null>(null);
  const elementNodeRefs = useRef<Record<string, KonvaGroup | null>>({});
  const confirmDialogRef = useRef<ConfirmDialogState>(null);
  const shortcutActionsRef = useRef<ShortcutActions>({
    removeSelectedElement: () => undefined,
    saveDraftToLocalStorage: () => undefined,
    loadDraftFromLocalStorage: () => undefined,
    exportSceneJson: () => undefined,
    exportReplayVideo: () => undefined,
    playReplay: () => undefined,
    stopReplay: () => undefined
  });
  const { stageContainerRef, stageSize } = useStageSize();

  const [selectedType, setSelectedType] = useState<SceneElementType>("vehicle");
  const [elements, setElements] = useState<SceneElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [uiFeedback, setUiFeedback] = useState<UiFeedback | null>(null);

  const pushUiFeedback = useCallback((feedback: UiFeedback) => {
    setUiFeedback(feedback);
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

  const sceneMeta = useMemo<SceneMeta>(
    () => ({
      canvasWidth: stageSize.width,
      canvasHeight: stageSize.height,
      gridSize: GRID_SIZE,
      background: SCENE_BACKGROUND
    }),
    [stageSize]
  );

  const {
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
  } = useSceneElementEditor({
    elements,
    setElements,
    selectedElementId,
    setSelectedElementId,
    onFeedback: pushUiFeedback
  });

  const {
    selectedKeyframes,
    selectedKeyframesCount,
    isReplayRunning,
    activeReplaySegment,
    isVideoExporting,
    replayReadyElementIds,
    replayRunningRef,
    captureKeyframe,
    clearKeyframes,
    removeKeyframesForElement,
    resetReplayData,
    stopReplay,
    playReplay,
    exportReplayVideo
  } = useReplayController({
    elements,
    setElements,
    selectedElement,
    selectedElementId,
    setSelectedElementId,
    stageContainerRef,
    onFeedback: pushUiFeedback
  });

  const {
    confirmDialog,
    closeConfirmDialog,
    confirmDialogAction,
    removeSelectedElement,
    clearScene
  } = useSceneDangerActions({
    elementsCount: elements.length,
    selectedElement,
    setElements,
    setSelectedElementId,
    removeKeyframesForElement,
    resetReplayData,
    onFeedback: pushUiFeedback
  });

  useEffect(() => {
    confirmDialogRef.current = confirmDialog;
  }, [confirmDialog]);

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

  const handleSnapshotLoaded = useCallback(
    (hydratedSnapshot: SceneSnapshot) => {
      setElements(hydratedSnapshot.elements);
      setSelectedElementId(hydratedSnapshot.selectedElementId);
      resetReplayData();
    },
    [resetReplayData]
  );

  const {
    saveDraftToLocalStorage,
    loadDraftFromLocalStorage,
    clearDraftFromLocalStorage,
    exportSceneJson
  } = useScenePersistenceActions({
    sceneSnapshot,
    onFeedback: pushUiFeedback,
    onSnapshotLoaded: handleSnapshotLoaded
  });

  useEffect(() => {
    loadDraftFromLocalStorage(true);
  }, [loadDraftFromLocalStorage]);

  useEffect(() => {
    shortcutActionsRef.current = {
      removeSelectedElement,
      saveDraftToLocalStorage,
      loadDraftFromLocalStorage,
      exportSceneJson,
      exportReplayVideo,
      playReplay,
      stopReplay
    };
  });

  useKeyboardShortcuts({
    shortcutActionsRef,
    replayRunningRef,
    confirmDialogRef,
    onCloseConfirmDialog: closeConfirmDialog
  });

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <div className="app-header-content">
          <p className="eyebrow">Caso Práctico 2 · GhersonSA</p>
          <h1>Representacion visual interactiva de accidentes</h1>
        </div>
        <BrandWatermark />
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
            iniciar/detener replay. Ctrl+Mayus+V exporta replay en video.
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
                disabled={isVideoExporting || (!isReplayRunning && replayReadyElementIds.length === 0)}
              >
                {isReplayRunning ? "Detener replay" : "Play replay"}
              </button>

              <button
                type="button"
                className="btn accent"
                onClick={exportReplayVideo}
                disabled={isReplayRunning || isVideoExporting || replayReadyElementIds.length === 0}
              >
                {isVideoExporting ? "Exportando video..." : "Exportar replay en video"}
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

      <ConfirmDialog
        dialog={confirmDialog}
        onCancel={closeConfirmDialog}
        onConfirm={confirmDialogAction}
      />
    </main>
  );
}

export default App;
