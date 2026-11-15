import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { createGenerator, decode, version, DEFAULT_EPOCH, MAX_TIMESTAMP, MAX_ID, MAX_MACHINE_ID, MAX_SEQUENCE } from '../Sources/Particle.mjs'
const require = createRequire(import.meta.url)

test('CommonJS and ESM expose the same core without global or prototype mutation', () => {
  const cjs = require('../Sources/Particle.js')
  assert.equal(cjs.createGenerator, createGenerator)
  assert.equal(cjs.decode, decode)
  assert.equal(cjs.version, version)
  assert.equal(globalThis.Particle, undefined)
  assert.equal(String.prototype.lpad, undefined)
  assert.equal(MAX_MACHINE_ID, 1023)
  assert.equal(MAX_SEQUENCE, 4095)
})

test('default clock and epoch generate exact BigInt and JSON-safe decimal strings', () => {
  const generator = createGenerator({ machineId: 17 })
  assert.equal(generator.epoch, DEFAULT_EPOCH)
  const id = generator.next()
  assert.equal(typeof id, 'bigint')
  assert.equal(decode(id).machineId, 17)
  assert.ok(decode(id).timestamp <= Date.now())
  const serialized = JSON.parse(JSON.stringify({ id: generator.nextString() }))
  assert.match(serialized.id, /^[0-9]+$/)
  assert.equal(decode(serialized.id).machineId, 17)
  assert.ok(Object.isFrozen(generator))
  assert.ok(Object.isFrozen(decode(id)))
})

test('invalid options, machine IDs, epochs, and clocks are rejected without coercion', () => {
  for (const bad of [null, [], false, 2, 'options']) {
    assert.throws(() => createGenerator(bad), TypeError)
    assert.throws(() => decode(0n, bad), TypeError)
  }
  assert.throws(() => createGenerator(), /machineId/)
  for (const machineId of [undefined, null, '1', -1, 1024, 0.5, NaN, Infinity]) {
    assert.throws(() => createGenerator({ machineId }), /machineId/)
  }
  for (const epoch of [null, '0', -1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createGenerator({ machineId: 0, epoch }), /epoch/)
    assert.throws(() => decode(0n, { epoch }), /epoch/)
  }
  for (const clock of [null, 1, 'Date.now']) {
    assert.throws(() => createGenerator({ machineId: 0, clock }), /clock/)
  }
})

test('clock values must be safe integer timestamps', () => {
  for (const now of [undefined, null, '0', 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createGenerator({ machineId: 0, epoch: 0, clock: () => now }).next(), /clock/)
  }
  assert.throws(() => createGenerator({ machineId: 0, epoch: 0, clock: () => -1 }).next(), { code: 'ERR_CLOCK_BEFORE_EPOCH' })
})

test('zero and the maximum 63-bit ID round-trip exactly', () => {
  const zero = createGenerator({ machineId: 0, epoch: 0, clock: () => 0 }).next()
  assert.equal(zero, 0n)
  assert.deepEqual(decode('0', { epoch: 0 }), { timestamp: 0, elapsed: 0, machineId: 0, sequence: 0 })
  const generator = createGenerator({ machineId: 1023, epoch: 0, clock: () => Number(MAX_TIMESTAMP) })
  let max
  for (let i = 0; i <= MAX_SEQUENCE; i++) max = generator.next()
  assert.equal(max, MAX_ID)
  assert.equal(max, 9223372036854775807n)
  assert.deepEqual(decode(max.toString(), { epoch: 0 }), {
    timestamp: Number(MAX_TIMESTAMP), elapsed: Number(MAX_TIMESTAMP), machineId: 1023, sequence: 4095
  })
})

test('4096 IDs in a frozen millisecond are distinct and strictly increasing', () => {
  let now = DEFAULT_EPOCH + 123
  let calls = 0
  const generator = createGenerator({ machineId: 7, clock: () => { calls++; return now } })
  const ids = Array.from({ length: 4096 }, () => generator.next())
  assert.equal(new Set(ids).size, 4096)
  for (let i = 1; i < ids.length; i++) assert.ok(ids[i] > ids[i - 1])
  assert.throws(generator.next, { code: 'ERR_SEQUENCE_EXHAUSTED' })
  assert.throws(generator.nextString, { code: 'ERR_SEQUENCE_EXHAUSTED' })
  assert.equal(calls, 4098, 'overflow does not poll or busy-wait')
  now++
  const next = generator.next()
  assert.ok(next > ids.at(-1))
  assert.equal(decode(next).sequence, 0)
})

test('all 1024 machine IDs occupy disjoint fields at the same time', () => {
  const ids = new Set()
  for (let machineId = 0; machineId <= 1023; machineId++) {
    const generator = createGenerator({ machineId, clock: () => DEFAULT_EPOCH + 123 })
    for (let sequence = 0; sequence < 2; sequence++) {
      const id = generator.next()
      assert.deepEqual(decode(id), { timestamp: DEFAULT_EPOCH + 123, elapsed: 123, machineId, sequence })
      ids.add(id)
    }
  }
  assert.equal(ids.size, 2048)
})

test('rollback and clock errors leave sequence state intact for recovery', () => {
  let now = DEFAULT_EPOCH + 10
  let broken = false
  const generator = createGenerator({ machineId: 0, clock: () => { if (broken) throw new Error('clock unavailable'); return now } })
  const first = generator.next()
  now--
  assert.throws(generator.next, { code: 'ERR_CLOCK_ROLLBACK' })
  now++
  assert.equal(generator.next(), first + 1n)
  broken = true
  assert.throws(generator.next, /clock unavailable/)
  broken = false
  assert.equal(generator.next(), first + 2n)
})

test('timestamp overflow is explicit and does not consume a sequence', () => {
  let now = Number(MAX_TIMESTAMP)
  const generator = createGenerator({ machineId: 0, epoch: 0, clock: () => now })
  const first = generator.next()
  now++
  assert.throws(generator.next, { code: 'ERR_TIMESTAMP_OVERFLOW' })
  now--
  assert.equal(generator.next(), first + 1n)
})

test('decoding rejects Number values and malicious or noncanonical decimal strings', () => {
  for (const bad of [0, Number(MAX_ID), null, undefined, {}, [], true, Symbol('id')]) {
    assert.throws(() => decode(bad), TypeError)
  }
  for (const bad of ['', ' 1', '1 ', '1\n', '1\r', '1\u2028', '1\u0000', '+1', '-1', '00', '01', '1.0', '1e3', '0xff', '１', '<script>alert(1)</script>', '9'.repeat(100000)]) {
    assert.throws(() => decode(bad), TypeError)
  }
  for (const bad of [-1n, MAX_ID + 1n, '9999999999999999999']) assert.throws(() => decode(bad), RangeError)
})

test('custom epoch decoding is exact and input configuration cannot mutate generators', () => {
  const options = { machineId: 5, epoch: 1000, clock: () => 1234 }
  const generator = createGenerator(options)
  options.machineId = 6
  options.epoch = 0
  assert.deepEqual(decode(generator.next(), { epoch: 1000 }), { timestamp: 1234, elapsed: 234, machineId: 5, sequence: 0 })
  assert.equal(generator.machineId, 5)
  assert.equal(generator.epoch, 1000)
  assert.throws(() => { generator.machineId = 6 }, TypeError)
})

test('known wire-format vectors match the documented layout', () => {
  const generator = createGenerator({ machineId: 1, epoch: 0, clock: () => 1 })
  assert.equal(generator.next(), 4198400n)
  assert.equal(generator.next(), 4198401n)
  assert.deepEqual(decode('4198400', { epoch: 0 }), { timestamp: 1, elapsed: 1, machineId: 1, sequence: 0 })
  assert.deepEqual(decode(8192n, { epoch: 0 }), { timestamp: 0, elapsed: 0, machineId: 2, sequence: 0 })
})
