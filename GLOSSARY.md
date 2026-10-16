# Atlas glossary

Operator-tooling vocabulary for this repo. Not an Attesta product glossary.

Topic and Area are deferred (Wave B / crystallize).

## Atlas

Operator app that loads markdown maps and tickets and renders wayfinding views. Not an Attesta product surface.

## Effort

A workstream under `<content-root>/<slug>/` with a `map.md` and numbered `issues/` tickets. This repo ships `atlas` and `pre-build` under `.scratch`.

## Map

The effort’s `map.md` prose: Destination, Notes, Decisions so far, Fog / Not yet specified, Out of scope. Rendered as sections in views; not the ticket DAG itself.

## Ticket

A numbered issue file under `<content-root>/<effort>/issues/<NN>-<slug>.md` with type, status, blockers, and body (plus `## Answer` when closed). Identity within an effort is the ticket number / slug.

## Projection

Typed model between disk content (e.g. Velite collections) and views. For an effort: tickets, map sections, derived buckets (`frontier` / `blocked` / `resolved`), blocker edges, and **Tier** per ticket. Derived outside the UI.

## Tier

Integer depth of a ticket in the effort’s blocker DAG: `0` when `Blocked by` is empty; otherwise one more than the maximum Tier among its **existing** blockers (ids present in the effort). A projection field, not the layout Y driver (placement is ELK, with dagre as an escape hatch). Not a status and not a ticket type. Missing blocker ids and cycles are invalid ticket-graph states (surfaced as warnings), not alternate Tier rules.
_Avoid_: rank (dagre-internal), level, layer (reserved for Atlas L0–L4)

## View

A UI surface that consumes a projection (wayfinder DAG, process kanban, architecture graph, etc.). Views do not re-derive status buckets, edges, or Tier.
