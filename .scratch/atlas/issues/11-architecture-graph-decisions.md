# Architecture graph view decisions

Type: grilling
Status: resolved
Blocked by: 03
Map: ../map.md

## Question

S5: topic × area graph with boundary rects — decide the model before any layout code.

1. **Node identity:** `(topic, area)` pairs vs topic-only nodes inside area hulls?
2. **Edge predicate:** “at least one IMPORTS or HTTP_CALLS between files tagged A and B” (via codebase-memory or ts-morph), folded through `topics.yaml`; at most one undirected edge per pair for display.
3. **Areas as rects:** non-overlapping layout regions vs overlapping hulls when a topic spans areas.
4. **Atlas itself:** is `tools/atlas` an area (`docs` / new `tooling`) so the viewer appears on the graph?

Decide enough to spawn an architecture-graph build backlog later. No implementation here.

## Answer

1. **Node identity:** `(topic, area)` pairs. A topic that lands in multiple areas becomes multiple nodes (one per area). Topic-only nodes inside area hulls are rejected — they hide cross-area fan-out and fight non-overlapping area regions.

2. **Edge predicate:** an undirected display edge exists between nodes `(t1, a1)` and `(t2, a2)` when at least one file-level `IMPORTS` or `HTTP_CALLS` edge connects a file tagged `(t1, a1)` to a file tagged `(t2, a2)` after folding through `topics.yaml` (topics = union of matching globs; area = most-specific glob). Cap at **one undirected edge per node pair** for display; multiplicity and direction stay out of S5. Provider (codebase-memory vs ts-morph) remains fog — this ticket only locks the predicate and fold.

3. **Areas as rects:** **non-overlapping layout regions**. Spanning topics do not create overlapping hulls; they create multiple `(topic, area)` nodes, each inside its area rect.

4. **Atlas itself:** `tools/atlas/**` maps to area **`docs`** (same L0 list as ticket 03 — no new `tooling` area). Viewer / Atlas package files appear on the graph under `docs` when their topic globs match; weak fit noted and accepted because Atlas is operator documentation/wayfinding, not a product runtime area.
