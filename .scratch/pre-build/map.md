# Pre-build: from design artifacts to a build backlog

Label: wayfinder:map
Charted: 2026-10-14

## Destination

Nothing left to decide before building. The spike's technical questions are answered against real libraries, `docs/kernel-spec.md`, `packages/kernel/fixtures/` and `docs/adr/` are amended for whatever the answers change, and the build is handed off as an ordered backlog of implementation issues under `.scratch/build/issues/`, triaged `ready-for-agent` where fully specified.

## Notes

- Domain: `GLOSSARY.md` is the vocabulary; `docs/kernel-spec.md` the rules; `docs/adr/0001`–`0011` the reasons. Read in that order before any ticket. The original design conversation is exported at `~/Desktop/cursor_attesta_system_requirements_revi.md`; the handoff that seeded this map is `/var/folders/5l/34rm8c_s3j9fn3kfhf8bjb140000gn/T/attesta-experiment-handoff.md`.
- Skills: `research` for research tickets; `prototype` for prototype tickets; `svelte-core-bestpractices` and the Svelte MCP (`list-sections`, `get-documentation`, `svelte-autofixer`) for anything `.svelte`/`.svelte.ts`; `domain-modeling` when a resolution touches `GLOSSARY.md` or adds an ADR.
- Spike code lives in `spikes/<ticket-slug>/` in this repo and is committed, so findings stay reproducible. It is never imported by `packages/*` or `apps/*`. This overrides the prototype skill's throwaway-branch default.
- Research findings are written to `docs/research/<ticket-slug>.md` on a local `research/<ticket-slug>` branch (no remote exists yet). The branch is never merged; the ticket's answer gists it and links the branch.
- Standing preferences: recommendations over option lists; plain prose; challenge the user; the action is **Seal**, the unit is **Step**.
- Confirmed at charting (no ticket): derived evaluation is skipped while a step has ref errors, `undefined` is a failure and `null` a value (kernel spec §5.2); organization and role display names stay inside the executable hash (§1.2); Cerbos is kept for both the engine (`step_policy`) and the SvelteKit server's people/organization actions, so the four ported policies (`catalog`, `org_admin_console`, `platform_admin_console`, `stream`) are re-based on the new vocabulary rather than deleted.
- Build order after this map, already agreed: kernel against fixtures → engine (events, seals) → web read-only timeline from events → drafts and sync → seal flow → attachments → DPP reading seals → load the example blueprint → port affiliation, onboarding and admin from `GLOSSARY.md` → public pages → remove Go.

## Decisions so far

<!-- one line per resolved ticket: [title] (`issues/NN-slug.md`): gist -->
- [JSONata failure modes](issues/03-jsonata-failure-modes.md): pin jsonata@2.2.2; throws/`undefined` → `derived-failed`, `null` seals; AST deny-list + `$eval` reject; `timeout: 50`; proposed seal-validation `derived-failed` fixture; sync-vs-async and NaN/Infinity left for amend-spec
- [automerge-repo server-side authorization and frozen documents](issues/02-automerge-repo-authorization.md): auth on WS upgrade; `shareConfig.access` for `work` (not bare `sharePolicy`); freeze = revoke access + `doc-unavailable`; actor from JWT `sub` at connect; custom MongoDB `StorageAdapterInterface`; freeze/push edge cases for engine/prototype
- [Appwrite facts for the identity adapter](issues/01-appwrite-facts.md): pin Appwrite 2.5.0 + node-appwrite 29.3.1; session client for Invitations, API key for Join/Org-creation approval; TablesDB; kernel slug subset; Role catalog in team prefs
- [sjsf facts for the binding](issues/04-sjsf-facts.md): pin @sjsf/* 3.9.0 + shadcn4-theme; controlled bind, no onChange; custom string + attachment widgets required; stock file widgets wrong shape

- [Local dev environment](issues/09-local-dev-environment.md): compose Appwrite 2.5.0 :8080, Mongo 27018, Cerbos 3592, Mailpit 8025/1025; `bun run dev:infra` + smoke; console HITL for project/API key/TablesDB/SMTP
- [Engine surface outline](issues/10-engine-surface-outline.md): SSE events + REST commands; WS `/api/sync` for drafts; GridFS blobs; notary PEM + fingerprint keyId; Cerbos deny-on-down — see `spikes/10-engine-surface-outline/`
- [sjsf ↔ Automerge binding](issues/05-sjsf-automerge-binding.md): custom string widget from day one for splices; keep 300ms validation debounce; caret heuristic OK for v1 — see `spikes/05-sjsf-automerge-binding/`
- [Cerbos policies for people/organization actions](issues/13-cerbos-people-org-vocabulary.md): eight resource kinds; principal attrs from Appwrite SSR; deny when Cerbos unreachable; rename hasProcesses→hasStreamInstances
- [Deployment and notary key custody](issues/14-deployment-and-notary-custody.md): Coolify web+engine; PEM via env path (gitignored locally / secret in prod); keyId fingerprint; well-known keeps historical publics; test public OK in fixtures
- [Attachments as content-addressed references](issues/08-content-addressed-attachments.md): IndexedDB upload queue; scalar LWW / array index merge; blob-missing from engine+queue; no GC v1; custom attachmentFileWidget — `spikes/08-content-addressed-attachments/`
- [Offline collaboration harness](issues/06-offline-collaboration-harness.md): dual-peer converge ~150ms; offline reconnect preserves edits; WASM ~1.1MB gzip → lazy-load off non-draft routes; form docs ~2.7KB/500 edits — `spikes/06-offline-collaboration-harness/`
- [Seal freeze and stale-heads flow](issues/07-seal-freeze-and-stale-heads.md): freeze = revoke shareConfig.access + doc-unavailable; stale = 2× POST /seal; late-peer diff via seal heads; read-only via GET sealed artifact — `spikes/07-seal-freeze-and-stale-heads/`
- [Amend spec, fixtures and ADRs](issues/11-amend-spec-fixtures-adrs.md): kernel-spec §4–§10 + JSONata 2.2.2; derived-failed fixture; ADR 0012 Cerbos; untp pending re-base
- [Write the build backlog](issues/12-build-backlog.md): 18 issues under [`.scratch/build/`](../build/) (`spec.md` → `docs/kernel-spec.md`); order kernel (TDD) → engine → web timeline → drafts → seal → attachments → DPP reads → blueprint load → people surfaces → UNTP → public pages → remove Go → cutover; first issue `01-kernel-validate-blueprint-and-version` is `ready-for-agent`

## Fog (post-map)

- **Browser / offline Cerbos** was not in pre-build spikes (only [engine surface outline](issues/10-engine-surface-outline.md) and [people/org vocabulary](issues/13-cerbos-people-org-vocabulary.md)). Later spike **13** recorded ePDP + Hub exclusivity; build [issue 29](../build/issues/29-offline-people-org-authz.md) chose **(B)** Attesta-owned offline projection (no Hub) — see [issue 30](../build/issues/30-offline-people-org-projection.md) and post-review map Decisions-so-far.

## Out of scope

- Everything in kernel spec §10: conditional edges, rework loops, dynamic fan-out beyond the `#n` suffix, field-level view gates, k-of-n seals, user-side signatures, external anchoring, org-authored blueprint fragments, step kinds other than `form`.
- In-app blueprint authoring (ADR-0011), demo data migration (ADR-0001), the Formata runtime and builder, the old CSS token system (ADR-0009).
- The build itself. This map ends when the backlog exists; walking it is a separate effort under `.scratch/build/`.
- The old Go repository: reference only, never edited.
