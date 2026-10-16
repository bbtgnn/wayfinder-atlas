# Process kanban view decisions

Type: grilling
Status: resolved
Blocked by: 08
Map: ../map.md

## Question

S3: a process kanban over the same projection as the wayfinder — columns and cards without conflating architecture.

1. **Columns:** wayfinder (`open` / `claimed` / `resolved`) and/or build triage? One board per effort?
2. **Cards:** same ticket identity as Flow nodes; blocked tint; click opens the same detail as wayfinder.
3. **Relationship to Flow:** separate route/mode vs split pane? No single canvas that mixes topic nodes with status columns.
4. **Scope for first kanban backlog:** only wayfinder efforts, or include `.scratch/build` triage board?

Decide UX + data rules. Spawn a build backlog only when S1 viewer exists and this ticket resolves (Wave A).

## Answer

1. **Columns:** wayfinder statuses only — **`open` / `claimed` / `resolved`** (same vocabulary as ticket 08). **One board per effort.** Build-triage columns are out of this board; dual status systems stay separate (ticket 06).

2. **Cards:** **same ticket identity** as Flow nodes (`${effort}/${ticketSlug}` / `ticketNumber` within effort). Blocked tint from projection `blocked`; click opens the **same ticket detail** as the wayfinder. No parallel card model.

3. **Relationship to Flow:** **separate route/mode** (Kit routes from ticket 02) — not a split pane and not one canvas mixing DAG nodes with status columns. Switch effort → same projection feeds either view.

4. **First kanban scope:** **wayfinder efforts only** (`atlas`, `pre-build`, …). Defer a `.scratch/build` triage board until after S1 ships and a dedicated backlog is spawned. **Do not spawn the S3 build backlog from this ticket alone** — wait until the S1 viewer exists (Wave A gate per map Notes).
