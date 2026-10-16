# Wayfinder Svelte Flow model

Type: prototype
Status: resolved
Blocked by: 01, 02
Map: ../map.md

## Question

What does the S1 wayfinder **view** show, and how does Svelte Flow represent it so a growing map stays readable?

Raise fidelity with a cheap prototype (spike under `spikes/atlas-07-wayfinder-flow/` or a stub inside `tools/atlas` if layout is already decided) using fixture data from `.scratch/atlas/` and/or `.scratch/pre-build/`.

Must decide:

1. **Nodes:** one node per ticket — which fields on the node (title, type, status)? Separate nodes for map sections (Destination, Fog) or only prose panels beside the graph?
2. **Edges:** only `Blocked by`, or also “mentioned in Decisions so far”?
3. **Frontier styling:** open + unblocked + unclaimed highlighted; claimed vs resolved distinct.
4. **Interaction:** click → ticket body / Answer gist; how deep into markdown rendering in S1?
5. **Layout:** auto layout (dagre/elk via Svelte Flow) vs manual positions; what happens when tickets are added to a growing map?
6. **Effort switcher:** in S1 or deferred to S2? (Map Notes prefer S1 = single-effort + fixture toggle is enough.)

Link the prototype. Verdict feeds [Write S1 wayfinder build backlog](14-write-s1-wayfinder-build-backlog.md).

## Answer

Spike: [`spikes/atlas-07-wayfinder-flow/`](../../../spikes/atlas-07-wayfinder-flow/) — Vite + Svelte 5 + `@xyflow/svelte` + `@dagrejs/dagre`. Fixture JSON from real `.scratch/{atlas,pre-build}` via `bun run fixture` (throwaway parser; S1 production path stays Velite per tickets 01/08). Not imported by apps/packages. Product shell remains SvelteKit (`tools/atlas`) per ticket 02.

1. **Nodes:** one node per ticket; fields on the node = `title`, `type`, `status` (plus ticket number). Map sections (Destination, Notes, Decisions, Fog, Out of scope) are a **prose side panel**, not graph nodes.
2. **Edges:** **`Blocked by` only** (blocker → blocked ticket). No “mentioned in Decisions so far” edges in S1.
3. **Frontier styling:** open ∧ unblocked ∧ unclaimed highlighted; claimed / resolved / blocked visually distinct (border + opacity).
4. **Interaction:** click → **Answer gist** (plain text excerpt of `## Answer`, else question-body excerpt). **No markdown rendering in S1.**
5. **Layout:** **dagre LR auto-layout** on each load; no persisted positions. Growing maps re-layout from scratch when the projection changes (ELK not needed for S1).
6. **Effort switcher:** **deferred to S2**. S1 = single-effort view + **fixture toggle** (atlas / pre-build).
