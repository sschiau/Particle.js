# Draft: Rebuilding Particle.js around exact IDs

**Publication status:** draft for review. v4.0.0 is released under npm’s next tag; latest remains v3.0.3. Verify availability and links before posting. This article has not been posted to an external channel.

Particle.js started as a small JavaScript implementation of time-based identifiers. Its core idea was easy to explain: combine time, a machine number, and a sequence. But the old implementation returned a JavaScript Number and chose sequence values at random. Those decisions limited what users could safely assume about the result.

The v4 candidate changes the foundation. It keeps every ID as a BigInt, offers decimal strings for JSON, and uses a counter for calls inside the same millisecond. One generator can issue 4,096 distinct IDs at that timestamp. It then reports an explicit capacity error instead of guessing, spinning, or inventing future timestamps.

The representation matters. In a checked-in deterministic experiment, 4,096 legacy calls produced only five distinct Number outputs even when the random draws were made idealized and non-repeating before their range wrapped. The candidate produced 4,096 distinct exact outputs. That 819.2× ratio describes this specific distinct-output experiment. It is not a claim that every application becomes faster by that factor.

This is also an API redesign. CommonJS and ESM use one core implementation, generator instances own their state, and TypeScript declarations are checked inside actual packed-package consumers. Importing the package does not create a global singleton or extend String.prototype. The runtime still has no external dependencies.

A dependable library also needs clear failure boundaries. v4 detects clock rollback and timestamp overflow, preserves state when calls fail, and rejects Number IDs and noncanonical decimal strings during decoding. It does not allocate machine IDs, persist watermarks, synchronize infrastructure clocks, or guarantee safe restarts on its own. Those are deployment responsibilities, and the documentation describes them explicitly.

The accompanying system diagram tells the same story at two levels. A beginner sees a clock, a computer number, and a ticket counter. An engineer sees the 41/10/12-bit layout, exact values, JSON serialization, allocation, and failure policies. The diagram runs locally with no build step and under a restrictive Content Security Policy.

Local checks cover runtime, security, declarations, and packed consumers. The existing workflows remain unchanged; a separate proposal would add Node 24/26 checks on Linux, Windows, and macOS. That proposed matrix has not run for this candidate. The work is reviewable through its source, test cases, raw benchmark samples, comparison guide, and migration plan.

Before recommending it for a production system, evaluate whether machine allocation, restart safety, and time-based identifiers fit your requirements. UUIDs and database sequences solve different coordination problems and may be a better fit.

Try v4 with npm install Particle@next, read the migration guide, and bring a concrete reproduction or deployment question to the issue tracker. The useful measure of progress is what users can now rely on and reproduce.

Links to include after release: npm package, release notes, live v4 demo, API contract, migration guide, and reproducible benchmark results.
