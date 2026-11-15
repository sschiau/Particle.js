# Particle.js

[![npm version](https://img.shields.io/npm/v/Particle?label=npm%20stable)](https://www.npmjs.com/package/Particle)
[![Publish to npm](https://github.com/sschiau/Particle.js/actions/workflows/publish.yml/badge.svg)](https://github.com/sschiau/Particle.js/actions/workflows/publish.yml)
[![License](https://img.shields.io/npm/l/Particle)](LICENSE.md)
[![Node support](https://img.shields.io/node/v/Particle)](package.json)
[![Socket score](https://socket.dev/api/badge/npm/package/Particle)](https://socket.dev/npm/package/Particle)

Exact time-based IDs for JavaScript. Independent generators, `bigint` or decimal-string output, and zero runtime dependencies.

> **v4 release candidate:** this branch contains `4.0.0-rc.1`, which has not been published. npm's stable release is **3.0.3**, whose Number precision and random-sequence limitations still apply. The v4 API and ID format are breaking changes; read the [migration guide](docs/migration-v4.md).

[Try the live v4 candidate demo](https://sschiau.github.io/Particle.js/Demo/mechanics.html) · [Run the v4 candidate demo](#browser-demo) · [API](docs/api.md) · [Compare approaches](docs/comparison.md) · [Benchmarks](docs/benchmarks.md)

![Particle mechanics and deployment diagram](docs/mechanics-preview.jpg)

## Why Particle v4?

- **Preserve every bit.** IDs use 63 value bits, fit in a non-negative signed 64-bit database integer, and never pass through JavaScript Number.
- **Count instead of guessing.** One generator can issue 4,096 distinct IDs per millisecond before reporting exhaustion.
- **Own your state.** Each generator has an immutable machine ID and epoch. Imports do not create globals or modify prototypes.
- **Fail explicitly.** Clock rollback, timestamp overflow, and per-millisecond exhaustion produce actionable errors without busy-waiting.
- **Use the module system you have.** CommonJS and ESM entry points share one implementation. TypeScript declarations are included and checked as installed consumers.

Uniqueness depends on **one active generator per machine ID in a shared epoch namespace**, monotonic clock behavior, and safe machine reuse after restarts. Particle does not allocate machine IDs, persist state, or coordinate machines. It is not an authentication-token generator.

## Try the candidate

Use Node **24.22.1+ in 24.x** or **26.13.1+ in 26.x**. Development and publishing use Node 26.13.1. The browser module needs native ES modules and BigInt.

Until the candidate is published, build it from this checkout:

```sh
npm ci --ignore-scripts
npm run check
npm pack
# In your application, install the resulting tarball:
npm install --save-exact /path/to/Particle-4.0.0-rc.1.tgz
```

### CommonJS

```js
const { createGenerator, decode } = require('Particle')

// Allocate machineId centrally; never reuse it concurrently.
const generator = createGenerator({ machineId: 1 })
const id = generator.nextString()
const fields = decode(id)

console.log(JSON.stringify({ id, timestamp: fields.timestamp }))
```

### ES modules and TypeScript

```js
import { createGenerator, decode } from 'Particle'

const generator = createGenerator({ machineId: 1 })
const id = generator.next() // bigint
const text = id.toString()  // exact decimal string for JSON
const { timestamp, machineId, sequence } = decode(text)
```

The default epoch is **2026-01-01T00:00:00.000Z**. Set a custom `epoch` in UNIX milliseconds when needed and supply that same epoch to `decode(id, { epoch })`. Never convert an ID to Number. JSON does not serialize BigInt directly; use `nextString()` or `id.toString()`.

## How the ID works

```text
       Clock                 Machine                Counter
  milliseconds − epoch    allocated 0–1023      0–4095 per millisecond
          │                     │                       │
          └───────────────┬─────┴───────────────────────┘
                          ▼
             [ 41 time | 10 machine | 12 sequence ]
                          │
                          ▼
              Exact bigint or decimal string
```

The upper sign bit is unused. A 41-bit millisecond range lasts about 69.7 years from your epoch. IDs strictly increase **within one generator**. Different machines do not provide a global causal order, and decimal strings require numeric sorting (or an appropriate numeric database column).

## Deploy across services

1. Pin the same released version and deploy with `npm ci` and a committed lockfile.
2. Choose a shared, stable epoch and record the format/epoch namespace with your data.
3. Assign a distinct machine ID to each concurrent process or worker. Replicas of the same service also need different allocations.
4. Synchronize host clocks and handle clock/capacity errors at your application boundary.
5. Before restarting or reassigning a machine ID, ensure its clock has passed the last timestamp previously issued. Persist/recover a watermark or enforce this through your allocator; the library does not perform it automatically.
6. Keep one generator per allocation for the lifetime of the process. Pass an existing ID through downstream services instead of recreating it.

Use database uniqueness constraints as a final guard. If you cannot coordinate machine ownership and restart safety, consider [UUIDs or a database sequence](docs/comparison.md).

## Capacity and clock errors

| Error code | Meaning | Application response |
| --- | --- | --- |
| `ERR_SEQUENCE_EXHAUSTED` | 4,096 IDs already issued in this millisecond | Backpressure or retry after the clock advances; do not spin |
| `ERR_CLOCK_ROLLBACK` | Clock is earlier than the last successful call | Alert and wait until it catches up; do not recreate the generator |
| `ERR_CLOCK_BEFORE_EPOCH` | Current time precedes your epoch | Correct configuration or clock |
| `ERR_TIMESTAMP_OVERFLOW` | 41-bit time range is exhausted | Plan a new epoch **and separate namespace** |

Failures do not consume the next sequence. Invalid option types and malformed IDs are rejected rather than coerced. See [the API contract](docs/api.md) for bounds, examples, and serialization.

## Evidence, not a speed slogan

The checked-in deterministic burst comparison generates 4,096 IDs at one machine and millisecond. v3.0.3 produces **5 distinct Number outputs** even with idealized non-repeating random draws; the v4 candidate produces **4,096 distinct exact outputs**. That is **819.2× more distinct outputs in this particular test**, not an end-to-end speedup or a universal uniqueness guarantee.

Reproduce the result with `npm run bench`. [Method, raw samples, and limitations](docs/benchmarks.md).

## Browser demo

Serve this checkout and open the static system diagram:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/Demo/mechanics.html
```

```html
<script type="module">
  import { createGenerator } from './Sources/Particle.mjs'
  const generator = createGenerator({ machineId: 1 })
  console.log(generator.nextString())
</script>
```

The candidate demo uses local ES modules and styles under a restrictive CSP. Its optional held clock demonstrates counters without animation. GitHub Pages publishes **main**. The live diagram demonstrates this unpublished v4 candidate; npm’s stable release remains v3.0.3.

## Contribute

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm run check
npm run bench
```

The existing GitHub workflows are unchanged. A separate proposal adds Node 24/26 checks on Linux, Windows, and macOS; that matrix has not run for this candidate. Run the full checks locally with `npm run check`. Tests cover timestamp/machine/sequence boundaries, frozen-clock bursts, rollback and overflow recovery, malformed IDs, DOM safety, module exports, and installed TypeScript consumers. Runtime source must retain 100% line, branch, and function coverage; that threshold is not a guarantee of correctness by itself.

[Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md) · [Code of conduct](CODE_OF_CONDUCT.md) · [Changelog](CHANGELOG.md) · [Release checklist](docs/release-checklist.md)

## License

[Apache-2.0](LICENSE.md). Copyright Silviu Schiau.
