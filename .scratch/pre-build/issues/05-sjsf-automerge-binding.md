# sjsf ↔ Automerge binding

Type: prototype
Status: resolved
Blocked by: 04
Map: ../map.md

## Question

Does the `StepDraft` shape in ADR-0009 hold up against the real libraries? Build `spikes/05-sjsf-automerge-binding/`: one SvelteKit route, one `@sjsf/form` on a small schema with string, number, enum, array-of-objects and boolean fields, bound to one in-memory Automerge document through a `StepDraft.svelte.ts` that:

- exposes `value` as `$state.raw`, replaced wholesale on every change;
- applies local edits through the per-type write strategy of kernel spec §4.1 (`updateText` for strings, scalar put for numbers/booleans/enums, list operations for arrays);
- accepts remote changes by applying a second actor's changes (simulated in the same page, two documents merging) and reassigning `value`.

Decide, by driving it with the user:

1. Does replacing `value` from outside reset field state (focus, touched, validation messages)? If so, what is the smallest workaround?
2. Does `updateText` round-trip through sjsf string widgets so that two actors typing into one string field merge instead of overwriting?
3. Where does the caret land when a remote splice hits the field being typed in? Is accepting it fine for now (the spec's position), or is a custom text widget needed from day one?
4. Is per-field 300 ms debouncing right, or does Automerge's change batching make it unnecessary?

Record the verdicts on each question as the answer. The validated `StepDraft` shape goes into the ADR-0009 amendment; the spike stays in `spikes/`.

## Answer

Spike: `spikes/05-sjsf-automerge-binding/` (SvelteKit + `@sjsf/form` / `@sjsf/shadcn4-theme` / `@sjsf/lucide-icons` @ 3.9.0, `@automerge/automerge` @ 3.5.0). One route, `StepDraft.svelte.ts` with `$state.raw` `value` replaced via `Automerge.toJS` after each local or peer merge; controlled bind `[() => draft.value, (next) => draft.reconcileFromPlain(next, true)]`; string field uses registered `automergeTextWidget` calling `Automerge.splice` (kernel §4.1 text strategy); scalars/lists via put / list replace; in-page peer doc + **Apply pending remote changes**.

### Verdicts

1. **External value replace vs field state.** Wholesale snapshot replacement through the controlled bind getter does **not** clear DOM focus or “touched” flags in normal editing (same field components stay mounted). **Validation messages can lag** until the next field validation pass (default 300 ms debounce). **Smallest workaround:** after applying remote Automerge changes, fire a synthetic `input` on the focused control (or remount only the affected field via `{#key}` on that path) so sjsf re-runs field validation; no full-form reset required.

2. **`updateText` / splice round-trip vs stock string widget.** Stock shadcn `textWidget` full-replaces the string on each keystroke → concurrent edits **last-writer-wins** (merge lab: two actors typing `hello` vs `world` → `"world"`). Character **splice** (`Automerge.splice`, same intent as kernel `updateText`) **merges** (`"worldhello"` in the same lab). **Ship a custom string widget from day one** for Draft text fields; keep stock widget for non-collaborative or diagnostic fields only.

3. **Caret when a remote splice hits the focused field.** The spike widget only nudges selection when the external value changes while focused; remote inserts do not preserve true CRDT-aware caret placement. **Accept for v1** (aligns with kernel/spec: merge correctness over caret UX); refine caret mapping in the custom widget later if user testing demands it.

4. **300 ms debounce.** Automerge batches document changes independently of sjsf. **`fieldsValidationDebounceMs` only gates validation feedback**, not sync. **Keep 300 ms default** for validation ergonomics; dropping to `0` is optional for snappier inline errors, not required for collaboration.

### StepDraft shape (validated for ADR-0009 amendment)

- Reactive class in `*.svelte.ts`: wraps in-memory Automerge doc + optional peer clone for spike; exposes `value = $state.raw<DraftValue>()` refreshed with `structuredClone(Automerge.toJS(doc))` after every change application.
- sjsf: `createForm` with `value: [getter, setter]` on that snapshot; theme extended with `automergeTextWidget`; capture non-text edits via form `input`/`change` listeners → `reconcileFromPlain`.
- Strings: custom widget → per-keystroke diff → `Automerge.splice`; never stock full-string writes on collaborative fields.
- Numbers, booleans, enums: scalar put (LWW).
- Arrays: positional list ops acceptable; spike uses whole-list replace for simplicity — production can narrow to insert/delete.

Run: `cd spikes/05-sjsf-automerge-binding && bun install && bun run dev`.

## Comments

