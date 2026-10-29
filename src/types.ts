export interface Vehicle {
  id: string; // internal record id (stable, never edited)
  name: string; // e.g. "Toyota Corolla"
  fleetId: string; // e.g. "CAR-102"
  externalId: string; // e.g. "VEH-205" (may be empty)
  calendarConfirmed: boolean; // simulated confirmation only
  markedReady: boolean; // operator has marked the vehicle Ready
  createdAt: string; // ISO timestamp
}

export type CheckKey = "info" | "calendar" | "mapping";

export interface CheckResult {
  key: CheckKey;
  title: string;
  complete: boolean;
  explanation: string;
  action: string | null; // null when complete
}

export type ReadinessStatus = "Incomplete" | "Action required" | "Ready";

export interface Readiness {
  checks: CheckResult[];
  completed: number;
  total: number;
  status: ReadinessStatus;
  nextAction: string | null;
}

export interface VehicleInput {
  name: string;
  fleetId: string;
  externalId: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof VehicleInput, string>>;
  cleaned: VehicleInput;
}
