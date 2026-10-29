import { beforeEach, describe, expect, it } from "vitest";
import { loadVehicles, saveVehicles, STORAGE_KEY } from "./storage";
import type { Vehicle } from "../types";

const vehicle: Vehicle = {
  id: "rec-1",
  name: "Toyota Corolla",
  fleetId: "CAR-102",
  externalId: "VEH-205",
  calendarConfirmed: true,
  markedReady: true,
  createdAt: "2026-10-27T10:00:00.000Z",
};

beforeEach(() => window.localStorage.clear());

describe("storage", () => {
  it("returns an empty fleet with no warning when nothing is saved", () => {
    expect(loadVehicles()).toEqual({ vehicles: [], warning: null });
  });

  it("round-trips saved vehicles", () => {
    expect(saveVehicles([vehicle]).ok).toBe(true);
    expect(loadVehicles().vehicles).toEqual([vehicle]);
  });

  it("recovers from corrupted JSON with a warning", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    const r = loadVehicles();
    expect(r.vehicles).toEqual([]);
    expect(r.warning).toMatch(/corrupted/i);
  });

  it("recovers from data of the wrong shape", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: "world" }));
    const r = loadVehicles();
    expect(r.vehicles).toEqual([]);
    expect(r.warning).not.toBeNull();
  });

  it("skips invalid records but keeps valid ones", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([vehicle, { id: 5 }, null]));
    const r = loadVehicles();
    expect(r.vehicles).toEqual([vehicle]);
    expect(r.warning).toMatch(/2 saved vehicle records were invalid/i);
  });

  it("reports failure instead of throwing when saving fails", () => {
    const failing = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    } as unknown as Storage;
    const r = saveVehicles([vehicle], failing);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/could not be saved/i);
  });
});
