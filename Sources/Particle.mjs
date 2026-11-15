/**
 * Copyright 2014-2017 Silviu Schiau.
 * SPDX-License-Identifier: Apache-2.0
 * v4 uses exact integers and independent generator state.
 */

export const version = '4.0.0-rc.1'
export const DEFAULT_EPOCH = 1767225600000 // 2026-01-01T00:00:00.000Z
export const MAX_TIMESTAMP = (1n << 41n) - 1n
export const MAX_ID = (1n << 63n) - 1n
export const MAX_MACHINE_ID = 1023
export const MAX_SEQUENCE = 4095

function optionsObject(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object')
  }
}

function validateEpoch(epoch) {
  // Keep decoded UNIX milliseconds exactly representable as a Number.
  if (!Number.isSafeInteger(epoch) || epoch < 0 || epoch > Number.MAX_SAFE_INTEGER - Number(MAX_TIMESTAMP)) {
    throw new RangeError('epoch must be a non-negative safe integer with room for 41 timestamp bits')
  }
}

function fail(code, message) {
  const error = new RangeError(message)
  error.code = code
  throw error
}

/** Create one generator per allocated machine ID. Never share an ID concurrently. */
export function createGenerator(options = {}) {
  optionsObject(options)
  const { machineId, epoch = DEFAULT_EPOCH, clock = Date.now } = options
  if (!Number.isInteger(machineId) || machineId < 0 || machineId > MAX_MACHINE_ID) {
    throw new RangeError('machineId must be an integer from 0 to 1023')
  }
  validateEpoch(epoch)
  if (typeof clock !== 'function') throw new TypeError('clock must be a function')

  let lastTimestamp = -1
  let sequence = 0
  const machineBits = BigInt(machineId) << 12n

  function next() {
    const now = clock()
    if (!Number.isSafeInteger(now)) throw new RangeError('clock must return safe integer UNIX milliseconds')
    if (now < epoch) fail('ERR_CLOCK_BEFORE_EPOCH', 'clock is earlier than epoch')
    if (now < lastTimestamp) fail('ERR_CLOCK_ROLLBACK', 'clock moved backwards; wait for it to catch up')
    const elapsed = BigInt(now - epoch)
    if (elapsed > MAX_TIMESTAMP) fail('ERR_TIMESTAMP_OVERFLOW', '41-bit timestamp range exhausted; choose a new epoch and namespace')
    const nextSequence = now === lastTimestamp ? sequence + 1 : 0
    // Fail without spinning or inventing timestamps. State is unchanged on failure.
    if (nextSequence > MAX_SEQUENCE) fail('ERR_SEQUENCE_EXHAUSTED', '4096 IDs already generated in this millisecond; retry after the clock advances')
    lastTimestamp = now
    sequence = nextSequence
    return (elapsed << 22n) | machineBits | BigInt(sequence)
  }

  return Object.freeze({ machineId, epoch, next, nextString: () => next().toString() })
}

function parseId(id) {
  if (typeof id === 'string') {
    // Bound input length before BigInt conversion, including for untrusted IDs.
    if (id.length === 0 || id.length > 19 || (id.length > 1 && id[0] === '0') || /[^0-9]/.test(id)) throw new TypeError('id must be a canonical decimal string of at most 19 digits')
    id = BigInt(id)
  } else if (typeof id !== 'bigint') {
    throw new TypeError('id must be a bigint or decimal string; Number input is not accepted')
  }
  if (id < 0n || id > MAX_ID) throw new RangeError('id must fit in 63 unsigned value bits')
  return id
}

/** Decode v4 IDs only. Consumers must use the same epoch as their generator. */
export function decode(id, options = {}) {
  optionsObject(options)
  const { epoch = DEFAULT_EPOCH } = options
  validateEpoch(epoch)
  const value = parseId(id)
  const elapsed = Number(value >> 22n)
  return Object.freeze({
    timestamp: epoch + elapsed,
    elapsed,
    machineId: Number((value >> 12n) & 1023n),
    sequence: Number(value & 4095n)
  })
}
