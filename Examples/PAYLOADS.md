# JSON by default; optional binary

Particle 4.0.1 retains Particle.generateParticle() and its Number output. New IDs fit in Number.MAX_SAFE_INTEGER, so JSON numbers round-trip exactly. Binary is an application transport option, not a way around the generator's eight-per-ms capacity.

## Run locally on Node 26+

```sh
node Examples/payload-roundtrip.cjs          # JSON default
node Examples/payload-roundtrip.cjs --binary # Explicit binary option
```

Each example generates 100,000 distinct IDs using real-clock backpressure. It takes at least about 12.5 seconds; the recorded live run took 16.03 seconds. The batching helper queues retries asynchronously after capacity exhaustion. It never changes the clock, invents future timestamps, or recreates the generator.

The original library method remains synchronous. The async helper is application code around it, and rejects configuration changes during a running batch. Configure a unique machine allocation and shared epoch at startup; keep the singleton's configuration stable while other callers use it.

## Optional module

For a repository checkout:

```js
const { encodeNumberPayload, decodeNumberPayload } = require('./binary.js')
const bytes = encodeNumberPayload(ids)
// Send bytes using a binary-capable transport.
const receivedIds = decodeNumberPayload(bytes)
```

npmjs Particle@4.0.1 (next) provides this entry as `require('Particle/binary.js')`. GitHub Packages provides it as `require('@sschiau/particle/binary.js')` in version 4.0.1. npmjs Particle@3.0.3 (latest) does not provide this entry. The original main export's fields/methods are unchanged; binary helpers are a separate module.

The example uses a local Buffer copy to exercise separate receiver storage. It does not test a network or database. The helper transports ID batches, not arbitrary business-event records. Keep any other payload fields in their current schema until an appropriate complete-record encoding is tested.

## Wire format

| Bytes | Contents |
| --- | --- |
| 0–3 | ASCII PNF1: Particle Number Float64 codec version 1 |
| 4–7 | Unsigned 32-bit little-endian count |
| 8 onward | One IEEE-754 float64 little-endian Number per ID |

A complete frame has exactly `8 + count * 8` bytes and at most 1,000,000 IDs. Invalid lengths, counts, magic/version, noninteger or negative values, and values above the legacy Number range are rejected. New-generation IDs are safe integers; the generic Number codec also permits legacy rounded Numbers for migration and cannot restore their lost bits. Decoded output owns separate memory.

Buffer.writeDoubleLE/readDoubleLE specify byte order. A browser receiver can use DataView.getFloat64(offset, true). These are float64 bytes, not an int64 wire representation. Sending a raw Float64Array backing buffer without a byte-order/ownership contract is not the portable protocol used here.

The frame header identifies the codec, not the Particle ID format or epoch. Share the format/epoch namespace separately. Streaming receivers must assemble a complete frame and enforce length limits before buffering the advertised body. Authentication/integrity protection belongs to the application transport.

## Measured codec cost

On the same 100,000 exact IDs, warmed encode/copy/decode+validation medians were JSON 6.08 ms and binary 2.30 ms, with 1,700,009 and 800,008 bytes respectively. These codec-only times exclude the 16.03-second live issuance run. They are not request-latency guarantees. [Full method and raw results](../Benchmarks/README.md).

Do not wrap binary in base64/JSON and assume these timings still apply. Reuse a buffer only after consumers finish with its old contents. Neither transport allocates machine IDs, persists restart watermarks, synchronizes clocks, or creates uniqueness across epochs/unsafe clones.

References: [Node Buffer doubles](https://nodejs.org/api/buffer.html#bufwritedoublelevalue-offset), [Float64Array byte order](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array), [DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView).
