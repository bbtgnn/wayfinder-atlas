# Content layer

Type: research
Status: resolved
Blocked by:
Map: ../map.md

## Question

Where do maps and tickets come from when Atlas is its own repo?

## Answer

Velite reads `ATLAS_CONTENT_ROOT` (default `./content`) with the `{atlas,pre-build}` globs.
