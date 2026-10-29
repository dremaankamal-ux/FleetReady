import type { Vehicle } from "../types";

export const STORAGE_KEY = "fleet-ready:vehicles:v1";

export interface LoadResult {
  vehicles: Vehicle[];
  /** Set when stored data was unreadable or partly invalid. */
  warning: string | null;
}

export interface SaveResult {
  ok: boolean;
  error: string | null;
}

function isVehicle(value: unknown): value is Vehicle {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id !== "" &&
    typeof v.name === "string" &&
    typeof v.fleetId === "string" &&
    typeof v.externalId === "string" &&
    typeof v.calendarConfirmed === "boolean" &&
    typeof v.markedReady === "boolean" &&
    typeof v.createdAt === "string"
  );
}

/** Load vehicles, tolerating missing, corrupted or partly invalid data. */
export function loadVehicles(storage: Storage = window.localStorage): LoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      vehicles: [],
      warning: "Saved vehicles could not be read because browser storage is unavailable.",
    };
  }
  if (raw === null) return { vehicles: [], warning: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      vehicles: [],
      warning: "Saved vehicle data was corrupted and could not be loaded. Starting with an empty fleet.",
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      vehicles: [],
      warning: "Saved vehicle data had an unexpected format and could not be loaded. Starting with an empty fleet.",
    };
  }

  const seen = new Set<string>();
  const vehicles: Vehicle[] = [];
  for (const item of parsed) {
    if (isVehicle(item) && !seen.has(item.id)) {
      seen.add(item.id);
      vehicles.push(item);
    }
  }
  const skipped = parsed.length - vehicles.length;
  return {
    vehicles,
    warning:
      skipped > 0
        ? `${skipped} saved vehicle record${skipped === 1 ? " was" : "s were"} invalid and skipped.`
        : null,
  };
}

/** Save vehicles. Returns ok:false (never throws) so callers can avoid false success messages. */
export function saveVehicles(vehicles: Vehicle[], storage: Storage = window.localStorage): SaveResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    return { ok: true, error: null };
  } catch {
    return {
      ok: false,
      error: "Your changes could not be saved. Browser storage may be full or disabled.",
    };
  }
}
