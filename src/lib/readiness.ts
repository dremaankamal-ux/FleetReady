import type { CheckResult, Readiness, ReadinessStatus, Vehicle } from "../types";

/**
 * Pure readiness calculation. All results are derived from the vehicle's
 * fields; nothing here touches the DOM, storage or any external system.
 */
export function calculateReadiness(
  vehicle: Pick<Vehicle, "name" | "fleetId" | "externalId" | "calendarConfirmed">,
): Readiness {
  const hasInfo = vehicle.name.trim() !== "" && vehicle.fleetId.trim() !== "";
  const hasMapping = vehicle.externalId.trim() !== "";
  const hasCalendar = vehicle.calendarConfirmed;

  const checks: CheckResult[] = [
    {
      key: "info",
      title: "Vehicle information",
      complete: hasInfo,
      explanation: hasInfo
        ? "Vehicle name and fleet vehicle ID are present."
        : "The vehicle name and fleet vehicle ID are both required.",
      action: hasInfo ? null : "Edit the vehicle details and add the missing name or fleet ID.",
    },
    {
      key: "calendar",
      title: "Calendar setup",
      complete: hasCalendar,
      explanation: hasCalendar
        ? "Calendar setup has been confirmed (simulated confirmation)."
        : "Calendar setup has not been confirmed for this vehicle.",
      action: hasCalendar ? null : "Confirm the calendar is connected.",
    },
    {
      key: "mapping",
      title: "Vehicle mapping",
      complete: hasMapping,
      explanation: hasMapping
        ? "An external platform vehicle ID is recorded for this vehicle."
        : "No external platform vehicle ID has been added yet.",
      action: hasMapping ? null : "Add the external platform vehicle ID (for example VEH-205).",
    },
  ];

  const completed = checks.filter((c) => c.complete).length;
  const total = checks.length;

  let status: ReadinessStatus;
  if (!hasInfo) status = "Incomplete";
  else if (completed === total) status = "Ready";
  else status = "Action required";

  // Next most useful action: follow checklist order, info first.
  const firstOpen = checks.find((c) => !c.complete);
  const nextAction = firstOpen ? firstOpen.action : null;

  return { checks, completed, total, status, nextAction };
}

/** A vehicle may only be marked Ready when every required check passes. */
export function canMarkReady(
  vehicle: Pick<Vehicle, "name" | "fleetId" | "externalId" | "calendarConfirmed">,
): boolean {
  return calculateReadiness(vehicle).status === "Ready";
}

/**
 * The status shown to the operator. Marking Ready is an explicit operator
 * action, but it is only honoured while every check still passes, so editing
 * a Ready vehicle (e.g. clearing the mapping) immediately drops it back.
 */
export function effectiveStatus(vehicle: Vehicle): ReadinessStatus {
  const r = calculateReadiness(vehicle);
  if (r.status === "Ready" && !vehicle.markedReady) return "Action required";
  return r.status;
}
