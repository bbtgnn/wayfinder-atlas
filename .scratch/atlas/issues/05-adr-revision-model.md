# ADR revision model (L1)

Type: grilling
Status: resolved
Blocked by:
Map: ../map.md

## Question

ADRs must stop being silently rewritten in place if Atlas is to show a DAG over time. Node is `(adr, revision)`.

1. **Frontmatter shape:** `id`, `revision`, `revisions[]` (`n`, `date`, `kind`, `effort`, `ticket?`, `section?`, `summary`), `relations[]` (`builds-on` | `refines` | `supersedes` → `NNNN@rev`), `topics[]`, `spec[]`.
2. **Kinds:** `decide` | `clarify` | `amend` | `supersede` — when each is used; partial supersede must name `section`.
3. **Lint rules:** ADR file change without `revision` bump fails; cross-refs must pin `@rev`.
4. **Migration:** backfill existing `docs/adr/0001`–`0014` (0002 and 0014 already have dated amendments → start at rev ≥ 2).
5. **OpenSpec:** adopt requirement-block deltas inside ADRs, or keep prose + frontmatter index only for v1?

Decide the model. Writing frontmatter into all ADRs can be a spawned build/docs backlog.

## Answer

**Node:** `(id, revision)` where `id` is the four-digit ADR number and `revision` is a positive integer starting at 1. The file at `docs/adr/NNNN-*.md` always holds the latest revision’s body; history is indexed in frontmatter (and git), not as N files per ADR.

**Frontmatter (v1):**

```yaml
id: "0002"
revision: 4
revisions:
  - n: 1
    date: 2026-10-01
    kind: decide
    effort: pre-build
    summary: "Automerge for step drafts"
  - n: 2
    date: 2026-10-14
    kind: amend
    effort: build
    ticket: build/23
    section: "actor identity"
    summary: "Per-device Automerge actor"
relations:
  - type: builds-on   # builds-on | refines | supersedes
    target: "0001@1"  # always pin @rev
topics: [drafts-and-sync]
spec: ["kernel-spec#4.1", "kernel-spec#10"]
```

**Kinds:**

| Kind | When |
|------|------|
| `decide` | First acceptance of the ADR (rev 1). |
| `clarify` | Wording/precision only; no change to the decision’s force. |
| `amend` | Extends or narrows the decision without replacing it; name `section` when the change is partial. |
| `supersede` | Replaces prior force for a named `section` (required) or the whole ADR (`section: "*"`). Outbound `relations` entry `supersedes: NNNN@rev` required when another ADR takes over. |

**Lint (Wave D backlog; decide now):** (1) any content change to an ADR file without bumping `revision` and appending a `revisions[]` row fails; (2) every cross-ADR reference in body or `relations[].target` must pin `@rev`; (3) `supersede` / partial `amend` without `section` fails.

**Migration:** backfill `docs/adr/0001`–`0014` in one docs backlog. Baseline: each ADR starts at `revision: 1` / `kind: decide` from first Accept date if known. **0002** and **0014** (dated amendments already in prose) start at **rev ≥ 2** with one `amend`/`supersede` row per existing amendment heading; map those headings into `section` + `summary`.

**OpenSpec:** **DEFER**. v1 is prose body + frontmatter index only. Requirement-block deltas inside ADRs are out of scope until a later ticket explicitly adopts OpenSpec; do not block Atlas ADR DAG on that.
