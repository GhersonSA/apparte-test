import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";

import {
  createSceneElement,
  type SceneElement,
  type SceneElementType,
  type SceneSnapshot
} from "./types/scene";

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

function App() {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<SceneElementType>("vehicle");
  const [elements, setElements] = useState<SceneElement[]>([]);
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

  const sceneSnapshot = useMemo<SceneSnapshot>(
    () => ({
      version: 1,
      generatedAt: new Date().toISOString(),
      elements
    }),
    [elements]
  );

  const jsonPreview = useMemo(
    () => JSON.stringify(sceneSnapshot, null, 2),
    [sceneSnapshot]
  );

  function addElement(type: SceneElementType) {
    setElements((prev) => [...prev, createSceneElement(type, prev.length)]);
  }

  function updateElementPosition(id: string, x: number, y: number) {
    setElements((prev) =>
      prev.map((element) => (element.id === id ? { ...element, x, y } : element))
    );
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
        <p className="eyebrow">Caso Practico 2 · Fase 1</p>
        <h1>Representacion visual interactiva de accidentes</h1>
        <p className="subtitle">
          Base funcional con React + Konva: alta de elementos, drag and drop y
          conversion de la escena a JSON estructurado.
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
              onClick={() => setElements([])}
            >
              Limpiar escena
            </button>
          </div>

          <div ref={stageContainerRef} className="canvas-host">
            <div className="stage-wrapper">
              <Stage width={stageSize.width} height={stageSize.height}>
                <Layer>
                  <Rect
                    x={0}
                    y={0}
                    width={stageSize.width}
                    height={stageSize.height}
                    fill="#111827"
                  />

                  {Array.from({ length: Math.floor(stageSize.width / 40) }).map(
                    (_, index) => (
                      <Line
                        key={`grid-v-${index}`}
                        points={[index * 40, 0, index * 40, stageSize.height]}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth={1}
                      />
                    )
                  )}

                  {Array.from({ length: Math.floor(stageSize.height / 40) }).map(
                    (_, index) => (
                      <Line
                        key={`grid-h-${index}`}
                        points={[0, index * 40, stageSize.width, index * 40]}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth={1}
                      />
                    )
                  )}

                  {elements.map((element) => (
                    <Group
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      rotation={element.rotation}
                      draggable
                      onDragEnd={(event) =>
                        updateElementPosition(
                          element.id,
                          event.target.x(),
                          event.target.y()
                        )
                      }
                    >
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
