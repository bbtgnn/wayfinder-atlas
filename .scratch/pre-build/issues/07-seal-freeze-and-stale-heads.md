# Seal freeze and stale-heads flow

Type: prototype
Status: resolved
Blocked by: 02, 06
Map: ../map.md

## Question

Kernel spec §4.2 and §5.2 describe what happens around a seal: the client sends the heads it rendered, the engine rejects with `stale` if they moved, and after sealing the engine refuses every later change and surfaces "sealed without these edits" to a late peer. Does this flow work end to end on automerge-repo, and does it feel right?

On the harness from the offline collaboration spike, using the approach found by the automerge-repo research, add a minimal seal endpoint and drive with the user:

1. Context B edits after A has rendered; A seals with its heads; the engine answers `stale` with current heads; A re-renders and confirms. How many round trips, and what does A see in between?
2. A seals successfully; the document is frozen. B, online, types: what does B see, how fast?
3. B went offline before the seal, kept typing, reconnects: B's changes are refused; B is shown which of its edits were not sealed. Is the information available to render that, or only "rejected"?
4. Can a frozen document still be opened read-only by a new peer from the engine, and does it reproduce the sealed `snapshot.data` at the pinned heads?

Decide: the freeze mechanism the engine will use, what the client renders in each case, and any spec wording that must change. Spike in `spikes/07-seal-freeze-and-stale-heads/`.

## Answer

Recorded 2026-10-14. **Harness:** Node dual-peer (`spikes/07-seal-freeze-and-stale-heads/scripts/run-harness-node.ts`) + engine stub (`engine-server.ts`: `POST /draft/open`, `POST /seal`, `GET /sealed-draft`). **Playwright not used** — same `chromium.launch()` hang as spike 06; Node path is authoritative here.

### 1 — Stale heads then re-confirm

- **Round trips:** **2** HTTP `POST /seal` (first **409** `stale` + `currentHeads`, second **200** success) plus **1** reconnect sync (~**82 ms** in last run) before the confirming seal.
- **What A sees in between:** Confirm UI still reflects **render-time** heads/value (`base`) while offline; **409** returns engine **currentHeads**; after reconnect, live draft shows **B’s edit** (`base-B-edit`) and heads match engine; second seal succeeds on merged state.
- Evidence: `measurements/harness-report.json` → `question1_staleSeal`.

### 2 — Online B types after freeze

- **`doc-unavailable` ~1–3 ms** after B’s post-seal `change()` in harness; **local edit still applies** on the client (`ready` → `readyB-late`) while **engine sealed snapshot stays `ready`**.
- **UX:** Disable editing on **`doc-unavailable`** and/or instance **`step.sealed` (SSE)**; show read-only sealed materialization — do not treat the local fork as authoritative.
- Evidence: `question2_onlineFreeze`.

### 3 — Late offline peer

- After seal, B reconnects with **divergent heads**; **not merged**. App can render **“sealed without these edits”** using **seal `heads` + `snapshot.data`** (HTTP / SSE) and **`Automerge.view(localDoc, sealHeads)`** vs full local doc (`late` vs `late-offline-B` in harness). Stock repo only gives generic **`doc-unavailable`**, not structured rejected ops.
- Evidence: `question3_lateOfflinePeer` (`canRenderSealedWithoutTheseEdits: true`).

### 4 — Read-only open for new peer

- **`repo.find` over sync after freeze → unavailable** in harness; **read-only works** via **`GET /sealed-draft`** → `Automerge.load` + materialize at pinned heads (**matches `snapshot.data`**).
- Evidence: `question4_readOnlyNewPeer`.

### DRI decisions (user away)

| Area | Decision |
| --- | --- |
| **Freeze mechanism** | On `step.sealed`: persist seal + final Automerge bytes; set **`shareConfig.access(documentId) = false`**; call **`shareConfigChanged()`** (research/02). Inbound peer edits are refused; peers get **`doc-unavailable`**. |
| **Stale seal UX** | Client sends rendered heads; **409 `stale` + `currentHeads`**; re-render after sync settles; user re-confirms (kernel §5.2). |
| **Online after seal** | Read-only UI on **`doc-unavailable` + sealed instance state**; block/disable local `change` even though Automerge still accepts it locally until app policy kicks in. |
| **Late offline peer** | On reconnect, fetch seal; if local heads extend past seal heads, diff **view@sealHeads** vs live doc for copy; never merge late ops. |
| **Read-only open** | Do **not** rely on live sync for sealed drafts; serve sealed binary/snapshot over HTTP (production: seal API / export); client **view-pin** at seal heads. |
| **Spec wording** | **Amend kernel-spec §4.2:** replace “sync peers receive the rejection **and the frozen heads**” with: engine **revokes access** (`doc-unavailable`); **frozen heads and snapshot** reach clients via **seal record / read API**, not guaranteed over automerge-repo sync alone. |

**Run:** `cd spikes/07-seal-freeze-and-stale-heads && bun install && bun run harness` → `measurements/harness-report.json`.

## Comments

