# Choosing an identifier approach

Choose according to your operating model, not a package's badge count. Particle v4 is useful when compact, time-based IDs and machine allocation fit your system.

| Approach | Exact representation | Coordination | Ordering | Main tradeoff |
| --- | --- | --- | --- | --- |
| Particle v4 | 63-bit bigint / decimal string | Distinct machine IDs, common epoch, safe restart policy | Strict within one live generator | 4096 IDs/ms per generator; explicit clock/capacity errors |
| Particle v3.0.3 | JavaScript Number | Machine/epoch configuration | Time influenced; precision and random repeats remain | Cannot guarantee distinct outputs |
| UUID v4, e.g. Node crypto.randomUUID() | 128-bit UUID string | No machine-ID allocator | Random, no chronological ordering | Probabilistic collision model; larger values |
| UUID v7 implementation | 128-bit UUID string with time field | Depends on implementation's generation policy | Time ordered by format; details vary | Audit its monotonicity, random-bit, and clock policies |
| Database sequence | Database integer | Database manages sequence state | Sequence allocation order, not transaction commit order | Database access; gaps are normal |

Use Particle v4 for local generation when you control infrastructure, allocation, and data serialization. Use UUIDs when you want independent clients without machine ownership coordination. Use a database sequence when central allocation and database operations already fit the application.

No identifier is a substitute for an authorization check. Do not treat time ordering as a distributed causal clock. Never use performance figures from one input model as proof of another system's end-to-end behavior.

Sources: [UUID standard, RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html), [Node crypto.randomUUID](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions), [PostgreSQL sequence semantics](https://www.postgresql.org/docs/current/functions-sequence.html).
