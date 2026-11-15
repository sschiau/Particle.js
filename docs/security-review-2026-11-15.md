# Particle 4.0.1 security and license review

Reviewed November 15, 2026 against repository commit `d749c39b217cae7dd498f54512adb98ced70703f` and the actual npmjs `Particle@4.0.1` archive. CI and runtime source are unchanged by these fixes.

## Result

No critical or high-severity finding was confirmed in the reviewed published runtime. The current dependency audit reports zero vulnerabilities. The actual archive has no runtime/development dependencies or installation hooks and runs with string code generation disabled. These are bounded review results, not a guarantee against every defect.

The confirmed repository issue is the obsolete demo's remote HTTP script. Its license header also conflicts with the declared Apache license. Both are corrected on this branch. The old demo is absent from the published npm archive, so its repair improves the repository/site rather than retroactively changing npm 4.0.1.

## Socket score: 4.0.1 is not yet verifiable

At review time:

| Report | Supply Chain Security | Vulnerability | License |
| --- | ---: | ---: | ---: |
| Socket's explicit 3.0.2 page | 71 | 100 | 100 |
| Socket's explicit 4.0.1 page | Unavailable: Page Not Found | Unavailable | Unavailable |

The default Socket package page initially displayed 3.0.0, while the explicit 3.0.2 page called that version latest. npmjs already resolves both latest and next to 4.0.1. Socket's currently exposed metadata is therefore stale relative to npm. The 71 score cannot be attributed to 4.0.1, and an improvement cannot yet be measured.

The [3.0.2 report](https://socket.dev/npm/package/Particle/overview/3.0.2) and [4.0.1 report URL](https://socket.dev/npm/package/Particle/overview/4.0.1) were inspected in the browser. No authenticated Socket API credential was available for an on-demand scan. Socket's [scoring documentation](https://docs.socket.dev/docs/package-scores) says popularity/downloads and dependency counts also contribute; the Supply Chain Security number is not solely a vulnerability count. No fabricated score or static badge replacement is introduced.

## SR-001 — Legacy demo executes an unpinned HTTP dependency

- Rule: JS-SUPPLY-001 / JS-CSP-002.
- Severity: **Medium**, scoped to the legacy demo served over HTTP.
- Assessed location: [Demo/index.html:27](https://github.com/sschiau/Particle.js/blob/d749c39b217cae7dd498f54512adb98ced70703f/Demo/index.html#L27), inline initialization at line 30 and document.write rendering at lines 39–45.
- Evidence: a script loads `http://momentjs.com/downloads/moment-with-locales.min.js` without a pinned version or integrity, followed by an inline script. There is no CSP in that entry point.
- Impact: someone able to alter that HTTP response could execute JavaScript in the demo origin. HTTPS hosting normally blocks this mixed-content load, leaving the old demo broken instead. No attacker-controlled input into document.write was demonstrated; it is not reported as a proven DOM-XSS exploit.
- Fix: [Demo/index.html:7](../Demo/index.html) uses a restrictive CSP, a constant same-origin redirect, and an accessible fallback link to mechanics.html. It loads no scripts or external resources. The old header is retained as Apache SPDX attribution without the conflicting boilerplate.
- Validation: browser navigation from the old URL reaches the working 4.0.1 mechanics page. The regression at [Tests/demo-security.test.js:6](../Tests/demo-security.test.js) checks all demo HTML entry points for CSP and rejects inline/external executable scripts.

## SR-002 — Conflicting legacy license boilerplate

- Rule: License metadata and notice consistency.
- Severity: **Low**, license clarity; no runtime exploit.
- Assessed location: [Demo/index.html:5](https://github.com/sschiau/Particle.js/blob/d749c39b217cae7dd498f54512adb98ced70703f/Demo/index.html#L5) contains a partial permissive warranty/redistribution notice while line 19 identifies Apache-2.0.
- Impact: inconsistent notices can confuse users and automated license classification. This file is not shipped in npm 4.0.1; no Socket alert for it has been confirmed.
- Fix: the replacement entry point consistently identifies Apache-2.0 and retains the copyright notice.

## License presentation cleanup

The published LICENSE.md already matches the official Apache-2.0 terms in sections 1–9 after whitespace normalization. Its appendix customizes the brackets and inserts a copyright notice. This is not evidence that the substantive license is invalid, and Socket's older License score was already 100.

For predictable machine recognition, [LICENSE.md](../LICENSE.md) now matches the [official Apache text](https://www.apache.org/licenses/LICENSE-2.0.txt) byte for byte. [NOTICE](../NOTICE) retains the project copyright and the original appendix attribution. [package.json:26](../package.json) includes NOTICE in future archives. The license remains Apache-2.0; no license switch is made. This cleanup does not promise a Socket score increase.

## Validation and publication boundary

- Actual npm archive SHA-512: `sha512-2G25R+j4eyol7y9PvqtW2g6E0ApJhvbXSCnLW1QmSd9IdlqS3Wy5124nTbSkpSvZ7PHc9RhTPblkic+ZVu5sEQ==`.
- Actual npm archive contains nine expected files; demos, tests, benchmark fixtures, and workflows are excluded. The inspected runtime matches the repository byte for byte.
- Actual-package checks verify original API/global export, eight distinct safe integer IDs, ninth-call rejection, exact JSON and binary round trips, malformed-frame rejection, and no String.prototype patch, with string code generation disabled.
- Node 26.13.1: 17 tests pass; runtime line/branch/function coverage remains 100%. The new test is in an already executed test file; the npm test command is unchanged.
- npm audit: zero vulnerabilities. A packed consumer passes; future-package inspection verifies canonical LICENSE.md and NOTICE are actually included.
- No changes to .github workflows, .travis.yml, .nvmrc, or runtime modules. No new dependencies.
- npm 4.0.1 and its tags are not changed by this review. The canonical license/NOTICE changes need a separately approved new package version. The legacy demo fix reaches the public site when this branch is merged through the existing Pages deployment.

Known operational requirements remain documented: IDs are predictable identifiers, not credentials; unique machine allocations, shared epoch namespaces, restart watermarks, and application backpressure are required. The review does not replace those safeguards or claim that a dependency audit detects application-level issues.
