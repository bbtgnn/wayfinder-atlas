# Velite for .scratch markdown content

Type: research
Status: resolved
Blocked by:
Map: ../map.md

## Question

Can [Velite](https://velite.js.org/) be the content layer for Atlas S1: turn `.scratch/<effort>/map.md` and `issues/*.md` (and later ADRs) into a typed, validated data layer that a Svelte + Svelte Flow app consumes?

Answer from Velite docs and a minimal spike or config sketch against this repo’s real files — not marketing claims.

1. **Schema fit.** Zod (or Velite’s schema API) for wayfinder ticket front-matter lines (`Type:`, `Status:`, `Blocked by:`, `Map:`) and map sections (Destination, Notes, Decisions so far, Not yet specified / Fog, Out of scope). Can we model “Status line near the top” without forcing YAML frontmatter migration on day one?
2. **Collections.** One collection per effort vs glob `.scratch/*/issues/*.md` + maps. How do effort slugs and ticket numbers surface in generated types?
3. **Dev loop.** Watch mode with SvelteKit or Vite+Svelte; Bun compatibility; output location (`.velite/` gitignored vs committed).
4. **Dogfood.** Load `.scratch/atlas/` and `.scratch/pre-build/` in one build; call out anything that breaks on our heading/status conventions.
5. **Go / no-go.** If Velite forces a frontmatter rewrite or fights Bun, recommend the fallback (hand-rolled `Schema` parser, or gray-matter + zod) with a one-line reason.

Write findings to `.scratch/research/2026-10-15-velite-for-atlas.md`. The answer gists the go/no-go and the pin (Velite version) or the fallback.

## Answer

**Go** — pin **`velite@0.4.0`** with a custom wayfinder Markdown loader (`Key: value` lines → `data`); do not migrate to YAML frontmatter. Stock matter-loader alone is insufficient. Bun works (`bun velite`); set `root` to `.scratch` (not repo root) so globs see the tree; gitignore `.velite`. Empiric: atlas + pre-build in one `--strict` build (28 issues, 2 maps). Fallback if the loader/section transforms become a sink: hand-rolled parser + Zod (metadata is not YAML). Findings: [`.scratch/research/2026-10-15-velite-for-atlas.md`](../../research/2026-10-15-velite-for-atlas.md).
