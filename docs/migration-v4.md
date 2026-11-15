# Migrating from v3 to v4

v4 is a new API and ID format. It is not a drop-in patch. Keep existing records and API consumers working in their existing namespace while adding v4 deliberately.

| v3 | v4 |
| --- | --- |
| Side-effect import populates global Particle | Named CJS/ESM exports; no global export |
| Shared mutable machineId and epoch | Immutable configuration per generator instance |
| generateParticle() returns Number | next() returns bigint; nextString() returns decimal string |
| Random sequence may repeat | Counter uses 0–4095 per millisecond |
| Adds an implicit time offset | Elapsed milliseconds directly occupy 41 bits |
| May silently lose integer bits | Exact 63-bit value throughout |
| No rollback or burst policy | Explicit operational error codes |

## Change initialization

```js
// v4: create once at startup, not once per request.
const { createGenerator, decode } = require('Particle')
const epoch = 1767225600000
const generator = createGenerator({ machineId: 1, epoch })
const id = generator.nextString()
const fields = decode(id, { epoch })
```

For browser code use `type="module"` and import from `Sources/Particle.mjs`. A classic script tag no longer sets globalThis.Particle. Code that uses String.prototype.lpad must provide its own formatting; v4 does not modify built-in prototypes.

## Change storage and transport

Change schemas, validation, serializers, and database drivers to preserve decimal strings or native 64-bit integers end to end. Do not parse IDs using parseInt, unary plus, or Number. JSON cannot directly serialize BigInt; use strings.

Keep an external marker such as `{ idFormat: "particle-v4", idEpoch: 1767225600000, id: "..." }`. The ID itself contains no format or epoch. Use that marker to select the correct decoder. Do not feed old IDs to decode and assume a plausible timestamp proves compatibility.

Lost v3 integer bits cannot be recovered by converting the old Number to BigInt. Preserve old values as stored, their old decoding path, and their provenance; create new v4 identifiers only for new records or through an explicit mapping migration.

## Change deployment assumptions

Allocate one machine ID per concurrently active process/worker, keep the epoch stable, and handle sequence exhaustion and clock rollback. Never recreate a generator per request or restart it to bypass a clock error.

Restart safety belongs to the application: persist/recover the last issued timestamp or wait until the clock is known to be beyond the previous allocation's watermark. Cloned workers, VM snapshots, and overlapping leases need the same protection. Add database uniqueness constraints and test your failure/recovery paths.

## Rollout

1. Test the v4 package in a staging consumer, including declaration resolution and driver serialization.
2. Add the explicit ID namespace and dual-read logic where old and new records coexist.
3. Verify allocation, backpressure, clock monitoring, and restart-watermark handling under deployment failures.
4. Release a clearly versioned API/schema change, migrate clients, and monitor errors and constraint violations.
5. Keep the v3 decoder until old data no longer requires it. A package upgrade alone does not migrate IDs.
