# Spike navigator decisions

Type: grilling
Status: resolved
Blocked by: 03
Map: ../map.md

## Question

S6–S7: spikes as first-class Atlas nodes — topics/areas/folders and links to tickets — as a code guide.

1. **Metadata:** derive topics/areas from `topics.yaml` globs under `spikes/**` only, or require README `Topics:` / `Extends:` lines?
2. **Extends chain:** parse README links vs explicit `Extends: 06-offline-collaboration-harness`.
3. **UI:** list + detail vs nodes on the architecture graph; how deep “open folder” goes (path list vs editor deep link).
4. **Ticket link:** convention `Ticket: .scratch/.../issues/NN-...` in README?

Decide the spike model and what S1 can ignore (spikes out of S1 is fine).

## Answer

1. **Metadata:** **derive topics/areas from `topics.yaml` globs** under `spikes/**` (same map as ticket 03). README `Topics:` / `Extends:` lines are **optional overlays** — useful for author intent and Extends chains, never required for a spike to appear. Missing README → still listed from folder + globs.

2. **Extends chain:** prefer an **explicit** `Extends: <spike-slug>` line (e.g. `Extends: 06-offline-collaboration-harness`). Do not rely on parse-only of markdown link text for the chain; links may still appear in prose for humans.

3. **UI (v1):** **list + detail** as the spike navigator — not nodes on the architecture graph. Detail shows derived topics/areas, optional Extends, optional Ticket, and a **path list** of files under the spike folder. Editor deep links / “open in IDE” are out of v1. Spikes stay off the S5 architecture graph until a later slice explicitly adds them.

4. **Ticket link:** **optional** README convention `Ticket: .scratch/<effort>/issues/NN-...` (or equivalent relative path). No enforcement in S1–S6; when present, detail surfaces it as a link into the wayfinder ticket.

**S1 ignore:** spikes are out of the S1 wayfinder backlog entirely — no spike collection, navigator, or graph coupling required to ship S1.
