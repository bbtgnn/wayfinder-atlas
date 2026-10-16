# Dogfood and fixtures

Type: grilling
Status: resolved
Blocked by: 08
Map: ../map.md

## Question

How does Atlas prove it can render real maps as this effort’s map grows?

1. **Primary fixture:** `.scratch/atlas/` live — always. Any harness/CI must load it.
2. **Regression fixture:** pin `.scratch/pre-build/` (resolved map) and/or a copied snapshot under `tools/atlas/fixtures/` if live pre-build churn hurts.
3. **Acceptance:** “renders N tickets and M edges” byte-stable report? Visual screenshot? Playwright?
4. **Growth rule:** adding a ticket to this map must not require fixture edits if the primary fixture is live `.scratch/atlas/`.

Decide fixture layout and the minimum automated check for S1.

## Answer

1. **Primary fixture:** **live `.scratch/atlas/`** — always. Harness and CI load the real effort map; no checked-in mirror of atlas under `tools/atlas/fixtures/`.

2. **Regression fixture:** **prefer live `.scratch/pre-build/`** (resolved map, second effort). Add an **optional frozen copy** under `tools/atlas/fixtures/` only if live pre-build churn breaks the harness; do not freeze by default. S1 projection already targets both dogfood efforts (`atlas`, `pre-build`) per ticket 08.

3. **Acceptance (S1):** a **byte-stable harness report** that asserts ticket count and edge count (and effort ids) from the projection — not screenshots. **Playwright / visual** checks wait for a later wave once the viewer is worth locking pixels.

4. **Growth rule:** adding or resolving an atlas ticket updates the live primary fixture automatically; **no fixture-file edits required**. Goldens for the harness report update only when counts/edges intentionally change (or when a frozen pre-build snapshot is introduced later).
