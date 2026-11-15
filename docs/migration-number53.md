# Migrating to the exact-Number draft

This is an unpublished, breaking ID-format change. The method names, mutable singleton, CommonJS/browser globals, machine range, epoch property, and Number return type are retained. That does not make old and new packed values interchangeable.

| Old v3.0.3 format | New draft |
| --- | --- |
| Large rounded Number, random sequence | Exact safe integer Number, deterministic counter |
| Time offset plus 10 machine and 12 random bits | 40 elapsed-time, 10 machine, 3 counter bits |
| Randomness and lost bits can collide | Eight distinct slots per millisecond per valid allocation |
| No explicit capacity handling | Ninth call throws ERR_SEQUENCE_EXHAUSTED |
| Legacy unsafe numeric range | 0 through Number.MAX_SAFE_INTEGER |

1. Retain old stored IDs exactly as stored. Conversion cannot recover previously lost precision. Do not regenerate old IDs or silently replace foreign keys.
2. Mark records/messages with a namespace such as `{ idFormat: "particle-number53-v1", idEpoch: 1480657492000, id: 123 }`. Epoch and format are not encoded in the Number itself. Different epochs can overlap numerically.
3. Update validators to accept safe non-negative integer IDs, including zero. Preserve legacy validation/lookup paths for old records. `timeFromParticle()` can distinguish both supported numeric ranges, but other decoders need explicit format handling.
4. Allocate distinct machine IDs to all concurrent workers/processes in an epoch namespace. A shared physical machine may host several generator processes, each needing its own allocation.
5. Keep an allocation's last-issued timestamp watermark outside process memory. Before reusing it after restart, wait until the clock is strictly later. Snapshots, cloned instances, overlapping leases, and reloads reset or duplicate local state.
6. Add backpressure for ERR_SEQUENCE_EXHAUSTED. The API remains synchronous; queue or retry later in the application rather than busy-waiting or recreating the generator. At eight IDs/ms, 100,000 distinct IDs cannot be generated in under 10 ms by one allocation.
7. Keep JSON as the default transport. New safe integers round-trip exactly. The optional binary example is a separate codec and neither increases issuance capacity nor replaces namespace/restart safeguards.
8. Test staging, JSON consumers, binary consumers when used, database uniqueness constraints, driver integer handling, rollback, and restart recovery before an approved release.

New generation supports at most 1099511627775 elapsed milliseconds from epoch, about 34.8 years. Plan a new namespace before exhaustion; do not reset an epoch or counter within an existing ID domain.

The GitHub draft is named Particle 4.0 with version fields set to 4.0.1, as requested. This exact-Number implementation is not published. Version 4.0.1 identifies this exact-Number redesign. A future npmjs publication requires separate approval. Do not push a release tag or dispatch publishing for this draft. The new ID format and operational changes require a major-version rollout; the preserved method names do not make this a drop-in patch. Node 26+ is the new support policy; CI files remain unchanged at the owner's request.
