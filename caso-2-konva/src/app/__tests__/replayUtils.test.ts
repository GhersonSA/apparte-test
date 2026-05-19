import { describe, expect, it } from "vitest";

import { cloneSceneElements, interpolateElementsForReplay, parseNumber } from "../replayUtils";
import type { SceneElement } from "../../types/scene";

const vehicleFrom: SceneElement = {
  id: "vehicle-1",
  type: "vehicle",
  status: "free",
  zoneType: "vehicle-zone",
  x: 10,
  y: 20,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  zIndex: 2,
  locked: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  properties: {
    label: "Vehiculo A",
    color: "#38bdf8",
    width: 76,
    height: 36
  }
};

const vehicleTo: SceneElement = {
  id: "vehicle-1",
  type: "vehicle",
  status: "occupied",
  zoneType: "vehicle-zone",
  x: 30,
  y: 40,
  rotation: 90,
  scaleX: 2,
  scaleY: 0.5,
  zIndex: 0,
  locked: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:01:00.000Z",
  properties: {
    label: "Vehiculo B",
    color: "#0ea5e9",
    width: 90,
    height: 45
  }
};

const obstacleFrom: SceneElement = {
  id: "obstacle-1",
  type: "obstacle",
  status: "occupied",
  zoneType: "obstacle-zone",
  x: 5,
  y: 5,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  zIndex: 1,
  locked: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  properties: {
    label: "Obstaculo A",
    color: "#f97316",
    radius: 20
  }
};

const obstacleTo: SceneElement = {
  ...obstacleFrom,
  x: 15,
  y: 25,
  zIndex: 3
};

describe("replayUtils", () => {
  it("parseNumber returns parsed number and fallback for invalid values", () => {
    expect(parseNumber("42.5", 0)).toBe(42.5);
    expect(parseNumber("not-a-number", 7)).toBe(7);
  });

  it("cloneSceneElements returns a deep clone", () => {
    const original: SceneElement[] = [vehicleFrom, obstacleFrom];
    const cloned = cloneSceneElements(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);

    cloned[0].x = 999;
    expect(original[0].x).toBe(10);
  });

  it("interpolates values and keeps discrete fields until progress reaches 1", () => {
    const result = interpolateElementsForReplay(
      [vehicleFrom, obstacleFrom],
      [vehicleTo, obstacleTo],
      0.5
    );

    const interpolatedVehicle = result.find((element) => element.id === "vehicle-1");
    expect(interpolatedVehicle).toBeDefined();
    expect(interpolatedVehicle?.x).toBe(20);
    expect(interpolatedVehicle?.y).toBe(30);
    expect(interpolatedVehicle?.rotation).toBe(45);
    expect(interpolatedVehicle?.zIndex).toBe(2);
    expect(interpolatedVehicle?.status).toBe("free");

    expect(result.map((element) => element.zIndex)).toEqual([1, 2]);
  });

  it("applies target discrete fields when progress is 1", () => {
    const result = interpolateElementsForReplay([vehicleFrom], [vehicleTo], 1);

    expect(result[0].zIndex).toBe(0);
    expect(result[0].locked).toBe(true);
    expect(result[0].status).toBe("occupied");
    expect(result[0].properties).toEqual(vehicleTo.properties);
  });
});
