# wayfinder-atlas

Experimental viewer for a [wayfinder](https://github.com/mattpocock/skills/blob/main/docs/engineering/wayfinder.md), Matt Pocock’s method for charting a large effort before anyone builds it.

The method writes a shared map of decision tickets. Each ticket is a question, not a slice of implementation. Tickets name what blocks them. The frontier is whatever is still open, unblocked, and unclaimed. Fog is the decisions you can see coming and cannot state yet. His skill stores that map on an issue tracker or as local markdown. This repo reads the local form and draws the blocker links as a graph.

The live page is [bbtgnn.github.io/wayfinder-atlas](https://bbtgnn.github.io/wayfinder-atlas/). It shows the two maps this experiment was tried on, `atlas` and `pre-build`, under `.scratch/`. The layout is still being fiddled with.

Vocabulary for the words on the map: [`GLOSSARY.md`](./GLOSSARY.md).

## Run

```bash
bun install
bun test
bun run check
bun run dev
```

`bun run dev` serves http://localhost:4444. Velite watches `.scratch` and Vite serves the app.

`bun test` builds Velite first (see `bunfig.toml`), then runs the projection and layout tests.

A Pages build needs the repo path:

```bash
BASE_PATH=/wayfinder-atlas bun run build
bun run preview
```

## Content

Velite reads `ATLAS_CONTENT_ROOT`. Unset, that is `./.scratch` next to `velite.config.ts`.

It collects:

- `{atlas,pre-build}/map.md`
- `{atlas,pre-build}/issues/*.md`

Tickets use `Key: value` lines (`Type`, `Status`, `Blocked by`, `Map`), the same shape as Pocock’s local tracker, not YAML frontmatter.

Point the variable at another directory that uses those two effort names:

```bash
ATLAS_CONTENT_ROOT=/path/to/scratch bun run dev
```

See [`.env.example`](./.env.example).

## Layout

**Layout…** in the header is the only control. The default recipe is all on: ELK placement, packing disconnected islands along X, edge post-routing, and separate lanes. Order is `place`, then pack, then edge post. Dagre is the other engine in that same pipeline. Projection Tier is stored on each ticket and does not drive Y.
