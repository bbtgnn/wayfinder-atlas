# Atlas: visualize research, wayfinding, and the system

Label: wayfinder:map
Charted: 2026-10-15

## Destination

The full Atlas route is charted on this map and stays consistent as it grows. A first vertical slice ships: a Svelte + [Svelte Flow](https://svelteflow.dev/) wayfinder viewer under `tools/atlas` that renders `.scratch` maps (this effort’s map is the primary dogfood fixture). Later slices (process kanban, architecture graph, spikes guide, conventions, projection, Effect overlay) are decided here; each implementation gate spawns its own build backlog rather than executing inside wayfinder tickets. When this map’s open tickets are cleared and the S1 backlog exists (and can be walked), the route to a living Atlas is clear.

## Notes

- **Layers** (orthogonal; do not conflate in tickets): **L0** vocabulary (`topics.yaml` — Topic vs Area); **L1** conventions (commit trailers, ADR revisions, tracker lifecycle, spike tags); **L2** projection (`atlas.json` / content layer); **L3** views (wayfinder, process kanban, architecture, spikes, diffs); **L4** runtime overlay (Effect spans — longer term).
- **Vertical slices** (agreed order): Wave A S1–S3 (wayfinder → effort switcher → process kanban); Wave B S4+S8 (vocabulary + trailers, parallel); Wave C S5–S7 (architecture → spikes → link); Wave D S9–S11 (spec↔commits → tagged diff → ADR revisions); Wave E S13→S12 (tracker lifecycle → archive); Wave F S14→S15 (Effect runtime → view morph). Candy (S15) and archive-from-git stay fog until the viewer needs them.
- **Stack (S1):** Svelte (SvelteKit or Vite+Svelte — ticket) + Svelte Flow for the ticket DAG. [Velite](https://velite.js.org/) is the candidate for Markdown → typed content from `.scratch`; confirmed or rejected by research before the S1 backlog. **Effect is not required for S1**; it returns as a longer-term ticket (generator and/or L4 overlay). Foldkit is not the Atlas UI (operator app remains SvelteKit per effect-stack architecture-only).
- **Package:** `tools/atlas`. Glossary for Atlas terms lives at `tools/atlas/GLOSSARY.md` (not a second product glossary in `GLOSSARY.md` until crystallize if needed). See root `GLOSSARY-MAP.md`.
- **Dogfood:** This map (`.scratch/atlas/`) is the live primary fixture; live `.scratch/pre-build/` is the regression effort (optional frozen copy under `tools/atlas/fixtures/` only if churn hurts). S1 acceptance = byte-stable harness ticket/edge counts; Playwright later.
- **Plan vs build:** Wayfinder tickets decide. When an implementation gate is reached, write a build plan/backlog associated with that ticket (one or more issues under `.scratch/atlas-build/` or similar) — same pattern as pre-build → build.
- **Skills:** `research` for research; `prototype` for UI/behavior spikes; `svelte-core-bestpractices` + Svelte MCP for `.svelte` / `.svelte.ts`; `grilling` + `domain-modeling` when sharpening Atlas terms or ADR-worthy boundaries; `wayfinder` to work this map.
- **Research findings:** `.scratch/research/YYYY-MM-DD-<slug>.md` on the `atlas` branch (not a separate unmerged research branch).
- **Spikes:** if needed, `spikes/atlas-NN-<slug>/`, never imported by `packages/*` or `apps/*`.
- **Standing preferences:** recommendations over option lists; plain prose; challenge the user; Atlas must not rewrite Attesta product ADRs for tooling convenience.
- **Settled at charting (no ticket):** destination shape B (full route + S1 proof); name Atlas; implementation tickets spawn build backlogs; Svelte Flow not Foldkit for the graph; Q6–Q8 recommendations (tools/atlas, dogfood atlas+pre-build, sharp tickets for waves A–C + conventions + Effect-later, rest in fog).

## Decisions so far

<!-- one line per resolved ticket: [title] (`issues/NN-slug.md`): gist -->
- [Velite for .scratch markdown](issues/01-velite-for-scratch-markdown.md): go — pin velite@0.4.0 + custom Key:value loader (no YAML migration); root=.scratch; gitignore .velite; fallback hand-rolled+zod — `.scratch/research/2026-10-15-velite-for-atlas.md`
- [Topics and areas vocabulary](issues/03-topics-and-areas-vocabulary.md): topics=draft list; areas=kernel|engine|web-server|browser|infra|docs; `topics.yaml` at repo root; spikes included; commit scope prefers topic (area ok for chores); file deferred to Wave B
- [Commit trailers convention](issues/04-commit-trailers-convention.md): feat/fix require Ticket:/Spec:/Effort:; docs/chore/wayfinder optional; lint local scripts first (CI later); backfill via git notes not rewrite
- [ADR revision model](issues/05-adr-revision-model.md): node=(id,rev); frontmatter revisions+relations pin @rev; kinds decide|clarify|amend|supersede (section required on supersede/partial); OpenSpec DEFER; backfill 0001–0014
- [Tracker lifecycle rewrite](issues/06-tracker-lifecycle-rewrite.md): brainstorm→chart→plan→work→crystallize→archive; dual statuses; build stays done (no delete); wayfinder may archive; research on effort branch — `docs/agents/issue-tracker.md` rewritten
- [Package layout and S1 runtime](issues/02-package-layout-and-s1-runtime.md): tools/atlas workspace member (add tools/*); SvelteKit local-only + @xyflow/svelte + Velite; glossary at tools/atlas/GLOSSARY.md (Atlas/Effort/Projection/View before S1; Topic/Area defer); root scripts atlas / atlas:build
- [Wayfinder projection schema](issues/08-wayfinder-projection-schema.md): Velite `.velite` modules as S1 SoT (no atlas.json); Velite `s` schemas; frontier/blocked/resolved derived in projection; stable fields for kanban reuse
- [Wayfinder Svelte Flow model](issues/07-wayfinder-svelte-flow-model.md): nodes=tickets (title/type/status); map sections=prose panel; edges=Blocked by only; frontier highlight; click→gist (no md); dagre LR auto; effort switcher→S2 (S1=fixture toggle) — `spikes/atlas-07-wayfinder-flow/`
- [Dogfood and fixtures](issues/09-dogfood-and-fixtures.md): primary=live `.scratch/atlas/`; regression=live `pre-build` (+ optional `tools/atlas/fixtures/` freeze if churn); S1 acceptance=byte-stable ticket/edge report; Playwright later
- [Process kanban view decisions](issues/10-process-kanban-decisions.md): columns=open/claimed/resolved; one board per effort; same ticket ids as Flow; separate route/mode; wayfinder efforts first — build triage board later (S3 backlog after S1 exists)
- [Architecture graph view decisions](issues/11-architecture-graph-decisions.md): node=(topic,area); IMPORTS|HTTP_CALLS folded via topics.yaml ≤1 undirected edge/pair; non-overlapping area rects; tools/atlas → docs
- [Spike navigator decisions](issues/12-spike-navigator-decisions.md): globs + optional README Topics:/Extends:; Extends explicit line; list+detail v1 (not on arch graph); Ticket: optional; spikes out of S1
- [Effect generator and runtime overlay](issues/13-effect-generator-and-runtime-overlay.md): L2 Effect generator DEFER (Velite owns S1); L4 runtime overlay DEFER until apps expose Effect Layers
- [Write S1 wayfinder build backlog](issues/14-write-s1-wayfinder-build-backlog.md): `.scratch/atlas-build/` (01–06); **walked 2026-10-15** — all `done`; `bun run atlas` / `atlas:build` / harness green

## Not yet specified

- Tagged diff viewer UX (after-state + topic-colored hunks) once trailers exist.
- Archive-from-git reconstruction UX for deleted tickets after tracker lifecycle lands.
- Architecture↔kanban morph animation (S15).
- codebase-memory as the sole code-edge provider vs ts-morph fallback.
- Effect DevTools / file-backed Tracer shape for L4 once apps expose Layers.

## Out of scope

- Replacing the operator app (`apps/web`) with Foldkit or abandoning `@sjsf/form` for Atlas’s sake.
- Implementing Attesta product features (kernel, engine, streams) inside this effort.
- Building S2+ inside wayfinder tickets — only spawn backlogs when their decision tickets resolve.
- Merging or blocking on the `effect-stack` product retrofit; Atlas only consumes Effect when a ticket here chooses it.
- Rewriting git history to backfill trailers (use `git notes` or a mapping file if needed).
