# JSONata failure modes

Type: research
Status: resolved
Blocked by: none
Map: ../map.md

## Question

Kernel spec §4.5 and §6 say a derived expression that fails to evaluate is a seal error (`derived-failed`), that `undefined` is a failure and `null` a value, that `$now`, `$millis`, `$random` and `$eval` are denied, and that evaluation has a 50 ms budget. The fixture suite has no `derived-failed` case because the evaluator's actual behavior was never pinned.

From the JSONata JS implementation (docs and source):

1. Which situations throw at evaluation (type errors, unknown function, division by zero, regex failures) and which return `undefined` silently (missing path, filter with no match)?
2. Which throw at parse time, so `validateBlueprint` can report `bad-expr` before any instance exists?
3. How a deny-list is enforced: can the parser's AST be walked to find function calls, or must the evaluation environment shadow the denied functions? Which approach also catches `$eval("$now()")`?
4. How a time budget is enforced: does `jsonata` expose a timeout or an abort hook, or must the kernel run it in a worker? Note that the kernel is synchronous (spec §7) and `jsonata.evaluate` is async; say what that implies for the kernel surface.
5. Determinism: any built-in function besides the denied four that depends on locale, time zone or environment (`$fromMillis`, `$formatNumber`, string collation).

Propose the `derived-failed` fixture case (refs-and-derived or seal-validation shape per `packages/kernel/fixtures/README.md`) with the exact expression and data that trigger it. Pin the jsonata version. Write findings to `docs/research/03-jsonata-failure-modes.md` on branch `research/03-jsonata-failure-modes`.

## Answer

Branch `research/03-jsonata-failure-modes`, file `docs/research/03-jsonata-failure-modes.md`, commit `38b5a62d122db241e9f623b2924e032089f10f5b`.

1. Type/dispatch/`$error`/many built-ins throw (`T*` / `D*` codes); missing paths, empty filters, and numeric ops with an `undefined` operand return `undefined`; `null` is a normal value; `/0` yields `Infinity`/`NaN` without throwing.
2. Invalid syntax throws `S02xx` from `jsonata(expr)` → map to `bad-expr`; valid syntax that fails only at run time (e.g. `$nope()`) is not `bad-expr`.
3. Walk `ast()` for `function` → `$now`/`$millis`/`$random`/`$eval` → `denied-function`; reject any `$eval` at blueprint time so `$eval("$now()")` cannot bypass.
4. Pass `timeout: 50` (throws `D1012`); no abort hook; regex ReDoS not covered by `timeout`; `evaluate()` is async while kernel §7 is sync—engine must block or spec must change.
5. After denying `$now`, `$millis`, `$random`, `$eval`, remaining date/number formatting is deterministic given inputs; `$formatNumber` defaults are fixed in code, not locale.
6. Fixture: seal-validation case on `acme/weights#1` with derived `{ "name": "gapKg", "expr": "$data.missingField" }`, data `{ "lcdGlassKg": 10 }`, refs resolved → `derived-failed`.
7. Pin `jsonata@2.2.2`.
8. Wrap throws and `undefined` as `derived-failed`; `null` seals; blueprint parse errors stay `bad-expr`.

Open for amend-spec: whether `NaN`/`Infinity` are seal failures; ReDoS/`RegexEngine`; sync `evalDerived` vs Promise API; enforce `recover: false` in kernel.

## Comments
