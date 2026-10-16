# Write S1 wayfinder build backlog

Type: task
Status: resolved
Blocked by: 01, 02, 07, 08, 09
Map: ../map.md

## Question

Nothing left to decide for S1: scaffold `tools/atlas`, load dogfood fixtures, render the wayfinder with Svelte Flow, and prove it against `.scratch/atlas/`.

Write an ordered build backlog (new dir e.g. `.scratch/atlas-build/issues/` + `spec.md` pointing at decisions from this map) with tickets sized for agent sessions, triaged `ready-for-agent` where fully specified. Do not implement the viewer in this ticket.

Acceptance: backlog exists; first ticket is pickable; map Destination’s S1 clause is unblocked for a separate build effort or Wave A walk.

## Answer

Ordered S1 build backlog at [`.scratch/atlas-build/`](../../atlas-build/): [`spec.md`](../../atlas-build/spec.md) points at this map’s Decisions / S1 scope; six issues under [`issues/`](../../atlas-build/issues/), all `ready-for-agent`, ordered via `Blocked by`. First pickable: [`01-scaffold-tools-atlas`](../../atlas-build/issues/01-scaffold-tools-atlas.md) (no blockers). Chain: scaffold → Velite loader → projection → Flow UI; harness parallel after projection (blocked by 03); root `atlas` / `atlas:build` after 02+04. Viewer not implemented in this ticket.
