# Changelog

## 4.0.2 — 2026-11-15

- Publish @sschiau/particle@4.0.2 to GitHub Packages through a separate manual publisher; retain all existing CI workflows and npmjs latest/next at 4.0.2.

- Replace the legacy demo’s unpinned HTTP script and inline document.write rendering with a script-free redirect to the local mechanics demo.
- Use the unmodified official Apache-2.0 license text and retain existing copyright attribution in NOTICE, included in future package archives. Remove conflicting boilerplate from the obsolete demo. These changes retain Apache-2.0 licensing.
- Set package/runtime version metadata to 4.0.2 and update current project copyright notices to 2014–2026. Keep the original API and ID-generation/codec algorithms unchanged.
- Leave existing CI, the archived v3.0.3 benchmark fixture, and the published 4.0.1 artifact unchanged. Publish the 4.0.2 patch to npm under both latest and next without creating a release tag.

## 4.0.1 — 2026-11-15 (npmjs next and GitHub Packages)

### Breaking ID format

- Preserve the original methods, mutable singleton, machine IDs 0–1023, and Number output; change generation to an exact 53-bit layout: 40 elapsed-time bits, 10 machine bits, and 3 deterministic counter bits.
- Remove random sequence selection and the legacy time offset. Issue eight distinct IDs/ms per machine/epoch allocation; throw ERR_SEQUENCE_EXHAUSTED on the ninth call without waiting, wrapping, or inventing time.
- Retain allocation state across configuration switches, strict input/clock validation, rollback protection, arithmetic packing, and fresh Date.now readings.
- Decode new safe-integer IDs exactly and legacy rounded IDs through a separate numeric-range path. Lost legacy bits remain unrecoverable.

### Compatibility and deployment

- Preserve Node/browser globals and return the same singleton from CommonJS. Stop modifying String.prototype.
- Support Node 26+, retaining the Node 26.13.1 development pin and existing CI files/test command.
- Keep JSON as the default example; provide binary as an optional separate adapter with bounded framing/validation tests.
- Update the light mechanics demo to show the actual 40/10/3 counter format without clock/random patching.
- Replace obsolete duplicate-heavy speed claims with distinct-ID, live-clock, and same-corpus JSON/binary measurements. Add restart/namespace migration guidance.
- Publish the exact-Number implementation as @sschiau/particle@4.0.1 on GitHub Packages using the separate manual publisher.
- Initially publish Particle@4.0.1 to npmjs under next while retaining latest on Particle@3.0.3, using the tested archive directly.
- Promote latest to 4.0.1 after separate approval; next remains 4.0.1. Create the v4.0.1 GitHub release with the exact npm archive attached. Existing CI remains unchanged.

## 3.0.3 — 2026-11-15

- Publish the updated README with the live GitHub Pages demo link.
- Add the light-theme mechanics and deployment diagrams, local demo assets, and restrictive Content Security Policy to the repository.
- Add a security regression test covering malicious and invalid demo input, inert error rendering, no-eval execution, and restoration of the clock and random function.
- Update version metadata and demo installation examples to 3.0.3.

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
