# Tracker lifecycle rewrite (L1)

Type: grilling
Status: resolved
Blocked by:
Map: ../map.md

## Question

Rewrite `docs/agents/issue-tracker.md` around one lifecycle that covers wayfinding and build, compatible with Atlas dogfooding and eventual archive.

Proposed phases: brainstorm → chart map → plan tickets → work (branch per issue, squash + trailers) → crystallize (spec/ADR bumps) → archive (delete or move tickets; history remains in git).

1. **Confirm or amend phases.** Especially: map evolves across many commits (not one); crystallize and archive are separate commits.
2. **Deletion:** allow archive delete of issues with the constraint that `main` history is never rewritten and Atlas reconstructs from git when needed — vs keep `Status: done` forever for build DAGs (`issues:next`).
3. **Wayfinder vs build statuses:** keep `open`/`claimed`/`resolved` for maps and triage labels for build, or unify?
4. **Research path:** codify `.scratch/research/` on the effort branch (superseding unmerged `research/*` branches).
5. **What changes in `issues-lint` / `issues-next`** when archive deletes build tickets?

Decide the doc + script consequences. Editing the doc can be the resolution artifact or a tiny follow-up task listed in the answer.

## Answer

**Phases confirmed:** brainstorm → chart → plan → work (branch/worktree per issue when practical; squash + trailers on feat/fix) → crystallize → archive. Map evolves across **many** commits. Crystallize ≠ archive (separate commits). Research lives at `.scratch/research/` on the effort branch.

**Deletion:** wayfinder tickets **may** be archived (delete or move); git history is never rewritten; Atlas reconstructs when needed. **Build** tickets keep `Status: done` on disk forever — no delete — so `issues:next` and blocker walks keep working.

**Statuses:** stay **dual** — wayfinder `open`/`claimed`/`resolved` vs build triage labels. Do not unify.

**Scripts:** no change to `issues:lint` / `issues:next` for archive-delete of build tickets (forbidden). Wayfinder deletes only affect files on disk; lint already walks what exists. Trailer/ADR linters stay out of `issues:lint` until a later backlog.

**Resolution artifact:** rewrote [`docs/agents/issue-tracker.md`](../../../docs/agents/issue-tracker.md) with the lifecycle, dual statuses, research path, archive rules, and script consequences.
