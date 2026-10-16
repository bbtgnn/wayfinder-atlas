# Engine surface outline

Type: prototype
Status: resolved
Blocked by: 02
Map: ../map.md

## Question

Kernel spec names the kernel's functions (§7) and the token's claims (§8), and ADR-0001 names the engine's responsibilities, but nothing names the wire between `apps/web` and `apps/engine`. Both the build and the seal-flow spike need it. Produce an outline the user can react to, as a typed stub (`spikes/10-engine-surface-outline/` with TypeScript interfaces and route tables, no implementation), covering:

1. Event log read: endpoint to fetch an instance's events from a cursor; the live subscription (SSE or the existing WebSocket) and how a client catches up after offline; what the web app's server side reads for SSR versus what the browser subscribes to.
2. Instance commands: start instance, terminate, seal (`SealRequest`, `stale` response with current heads, success with the seal). Idempotency and who is allowed, by token.
3. Blueprint loading by a platform admin (CLI or endpoint, ADR-0011) and how the web app lists streams and versions.
4. Draft sync: the automerge-repo WebSocket route, how the identity token reaches it (per the automerge-repo research), per-document authorization, and the actor id → user id mapping.
5. Blobs: upload by hash, existence check, download, who may read (public while `view` is public).
6. Storage: MongoDB collections (`blueprints`, `instances` projection, `events`, `seals`, `drafts`), indexes, and the blob store (GridFS by default; say what would make object storage necessary).
7. Notary key: where the Ed25519 private key is read from, how `keyId` is derived, how public keys are published for `verifySeal`.
8. Cerbos: when the engine calls it, with which attributes (§9), and the failure mode when Cerbos is down.

Decide the surface with the user and record it as the answer; the amendment ticket turns it into a spec section or an ADR.

## Answer

Spike: `spikes/10-engine-surface-outline/` (`routes.ts`, `types/*`).

1. **Event log:** Paginated `GET /api/instances/:instanceId/events?afterSeq=&limit=` for catch-up and SSR (SvelteKit server forwards the user JWT, runs `derive` locally). Live tail on `GET .../events/stream` as SSE (`event: attesta.event`, `id:` = seq). After offline: paginate until caught up, then SSE from last seq. WebSocket is not used for events.

2. **Instance commands:** `POST /api/instances` (start), `POST .../terminate`, `POST .../seal` with Bearer JWT. Start: startable-stream or platform admin; terminate: platform admin or org admin (creator or participant org); seal: kernel `capabilities.seal` + Cerbos. Idempotency-Key on start (24h); terminate replays 200; seal returns existing seal if already sealed, 409 `stale` with `currentHeads` when heads mismatch.

3. **Blueprints:** YAML in repo `blueprints/` loaded by platform admin via CLI `blueprint:load` or `POST /api/admin/blueprints/reload` (and dev `.../load`). Web lists via `GET /api/streams` and `GET /api/streams/:streamKey`; instances pin `latestVersion` at create.

4. **Draft sync:** Sole WebSocket `WS /api/sync`; JWT (Bearer or session cookie) validated on HTTP upgrade before automerge-repo. `shareConfig.access(peerId, documentId)` from kernel `work` + Cerbos; `announce: false`. Stable actor per user: hex(first 16 bytes of SHA-256(`attesta:actor:v1:${userId}`)); web passes `{ actor }` on changes; engine maps peerId→userId at connect and actorId→userId for contributors; revoke access on seal.

5. **Blobs:** `PUT/HEAD/GET /api/blobs/:sha256` (hash-checked upload); public-view reads via `GET .../instances/:instanceId/nodes/:node/blobs/:sha256` (anonymous when gate.view is public). GridFS bucket `attachments`.

6. **Storage:** MongoDB collections `blueprints`, `instances` (projection), `events`, `seals` (denormalized index), `drafts` (automerge adapter keys); indexes in `types/storage.ts`. GridFS default; S3-style object storage only if blob scale, CDN origin, or backup split demands it later.

7. **Notary key:** PEM path env `ATTESTA_NOTARY_PRIVATE_KEY_PATH` (+ optional passphrase). `keyId = ed25519:` + hex(SHA-256(raw Ed25519 public key)). Publish `NotaryKeysDocument` at `/.well-known/attesta-notary-keys.json` and `GET /api/notary/keys`.

8. **Cerbos:** On draft sync apply, draft open, and seal — resource `step`, actions `work`/`seal`, attributes per kernel spec §9 and `step_policy.yaml`. When Cerbos is down or errors: **deny** (503 `cerbos-unavailable` on HTTP; sync not applied).

## Comments
