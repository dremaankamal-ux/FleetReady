import type { ValidationResult, Vehicle, VehicleInput } from "../types";

export function normalizeFleetId(value: string): string {
  return value.trim().toUpperCase();
}

/** True if another vehicle is already mapped to this external platform ID (case-insensitive). */
export function isDuplicateExternalId(
  vehicles: Pick<Vehicle, "id" | "name" | "fleetId" | "externalId">[],
  externalId: string,
  ignoreRecordId?: string,
): Pick<Vehicle, "id" | "name" | "fleetId" | "externalId"> | undefined {
  const wanted = externalId.trim().toUpperCase();
  if (wanted === "") return undefined;
  return vehicles.find((v) => v.id !== ignoreRecordId && v.externalId.trim().toUpperCase() === wanted);
}

/** Returns an error message if the external ID is already mapped to a different vehicle, else null. */
export function validateExternalId(
  externalId: string,
  existing: Pick<Vehicle, "id" | "name" | "fleetId" | "externalId">[],
  ignoreRecordId?: string,
): string | null {
  const clash = isDuplicateExternalId(existing, externalId, ignoreRecordId);
  if (!clash) return null;
  return `External platform vehicle ID ${externalId.trim()} is already mapped to ${clash.name} (${clash.fleetId}). Each vehicle needs its own ID.`;
}

/** True if another vehicle already uses this fleet ID (case-insensitive). */
export function isDuplicateFleetId(
  vehicles: Pick<Vehicle, "id" | "fleetId">[],
  fleetId: string,
  ignoreRecordId?: string,
): boolean {
  const wanted = normalizeFleetId(fleetId);
  if (wanted === "") return false;
  return vehicles.some((v) => v.id !== ignoreRecordId && normalizeFleetId(v.fleetId) === wanted);
}

/**
 * Validate and clean form input. Whitespace is trimmed before saving, so a
 * name or ID made only of spaces counts as blank.
 */
export function validateVehicleInput(
  input: VehicleInput,
  existing: Pick<Vehicle, "id" | "name" | "fleetId" | "externalId">[],
  ignoreRecordId?: string,
): ValidationResult {
  const cleaned: VehicleInput = {
    name: input.name.trim(),
    fleetId: input.fleetId.trim(),
    externalId: input.externalId.trim(),
  };
  const errors: ValidationResult["errors"] = {};

  if (cleaned.name === "") errors.name = "Enter a vehicle name, for example Toyota Corolla.";
  if (cleaned.fleetId === "") {
    errors.fleetId = "Enter a fleet vehicle ID, for example CAR-102.";
  } else if (isDuplicateFleetId(existing, cleaned.fleetId, ignoreRecordId)) {
    errors.fleetId = `Fleet vehicle ID ${cleaned.fleetId} is already in use. Choose a different ID.`;
  }

  const externalError = validateExternalId(cleaned.externalId, existing, ignoreRecordId);
  if (externalError) errors.externalId = externalError;

  return { ok: Object.keys(errors).length === 0, errors, cleaned };
}
