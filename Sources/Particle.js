/**
 * Copyright 2014-2026 Silviu Schiau.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @about Exact 53-bit Number IDs with the original Particle API
 * @author Silviu Schiau <pr@silviu.co>
 * @version 4.0.2
 * @license Apache-2.0
 *
 * Thanks to Twitter for Snowflake.
 */



'use strict';

(function () {
  var TIME_SCALE = 8192 // 2^13: 10 machine bits and 3 counter bits.
  var MACHINE_SCALE = 8
  var MAX_ELAPSED = 1099511627775 // 2^40 - 1 milliseconds, about 34.8 years.
  var MAX_ID = Number.MAX_SAFE_INTEGER
  var LEGACY_OFFSET = 1099511627775
  var LEGACY_SCALE = 4194304
  var LEGACY_MIN_ID = LEGACY_OFFSET * LEGACY_SCALE
  var LEGACY_MAX_ID = 9223372036854775808
  var states = new Map()
  var cachedConfig
  var lastTimestamp = -1 // Rollback guard only; every generation reads Date.now.

  function fail(code, message) {
    var error = new RangeError(message)
    error.code = code
    throw error
  }

  function validateEpoch(epoch) {
    if (!Number.isSafeInteger(epoch)) throw new TypeError('Epoch must be a safe integer Number in milliseconds')
    // Leave room for both exact timestamps and the legacy rounded boundary.
    if (epoch < 1000000000000 || epoch > Number.MAX_SAFE_INTEGER - MAX_ELAPSED - 2) {
      throw new RangeError('Epoch must have at least 13 digits and room for the supported time range')
    }
  }

  function configuration(machineId, epoch) {
    if (!Number.isInteger(machineId)) throw new TypeError('Machine ID must be an integer Number')
    if (machineId < 0 || machineId > 1023) throw new RangeError('Enter a valid machine id range [0-1023]')
    validateEpoch(epoch)
    var key = epoch + ':' + machineId
    return { machineId: machineId, epoch: epoch, key: key, state: states.get(key), machineOffset: machineId * MACHINE_SCALE, endTimestamp: epoch + MAX_ELAPSED }
  }

  var Particle = {
    version: '4.0.2',
    author: 'Silviu Schiau',
    machineId: void 0,
    epoch: void 0,
    generateParticle: function () {
      var machineId = this.machineId
      var epoch = this.epoch
      var config = cachedConfig
      if (!config || machineId !== config.machineId || epoch !== config.epoch) {
        config = configuration(machineId, epoch)
        cachedConfig = config
      }
      var now = Date.now()
      if (!Number.isSafeInteger(now)) throw new RangeError('Clock must return safe integer milliseconds')
      if (now < epoch) fail('ERR_CLOCK_BEFORE_EPOCH', 'Clock is earlier than the configured epoch')
      if (now < lastTimestamp) fail('ERR_CLOCK_ROLLBACK', 'Clock moved backwards; wait until it catches up')
      if (now > config.endTimestamp) fail('ERR_TIMESTAMP_OVERFLOW', '40-bit elapsed timestamp range is exhausted')
      // A clock callback can reenter generation; look up newly created state too.
      var state = config.state || states.get(config.key)
      var sequence = state && state.timestamp === now ? state.sequence + 1 : 0
      if (sequence > 7) fail('ERR_SEQUENCE_EXHAUSTED', '8 IDs already issued for this machine and epoch in this millisecond; retry after the clock advances')
      // No cached time, random sequence, bitwise truncation, or unsafe integers.
      var id = (now - epoch) * TIME_SCALE + config.machineOffset + sequence
      if (!state) {
        state = { timestamp: now, sequence: sequence }
        states.set(config.key, state)
        config.state = state
      } else {
        state.timestamp = now
        state.sequence = sequence
      }
      lastTimestamp = now
      return id
    },
    timeFromParticle: function (particle) {
      var epoch = this.epoch
      validateEpoch(epoch)
      if (typeof particle !== 'number') throw new TypeError('Particle must be a Number')
      if (!Number.isInteger(particle) || particle < 0) throw new RangeError('Particle must be a non-negative integer Number')
      if (particle <= MAX_ID) return Math.floor(particle / TIME_SCALE) + epoch
      // Valid legacy IDs occupy a disjoint, much larger numeric range.
      if (particle < LEGACY_MIN_ID || particle > LEGACY_MAX_ID) throw new RangeError('Particle is outside the supported numeric formats')
      return Math.floor(particle / LEGACY_SCALE) - LEGACY_OFFSET + epoch
    }
  }

  var root = typeof self === 'object' && self && self.Object === Object && self || globalThis
  root.Particle = Particle
  if (typeof module === 'object' && module && module.exports) module.exports = Particle
}.call(this))
