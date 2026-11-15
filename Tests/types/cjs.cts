import Particle = require('Particle')
const generator = Particle.createGenerator({ machineId: 1 })
const id: bigint = generator.next()
const value: string = generator.nextString()
const timestamp: number = Particle.decode(value).timestamp
// @ts-expect-error Do not decode a Number.
Particle.decode(123)
void id
void timestamp
