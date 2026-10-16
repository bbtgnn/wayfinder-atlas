# Atlas

Operator wayfinder. It loads markdown maps and tickets and draws a blocker DAG. It is not an Attesta product surface.

Vocabulary: [`GLOSSARY.md`](./GLOSSARY.md).

## Run

```bash
bun install
bun test
bun run check
bun run dev
```

`bun run dev` serves **http://localhost:4444** (Velite watch and Vite together). The shipped fixture is enough; no Attesta checkout is required.

`bun test` builds Velite first (see `bunfig.toml`), then runs projection and wayfinder tests.

## Content root

Velite reads `ATLAS_CONTENT_ROOT`. When that variable is unset, the root is `./content` next to `velite.config.ts`.

Collections stay:

- `{atlas,pre-build}/map.md`
- `{atlas,pre-build}/issues/*.md`

Tickets use `Key: value` lines (`Type`, `Status`, `Blocked by`, `Map`), not YAML frontmatter.

Point the variable at another tree to load the same effort names from there. An Attesta `.scratch` directory still loads `atlas` and `pre-build`:

```bash
ATLAS_CONTENT_ROOT=/path/to/attesta-experiment/.scratch bun run dev
```

See [`.env.example`](./.env.example).

## Layout

The header button **Layout…** is the only control surface. There is no always-visible A/B strip.

Default recipe (all on):

| Flag | Role |
| --- | --- |
| `engine: 'elk'` | ELK layered placement |
| `packComponentsX` | Weakly-connected islands: top-align (`minY → 0`) and space along X |
| `elkEdgePost` | Remap sections, channel-mid L, downward clamp, obstacle clear |
| `elkSeparateLanes` | Separate lanes; still default-on |

Fixed order: `place → packComponentsX? → elkEdgePost?`. Dagre is an escape hatch (`DAGRE_RECIPE`) inside that same pipeline. Projection **Tier** stays on the model; it is not the layout Y driver. `layout-node-post.ts` remains in the tree and is unwired from the default path.
