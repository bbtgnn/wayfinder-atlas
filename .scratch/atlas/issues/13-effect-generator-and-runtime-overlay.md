# Effect for generator and runtime overlay (longer term)

Type: grilling
Status: resolved
Blocked by: 08
Map: ../map.md

## Question

Where does Effect enter Atlas, without blocking S1?

Two separable bets (decide independently):

1. **L2 generator:** Effect (`FileSystem`, `Command` for git, `Schema`, `Layer` for codebase-memory vs stub) producing projection data. Pin versions independently of Foldkit (Atlas has no Foldkit peer). Go / defer / never relative to Velite winning S1.
2. **L4 runtime overlay:** annotate app Layers with `topic`/`area` spans; file or socket exporter; overlay on architecture graph; diff vs static edges. Explicitly **blocked on** Effect existing in `apps/engine` / web — not on this map’s S1. Fog details stay in map Not yet specified until product Effect lands.

Record go/defer for each. No product Effect work in this ticket.

## Answer

1. **L2 Effect generator:** **DEFER.** Velite owns S1 content → projection (tickets 01, 08). No Effect `FileSystem` / `Command` / `Schema` / `Layer` generator in the S1 backlog. Revisit only if Velite’s fallback path proves insufficient or a later slice needs Effect-shaped IO; not “never,” not “go” for Wave A.

2. **L4 runtime overlay:** **DEFER** until product apps expose Effect Layers (`apps/engine` / web). Atlas does not invent spans or exporters ahead of that. Fog items (DevTools / file-backed Tracer shape) stay in map **Not yet specified** until product Effect lands. No Atlas product-Effect work in this ticket or S1.
