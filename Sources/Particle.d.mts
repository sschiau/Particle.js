/** Exact IDs contain 41 elapsed-time, 10 machine, and 12 sequence bits. */
export declare const version: string
export declare const DEFAULT_EPOCH: number
export declare const MAX_TIMESTAMP: bigint
export declare const MAX_ID: bigint
export declare const MAX_MACHINE_ID: 1023
export declare const MAX_SEQUENCE: 4095
export interface GeneratorOptions {
  /** Must be unique among concurrent generators in the same epoch namespace. */
  machineId: number
  /** Non-negative, safe integer UNIX milliseconds; default is 2026-01-01 UTC. */
  epoch?: number
  /** Defaults to Date.now. Primarily useful for deterministic tests. */
  clock?: () => number
}
export interface Generator {
  readonly machineId: number
  readonly epoch: number
  /** Throws on rollback, timestamp overflow, or more than 4096 IDs/ms. */
  next(): bigint
  /** Exact decimal serialization, suitable for JSON and database text columns. */
  nextString(): string
}
export interface DecodedId {
  readonly timestamp: number
  readonly elapsed: number
  readonly machineId: number
  readonly sequence: number
}
export declare function createGenerator(options: GeneratorOptions): Generator
export declare function decode(id: bigint | string, options?: { epoch?: number }): DecodedId
