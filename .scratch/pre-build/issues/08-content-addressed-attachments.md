# Attachments as content-addressed references

Type: prototype
Status: resolved
Blocked by: 05
Map: ../map.md

## Question

Kernel spec §4.3: a file field writes `{ sha256, size, contentType, filename }` into the draft immediately, the bytes upload in a background queue, and the step cannot seal while a referenced blob is missing. Does this work with sjsf's file handling and feel right to the user?

In `spikes/08-content-addressed-attachments/`, on the binding spike: a custom sjsf file widget that hashes the file locally (Web Crypto), writes the reference into the Automerge document, enqueues the upload to a stub engine endpoint that stores by hash, and renders the field's state. Drive with the user:

1. Pick a file offline: the reference lands in the draft, the queue holds the bytes; reconnect: the upload completes without user action. Where do the bytes live while offline (IndexedDB, OPFS, memory), and what happens on reload?
2. Two contexts pick different files into the same field; and into different items of an array of files: merge outcome.
3. A referenced blob is absent on the engine: the seal is refused with `blob-missing`; the UI shows which field. Is the queue state enough to explain it?
4. Replacing a file: the old reference leaves the draft; does the engine keep orphan blobs (yes, content-addressed, and say so) and does anything need to garbage-collect them now?

Decide the widget contract, the queue's persistence, and the attachment reference wording in the spec if it changes.

## Answer

Spike: `spikes/08-content-addressed-attachments/` (extends spike 05 `StepDraft` + sjsf controlled bind; `@sjsf/*` **3.9.0**). Custom **`attachmentFileWidget`**: Web Crypto SHA-256 → `StepDraft.putAttachmentRef` writes `{ sha256, size, contentType, filename }` into Automerge immediately → `UploadQueue` persists bytes in **IndexedDB** and `PUT` stub engine `/api/blobs/:sha256` (hash-verified, idempotent). UI shows per-field queue status; **Try seal** runs client-side `blob-missing` checks with field paths + hints. Merge labs on certificate (scalar) and exhibits (list).

### Verdicts (DRI)

1. **Offline bytes + reload.** **Yes — sjsf custom widget works; UX is acceptable** if the field shows ref + upload state while hash is instant. **Bytes while offline:** persist pending uploads in **IndexedDB** keyed by `sha256` (not memory-only; **OPFS deferred** until large-file profiling). Active session keeps a memory `Blob` map for drain. **On reload:** hydrate queue from IndexedDB and resume on `online` / app start; draft refs come from Automerge sync (spike simulates with `localStorage` Automerge snapshot). Reference in draft survives reload even when upload is still pending.

2. **Concurrent picks (merge).** **Same file field (scalar ref):** whole object is one Automerge value → **last-writer-wins** on the `{ sha256, … }` map (merge lab: one filename wins). **Array of files, different indices:** list inserts **merge — both refs kept**. **Same index:** list slot **LWW** (one ref per index). Filename/metadata conflicts on identical `sha256` are impossible; different hashes at the same path are ordinary concurrent edits.

3. **`blob-missing` + UI.** **Engine `GET /api/blobs/:sha256` is authoritative for seal** (precondition §5.2.7). **Queue state is necessary but not sufficient:** combine engine `present: false` with queue `queued | uploading | failed | absent` and offline flag to produce field-path errors (`validateAttachmentBlobs` / `BlobMissingError`). That is enough to explain “still uploading”, “offline queued”, “failed retry”, or “another device must upload”. Show errors **per JSON path** (maps to sjsf field).

4. **Replace file / orphans.** Replacing clears the old ref from the draft (scalar put / list edit); **stub engine keeps prior blobs** (content-addressed store). **No GC in v1** — orphans are cheap; later GC only when no sealed snapshot or live draft references a hash (out of scope for pre-build).

### Contracts (for build)

- **Widget:** `ui:widget: attachmentFileWidget` on attachment-shaped object fields; `value` is `AttachmentRef | null`; never `File` / Data URL. Flow: hash → draft ref → enqueue bytes → display queue status.
- **Queue:** browser-local **IndexedDB** store `spike-08-upload-queue` / `pending` (production: org-scoped name); delete row on successful `PUT`; retry on failure; pause uploads when offline.
- **Spec §4.3:** Wording **unchanged**; spike confirms shape. **Clarification to add at implementation:** `sha256` is **64-char lowercase hex** (same as engine blob id and PUT path param).

Run: `cd spikes/08-content-addressed-attachments && bun install && bun run dev`.

## Comments

