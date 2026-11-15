import { createGenerator, decode, type Generator, type DecodedId } from 'Particle'
const generator: Generator = createGenerator({ machineId: 1, clock: () => 1767225600000 })
const id: bigint = generator.next()
const text: string = generator.nextString()
const fields: DecodedId = decode(text)
const time: number = fields.timestamp
// @ts-expect-error Numbers are rejected to prevent precision loss.
decode(123)
// @ts-expect-error Machine identifiers must be numbers.
createGenerator({ machineId: '1' })
// @ts-expect-error A machine ID is required.
createGenerator({})
// @ts-expect-error Generator options are immutable.
generator.machineId = 2
// @ts-expect-error next() returns bigint, not Number.
const lossy: number = id
void time
