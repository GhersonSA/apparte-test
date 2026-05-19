import { Circle, Line, Rect, Text } from "react-konva";

import type { SceneElement, SceneElementType } from "../types/scene";

export const toolbarOptions: Array<{ type: SceneElementType; label: string }> = [
  { type: "vehicle", label: "Vehiculo" },
  { type: "obstacle", label: "Obstaculo" },
  { type: "reference", label: "Referencia" }
];

export function renderElementShape(element: SceneElement) {
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

export function renderSelectionOutline(element: SceneElement) {
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
