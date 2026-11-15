import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const scratch = mkdtempSync(join(tmpdir(), 'particle-package-'))
const run = (file, args, cwd) => execFileSync(file, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
try {
  const cache = join(scratch, 'cache')
  assert.ok(process.env.npm_execpath, 'Run via npm run test:package')
  const npm = (args, cwd) => run(process.execPath, [process.env.npm_execpath, ...args], cwd)
  const packResult = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', scratch, '--cache', cache], root))
  const packed = Array.isArray(packResult) ? packResult[0] : (packResult.files ? packResult : Object.values(packResult)[0])
  const paths = new Set(packed.files.map(file => file.path))
  for (const file of ['Sources/Particle.js', 'Sources/Particle.mjs', 'Sources/Particle.d.cts', 'Sources/Particle.d.mts', 'README.md', 'LICENSE.md', 'docs/api.md', 'docs/migration-v4.md']) assert.ok(paths.has(file), `missing ${file}`)
  assert.ok(![...paths].some(path => /^(Tests|Benchmarks|node_modules)\//.test(path)))
  const consumer = join(scratch, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'particle-consumer-check', private: true }))
  npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache, join(scratch, packed.filename)], consumer)
  const assertions = `
    const g = createGenerator({machineId: 8, clock: () => DEFAULT_EPOCH + 1});
    if (decode(g.next()).machineId !== 8 || typeof g.nextString() !== 'string') throw Error('invalid consumer API');
    if (globalThis.Particle !== undefined || String.prototype.lpad !== undefined) throw Error('global side effect');
  `
  run(process.execPath, ['--disallow-code-generation-from-strings', '--input-type=commonjs', '-e', `const {createGenerator, decode, DEFAULT_EPOCH} = require('Particle'); ${assertions}`], consumer)
  run(process.execPath, ['--disallow-code-generation-from-strings', '--input-type=module', '-e', `import {createGenerator, decode, DEFAULT_EPOCH} from 'Particle'; ${assertions}`], consumer)
  for (const file of ['esm.mts', 'cjs.cts', 'tsconfig.json']) writeFileSync(join(consumer, file), readFileSync(join(root, 'Tests/types', file)))
  run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(consumer, 'tsconfig.json')], consumer)
  console.log(`Packed ${packed.id}: CJS, ESM, no-eval consumers and both TypeScript declaration paths pass.`)
} finally {
  // Only remove this test's freshly allocated temporary directory.
  rmSync(scratch, { recursive: true, force: true })
}
