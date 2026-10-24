# Changelog

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
