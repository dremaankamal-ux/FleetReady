# Fleet Ready

A frontend-only prototype that helps fleet operators get newly added vehicles ready for bookings. It finds missing setup steps, guides the operator through fixing them, and marks a vehicle Ready only when every check passes.

> **Prototype notice:** all checks are simulated and saved in the browser's localStorage. Nothing connects to a real calendar, external platform, or backend. The "Confirm calendar connected" button records a simulated confirmation only.

## The problem

New operators often get stuck in their first week because a vehicle looks "added" but is not actually set up: the calendar is not confirmed, or the vehicle is not mapped to its external platform ID. Fleet Ready turns that into a three-item checklist with a clear next action, so the operator can self-serve the fix instead of contacting support.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (Vitest)
npm run build    # type-check + production build
```

## How it works

Three required checks per vehicle:

| Check | Complete when |
| --- | --- |
| Vehicle information | Name and fleet vehicle ID are present |
| Calendar setup | Operator clicks "Confirm calendar connected" (simulated) |
| Vehicle mapping | External platform vehicle ID is provided |

Statuses are calculated from the checklist, never hardcoded:

- **Incomplete**: vehicle information is missing
- **Action required**: information present, calendar or mapping incomplete
- **Ready**: all three checks complete and the operator has marked the vehicle Ready

## Edge cases handled

- Blank or whitespace-only name/ID, with trimming before saving
- Duplicate fleet vehicle IDs and duplicate external platform IDs (case-insensitive), checked both when adding and when editing; the error names the vehicle already using the ID
- Missing external ID keeps mapping incomplete
- Corrupted or partly invalid localStorage data is skipped with a visible warning
- Failed saves show an error, never a success message, leave state unchanged, and keep the typed form input
- Editing a vehicle after it was marked Ready removes the Ready mark so it must be re-checked
- Mark Ready is disabled (and rejected in code) while any check is incomplete

## Structure

```
src/
  types.ts                 data models
  lib/readiness.ts         pure readiness calculation
  lib/validation.ts        input validation, duplicate detection
  lib/storage.ts           localStorage load/save with error handling
  lib/*.test.ts            unit tests (28)
  components/              AddVehicleForm, VehicleCard, FleetList, StatusBadge
  App.tsx                  state and persistence wiring
  styles.css               plain CSS
```
