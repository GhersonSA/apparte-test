import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";

import {
  createSceneElement,
  type SceneElement,
  type SceneMeta,
  type SceneElementType,
  type SceneSnapshot
} from "./types/scene";

const GRID_SIZE = 40;
const SCENE_BACKGROUND = "#111827";

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

function App() {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<SceneElementType>("vehicle");
  const [elements, setElements] = useState<SceneElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 960, height: 580 });

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

  const sceneSnapshot = useMemo<SceneSnapshot>(
    () => ({
      version: 2,
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

  function updateElementPosition(id: string, x: number, y: number) {
    patchElement(id, (element) => ({
      ...element,
      x,
      y,
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
  }

  function toggleSelectedLocked() {
    if (!selectedElement) {
      return;
    }

    patchElement(selectedElement.id, (element) => ({
      ...element,
      locked: !element.locked,
      updatedAt: new Date().toISOString()
    }));
  }

  function removeSelectedElement() {
    if (!selectedElement) {
      return;
    }

    setElements((prev) => prev.filter((element) => element.id !== selectedElement.id));
    setSelectedElementId(null);
  }

  function exportSceneJson() {
    const blob = new Blob([jsonPreview], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    anchor.href = url;
    anchor.download = `case2-scene-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <header className="app-header panel">
        <p className="eyebrow">Caso Practico 2 · Fase 2</p>
        <h1>Representacion visual interactiva de accidentes</h1>
        <p className="subtitle">
          Modelo de escena extendido con seleccion, capas, metadatos y edicion
          de propiedades en tiempo real.
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
            >
              Anadir seleccionado
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setElements([]);
                setSelectedElementId(null);
              }}
            >
              Limpiar escena
            </button>
          </div>

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
                      x={element.x}
                      y={element.y}
                      rotation={element.rotation}
                      scaleX={element.scaleX}
                      scaleY={element.scaleY}
                      draggable={!element.locked}
                      onClick={() => setSelectedElementId(element.id)}
                      onTap={() => setSelectedElementId(element.id)}
                      onDragEnd={(event) =>
                        updateElementPosition(
                          element.id,
                          event.target.x(),
                          event.target.y()
                        )
                      }
                    >
                      {selectedElementId === element.id ? renderSelectionOutline(element) : null}
                      {renderElementShape(element)}
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>

          <p className="hint">
            Tip: selecciona un tipo y pulsa "Anadir seleccionado". Todos los
            elementos son arrastrables para recrear la escena.
          </p>
        </article>

        <aside className="panel json-panel">
          <div className="panel-head">
            <h2>Inspector de escena</h2>
            <span className="badge">v2</span>
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
            <button type="button" className="btn ghost" onClick={bringSelectedToFront}>
              Enviar al frente
            </button>

            <button type="button" className="btn danger" onClick={removeSelectedElement}>
              Eliminar seleccionado
            </button>
          </div>

          <div className="panel-head">
            <h2>Modelo JSON en vivo</h2>
          </div>

          <div className="actions">
            <button type="button" className="btn primary" onClick={exportSceneJson}>
              Exportar JSON
            </button>
          </div>

          <pre>{jsonPreview}</pre>
        </aside>
      </section>
    </main>
  );
}

export default App;
