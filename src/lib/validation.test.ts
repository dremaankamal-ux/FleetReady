import { describe, expect, it } from "vitest";
import { isDuplicateExternalId, isDuplicateFleetId, validateExternalId, validateVehicleInput } from "./validation";

const existing = [
  { id: "rec-1", name: "Toyota Corolla", fleetId: "CAR-102", externalId: "VEH-205" },
  { id: "rec-2", name: "Ford Transit", fleetId: "VAN-007", externalId: "" },
];

describe("validateVehicleInput", () => {
  it("accepts valid input and trims whitespace", () => {
    const r = validateVehicleInput(
      { name: "  Toyota Corolla ", fleetId: " CAR-103 ", externalId: " VEH-206 " },
      existing,
    );
    expect(r.ok).toBe(true);
    expect(r.cleaned).toEqual({ name: "Toyota Corolla", fleetId: "CAR-103", externalId: "VEH-206" });
  });

  it("requires a vehicle name and fleet ID", () => {
    const r = validateVehicleInput({ name: "", fleetId: "", externalId: "" }, existing);
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBeDefined();
    expect(r.errors.fleetId).toBeDefined();
  });

  it("treats whitespace-only values as blank", () => {
    const r = validateVehicleInput({ name: "   ", fleetId: "   ", externalId: "" }, existing);
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBeDefined();
    expect(r.errors.fleetId).toBeDefined();
  });

  it("allows an empty external platform ID", () => {
    const r = validateVehicleInput({ name: "Ford Transit", fleetId: "VAN-008", externalId: "" }, existing);
    expect(r.ok).toBe(true);
    expect(r.cleaned.externalId).toBe("");
  });

  it("rejects a duplicate fleet ID, ignoring case and surrounding spaces", () => {
    const r = validateVehicleInput({ name: "Honda Civic", fleetId: " car-102 ", externalId: "" }, existing);
    expect(r.ok).toBe(false);
    expect(r.errors.fleetId).toMatch(/already in use/i);
  });

  it("allows a vehicle to keep its own fleet ID when editing", () => {
    const r = validateVehicleInput(
      { name: "Toyota Corolla", fleetId: "CAR-102", externalId: "VEH-205" },
      existing,
      "rec-1",
    );
    expect(r.ok).toBe(true);
  });
});

describe("duplicate external platform IDs", () => {
  it("rejects a new vehicle that reuses another vehicle's external ID", () => {
    const r = validateVehicleInput({ name: "Suzuki Alto", fleetId: "CAR-104", externalId: " veh-205 " }, existing);
    expect(r.ok).toBe(false);
    expect(r.errors.externalId).toMatch(/already mapped to Toyota Corolla \(CAR-102\)/);
  });

  it("rejects mapping an existing vehicle to an ID used by another vehicle", () => {
    expect(validateExternalId("VEH-205", existing, "rec-2")).toMatch(/already mapped/);
  });

  it("allows a vehicle to keep or re-save its own external ID", () => {
    expect(validateExternalId("VEH-205", existing, "rec-1")).toBeNull();
  });

  it("allows an empty external ID even if other vehicles have none", () => {
    expect(validateExternalId("", existing, "rec-2")).toBeNull();
    expect(isDuplicateExternalId(existing, "   ")).toBeUndefined();
  });

  it("allows a unique external ID", () => {
    expect(validateExternalId("VEH-300", existing, "rec-2")).toBeNull();
  });
});

describe("isDuplicateFleetId", () => {
  it("detects duplicates and ignores blanks", () => {
    expect(isDuplicateFleetId(existing, "VAN-007")).toBe(true);
    expect(isDuplicateFleetId(existing, "van-007")).toBe(true);
    expect(isDuplicateFleetId(existing, "VAN-999")).toBe(false);
    expect(isDuplicateFleetId(existing, "   ")).toBe(false);
  });
});
