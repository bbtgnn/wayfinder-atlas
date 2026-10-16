# Layout pipeline toggles (design)

## Current (simplified)

Recipe: `{ engine, packComponentsX, elkEdgePost, elkSeparateLanes }`.

Pipeline: `place → packComponentsX? → elkEdgePost?`. Inside edge-post, remap + channel-mid + clamp + clearObstacles always run (`ELK_EDGE_POST_ALL`); only `elkSeparateLanes` is optional. Tier posts (`pinTierY` / `packSameTierX`) remain as code Modules but are unwired from recipe/UI. Default = ELK + pack + edge-post, lanes off.

> Sections below are the original design archive (pin/pack tier flags, profile zoo). Treat as historical — superseded by the simplified recipe above.

---

Atlas wayfinder dogfood: interactive engine + post-fix controls behind one deep **Module**, not URL-param gymnastics.

Call chain (archive wording): `EffortProjection` → `flowFromProjection` → `layoutElk` | `layoutDag` → `WayfinderView` → SvelteFlow.

## 1. Verdict

**Yes — all post-fixes can turn off**, once they live behind a recipe seam rather than inside the engines.

Caveats (intentional, not blockers):

- ELK’s `edgeRouting: ORTHOGONAL` stays an **engine placement preference**, not a post-fix. Turning post-fixes off does not mean “diagonal ELK”; it means skip remap/enforce/clamp after placement.
- With `pinTierY` off, Y is raw engine output (dogfood experiment). Production default still pins Tier Y from Projection.
- With ELK edge-post off, edges fall back to Svelte Flow `smoothstep` (no polyline). Remap without pin/pack is undefined product value — recipe validation may force edge-post off when both node posts are off, or simply run remap against raw coords.

## 2. Deep module Interface: `LayoutRecipe`

One small type; callers learn this and nothing about dagre/ELK internals.

```ts
type LayoutEngine = 'dagre' | 'elk'

/** Ordered pipeline is fixed; flags only enable/disable named stages. */
type LayoutRecipe = {
  engine: LayoutEngine
  pinTierY: boolean       // Projection Tier → absolute Y (tierBandY)
  packSameTierX: boolean  // same-Tier horizontal clearance
  /** ELK only; ignored for dagre. Remap sections → enforceOrthogonal → clampDownwardExit. */
  elkEdgePost: boolean
}
```

**Callers must know:** engine choice; which of the three product stages run; that stage order is fixed (`place → pinTierY? → packSameTierX? → elkEdgePost?`); that `elkEdgePost` is a no-op on dagre.

**Stays hidden:** ELK partition options, FakeWorker, port IDs, remap math, orthogonal corner insertion, clamp rules, dagre `minlen` / ranker, NODE_W/H constants.

**Reject:** free-form stage arrays / reordering UI (order is fixed product knowledge; flags are enough). **Reject:** kitchen-sink of ELK layoutOptions booleans on the recipe (shallow Interface, leaks Implementation).

**Depth / Leverage:** `flowFromProjection(proj, recipe)` is the external **Seam**. One recipe drives layout, persistence, URL sync, and tests. Locality: post-fix bugs live in stage Adapters, not in both engines and the view.

## 3. Pipeline stages as Adapters

| Stage (Adapter) | Role | dagre | elk |
| --- | --- | --- | --- |
| **place** | Node XY from engine only | `layoutDag` raw | `layoutElk` raw (+ keep ELK sections on edges for later) |
| **pinTierY** | Overwrite Y from Projection tiers | yes | yes |
| **packSameTierX** | Same-tier X clearance | yes | yes |
| **elkEdgePost** | Remap → orthogonal → clamp; set `type: 'elk'` polylines | no | yes |

Fixed order inside `flowFromProjection` (or a tiny `runLayoutPipeline` helper it owns). Engines stop composing later stages.

## 4. Seam locations + migration

| Seam | File (proposed) | Responsibility |
| --- | --- | --- |
| Recipe type + profiles + resolve/persist | `tools/atlas/src/lib/wayfinder/layout-recipe.ts` | `LayoutRecipe`, `PRODUCTION_RECIPE`, `RAW_ELK_RECIPE`, load/save |
| External pipeline | `flow-from-projection.ts` | Projection → nodes/edges; dispatch place + optional stages |
| Place (dagre) | `layout.ts` | Raw dagre XY only |
| Place (elk) | `layout-elk.ts` | Raw ELK XY + attach unmapped sections / bend data |
| Node post | `layout-node-post.ts` (extract from `layout.ts`) | `pinTierY` / `tierBandY`, `packSameTierX` |
| Edge post | `layout-elk-edge-post.ts` (extract from `layout-elk.ts`) | remap / enforce / clamp |
| Engine resolve (narrow) | `layout-engine.ts` | Keep `LayoutEngine` union; recipe Module owns full resolve |
| UI → pipeline | `WayfinderView.svelte` | `$state` recipe; re-layout on change |

**Migration (peel, don’t layer):**

1. Extract `tierBandY` + `packSameTierX` to node-post Module; both engines (and tests) import from there.
2. Strip `layoutDag` / `layoutElk` so they return **raw placement** only (ELK still returns section payloads needed by edge-post).
3. Move remap/enforce/clamp into edge-post Adapter; `layoutElk` no longer calls them.
4. Wire `flowFromProjection(proj, recipe)` to run stages from flags.
5. Replace mount-time `resolveLayoutEngine()` const with reactive recipe state.

**Reject:** leaving posts inside engines behind optional params (`layoutElk(..., { pinTierY })`) — fake seam; two call sites still own composition; flags leak through place Adapters.

## 5. UI

**Panel composition (header or collapsible “Layout” strip):**

1. Engine select: `dagre` | `elk`.
2. Shared node-post toggles: Pin tier Y · Pack same-tier X.
3. If `engine === 'elk'`: Edge post-route toggle (single control for the whole elkEdgePost Adapter — not three internal steps).

Primary UX is the panel. **Persist:** `localStorage['atlas.layoutRecipe']` (JSON of `LayoutRecipe`). Migrate old `atlas.layoutEngine` string into `{ engine, …production posts }`. **Optional URL sync:** write `?layout=` + compact stage flags on change; read on boot with URL > storage > default. URL is secondary, not the control surface.

**Reactive re-layout:** today `WayfinderView` freezes `const layoutEngine = resolveLayoutEngine()` at script init and only re-layouts on fixture switch. Recipe must be `$state`; any toggle/engine change re-invokes `flowFromProjection` and reassigns `nodes`/`edges` (same path as `applyProjection`). Keep `{#key effort}` for fixture remount; do **not** remount Flow on every toggle if reassignment + `fitView` is enough — prefer reassign to avoid focus loss.

## 6. Defaults / profiles (historical)

> Superseded: profile zoo removed. Live defaults are `DEFAULT_RECIPE` / `DAGRE_RECIPE` in `layout-recipe.ts` (see **Current (simplified)**).

| Profile | Recipe | Use |
| --- | --- | --- |
| **production** | `{ engine: 'dagre', pinTierY: true, packSameTierX: true, elkEdgePost: false }` | Ship / cold start default |
| **elk-dogfood** | `{ engine: 'elk', pinTierY: true, packSameTierX: true, elkEdgePost: true }` | Current ELK path A/B |
| **raw-elk** | `{ engine: 'elk', pinTierY: false, packSameTierX: false, elkEdgePost: false }` | Experiment: engine placement as-is |

Panel can expose a profile dropdown that sets the recipe, then allow per-stage tweaks. Default boot = **production**.

## 7. Test seams

Unit-test each Adapter through its Interface (same surface callers use):

- **place:** fixtures assert engine XY without tier pin (new expectations; today’s “Y === tierBandY” moves to pinTierY tests).
- **pinTierY / packSameTierX:** pure node arrays in/out.
- **elkEdgePost:** section → points; clampDownwardExit already isolated — keep it on the edge-post Module.
- **recipe resolve:** storage / URL / default precedence (extend `layout-engine.test.ts` patterns into `layout-recipe.test.ts`).
- **pipeline:** one integration test per profile shape via `flowFromProjection`.

## 8. Out of scope

- True post-pack ELK re-route / clearance (remap remains approximate).
- Adopting ELK as the production default (spike recommendation stands: dagre default).

## 9. Suggested tickets

1. `refactor(atlas): extract wayfinder node-post stages from layout engines` — Peel `tierBandY` / `packSameTierX`; engines return raw placement.
2. `refactor(atlas): extract elk edge-post Adapter from layoutElk` — Remap/enforce/clamp become a named stage with section input.
3. `feat(atlas): LayoutRecipe seam on flowFromProjection` — Recipe type, profiles, pipeline composition, recipe resolve/persist.
4. `feat(atlas): wayfinder layout controls panel with live re-layout` — Engine + conditional toggles; fix mount-frozen engine; localStorage (+ optional URL sync).
5. `test(atlas): unit-cover layout pipeline stages and profiles` — Place / node-post / edge-post / recipe precedence fixtures.
