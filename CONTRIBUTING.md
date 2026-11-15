# Contributing

Start with a bug report containing a minimal reproduction or a feature request describing the use case. Keep pull requests focused on a concrete behavior and include relevant tests.

## Development

Use the version in `.nvmrc` (currently Node 26.13.1). Node 24.22.1 is also tested.

```sh
nvm install
nvm use
npm ci --ignore-scripts
npm run check
npm run bench
```

`npm run check` runs the runtime and demo security tests, TypeScript fixtures, a real packed-package installation with CJS/ESM/type consumers, and npm audit. Runtime source coverage must remain 100% for lines, branches, and functions. TypeScript is a development-only dependency; the published runtime has no dependencies.

Serve the repository with `python3 -m http.server 8765 --bind 127.0.0.1` and open `http://127.0.0.1:8765/Demo/mechanics.html` to review the browser demo. No bundler is needed. Keep it compatible with its strict CSP and use textContent rather than HTML parsing for dynamic output.

The package has one ESM implementation and a small synchronous CommonJS bridge for supported Node versions. Keep `.d.mts` and `.d.cts` declarations in sync. The pack test verifies both declarations in an installed consumer, not only within this repository.

## ID correctness

Tests should use injected clocks to cover same-millisecond bursts, rollback, overflow, machine separation, and recovery without consuming sequence state. Keep decoding exact at 0 and 2^63−1. Reject Number IDs, noncanonical strings, and unbounded input before conversion. Avoid sleeping or random tests for invariants that can be deterministic.

Read [the migration guide](docs/migration-v4.md) before changing the wire format. Mixed formats and epochs require explicit namespaces. Benchmark results must include the input model, runtime, hardware, repetitions, and the claim's limits.

## Releases

A maintainer reviews validation before tagging. Tag names must match package.json exactly. The existing publishing workflow runs runtime tests and npm audit, then runs npm publish. The package sets `publishConfig.tag` to `next`, so v4 publishes there while `latest` stays on v3.0.3. Keep that setting unless a separate promotion is approved. The workflow does not run the declaration or packed-consumer checks; run the full checks locally before publishing. Ordinary branch pushes do not publish npm packages. Do not retag or overwrite a published version.

Keep package metadata, source version, changelog, examples, and both lockfile version entries aligned. GitHub Pages publishes main, so merging demo changes also changes the public site. See [the release checklist](docs/release-checklist.md).
