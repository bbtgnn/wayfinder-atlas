# Disconnected graph-component pack (design)

Atlas wayfinder: after place, treat **weakly-connected islands** as rigid blocks — top-align on Y, pack along X. Distinct from Projection **Tier** posts (`pinTierY` / `packSameTierX`).

Vocabulary: **Module** / **Interface** / **Seam** / **Adapter** / **Depth** (codebase-design). “Component” here means a **graph weakly-connected component**, not a Module.

## 1. Verdict / problem

**Ship a post-place `packComponentsX` stage.** Raw ELK (or dagre) layering inside one connected piece is already good enough for within-island “tiers.” What breaks the canvas is **multiple disconnected islands**: ELK scatters them in Y and wastes / overlaps X. Product need is island packing, not better intra-DAG ranking.

Prior spike already noted ELK + partitions still disagree with global Tier banding for disconnected pieces — that drove Y-pin for production. This stage is the **other** dogfood path: keep ELK’s internal layering, drop Tier pin/pack, and **shelf-pack islands** instead.

**Reject:** ELK `separateConnectedComponents` / compound-graph options as the product fix — engine config is shallow Interface leak; we already like raw place for connected pieces and need a post Adapter we can toggle.  
**Reject:** inventing a second “tier” from component index — Tier stays Projection-only (`tools/atlas/GLOSSARY.md`).

## 2. Component definition

**Undirected weakly-connected components on layout edges.**

- **Edges in:** the same Flow edges `flowFromProjection` already builds from Projection `BlockerEdge` (`blockedBy` → blocker → dependent). Direction is ignored for membership.
- **Endpoints:** only edges whose `source` and `target` both exist in the current node set. Dangling refs (missing blockers) do not glue islands.
- **Isolates:** nodes with no such edge are singleton components.
- **Cycles / Tier warning edges:** still count; WCC does not special-case cycles.

**Reject:** strongly-connected / directed components — would split ordinary blocker DAGs into noise.  
**Reject:** “ignore back-edges” as a first-class rule — Atlas has no separate back-edge kind; filtering by `tier(source) < tier(target)` reintroduces Tier into a Tier-agnostic stage and mis-splits under warnings.  
**Reject:** connectivity from map prose / architecture IMPORTS — wayfinder layout edges are Blocked-by only.

## 3. Interface: recipe flag + pipeline order

Extend `LayoutRecipe`:

```ts
packComponentsX: boolean
// Rigid-body pack of weakly-connected islands: top-align min-Y → y=0,
// then left→right bbox pack with COMPONENT_SEP. Tier-agnostic.
```

**Callers must know:** one boolean; stage order is fixed; stage is engine-agnostic; when on with `pinTierY`, island top-align **overrides** absolute cross-island Tier band sharing (relative Y inside an island is preserved as a rigid body). Recommended profiles never combine them.

**Fixed pipeline** (product surface; Tier posts unwired — see layout-pipeline-toggles-design note):

```
place → packComponentsX? → elkEdgePost?
```

Why this order:

| Stage | Relation to `packComponentsX` |
| --- | --- |
| **place** | Supplies XY + island topology; pack never re-ranks inside an island. |
| **pinTierY / packSameTierX** | Projection Tier posts run first when enabled. Island pack after so component bboxes win X clearance; Y shelf may undo global Tier alignment across islands (see profiles). |
| **elkEdgePost** | Always last: polylines must remap/clamp against **final** node XY. |

**Reject:** free-form reorder UI (same as existing recipe design).  
**Reject:** optional params on `layoutElk` / `layoutDag` — composition stays in `flowFromProjection`.  
**Reject:** X-only variant when `pinTierY` is on — one behaviour behind the flag (Depth); profiles choose the combo.

`recipeEquals` / `parseStoredRecipe` / persist: treat missing `packComponentsX` as `false` (safe migrate).

## 4. Algorithm sketch

Deep Module Interface: `packComponentsX(nodes, edges): void` (mutate positions in place, same style as `pinTierY` / `packSameTierX`).

1. Build undirected adjacency from edges with both endpoints present.
2. WCC via BFS/DFS; each component = list of node ids.
3. Per component, bbox from node positions + `LAYOUT_NODE_W` / `LAYOUT_NODE_H` (same constants as node-post).
4. **Top-align:** translate each component by `dy = -minY` so every island’s top sits on **y = 0**.  
   **Reject:** align to “current global minY without normalizing to 0” — same relative shelf, worse test determinism; fitView owns viewport.
5. **Sort** components by current `minX`, tie-break by min numeric ticket id.
6. **Pack X:** place first island so `minX = 0`; each next island’s `minX = prev.maxX + COMPONENT_SEP`.  
   `COMPONENT_SEP = 2 * LAYOUT_NODE_SEP` (80 today) — wider than card-card gap so islands read as blocks.  
   Rigid `dx`/`dy` applied to every node in the island.
7. Single-component graph: still normalize to `(0,0)` origin (cheap, deterministic).

**Reject:** parent-mean / BK-style recentering across islands — same fight documented for `packSameTierX`.  
**Reject:** re-running ELK per component — cost and edge-section inconsistency; place once, pack once.

## 5. Seam locations

| Seam | File | Responsibility |
| --- | --- | --- |
| Recipe flag + profiles | `layout-recipe.ts` | `packComponentsX`; new `ELK_RAW_POST_RECIPE`; migrate parse |
| External pipeline | `flowFromProjection.ts` | Call stage after Tier posts, before `elkEdgePost` |
| Component-pack Module | **`layout-component-post.ts`** (new) | WCC + bbox + rigid pack; export `COMPONENT_SEP` |

**Reject:** stuffing into `layout-node-post.ts` — that Module’s Interface is Projection-Tier-aware (`tiers` arg). Island pack is Tier-agnostic (`nodes` + `edges` only); separate file keeps Depth and Locality.

No second Adapter family: one function is the Interface; tests cross that Seam only.

## 6. UI toggle placement

In `WayfinderView` layout strip, **with the shared node-post toggles** (not under the ELK-only edge-post group):

1. Pin tier Y  
2. Pack same-tier X  
3. **Pack components X** ← new  
4. (if elk) Edge post-route + sub-flags  

Label: `Pack components X`. Hint in header optional: islands ≠ Projection Tier.

Applies for both engines; most useful with ELK + Tier posts off.

## 7. Profiles

| Profile | `packComponentsX` | Notes |
| --- | --- | --- |
| **production** | `false` | Unchanged: dagre + `pinTierY` + `packSameTierX`. |
| **elk-dogfood** | `false` | Keep Tier posts + full edge-post A/B. |
| **raw-elk** | `false` | Engine XY only. |
| **elk-raw+post** (new) | **`true`** | `{ engine: 'elk', pinTierY: false, packSameTierX: false, packComponentsX: true, elkEdgePost: true, all elk* subflags: true }` — dogfood “ELK layering + island shelf + polyline post”. |

Boot default stays **production**. Panel profile dropdown adds `elk-raw+post`.

**Reject:** turning `packComponentsX` on in production behind Tier pin — fights global Tier bands; dogfood first.

## 8. Tests

Through the Module Interface (`layout-component-post.test.ts`):

- Two disjoint edges → two islands; after pack, equal `minY === 0`, non-overlapping X with ≥ `COMPONENT_SEP` gap.
- Preserve relative XY inside an island (rigid body).
- Sort stability: overlapping/equal minX → ticket-id tie-break.
- Dangling edge (missing endpoint) does not merge islands.
- Singleton-only graph → origin normalize.
- Idempotent enough: second call leaves already-packed layout stable (or document single-pass expectation).

Pipeline / recipe:

- `flowFromProjection` with `ELK_RAW_POST_RECIPE`: Tier posts skipped, pack runs, elk edges present.
- `parseStoredRecipe` without the field → `false`.
- `recipeEquals` includes the flag.

**Reject:** screenshot/Playwright as the stage gate — pure XY fixtures are enough.

## 9. Out of scope

- Changing Projection Tier rules or production default away from Y-pin.
- True post-pack ELK re-layout / clearance (edge-post remains approximate remap).
- Vertical packing of islands (only top-align + X).
- Interactive drag that re-runs component pack.
- Using this for architecture-graph View (different edge kinds).

## 10. Implementation tickets

1. `feat(atlas): packComponentsX stage for wayfinder islands` — `layout-component-post.ts` + wire in `flowFromProjection` + recipe flag/migrate.
2. `feat(atlas): elk-raw+post layout profile and toggle` — profile constant, panel dropdown + checkbox, `recipeEquals`/persist.
3. `test(atlas): cover packComponentsX WCC and shelf pack` — unit fixtures + one pipeline profile assertion.
