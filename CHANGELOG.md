# Changelog

## 3.0.2 — 2026-11-15

- Pin development and publishing to Node 26.13.1 and support Node 26 alongside the existing Node 24 range.
- Add a live Socket score badge to the README.
- Replace the dynamic Function-based global lookup with globalThis, preserving the browser self export.
- Declare Apache-2.0 in package and lockfile metadata and use the standard Apache notice in the source header. The existing Apache license file and copyright attribution are retained.
- Add a regression test that loads the library with string code generation disabled.

## 3.0.1 — 2026-11-15

### Changes

- Replace Jest with Node's built-in test runner and assertions, removing all npm development dependencies, including transitive deepmerge.
- Preserve all 10 tests, including the browser-global export check.
- Use V8 coverage with the existing 100% line/function and 93.75% branch minimums. Coverage prints locally; the separate statement threshold and previous JSON/LCOV reports are no longer generated.
- Update package and exported version metadata. Library behavior and Node 24 requirements remain the same.

### Validation

- Clean npm ci installation.
- 10 tests passing with 100% V8 line, branch, and function coverage.
- npm audit and npm audit --omit=dev: zero affected packages at release preparation.

## 3.0.0 — 2026-10-24

### Breaking compatibility change

Development and package engine requirements now target Node 24.22.1 LTS (24.x). Node 6 and other versions outside this range are no longer supported.

### Changes

- Upgrade Jest from 17.0.3 to 30.5.2 and migrate removed assertion aliases.
- Remove the deprecated Codecov npm uploader; local tests no longer upload coverage.
- Add a committed dependency lockfile, Node version pin, and updated CI runtime.
- Test browser-global export alongside the existing Node behavior.

### Validation

- Clean npm ci installation.
- 10 tests passing with 100% statements, branches, functions, and lines coverage.
- npm audit and npm audit --omit=dev: zero affected packages at release preparation.

### Known limitations

ID generation still uses JavaScript Number and random sequence selection. Precision loss and repeated sequences can produce duplicate identifiers. This release does not fix those source defects and IDs must not be used as secret authentication tokens. The optional demo still references an external HTTP Moment script that returned HTTP 403 during validation.
