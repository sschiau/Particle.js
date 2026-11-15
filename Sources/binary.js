/* Copyright 2014-2026 Silviu Schiau. SPDX-License-Identifier: Apache-2.0 */
// Optional Node 26+ binary transport. The Particle singleton API is unchanged.
// Wire format: ASCII PNF1, uint32 LE count, count IEEE-754 float64 LE Numbers.
const MAGIC=Buffer.from('PNF1').readUInt32LE(0)
const HEADER_BYTES=8,MAX_IDS=1000000,MAX_ID=2**63
function validId(id){if(typeof id!=='number'||!Number.isInteger(id)||id<0||id>MAX_ID)throw new TypeError('Expected an original-format non-negative integer Number')}
function validCount(count){if(!Number.isInteger(count)||count<0||count>MAX_IDS)throw new RangeError(`Payload count must be between 0 and ${MAX_IDS}`)}
function encodeNumberPayload(ids){
  if(!Array.isArray(ids)&&!(ids instanceof Float64Array))throw new TypeError('Expected an Array or Float64Array of Numbers')
  const count=ids.length
  validCount(count)
  const payload=Buffer.alloc(HEADER_BYTES+count*8)
  payload.writeUInt32LE(MAGIC,0);payload.writeUInt32LE(count,4)
  for(let i=0;i<count;i++){const id=ids[i];validId(id);payload.writeDoubleLE(id,HEADER_BYTES+i*8)}
  return payload
}
function decodeNumberPayload(payload){
  if(!Buffer.isBuffer(payload))throw new TypeError('Expected a Buffer')
  if(payload.length<HEADER_BYTES||payload.length>HEADER_BYTES+MAX_IDS*8)throw new RangeError('Invalid payload length')
  if(payload.readUInt32LE(0)!==MAGIC)throw new TypeError('Unsupported Number payload format')
  const count=payload.readUInt32LE(4);validCount(count)
  if(payload.length!==HEADER_BYTES+count*8)throw new RangeError('Payload length does not match count')
  const ids=new Float64Array(count)
  for(let i=0;i<count;i++){const id=payload.readDoubleLE(HEADER_BYTES+i*8);validId(id);ids[i]=id}
  return ids
}
module.exports={encodeNumberPayload,decodeNumberPayload,MAX_IDS,validId,validCount}
