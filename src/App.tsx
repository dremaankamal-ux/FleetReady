import { useState } from "react";
import type { Vehicle, VehicleInput } from "./types";
import { loadVehicles, saveVehicles } from "./lib/storage";
import { validateExternalId, validateVehicleInput } from "./lib/validation";
import { calculateReadiness } from "./lib/readiness";
import { AddVehicleForm } from "./components/AddVehicleForm";
import type { AddResult } from "./components/AddVehicleForm";
import { VehicleCard } from "./components/VehicleCard";
import type { ActionResult } from "./components/VehicleCard";
import { FleetList } from "./components/FleetList";

function newRecordId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [initial] = useState(() => loadVehicles());
  const [vehicles, setVehicles] = useState<Vehicle[]>(initial.vehicles);
  const [loadWarning, setLoadWarning] = useState<string | null>(initial.warning);
  const [selectedId, setSelectedId] = useState<string | null>(initial.vehicles[0]?.id ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  /**
   * Persist first, update state second. If saving fails the on-screen state
   * is left untouched and no success message is shown.
   */
  function commit(next: Vehicle[], successNotice: string | null): ActionResult {
    const result = saveVehicles(next);
    if (!result.ok) {
      setSaveError(result.error);
      setNotice(null);
      return { ok: false, error: result.error ?? "Your changes could not be saved." };
    }
    setSaveError(null);
    setVehicles(next);
    setNotice(successNotice);
    return { ok: true };
  }

  function update(id: string, patch: (v: Vehicle) => Vehicle, successNotice: string | null): ActionResult {
    const next = vehicles.map((v) => (v.id === id ? patch(v) : v));
    return commit(next, successNotice);
  }

  function handleAdd(input: VehicleInput): AddResult {
    const check = validateVehicleInput(input, vehicles);
    if (!check.ok) {
      setNotice(null);
      return { ok: false, errors: check.errors };
    }
    const vehicle: Vehicle = {
      id: newRecordId(),
      ...check.cleaned,
      calendarConfirmed: false,
      markedReady: false,
      createdAt: new Date().toISOString(),
    };
    const result = commit([...vehicles, vehicle], `${vehicle.name} (${vehicle.fleetId}) was added. Follow the checklist to get it ready.`);
    if (result.ok) {
      setSelectedId(vehicle.id);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }

  /** Editing a vehicle that was marked Ready removes the Ready mark so it must be re-checked. */
  function resetReadyNotice(v: Vehicle, base: string): string {
    return v.markedReady ? `${base} Ready status was removed because the vehicle was edited. Review the checklist and mark it Ready again.` : base;
  }

  function handleEditDetails(id: string, input: { name: string; fleetId: string }): ActionResult {
    const check = validateVehicleInput({ ...input, externalId: "" }, vehicles, id);
    if (!check.ok) return { ok: false, errors: check.errors };
    const current = vehicles.find((v) => v.id === id);
    if (!current) return { ok: false, error: "That vehicle could not be found." };
    return update(
      id,
      (v) => ({ ...v, name: check.cleaned.name, fleetId: check.cleaned.fleetId, markedReady: false }),
      resetReadyNotice(current, "Vehicle details were updated."),
    );
  }

  function handleSetMapping(id: string, externalId: string): ActionResult {
    const current = vehicles.find((v) => v.id === id);
    if (!current) return { ok: false, error: "That vehicle could not be found." };
    const cleaned = externalId.trim();
    const externalError = validateExternalId(cleaned, vehicles, id);
    if (externalError) return { ok: false, errors: { externalId: externalError } };
    return update(
      id,
      (v) => ({ ...v, externalId: cleaned, markedReady: false }),
      resetReadyNotice(current, cleaned ? "External platform vehicle ID saved." : "External platform vehicle ID was cleared."),
    );
  }

  function handleSetCalendar(id: string, confirmed: boolean): ActionResult {
    const current = vehicles.find((v) => v.id === id);
    if (!current) return { ok: false, error: "That vehicle could not be found." };
    return update(
      id,
      (v) => ({ ...v, calendarConfirmed: confirmed, markedReady: confirmed ? v.markedReady : false }),
      resetReadyNotice(
        current,
        confirmed ? "Simulated calendar confirmation recorded. No real calendar was connected." : "Simulated calendar confirmation removed.",
      ),
    );
  }

  function handleSetReady(id: string, ready: boolean): ActionResult {
    const current = vehicles.find((v) => v.id === id);
    if (!current) return { ok: false, error: "That vehicle could not be found." };
    if (ready && calculateReadiness(current).status !== "Ready") {
      return { ok: false, error: "This vehicle cannot be marked Ready until all three checks are complete." };
    }
    return update(
      id,
      (v) => ({ ...v, markedReady: ready }),
      ready ? `${current.name} is marked Ready (prototype status).` : "Ready status removed.",
    );
  }

  return (
    <div className="page">
      <header className="app-header">
        <p className="eyebrow">
          <span aria-hidden="true">☑</span> Fleet Ready · Vehicle setup checklist
        </p>
        <h1>Get your vehicles ready for bookings</h1>
        <p className="lead">Find missing setup steps, fix issues, and make sure every vehicle is ready to go.</p>
        <p className="prototype-note">
          Prototype: all checks are simulated and stored in this browser only. No real calendars or external platforms
          are contacted.
        </p>
      </header>

      <main>
        {loadWarning && (
          <p className="alert alert-error" role="alert">
            {loadWarning}{" "}
            <button type="button" className="btn btn-link" onClick={() => setLoadWarning(null)}>
              Dismiss
            </button>
          </p>
        )}
        {saveError && (
          <p className="alert alert-error" role="alert">
            {saveError} Nothing was changed.
          </p>
        )}
        {notice && !saveError && (
          <p className="alert alert-success" role="status">
            {notice}
          </p>
        )}

        <div className="layout">
          <div className="col">
            <AddVehicleForm onAdd={handleAdd} />
            <FleetList vehicles={vehicles} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setNotice(null); }} />
          </div>
          <div className="col">
            {selected ? (
              <VehicleCard
                key={selected.id}
                vehicle={selected}
                onEditDetails={handleEditDetails}
                onSetMapping={handleSetMapping}
                onSetCalendar={handleSetCalendar}
                onSetReady={handleSetReady}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <section className="card">
                <h2>Setup checklist</h2>
                <p className="empty">
                  {vehicles.length === 0
                    ? "Add a vehicle to see its setup checklist."
                    : "Choose “View / edit setup” on a vehicle to see its checklist."}
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
