import { describe, expect, it } from "vitest";
import { calculateReadiness, canMarkReady, effectiveStatus } from "./readiness";
import type { Vehicle } from "../types";

const base: Vehicle = {
  id: "rec-1",
  name: "Toyota Corolla",
  fleetId: "CAR-102",
  externalId: "VEH-205",
  calendarConfirmed: true,
  markedReady: false,
  createdAt: "2026-10-27T10:00:00.000Z",
};

describe("calculateReadiness", () => {
  it("flags a new vehicle with missing setup steps as Action required (1 of 3)", () => {
    const r = calculateReadiness({ ...base, externalId: "", calendarConfirmed: false });
    expect(r.status).toBe("Action required");
    expect(r.completed).toBe(1);
    expect(r.total).toBe(3);
    expect(r.checks.find((c) => c.key === "info")?.complete).toBe(true);
    expect(r.nextAction).toMatch(/calendar/i);
  });

  it("is Incomplete when vehicle information is missing", () => {
    const r = calculateReadiness({ ...base, name: "   " });
    expect(r.status).toBe("Incomplete");
    expect(r.checks.find((c) => c.key === "info")?.complete).toBe(false);
    expect(r.nextAction).toMatch(/name|fleet/i);
  });

  it("is Incomplete when the fleet ID is missing", () => {
    expect(calculateReadiness({ ...base, fleetId: "" }).status).toBe("Incomplete");
  });

  it("keeps mapping incomplete when the external platform ID is missing", () => {
    const r = calculateReadiness({ ...base, externalId: "  " });
    const mapping = r.checks.find((c) => c.key === "mapping");
    expect(mapping?.complete).toBe(false);
    expect(mapping?.action).toMatch(/external platform vehicle ID/i);
    expect(r.status).toBe("Action required");
    expect(r.completed).toBe(2);
  });

  it("keeps calendar incomplete until confirmed", () => {
    const r = calculateReadiness({ ...base, calendarConfirmed: false });
    const calendar = r.checks.find((c) => c.key === "calendar");
    expect(calendar?.complete).toBe(false);
    expect(calendar?.action).toMatch(/confirm/i);
    expect(r.status).toBe("Action required");
  });

  it("is Ready when all three checks are complete", () => {
    const r = calculateReadiness(base);
    expect(r.status).toBe("Ready");
    expect(r.completed).toBe(3);
    expect(r.nextAction).toBeNull();
    expect(r.checks.every((c) => c.action === null)).toBe(true);
  });

  it("recalculates after an edit", () => {
    const incomplete: Vehicle = { ...base, externalId: "", calendarConfirmed: false };
    expect(calculateReadiness(incomplete).completed).toBe(1);

    const withMapping = { ...incomplete, externalId: "VEH-205" };
    expect(calculateReadiness(withMapping).completed).toBe(2);

    const withCalendar = { ...withMapping, calendarConfirmed: true };
    expect(calculateReadiness(withCalendar).status).toBe("Ready");

    // Editing a Ready vehicle (clearing the mapping) drops it back.
    const edited = { ...withCalendar, externalId: "" };
    expect(calculateReadiness(edited).status).toBe("Action required");
  });
});

describe("canMarkReady / effectiveStatus", () => {
  it("blocks marking Ready while any check is incomplete", () => {
    expect(canMarkReady({ ...base, externalId: "" })).toBe(false);
    expect(canMarkReady({ ...base, calendarConfirmed: false })).toBe(false);
    expect(canMarkReady(base)).toBe(true);
  });

  it("shows Ready only when the operator marked it and all checks pass", () => {
    expect(effectiveStatus({ ...base, markedReady: true })).toBe("Ready");
    expect(effectiveStatus({ ...base, markedReady: false })).toBe("Action required");
  });

  it("drops a marked-Ready vehicle back to Action required after it is edited", () => {
    expect(effectiveStatus({ ...base, markedReady: true, externalId: "" })).toBe("Action required");
  });
});
