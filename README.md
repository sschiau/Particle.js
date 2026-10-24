# Particle.js

A small JavaScript library for generating time-based numeric identifiers and extracting their timestamps. Works in Node.js and browsers, with no runtime dependencies.

> **Known limitation:** identifiers are represented as JavaScript `Number`, which cannot preserve all 64-bit integer values. Distinct identifiers can collide. Random sequence selection can also repeat. Avoid this version where guaranteed uniqueness is required, and never use its identifiers as authentication tokens.

## Install

```sh
npm install Particle@3.0.0
```

Version 3 requires Node.js **24.22.1 or newer within Node 24.x**. See [release notes](CHANGELOG.md) for compatibility changes. The install command applies once v3.0.0 is published.

## Use in Node.js

The module registers `Particle` on the global object; it does not return the generator through `module.exports`.

```js
require('Particle')
const generator = globalThis.Particle

generator.machineId = 1
generator.epoch = 1480657492000

const id = generator.generateParticle()
const timestamp = generator.timeFromParticle(id)

console.log({ id, timestamp, date: new Date(timestamp) })
```

Set `machineId` to an integer from 0 through 1023 and `epoch` to a timestamp in milliseconds with at least 13 digits. Use the same epoch when decoding identifiers. These fields configure a shared singleton; changing them affects subsequent calls.

## Use in a browser

Serve `Sources/Particle.js` with your application and load it before your own script:

```html
<script src="./Sources/Particle.js"></script>
<script>
  Particle.machineId = 1
  Particle.epoch = 1480657492000
  console.log(Particle.generateParticle())
</script>
```

The optional `Demo/index.html` uses an old external HTTP Moment.js URL that may fail. The library itself does not need Moment.js.

## API

| Member | Purpose |
| --- | --- |
| `machineId` | Configured machine identifier, from 0 to 1023 |
| `epoch` | Custom epoch in milliseconds |
| `generateParticle()` | Generate a numeric identifier; throws when configuration fails validation |
| `timeFromParticle(id)` | Recover a timestamp using the configured epoch |
| `version` | Library version |

The format combines elapsed time, machine identity, and a random sequence. System clock changes and random sequence repetition affect its behavior. A synchronized clock does not resolve number precision or uniqueness limitations.

## Development

```sh
nvm install
nvm use
npm ci
npm test
npm audit
npm audit --omit=dev
```

The project pins Node 24.22.1 and Jest 30.5.2. Tests run locally without uploading coverage. Coverage reports are generated in `__TestsCoverage/`; existing thresholds remain enforced. At v3.0.0 preparation, 10 tests passed with 100% coverage and both npm audits reported zero affected packages. Audit results can change as advisories are published and do not cover the source limitations above.

## License

[Apache License 2.0](LICENSE.md). Copyright Silviu Schiau.
