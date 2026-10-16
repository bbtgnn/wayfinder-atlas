# automerge-repo server-side authorization and frozen documents

Type: research
Status: resolved
Blocked by: none
Map: ../map.md

## Question

ADR-0002 and kernel spec §4.2 assume an automerge-repo sync server that authenticates every connection, authorizes per document from the kernel's `work` capability, maps Automerge actor ids to user ids, and refuses changes to a frozen (sealed) document. Stock automerge-repo sync servers accept any sync message for any document id. Is what we assumed possible, and how?

1. Authentication: how a WebSocket network adapter can carry the identity token (kernel spec §8) and reject the connection before any sync message. Same origin, so a cookie is also a candidate.
2. Per-document authorization: `sharePolicy` semantics, whether it can gate inbound changes (not just outbound sharing), and what the server can inspect about an incoming sync message (document id, actor id, heads) before applying it.
3. Freezing: once a document is sealed, how the server refuses later changes and tells the peer; what the peer sees (does automerge-repo surface a rejection, or does the client simply never converge?); whether the client can detect "sealed without these edits" from the frozen heads.
4. Actor ids: how a client's actor id is set, whether the server can trust it, and whether the mapping actor id → user id must instead be established at connection time as the spec says.
5. Heads: how the client reads current heads for the `SealRequest`, and whether `Automerge.getHeads` and the repo's `DocHandle` agree during pending sync.
6. Storage adapter on the engine: what a MongoDB storage adapter needs to implement, and whether an existing one exists.

Pin the automerge and automerge-repo versions. Write findings to `docs/research/02-automerge-repo-authorization.md` on branch `research/02-automerge-repo-authorization`, each claim cited to docs or source.

## Answer

Branch `research/02-automerge-repo-authorization`, file `docs/research/02-automerge-repo-authorization.md`, commit `ef3d48bc3d9b2f07bd757c5c4b749b5079c2f1f8`.

1. Authentication: validate the identity token on the HTTP WebSocket `upgrade` (Bearer or cookie); stock wire protocol has no auth—then map repo `peerId` from `join` to JWT claims.
2. Per-document authorization: use `shareConfig.access(peerId, documentId)` for `work`; legacy `sharePolicy` only blocks announce and still allows fetch-by-id. Wire gives `documentId` + peer `senderId`; Automerge actors need decoded sync `changes`.
3. Freezing: no built-in freeze—revoke `access` + `shareConfigChanged()` to refuse inbound sync and emit `doc-unavailable`; no stock “sealed without these edits” event; app compares heads to the Seal.
4. Actor ids: clients choose Automerge actors; peer `senderId` ≠ actor—engine assigns actor from `sub` at connect and must not trust client actors for identity.
5. Heads: root `DocHandle.heads()` matches `getHeads` on the live doc; in-flight sync means local heads can lag the engine until merge completes (`stale` seal path).
6. Storage: implement `StorageAdapterInterface` (key/range KV); official adapters are IndexedDB and NodeFS only—no MongoDB adapter upstream.

Versions at research time: `@automerge/automerge-repo@2.6.0-alpha.3`, `@automerge/automerge@3.5.0` (npm); upstream catalog at research read was repo `2.6.0-alpha.5` / automerge `3.2.6` — align when shipping.

Open for engine/prototype: delivering frozen heads to late peers when `access` is false; reject inbound after seal while still pushing sealed snapshot; multi-tab actor mapping; MongoDB adapter under load; whether `doc-unavailable` + seal API covers stale-heads UX.

## Comments
