import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { cpus } from 'node:os'
import { performance } from 'node:perf_hooks'
import { createGenerator, DEFAULT_EPOCH, version } from '../Sources/Particle.mjs'

const timestamp = Date.UTC(2026, 10, 15, 12, 0, 0)
let draw = 0
const math = Object.create(Math)
// Give legacy code idealized non-repeating draws before its 4095-value range wraps.
math.random = () => ((draw++ % 4095) + 0.5) / 4095
class FixedDate extends Date { constructor() { super(timestamp) } }
const legacy = createContext({ Date: FixedDate, Math: math })
runInContext(readFileSync(new URL('./fixtures/Particle-v3.0.3.js', import.meta.url), 'utf8'), legacy)
legacy.Particle.machineId = 1
legacy.Particle.epoch = DEFAULT_EPOCH
const oldIds = Array.from({ length: 4096 }, () => legacy.Particle.generateParticle())
const generator = createGenerator({ machineId: 1, clock: () => timestamp })
const newIds = Array.from({ length: 4096 }, () => generator.next().toString())
const previousDistinct = new Set(oldIds).size
const candidateDistinct = new Set(newIds).size
const iterations = 100000
function measure(strings) {
  let tick = 0
  const g = createGenerator({ machineId: 1, clock: () => timestamp + Math.floor(tick++ / 1024) })
  let last
  const start = performance.now()
  for (let i = 0; i < iterations; i++) last = strings ? g.nextString() : g.next()
  const milliseconds = performance.now() - start
  return { milliseconds, idsPerSecond: iterations / milliseconds * 1000, last: last.toString() }
}
measure(false)
measure(true)
const bigintRuns = Array.from({ length: 5 }, () => measure(false))
const stringRuns = Array.from({ length: 5 }, () => measure(true))
const median = runs => runs.map(run => run.idsPerSecond).sort((a, b) => a - b)[2]
console.log(JSON.stringify({
  candidate: version,
  node: process.version,
  platform: process.platform,
  architecture: process.arch,
  cpu: cpus()[0]?.model,
  burst: {
    fixedTimestamp: timestamp, sharedEpoch: DEFAULT_EPOCH, samples: 4096,
    legacyVersion: '3.0.3', legacyDistinctNumberIds: previousDistinct,
    legacyUnsafeNumberIds: oldIds.filter(id => !Number.isSafeInteger(id)).length,
    candidateDistinctStringIds: candidateDistinct,
    distinctOutputRatio: candidateDistinct / previousDistinct,
    method: 'Fixed machine and millisecond. Legacy receives idealized sequential random draws, not real randomness. This measures distinct outputs, not speed or end-to-end production capacity.'
  },
  throughput: {
    iterationsPerRun: iterations, repeats: 5,
    bigintMedianIdsPerSecond: median(bigintRuns),
    stringMedianIdsPerSecond: median(stringRuns),
    bigintRuns, stringRuns,
    method: 'Candidate only; injected clock advances after every 1024 calls. Warmed local microbenchmark. No storage, network, production wall-clock pacing, or legacy throughput comparison.'
  }
}, null, 2))
