import { describe, expect, it } from "vitest";

import {
  buildSceneExportPayload,
  hydrateSceneSnapshot,
  validateSceneSnapshot
} from "../scenePersistence";
import type { SceneSnapshot } from "../../types/scene";

describe("scenePersistence", () => {
  it("hydrates a valid snapshot and normalizes safe defaults", () => {
    const rawSnapshot = {
      version: 999,
      generatedAt: "invalid-date",
      selectedElementId: "missing-id",
      meta: {
        canvasWidth: 0,
        canvasHeight: -10,
        gridSize: 0,
        background: ""
      },
      elements: [
        {
          id: "veh-1",
          type: "vehicle",
          status: "free",
          zoneType: "vehicle-zone",
          x: 120,
          y: 140,
          rotation: 0,
          scaleX: 0.1,
          scaleY: 0.2,
          zIndex: 2,
          locked: false,
          createdAt: "invalid-date",
          updatedAt: "2025-01-01T10:00:00.000Z",
          properties: {
            label: "Vehiculo test",
            color: "invalid-color",
            width: 8,
            height: 10
          }
        }
      ]
    };

    const hydrated = hydrateSceneSnapshot(rawSnapshot);

    expect(hydrated).not.toBeNull();
    expect(hydrated?.version).toBe(4);
    expect(hydrated?.selectedElementId).toBeNull();
    expect(hydrated?.meta.canvasWidth).toBe(1);
    expect(hydrated?.meta.canvasHeight).toBe(1);
    expect(hydrated?.meta.gridSize).toBe(1);

    const firstElement = hydrated?.elements[0];
    expect(firstElement?.scaleX).toBe(0.2);
    expect(firstElement?.scaleY).toBe(0.2);

    if (firstElement?.type === "vehicle") {
      expect(firstElement.properties.color).toBe("#38bdf8");
      expect(firstElement.properties.width).toBe(12);
      expect(firstElement.properties.height).toBe(12);
    }
  });

  it("returns null when snapshot contains invalid element types", () => {
    const rawSnapshot = {
      generatedAt: new Date().toISOString(),
      selectedElementId: null,
      meta: {
        canvasWidth: 800,
        canvasHeight: 600,
        gridSize: 20,
        background: "#0f172a"
      },
      elements: [
        {
          id: "bad-1",
          type: "unknown",
          x: 0,
          y: 0
        }
      ]
    };

    expect(hydrateSceneSnapshot(rawSnapshot)).toBeNull();
  });

  it("validates required scene constraints", () => {
    const emptySnapshot: SceneSnapshot = {
      version: 4,
      generatedAt: new Date().toISOString(),
      selectedElementId: null,
      meta: {
        canvasWidth: 800,
        canvasHeight: 600,
        gridSize: 20,
        background: "#0f172a"
      },
      elements: []
    };

    const issues = validateSceneSnapshot(emptySnapshot);
    expect(issues).toContain("La escena no tiene elementos para exportar.");
  });

  it("builds export payload without internal timestamps", () => {
    const snapshot: SceneSnapshot = {
      version: 4,
      generatedAt: "2025-01-01T10:00:00.000Z",
      selectedElementId: "veh-1",
      meta: {
        canvasWidth: 960,
        canvasHeight: 580,
        gridSize: 20,
        background: "#0f172a"
      },
      elements: [
        {
          id: "veh-1",
          type: "vehicle",
          status: "free",
          zoneType: "vehicle-zone",
          x: 10,
          y: 20,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          zIndex: 0,
          locked: false,
          createdAt: "2025-01-01T09:00:00.000Z",
          updatedAt: "2025-01-01T09:30:00.000Z",
          properties: {
            label: "Vehiculo",
            color: "#38bdf8",
            width: 70,
            height: 30
          }
        }
      ]
    };

    const payload = buildSceneExportPayload(snapshot);

    expect(payload.elements[0]).toMatchObject({
      id: "veh-1",
      type: "vehicle",
      status: "free",
      zoneType: "vehicle-zone"
    });
    expect(payload.elements[0]).not.toHaveProperty("createdAt");
    expect(payload.elements[0]).not.toHaveProperty("updatedAt");
  });
});
