# Wayfinder projection schema

Type: grilling
Status: resolved
Blocked by: 01
Map: ../map.md

## Question

What typed model does the S1 viewer consume between disk and Svelte Flow?

1. **Source of truth at runtime:** Velite-generated modules, a hand-built `atlas.json`, or parse-on-the-fly in the Vite plugin — pick one for S1.
2. **Schema:** Effort, Map (sections), Ticket (id, slug, title, type, status, blockedBy[], body/answer gist). Zod/Effect Schema/Velite schemas — one stack.
3. **Derived fields:** `frontier`, `blocked`, `resolved` computed in projection vs in the UI.
4. **Stability:** field names that S2 (kanban) and S3 can reuse without a break.

Output: a short schema sketch in the answer (types or JSON example). Implementation belongs in the S1 build backlog.

## Answer

1. **Runtime source of truth:** **Velite-generated typed modules** (import from `.velite`, gitignored). No checked-in `atlas.json` and no parse-on-the-fly Vite plugin for S1 — Velite owns load/validate/watch; the projection layer shapes collections into view models. (Fallback path from ticket 01 still applies at the content layer only, not a third runtime shape.)

2. **Schema stack:** **Velite `s` (Zod re-export)** only — same schemas that build collections. No Effect Schema for S1; no parallel Zod package. Collections stay global (`issues`, `maps`) with `effort` derived from `s.path()` (ticket 01).

3. **Derived fields:** compute **`frontier` / `blocked` / `resolved` (and ticket sets) in the projection layer**, not in Svelte components. UI reads ready-made buckets + edges; kanban (S3) reuses the same buckets/columns without re-deriving status rules.

4. **Stability for S2/S3:** keep these names frozen across views — `effort`, `ticketNumber`, `ticketSlug`, `title`, `type`, `status`, `blockedBy`, `mapSections`, `frontier`, `blocked`, `resolved`. Identity key: `${effort}/${ticketSlug}` (or `ticketNumber` within an effort). Do not rename status vocabulary (`open` | `claimed` | `resolved`) for wayfinder efforts; build-triage statuses stay out of this projection until a later board decides otherwise.

### Schema sketch

```ts
// Velite collections → projection (conceptual; implement in S1 backlog)

type TicketStatus = 'open' | 'claimed' | 'resolved'

type Ticket = {
  effort: string
  ticketNumber: number
  ticketSlug: string // e.g. 08-wayfinder-projection-schema
  title: string
  type: string // research | prototype | grilling | task | …
  status: TicketStatus
  blockedBy: number[] // normalized; blank/none → []
  body: string // markdown after meta
  answerGist?: string // ## Answer excerpt when present
}

type MapSectionId =
  | 'destination'
  | 'notes'
  | 'decisions'
  | 'fog'
  | 'outOfScope'
  | string // pass-through unknown H2s

type EffortMap = {
  effort: string
  title: string
  label?: string
  charted?: string
  sections: { id: MapSectionId; heading: string; body: string }[]
}

type EffortProjection = {
  effort: string
  map: EffortMap
  tickets: Ticket[]
  // derived in projection layer (not UI):
  frontier: Ticket[] // open ∧ unblocked ∧ unclaimed
  blocked: Ticket[] // has unresolved blocker
  resolved: Ticket[] // status === resolved
  edges: { from: number; to: number }[] // blocker → ticket (Blocked by)
}
```

S1 viewer imports Velite `issues` / `maps`, builds one `EffortProjection` per dogfood effort (`atlas`, `pre-build`), and feeds Flow/kanban from that object.
