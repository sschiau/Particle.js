const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { describe, test } = require('node:test')
const { runInThisContext } = require('node:vm')

const sourcePath = require.resolve('../Sources/Particle.js')
require(sourcePath)
const Particle = globalThis.Particle

describe('Errors', () => {
  test('Throw error if MachineId is not set', () => {
    assert.throws(() => {
      Particle.generateParticle()
    }, { message: 'Machine ID should be digits only and not undefined' })
  })

  test('Throw error if MachineId is not an integer', () => {
    assert.throws(() => {
      Particle.machineId = 'not an integer'
      Particle.generateParticle()
    }, { message: 'Machine ID should be digits only and not undefined' })
  })

  test('Throw error if MachineId is not inside the valid range [0-1023]', () => {
    assert.throws(() => {
      Particle.machineId = 2000
      Particle.generateParticle()
    }, { message: 'Enter a valid machine id range [0-1023]' })
  })

  test('Throw error if Epoch is not undefined', () => {
    assert.throws(() => {
      Particle.machineId = 1
      Particle.generateParticle()
    }, { message: 'Epoch should be digits only and not undefined' })
  })

  test('Throw error if Epoch is not an integer', () => {
    assert.throws(() => {
      Particle.epoch = 'not an integer'
      Particle.generateParticle()
    }, { message: 'Epoch should be digits only and not undefined' })
  })

  test('Throw error if Epoch is not 13 digits long', () => {
    assert.throws(() => {
      Particle.epoch = 148065749200
      Particle.generateParticle()
    }, { message: 'UNIX time should be in miliseconds (min 13 digits)' })
  })
})

describe('Tests', () => {
  test('Check Epoch & MachineId inside Particle', () => {
    Particle.machineId = 1
    Particle.epoch = 1480657492000
    assert.equal(Particle.machineId, 1)
    assert.equal(Particle.epoch, 1480657492000)
  })

  test('Generate Particle', () => {
    Particle.machineId = 1
    Particle.epoch = 1480657492000
    var particle = Particle.generateParticle()
    assert.equal(typeof particle, 'number')
    assert.ok(particle > 4611686018427387903)
    assert.ok(particle <= 9223372036854775807)
  })

  test('Retrieve Time From Particle', () => {
    var particle = Particle.generateParticle()
    var timestamp = Particle.timeFromParticle(particle)
    assert.equal(typeof timestamp, 'number')
    assert.ok(timestamp > 1480657492000)
  })
})

describe('Browser global export', () => {
  test('exports to browser self when it shares the current Object constructor', () => {
    const browser = { Object }
    global.self = browser
    try {
      runInThisContext(readFileSync(sourcePath, 'utf8'), { filename: sourcePath })
      assert.equal(browser.Particle.version, '3.0.0')
      browser.Particle.machineId = 1
      browser.Particle.epoch = 1480657492000
      const particle = browser.Particle.generateParticle()
      assert.equal(typeof particle, 'number')
      assert.ok(particle > 0)
    } finally {
      delete global.self
    }
  })
})
