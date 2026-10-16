# Amend spec, fixtures and ADRs with spike findings

Type: task
Status: resolved
Blocked by: 01, 03, 05, 06, 07, 08, 10
Map: ../map.md

## Question

Fold every resolved ticket's answer into the design artifacts so the build starts from documents that match reality. Nothing new is decided here; where an answer contradicts an ADR, write a superseding ADR rather than editing the old one silently.

- `docs/kernel-spec.md`: §4.1 write strategies and debouncing (binding spike); §4.2 freeze semantics and what a late peer sees (seal-freeze spike); §4.3 attachment reference and queue (attachments spike); §5.2 and §6 JSONata failure modes and the sync/async implication for the kernel surface (JSONata research); a new section for the engine surface (engine outline).
- `packages/kernel/fixtures/`: add the `derived-failed` case proposed by the JSONata research; update `README.md` codes.
- `docs/adr/0002`: bundle and persistence findings; `0007`: the two verified Appwrite behaviors and the adapter's resulting shape; `0009`: validated `StepDraft` shape; `0006`/new ADR: Cerbos used by both engine and SvelteKit server, with the ported policies re-based (confirmed at charting).
- `GLOSSARY.md`: any term the spikes introduced or sharpened (run `domain-modeling`).
- `docs/untp.md`: mark it as the previous implementation's description pending re-basing (the re-basing itself is fog, see the map).
- `README.md` status line.

One commit per artifact group, Conventional Commits. Resolved when every spec change has its fixture and every contradiction its ADR.

## Answer

Folded tickets 01–10, 13, 14 into `docs/kernel-spec.md` (§4.1–4.3, §5.2/§6 JSONata + sync blocking, §9 Cerbos, new §10 engine surface, §11 out of scope), `packages/kernel/fixtures/` (`derived-failed` on `@refs-with-gapkg`, README), ADRs 0002/0007/0008/0009 amended + **0012** Cerbos engine/web, `GLOSSARY.md` (StepDraft, attachment queue), `docs/untp.md` pending re-base banner, README status. Open: NaN/Infinity derived values, regex ReDoS, one stale `validate-for-seal` ref case vs sealed snapshot.

## Comments
