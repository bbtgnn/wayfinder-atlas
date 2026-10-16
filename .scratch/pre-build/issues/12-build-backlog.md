# Write the build backlog

Type: task
Status: resolved
Blocked by: 09, 11
Map: ../map.md

## Question

Turn the agreed build order into implementation issues under `.scratch/build/issues/NN-<slug>.md`, following `docs/agents/issue-tracker.md`, each sized to one agent session, with a `Status:` triage label from `docs/agents/triage-labels.md` (`ready-for-agent` where the spec, fixtures and amended ADRs fully specify it; `ready-for-human` or `needs-info` otherwise, saying what is missing).

Order, from the map's Notes: kernel against fixtures (one issue per kernel function group, `tdd`) → engine event log and seals → web read-only Stream timeline from events → drafts and sync → seal flow → attachments → DPP reading seals → load the example blueprint → port affiliation, onboarding and admin surfaces from `GLOSSARY.md` → public pages → remove Go.

Each issue names: the spec sections and fixtures it is checked against, the dev-environment services it needs, the ADRs it must not contradict, and its demo (what can be shown when it closes). A `.scratch/build/spec.md` points at `docs/kernel-spec.md` rather than restating it.

Resolved when the backlog exists and the first issue is `ready-for-agent`. This closes the map.

## Answer

Created [`.scratch/build/spec.md`](../../build/spec.md) (pointer to `docs/kernel-spec.md`) and **18** ordered issues in [`.scratch/build/issues/`](../../build/issues/): six kernel groups (TDD vs fixtures), then engine event log/seals, web read-only timeline, drafts/sync, seal flow, attachments, DPP seal reads, example blueprint load, affiliation/onboarding/admin (`ready-for-human`), UNTP re-base (`needs-info`), public pages (`ready-for-human`), remove Go, Go demo cutover (`ready-for-human`). Graduated map fog into issues `15-untp-over-seals` and `18-cutover-from-go-demo`. First issue: `01-kernel-validate-blueprint-and-version.md` — `ready-for-agent`.

## Comments
