# Benchmarks and correctness evidence

The goal is a more dependable ID generator. A blanket “10× faster” claim would not describe the evidence below.

## Reproduce

```sh
npm run bench
# For machine-readable results:
node Benchmarks/compare.mjs > results.json
```

The script uses the original v3.0.3 source snapshot from the tagged release in an isolated VM. Its prototype changes do not affect the candidate or host realm. The fixture is not included in the published npm package.

## Same-millisecond distinct outputs

Both generators receive the same fixed machine ID, epoch (2026-01-01 UTC), and millisecond (2026-11-15T12:00:00.000Z). The batch contains 4,096 calls. To isolate Number precision, legacy draws are idealized: each of its 4,095 possible sequence values is selected once before wrapping. This is more favorable than random selection, which can repeat earlier.

| Observation | v3.0.3 | v4 candidate |
| --- | --- | --- |
| Calls in the fixed millisecond | 4096 | 4096 |
| Distinct returned ID values | 5 | 4096 |
| Unsafe Number outputs | 4096 | 0 (outputs are exact strings from BigInt) |
| Next call at that millisecond | No explicit exhaustion handling | ERR_SEQUENCE_EXHAUSTED |

The ratio is **4096 / 5 = 819.2× more distinct outputs in this specific burst test**. This is a representational-correctness result, not a throughput ratio. It does not remove allocation or restart requirements, and the v3 result varies with timestamp/epoch and Number spacing.

Raw results record the deterministic inputs and machine/runtime: [Node 26](benchmark-results.json), [Node 24](benchmark-results-node24.json). Source: [compare.mjs](../Benchmarks/compare.mjs).

## Local CPU microbenchmarks

The same script measures candidate BigInt and decimal-string generation separately: one warmup followed by five runs of 100,000 calls. An injected clock advances every 1,024 calls so the benchmark does not overflow the per-millisecond sequence.

See the raw files for all samples, medians, CPU model, platform, and Node version. These are local microbenchmarks, not a service capacity commitment. They omit real clock-call overhead, production wall-clock pacing, network, databases, and deployment coordination. Synthetic-clock throughput may exceed the generator's real-time 4,096 IDs/ms limit; do not interpret it as achievable per-machine production issuance. There is no v3-v4 throughput claim.

## Deterministic regression coverage

The test suite checks all 4,096 sequence slots, all 1,024 machine IDs, exact zero/max decoding, rollback and overflow recovery, immutable configuration, malformed/oversized input, serialization, no global/prototype mutation, CJS/ESM consumers, declaration resolution, and inert DOM rendering. Source coverage thresholds require 100% lines, branches, and functions. Coverage alone is not a proof of correctness.
