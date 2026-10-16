# Package layout and S1 runtime

Type: grilling
Status: resolved
Blocked by:
Map: ../map.md

## Question

Lock where Atlas lives and how S1 runs, so the build backlog can scaffold without reopening structure.

1. **Path:** confirm `tools/atlas` (not `apps/atlas`). Workspace member in root `package.json` vs standalone package with its own lockfile.
2. **App shell:** SvelteKit vs Vite+Svelte SPA for a local-only dev tool. Criteria: file watching over `.scratch`, no public deploy, Svelte Flow (`@xyflow/svelte` or current package name), Velite (or fallback) integration.
3. **Glossary:** `tools/atlas/GLOSSARY.md` for Atlas terms (Topic, Area, Effort, Projection, Atlas, View). Which terms must be defined before S1 backlog vs can wait for first crystallize.
4. **Scripts:** root scripts (`bun run atlas`, `bun run atlas:build`) vs only local scripts inside `tools/atlas`.

Decide enough that ticket [Write S1 wayfinder build backlog](14-write-s1-wayfinder-build-backlog.md) can list concrete scaffold steps.

## Answer

1. **Path:** `tools/atlas` (not `apps/*` — Atlas is operator tooling, not a product surface). Add `"tools/*"` to root `workspaces` and make it a Bun workspace member sharing the repo lockfile. No separate lockfile.

2. **App shell:** **SvelteKit, local-only** (no public adapter / no deploy target). Pair with `@xyflow/svelte` and Velite (`velite@0.4.0` per ticket 01): `velite dev` + Kit `vite`/`dev` in parallel; build is `velite build --clean &&` Kit build. Kit wins over a bare Vite+Svelte SPA because Wave A already needs routes (effort switcher / kanban later) and the operator app’s Svelte 5 skills/MCP apply unchanged. File watch over `.scratch` is Velite’s job (`root=.scratch`); Kit does not need to own that watch.

3. **Glossary:** `tools/atlas/GLOSSARY.md` (stay out of product `CONTEXT.md` until crystallize). **Define before S1 backlog:** Atlas, Effort, Projection, View (plus operational Map / Ticket as used by the projection). **Defer to ticket 03 / crystallize:** Topic, Area (L0 vocabulary — not required to scaffold or render the wayfinder DAG).

4. **Scripts:** root `bun run atlas` → `tools/atlas` dev (Velite watch + Kit), and `bun run atlas:build` → production build of the same. Keep package-local scripts too; root entries are the operator entrypoints.
