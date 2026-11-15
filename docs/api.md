# Particle v4 API

This document describes `4.0.0`, available under npm’s `next` tag. The v3 API and ID format differ.

## createGenerator(options)

```js
const { createGenerator } = require('Particle')
const generator = createGenerator({ machineId: 12, epoch: 1767225600000 })
```

| Option | Contract |
| --- | --- |
| `machineId` | Required number, integer 0–1023. Allocate one per concurrent generator in the epoch namespace. Strings are rejected. |
| `epoch` | Optional non-negative, safe integer UNIX milliseconds. Default `1767225600000` (2026-01-01 UTC). Must be at most `Number.MAX_SAFE_INTEGER − (2^41−1)` so decoded timestamps remain exact. |
| `clock` | Optional function returning safe integer UNIX milliseconds; defaults to `Date.now`. Primarily useful for deterministic testing. |

The frozen generator exposes `machineId`, `epoch`, `next()` and `nextString()`. Options are captured when constructed; changing the original options object has no effect. Sequence state is private to this instance and is not persisted.

`next()` returns a **bigint**. `nextString()` generates the next ID and returns its canonical decimal string. Calling both creates two IDs, not two representations of the same one. To serialize an existing bigint, use `id.toString()`.

For the first call in a millisecond the sequence is zero; later calls in that same millisecond increment it. When the clock advances, the sequence resets to zero. After sequence 4095, the next call throws. Clock rollback throws until the clock catches up with the last successful timestamp. Neither failure consumes sequence state. The implementation never sleeps, polls, invents future timestamps, or automatically retries.

## decode(id, options?)

```js
const { decode } = require('Particle')
const fields = decode('4198400', { epoch: 1767225600000 })
// { timestamp: 1767225600001, elapsed: 1, machineId: 1, sequence: 0 }
```

Input must be bigint or a canonical decimal string of at most 19 digits, in `[0, 2^63−1]`. Number, whitespace, leading plus signs, leading zeros (except `"0"`), exponent notation, hexadecimal strings, negative values, and oversized strings are rejected. The bounded string check happens before BigInt conversion.

The optional `epoch` uses the same validation and default as `createGenerator`. The frozen result contains numeric `timestamp` (UNIX milliseconds), `elapsed` (milliseconds from epoch), `machineId`, and `sequence`. These fields fit safely in Number; the full ID may not.

An ID carries no epoch, format version, origin, authentication, or proof that it was issued by your system. Parsing only verifies the representation and bit bounds. Use application authorization and an external format/epoch namespace.

## Wire format

```text
Unused sign bit | elapsed milliseconds | machine ID | sequence
     1 bit      |       41 bits        |  10 bits   | 12 bits
```

`id = (BigInt(timestamp − epoch) << 22n) | (BigInt(machineId) << 12n) | BigInt(sequence)`.

Minimum ID is `0n`. Maximum is `9223372036854775807n`. Time range is `[0, 2199023255551]` milliseconds from epoch. The package exports `version`, `DEFAULT_EPOCH`, `MAX_TIMESTAMP`, `MAX_ID`, `MAX_MACHINE_ID`, and `MAX_SEQUENCE` alongside the two functions.

Store the decimal string in JSON and language boundaries. For database integer storage, verify your driver returns signed 64-bit values as strings or BigInt, not Number. Decimal string lexicographic order is not numeric order.

## Error behavior

Invalid options and inputs throw TypeError or RangeError. Operational RangeErrors also carry one of these stable `code` strings:

| Code | Trigger |
| --- | --- |
| `ERR_CLOCK_BEFORE_EPOCH` | Clock value is before epoch |
| `ERR_CLOCK_ROLLBACK` | Clock value is below this instance's last successful timestamp |
| `ERR_SEQUENCE_EXHAUSTED` | 4,096 IDs already emitted at the current millisecond |
| `ERR_TIMESTAMP_OVERFLOW` | Elapsed time exceeds the 41-bit range |

A custom clock's own exception is propagated. Invalid or failing calls do not change timestamp or sequence state. Callers are responsible for backpressure, retry scheduling, monitoring, and ownership allocation. Recreating the generator to work around a failure can reissue IDs.

## Uniqueness and restart contract

A single instance's successful calls strictly increase. Disjoint machine IDs separate generators at the same epoch, timestamp, and sequence. These properties do not coordinate machine IDs, protect against cloned process state, persist watermarks, or create global ordering across machines.

Two instances using the same machine ID and epoch can immediately collide. Restarted generators reset sequence to zero; before reusing a machine ID, the clock must be strictly later than every timestamp previously issued with that allocation. The system must persist/recover that watermark or enforce the condition through an allocator. If you cannot satisfy these conditions, use an identifier approach that does not depend on machine allocation.
