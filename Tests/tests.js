require('../Sources/Particle.js')

describe('Errors', () => {
  test('Throw error if MachineId is not set', () => {
    expect(() => {
      Particle.generateParticle()
    }).toThrow('Machine ID should be digits only and not undefined')
  })

  test('Throw error if MachineId is not an integer', () => {
    expect(() => {
      Particle.machineId = 'not an integer'
      Particle.generateParticle()
    }).toThrow('Machine ID should be digits only and not undefined')
  })

  test('Throw error if MachineId is not inside the valid range [0-1023]', () => {
    expect(() => {
      Particle.machineId = 2000
      Particle.generateParticle()
    }).toThrow('Enter a valid machine id range [0-1023]')
  })

  test('Throw error if Epoch is not undefined', () => {
    expect(() => {
      Particle.machineId = 1
      Particle.generateParticle()
    }).toThrow('Epoch should be digits only and not undefined')
  })

  test('Throw error if Epoch is not an integer', () => {
    expect(() => {
      Particle.epoch = 'not an integer'
      Particle.generateParticle()
    }).toThrow('Epoch should be digits only and not undefined')
  })

  test('Throw error if Epoch is not 13 digits long', () => {
    expect(() => {
      Particle.epoch = 148065749200
      Particle.generateParticle()
    }).toThrow('UNIX time should be in miliseconds (min 13 digits)')
  })
})

describe('Tests', () => {
  test('Check Epoch & MachineId inside Particle', () => {
    Particle.machineId = 1
    Particle.epoch = 1480657492000
    expect(Particle.machineId).toBe(1)
    expect(Particle.epoch).toBe(1480657492000)
  })

  test('Generate Particle', () => {
    Particle.machineId = 1
    Particle.epoch = 1480657492000
    var particle = Particle.generateParticle()
    expect(particle).toBeGreaterThan(4611686018427387903)
    expect(particle).toBeLessThanOrEqual(9223372036854775807)
  })

  test('Retrieve Time From Particle', () => {
    var particle = Particle.generateParticle()
    expect(Particle.timeFromParticle(particle)).toBeGreaterThan(1480657492000)
  })
})

describe('Browser global export', () => {
  test('exports to browser self when it shares the current Object constructor', () => {
    const browser = { Object }
    global.self = browser
    try {
      jest.isolateModules(() => { require('../Sources/Particle.js') })
      expect(browser.Particle.version).toBe('3.0.0')
      browser.Particle.machineId = 1
      browser.Particle.epoch = 1480657492000
      expect(browser.Particle.generateParticle()).toBeGreaterThan(0)
    } finally {
      delete global.self
    }
  })
})
