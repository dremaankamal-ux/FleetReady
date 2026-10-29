import type { ReadinessStatus } from "../types";

const CLASS: Record<ReadinessStatus, string> = {
  Ready: "badge badge-ready",
  "Action required": "badge badge-action",
  Incomplete: "badge badge-incomplete",
};

export function StatusBadge({ status }: { status: ReadinessStatus }) {
  return <span className={CLASS[status]}>{status}</span>;
}
