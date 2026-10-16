# sjsf facts for the binding

Type: research
Status: resolved
Blocked by: none
Map: ../map.md

## Question

ADR-0009 puts `@sjsf/form` behind a `StepDraft` reactive class whose `value` is `$state.raw` and is replaced wholesale on every local or remote Automerge change. The prototype that follows needs these facts about the current `@sjsf/form` release, from its docs and source:

1. Controlled value: how a parent supplies and replaces the form value, and what happens to per-field state (touched, focus, validation messages, open popovers) when `value` is replaced from outside while a field is focused.
2. Change reporting: does `onchange` (or equivalent) report whole-document or per-field changes, with what path information, and is it debounced?
3. String widgets: is the input controlled on every keystroke, and can a custom text widget receive a splice-aware update (for Automerge `updateText`) without fighting the library?
4. Component resolution: how custom widgets and fields are registered so the demo blueprint's `ui:components` keys (`unknownNativeFileField`, `multiEnumField`, and the others in `blueprints/examples/indium-recycling-audit.yaml`) resolve.
5. Dynamic enums: can enum options be supplied at runtime from outside the schema (for a possible "options from ref")? Only a yes/no with the mechanism; it is not a requirement.
6. File fields: what the default file widget emits, and how to replace it with one that emits the attachment reference object from kernel spec §4.3.
7. Packages and versions: shadcn theme package, lucide icon set package, Tailwind version they expect, shadcn-svelte and bits-ui compatibility with Svelte 5.

Pin versions. Write findings to `docs/research/04-sjsf-facts.md` on branch `research/04-sjsf-facts`, each claim cited.


## Answer

Branch `research/04-sjsf-facts`, file `docs/research/04-sjsf-facts.md`, commit `e95465ec5f4fdb6be2cc84c7a856acdd233d4670`.

1. Controlled `value` bind tuple `[get,set]`; parent owns Draft; external replace does not clear field UI state by itself.
2. No form-level `onChange`; binding must wrap setters / watch controlled value; validation debounce default 300 ms.
3. Stock string widget full-replaces; custom widget needed for Automerge `updateText` splices.
4. `ui:components` + compat resolver; demo `unknownField → nativeFileField` and `multiEnumField` work if extras registered on theme.
5. Dynamic enums via `extraUiOptions` / `remoteEnumField` — fine later, not first spike.
6. Stock file widgets store Data URL or `File`; Attesta needs custom field writing `{ sha256, size, contentType, filename }`.
7. Pin `@sjsf/form` / `@sjsf/shadcn4-theme` / `@sjsf/lucide-icons` **3.9.0** (not legacy `@sjsf/shadcn-theme`).

Open for spike: caret/focus under remote replace; in-place vs wholesale sync; pin `@lucide/svelte`.

## Comments
