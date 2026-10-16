# Topics and areas vocabulary (L0)

Type: grilling
Status: resolved
Blocked by:
Map: ../map.md

## Question

Define the L0 partition used by every later view that colors or groups code.

1. **Topic list** (concerns, many per file) — start from the draft: blueprint, steps-and-gates, drafts-and-sync, seals-and-notary, refs-and-derived, forms-and-ui, people-and-orgs, authorization, attachments, dpp-and-public, deployment. Add/remove/rename against `CONTEXT.md` words.
2. **Area list** (placement, exactly one per file): kernel, engine, web-server, browser, infra, docs — confirm or amend.
3. **File format and location:** `topics.yaml` at repo root vs under `tools/atlas/`. Glob rule precedence (most specific wins for areas; union for topics).
4. **Spikes:** do `spikes/**` use the same map (yes expected)?
5. **Conventional Commits:** should `feat(<scope>)` prefer topic names going forward, or keep area scopes (`kernel`, `engine`) and put topics only in path globs?

Output: agreed lists + where the file lives. Implementation of the file can wait for a build backlog spawned later; this ticket decides the model.

## Answer

**Topics** (many per file; union across matching globs), aligned to `CONTEXT.md` sections — keep the draft list unchanged:

`blueprint`, `steps-and-gates`, `drafts-and-sync`, `seals-and-notary`, `refs-and-derived`, `forms-and-ui`, `people-and-orgs`, `authorization`, `attachments`, `dpp-and-public`, `deployment`

No add/remove/rename: every CONTEXT cluster maps onto one of these (Event log → seals-and-notary; StepDraft/surfaces → forms-and-ui; Capability/Cerbos → authorization; taxonomy → people-and-orgs or blueprint presentation). New topics only when a CONTEXT section has no home.

**Areas** (exactly one per file; most-specific glob wins): `kernel`, `engine`, `web-server`, `browser`, `infra`, `docs` — confirmed as-is. `web-server` = SvelteKit SSR / identity adapter; `browser` = client runes and offline; do not invent a third “web” area.

**File:** `topics.yaml` at **repo root** (L0 is product-wide, not Atlas-package-local). Schema sketch for Wave B backlog (do not create yet):

```yaml
topics:
  - id: blueprint
    # ...
areas:
  - id: kernel
    globs: ["packages/kernel/**"]
# file → topics = union of matching topic globs; area = most-specific matching area glob
```

**Spikes:** `spikes/**` uses the same map (topics + areas).

**Commits:** Conventional Commits `scope` prefers a **topic** when the change is about one concern; **area** scopes (`kernel`, `engine`, …) remain fine for cross-cutting chores that do not map cleanly to one topic. Path globs remain the source of truth for coloring; commit scope is a hint, not a second ontology.
