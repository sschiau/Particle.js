# Exact-Number issuance and payload checks

Use Node 26+ and run `npm run bench` (or `npm run bench:payload`). The selected layout is 40 time bits, 10 machine bits, and 3 counter bits. It has eight unique slots per millisecond per machine/epoch allocation, a 34.8-year horizon, and exact Number values.

## Live 100,000-ID issuance

One observed real-clock run on Node v26.13.1 / Apple M1 Max:

| Measurement | Result |
| --- | ---: |
| Successful outputs | 100,000 |
| Distinct outputs | 100,000 |
| Duplicate outputs | 0 |
| Live generation time | 16.03 seconds |
| Capacity retries | 12,690 |
| Approximate theoretical minimum | 12.5 seconds |

The source reads native Date.now on every attempt and never caches time or advances a logical timestamp. The application helper awaits a 1 ms timer after ERR_SEQUENCE_EXHAUSTED, yielding instead of spinning. Scheduling, coarse clocks, competing work, and timer delays can skip issuance windows. This is one live run, not a throughput or latency guarantee. The theoretical eight-per-ms limit is an upper bound, not a promised 8,000 IDs/s service rate.

The original v3.0.3 diagnostic emitted 100,000 rounded Numbers in an isolated VM, with only 1,141 distinct values and 100,000 unsafe integers. Its 228.12 ms is not a correctness-equivalent speed comparison. The earlier arithmetic draft also emitted severe duplicates; its millisecond-per-100,000 claims do not describe this exact format. Old local benchmark artifacts were archived outside the checkout so they cannot be mistaken for current results.

## JSON default; binary optional

Both codecs process the identical 100,000 exact live-issued IDs. Nine warmed samples alternate codec order. Timings include encoding, one Buffer copy, receiver decoding, and safe-integer validation. Equality checks are outside timing; no network or database is measured.

| Payload | Encode median | Copy median | Decode/validate median | Total median | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| JSON numbers | 2.36 ms | 0.09 ms | 3.82 ms | 6.08 ms | 1,700,009 |
| Binary float64 LE | 0.60 ms | 0.07 ms | 1.61 ms | 2.30 ms | 800,008 |

Binary payload processing was 2.65× faster and 52.9% smaller in this run. It does not increase generation capacity or remove issuance waiting. Component medians need not add up to the median total. JSON is the default example and preserves every new ID exactly. The optional binary codec carries the same Number values with explicit byte order and bounded framing.

[Raw timings, distinct counts, retries, source hashes, and method](results-node26.json) · [Payload protocol](../Examples/PAYLOADS.md) · [Batch helper](../Examples/generate-batch.cjs).

This exact-Number implementation is published as Particle@4.0.1 under npmjs latest and next and as @sschiau/particle@4.0.1 on GitHub Packages. npmjs latest and next both point to Particle@4.0.1. Existing CI files/test command are unchanged.

## Deterministic correctness tests

`npm test` checks 100,000 distinct issuances using an injected clock that advances after every eight successes. This validates packing and counter invariants; it is not a wall-clock throughput claim. Additional tests exercise all 1,024 machines and eight slots at one timestamp, max/zero values, JSON/binary round-trips, exhaustion and recovery, configuration switching, reentrant clocks, legacy decoding, and unsafe clone/restart conditions. These tests do not guarantee uniqueness when callers violate allocation/namespace/restart requirements.
