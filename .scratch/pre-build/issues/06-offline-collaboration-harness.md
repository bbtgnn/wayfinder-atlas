# Offline collaboration harness

Type: task
Status: resolved
Blocked by: 05
Map: ../map.md

## Question

Extend `spikes/05-sjsf-automerge-binding/` into `spikes/06-offline-collaboration-harness/`: the bound form from the binding spike, an automerge-repo WebSocket sync server (Bun), IndexedDB storage in the browser, two browser contexts. Drive, without the user, and record numbers and observations:

1. Both contexts online, editing the same string and the same array: convergence and merge quality.
2. Context A offline (network blocked), both keep editing, A reconnects: convergence, no lost edits, time to converge.
3. Reload a context while offline: the draft is restored from IndexedDB with its heads.
4. Production bundle size of the web route with Automerge WASM, broken down (Automerge, automerge-repo, sjsf, shadcn), gzip and brotli; time to interactive on a throttled connection.
5. Document size after 500 edits; whether compaction matters for form-sized documents.

Resolved when the five measurements are recorded in the answer with the commands to reproduce them. The decision this unblocks: whether Automerge's cost is acceptable as-is (ADR-0002 consequence) or needs mitigation (lazy loading, a worker) noted in the amendment.

## Answer

Spike: `spikes/06-offline-collaboration-harness/`. **Playwright** `bun run harness` (build + vite preview, real IndexedDB). **Node** `bun run harness:node` (DummyStorageAdapter stand-in). Shared IDB name `spike06`; offline reload uses `?offline=1` so WebSocket does not race storage. Reports: `measurements/harness-playwright-report.json`, `measurements/harness-node-report.json`, `measurements/bundle-report.json`, `measurements/doc-size-report.json`.

### Measurements

| # | Result | Reproduce |
| --- | --- | --- |
| **1 — Online dual edit** | Converged ~150–170 ms; character-level title merge; identical JSON both contexts. | `cd spikes/06-offline-collaboration-harness && bun run harness` |
| **2 — Offline A, reconnect** | Offline + online edits preserved; reconnect→converge ~150 ms; no lost edits. | same |
| **3 — Offline reload** | `restoredFromIndexedDb: true`; value + heads match after `repo.flush()` and `?doc=&offline=1` reload (Playwright). Node: `restoredFromPersistentStorage: true` on DummyStorageAdapter. | `bun run harness` and `bun run harness:node` |
| **4 — Bundle + TTI** | Index route **~4.47 MB raw / ~1.38 MB gzip / ~973 KB brotli**; WASM **~793 KB brotli**. Slow-3G **ready() did not complete within 45s** on preview; **~15.6 s** brotli transfer estimate @ 500 kbps + 400 ms RTT only. | `bun run build && bun run measure:bundle`; TTI fields in `harness-playwright-report.json` |
| **5 — Doc size @ 500 edits** | **2675 bytes** with full history; compaction **0%** (single head). | `bun run measure:doc-size` |

### DRI — Automerge cost (ADR-0002)

**Sync/collaboration behavior is acceptable as-is** (online merge, offline queue + reconnect, list inserts, splice text). **Initial web delivery cost is not acceptable on every route**: Automerge WASM dominates the draft route (~**82%** brotli bytes). **Mitigation required before production**: lazy-load WASM + automerge-repo on draft routes; optional worker if TTI remains high. Do not ship this spike bundle on the default app shell.

## Comments
