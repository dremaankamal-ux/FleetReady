import { useState } from "react";
import type { FormEvent } from "react";
import type { Vehicle, VehicleInput } from "../types";
import { calculateReadiness, canMarkReady, effectiveStatus } from "../lib/readiness";
import { StatusBadge } from "./StatusBadge";

export interface ActionResult {
  ok: boolean;
  errors?: Partial<Record<keyof VehicleInput, string>>;
  error?: string;
}

interface Props {
  vehicle: Vehicle;
  onEditDetails: (id: string, input: { name: string; fleetId: string }) => ActionResult;
  onSetMapping: (id: string, externalId: string) => ActionResult;
  onSetCalendar: (id: string, confirmed: boolean) => ActionResult;
  onSetReady: (id: string, ready: boolean) => ActionResult;
  onClose: () => void;
}

export function VehicleCard({ vehicle, onEditDetails, onSetMapping, onSetCalendar, onSetReady, onClose }: Props) {
  const readiness = calculateReadiness(vehicle);
  const status = effectiveStatus(vehicle);
  const allChecksPass = canMarkReady(vehicle);

  const [editingDetails, setEditingDetails] = useState(false);
  const [name, setName] = useState(vehicle.name);
  const [fleetId, setFleetId] = useState(vehicle.fleetId);
  const [mapping, setMapping] = useState(vehicle.externalId);
  const [errors, setErrors] = useState<ActionResult["errors"]>({});
  const [cardError, setCardError] = useState<string | null>(null);

  function report(result: ActionResult) {
    setErrors(result.errors ?? {});
    setCardError(result.ok ? null : (result.error ?? null));
    return result.ok;
  }

  function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (report(onEditDetails(vehicle.id, { name, fleetId }))) setEditingDetails(false);
  }

  function saveMapping(e: FormEvent) {
    e.preventDefault();
    report(onSetMapping(vehicle.id, mapping));
  }

  return (
    <section className="card vehicle-card" aria-labelledby="vehicle-heading">
      <div className="card-head">
        <div>
          <h2 id="vehicle-heading">{vehicle.name || "Unnamed vehicle"}</h2>
          <p className="muted">Fleet ID: {vehicle.fleetId || "not set"}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="progress" aria-live="polite">
        <strong>
          {readiness.completed} of {readiness.total} checks complete
        </strong>
      </p>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={readiness.total}
        aria-valuenow={readiness.completed}
      >
        <div className="progress-fill" style={{ width: `${(readiness.completed / readiness.total) * 100}%` }} />
      </div>

      {cardError && (
        <p className="alert alert-error" role="alert">
          {cardError}
        </p>
      )}

      {status === "Ready" ? (
        <div className="alert alert-success">
          <p>
            <strong>All simulated setup checks are complete. This vehicle is marked Ready.</strong>
          </p>
          <p className="small">
            This is a prototype readiness status based on the checklist below. It is not a real-world verification of
            any calendar or external platform.
          </p>
        </div>
      ) : (
        <div className="alert alert-warn">
          <p>
            <strong>Next step:</strong>{" "}
            {readiness.nextAction ?? "All checks are complete. Mark this vehicle Ready below."}
          </p>
          <p className="small">Readiness is a prototype status from simulated checks, not a real-world verification.</p>
        </div>
      )}

      <ul className="checklist">
        {readiness.checks.map((check) => (
          <li key={check.key} className={`check ${check.complete ? "check-done" : "check-open"}`}>
            <div className="check-head">
              <h3>{check.title}</h3>
              <span className={check.complete ? "pill pill-done" : "pill pill-open"}>
                {check.complete ? "✓ Complete" : "! Needs attention"}
              </span>
            </div>
            <p>{check.explanation}</p>

            {check.key === "info" && !editingDetails && (
              <button type="button" className="btn btn-link" onClick={() => setEditingDetails(true)}>
                Edit name or fleet ID
              </button>
            )}
            {check.key === "info" && editingDetails && (
              <form onSubmit={saveDetails} noValidate className="inline-form">
                <div className="field">
                  <label htmlFor="edit-name">Vehicle name</label>
                  <input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={errors?.name ? true : undefined}
                  />
                  {errors?.name && <p className="field-error">{errors.name}</p>}
                </div>
                <div className="field">
                  <label htmlFor="edit-fleet-id">Fleet vehicle ID</label>
                  <input
                    id="edit-fleet-id"
                    value={fleetId}
                    onChange={(e) => setFleetId(e.target.value)}
                    aria-invalid={errors?.fleetId ? true : undefined}
                  />
                  {errors?.fleetId && <p className="field-error">{errors.fleetId}</p>}
                </div>
                <div className="row">
                  <button type="submit" className="btn btn-primary">
                    Save details
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setEditingDetails(false);
                      setName(vehicle.name);
                      setFleetId(vehicle.fleetId);
                      setErrors({});
                      setCardError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {check.key === "calendar" && !check.complete && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => report(onSetCalendar(vehicle.id, true))}
                >
                  Confirm calendar connected
                </button>
                <p className="hint">
                  This button records a simulated confirmation only. It does not connect a real calendar.
                </p>
              </>
            )}
            {check.key === "calendar" && check.complete && (
              <button type="button" className="btn btn-link" onClick={() => report(onSetCalendar(vehicle.id, false))}>
                Undo simulated confirmation
              </button>
            )}

            {check.key === "mapping" && (
              <form onSubmit={saveMapping} noValidate className="inline-form">
                <div className="field">
                  <label htmlFor="edit-external-id">External platform vehicle ID</label>
                  <input
                    id="edit-external-id"
                    value={mapping}
                    onChange={(e) => setMapping(e.target.value)}
                    placeholder="VEH-205"
                    aria-invalid={errors?.externalId ? true : undefined}
                    aria-describedby={errors?.externalId ? "edit-external-id-error" : undefined}
                  />
                  {errors?.externalId && (
                    <p className="field-error" id="edit-external-id-error">
                      {errors.externalId}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className={check.complete ? "btn" : "btn btn-primary"}
                  disabled={mapping.trim() === vehicle.externalId}
                >
                  {check.complete ? "Update mapping" : "Save mapping"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <div className="ready-actions">
        {vehicle.markedReady ? (
          <button type="button" className="btn" onClick={() => report(onSetReady(vehicle.id, false))}>
            Remove Ready status
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allChecksPass}
            aria-describedby="ready-hint"
            onClick={() => report(onSetReady(vehicle.id, true))}
          >
            Mark vehicle Ready
          </button>
        )}
        {!vehicle.markedReady && !allChecksPass && (
          <p className="hint" id="ready-hint">
            Complete all three checks to enable this button.
          </p>
        )}
        <button type="button" className="btn btn-link" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
