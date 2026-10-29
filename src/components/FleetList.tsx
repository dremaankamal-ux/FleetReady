import type { Vehicle } from "../types";
import { calculateReadiness, effectiveStatus } from "../lib/readiness";
import { StatusBadge } from "./StatusBadge";

interface Props {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FleetList({ vehicles, selectedId, onSelect }: Props) {
  return (
    <section className="card" aria-labelledby="fleet-heading">
      <h2 id="fleet-heading">Fleet vehicles</h2>
      {vehicles.length === 0 ? (
        <p className="empty">
          No vehicles yet. Add your first vehicle above and Fleet Ready will show what is still missing before it is
          ready for bookings.
        </p>
      ) : (
        <ul className="fleet-list">
          {vehicles.map((v) => {
            const r = calculateReadiness(v);
            return (
              <li key={v.id} className={v.id === selectedId ? "fleet-item selected" : "fleet-item"}>
                <div className="fleet-main">
                  <p className="fleet-name">{v.name}</p>
                  <p className="muted">{v.fleetId}</p>
                </div>
                <div className="fleet-meta">
                  <StatusBadge status={effectiveStatus(v)} />
                  <span className="muted">
                    {r.completed}/{r.total} checks complete
                  </span>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onSelect(v.id)}
                  aria-label={`View or edit setup for ${v.name} (${v.fleetId})`}
                  aria-pressed={v.id === selectedId}
                >
                  View / edit setup
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
