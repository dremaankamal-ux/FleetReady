import { useState } from "react";
import type { FormEvent } from "react";
import type { VehicleInput } from "../types";

export interface AddResult {
  ok: boolean;
  errors?: Partial<Record<keyof VehicleInput, string>>;
  error?: string;
}

interface Props {
  onAdd: (input: VehicleInput) => AddResult;
}

const EMPTY: VehicleInput = { name: "", fleetId: "", externalId: "" };

export function AddVehicleForm({ onAdd }: Props) {
  const [values, setValues] = useState<VehicleInput>(EMPTY);
  const [errors, setErrors] = useState<AddResult["errors"]>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: keyof VehicleInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = onAdd(values);
    if (result.ok) {
      // Only clear the form once the vehicle has really been saved.
      setValues(EMPTY);
      setErrors({});
      setFormError(null);
    } else {
      // Keep what the operator typed so nothing is lost.
      setErrors(result.errors ?? {});
      setFormError(result.error ?? null);
    }
  }

  return (
    <section className="card" aria-labelledby="add-heading">
      <h2 id="add-heading">Add a vehicle</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="vehicle-name">Vehicle name</label>
          <input
            id="vehicle-name"
            value={values.name}
            onChange={set("name")}
            placeholder="Toyota Corolla"
            aria-invalid={errors?.name ? true : undefined}
            aria-describedby={errors?.name ? "vehicle-name-error" : undefined}
            autoComplete="off"
          />
          {errors?.name && (
            <p className="field-error" id="vehicle-name-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="fleet-id">Fleet vehicle ID</label>
          <input
            id="fleet-id"
            value={values.fleetId}
            onChange={set("fleetId")}
            placeholder="CAR-102"
            aria-invalid={errors?.fleetId ? true : undefined}
            aria-describedby={errors?.fleetId ? "fleet-id-error" : undefined}
            autoComplete="off"
          />
          {errors?.fleetId && (
            <p className="field-error" id="fleet-id-error">
              {errors.fleetId}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="external-id">
            External platform vehicle ID <span className="optional">(optional for now)</span>
          </label>
          <input
            id="external-id"
            value={values.externalId}
            onChange={set("externalId")}
            placeholder="VEH-205"
            aria-invalid={errors?.externalId ? true : undefined}
            aria-describedby={errors?.externalId ? "external-id-error" : "external-id-hint"}
            autoComplete="off"
          />
          {errors?.externalId && (
            <p className="field-error" id="external-id-error">
              {errors.externalId}
            </p>
          )}
          <p className="hint" id="external-id-hint">
            Leave empty if you do not have it yet. The mapping check stays incomplete until it is added.
          </p>
        </div>

        {formError && (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="btn btn-primary">
          Add vehicle
        </button>
      </form>
    </section>
  );
}
