# Commit trailers convention (L1)

Type: grilling
Status: resolved
Blocked by:
Map: ../map.md

## Question

How do commits declare ticket and spec links so Atlas can associate history without archaeology?

1. **Required trailers** on `feat` / `fix`: `Ticket:`, `Spec:`, `Effort:` — exact formats (e.g. `Ticket: atlas/14`, `Ticket: build/09`, `Spec: ADR-0002@3`, `Spec: kernel-spec#10`).
2. **When optional:** `docs`, `chore`, wayfinder claim/resolve commits.
3. **Lint:** extend `scripts/` (or atlas tooling) to check `main..HEAD`; fail CI or local-only for now?
4. **Backfill:** the three early build commits and any atlas charting commits — `git notes`, a small mapping file, or leave unlinked?

Decide the convention and lint strictness. Do not implement the linter in this ticket; spawn or defer implementation to a backlog when Wave B starts.

## Answer

**Required on `feat` / `fix`** (every such commit on effort branches and `main`):

| Trailer | Format | Examples |
|---------|--------|----------|
| `Ticket:` | `<effort>/<NN>` (no leading zeros required in NN; two-digit preferred) | `Ticket: atlas/14`, `Ticket: build/09` |
| `Spec:` | `ADR-NNNN@rev` and/or `kernel-spec#<section>` (repeat trailer for multiple) | `Spec: ADR-0002@3`, `Spec: kernel-spec#10` |
| `Effort:` | effort slug matching `.scratch/<effort>/` | `Effort: atlas`, `Effort: build` |

Multiple `Ticket:` / `Spec:` lines allowed. `Ticket:` may point at a wayfinder or build issue under that effort. If a feat/fix has no ADR/spec touch, still emit `Spec:` with the governing pin (e.g. the ADR the change implements); do not omit.

**Optional** (encouraged, not lint-required): `docs`, `chore`, and wayfinder-only claim/resolve/map commits. When present, use the same formats.

**Lint:** local `scripts/` first (check `main..HEAD` for missing trailers on `feat`/`fix`). **Do not fail CI yet** — Wave B backlog adds the script; CI gate is a later switch once the habit sticks. Atlas tooling may reuse the same checker later.

**Backfill:** use **`git notes`** (refs under `refs/notes/atlas` or similar) for early build commits and atlas charting commits — **never rewrite history**. A checked-in mapping file is a fallback only if notes prove painful to share; default is notes. Unlinked remains acceptable until notes land.
