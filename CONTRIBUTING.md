# Contributing

Preserve the original Particle API and Number output. The 4.x line uses the exact 40/10/3 format. npmjs latest/next provide the 4.0.2 security/license patch; the alternative GitHub Packages build remains 4.0.1; legacy v3.0.3 uses rounded/random IDs and remains available by explicit version. API compatibility does not imply wire-format compatibility. Read docs/migration-number53.md before changing storage or generation assumptions.

Use Node 26 or newer; .nvmrc pins development to Node 26.13.1. Run npm test and npm audit. Existing CI files and the npm test command remain unchanged. The published runtime has no dependencies.

Every generation must read Date.now and recompute its packed time from that reading. Previous issuance timestamps/counters are state for rollback detection and uniqueness; they must not replace the clock or be reset on configuration switches. Never busy-wait, invent future time, silently wrap counters, or substitute randomness for uniqueness.

Test all 1024 machines and eight slots, zero/max safe integers, exhaustion without state consumption, rollback, overflow, configuration reuse, reentrant clock callbacks, cloned-instance/restart limitations, and both legacy and exact timestamp decoding. The demo must use text-only DOM output and its restrictive CSP, with no clock/random patching.

JSON is the default application example. Binary is opt-in and requires the documented wire contract, exact round-trip checks, byte-order tests, and bounded malformed-frame handling. The binary adapter is a separate optional binary.js entry point; it does not change the Particle singleton API.

npm run bench performs a live 100000-ID issuance with asynchronous backpressure and compares JSON/binary on that exact dataset. It takes at least about 12.5 seconds and can be longer due to timer/scheduling delays. Report successful distinct issuances, rejected attempts, and CPU/codec timing separately. Never reuse the earlier duplicate-heavy draft's millisecond speed claims as unique-ID throughput.

Report suspected security problems privately to pr@silviu.co. Do not post credentials or production records in public issues. Keep development work on review branches. Creating release tags, promoting npm tags, or publishing packages requires separate approval.
