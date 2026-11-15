// Node 26+ local draft: JSON by default, optional --binary.
const {performance}=require('node:perf_hooks')
const Particle=require('../Sources/Particle.js')
const generateBatch=require('./generate-batch.cjs')
const {encodeNumberPayload,decodeNumberPayload,validCount}=require('./number-payload.cjs')
async function main(){
 const args=process.argv.slice(2)
 if(args.some(arg=>arg!=='--binary'))throw Error('Usage: node Examples/payload-roundtrip.cjs [--binary]')
 const binary=args.includes('--binary')
 Particle.machineId=1;Particle.epoch=1480657492000
 console.log('Issuing 100000 unique IDs; real-clock capacity requires at least about 12.5 seconds.')
 const generated=await generateBatch(Particle)
 const start=performance.now()
 const bytes=binary?encodeNumberPayload(generated.ids):Buffer.from(JSON.stringify({ids:Array.from(generated.ids)}),'utf8')
 const receivedBytes=Buffer.from(bytes) // Local copy, not a network measurement.
 const received=binary?decodeNumberPayload(receivedBytes):JSON.parse(receivedBytes.toString('utf8')).ids
 if(!Array.isArray(received)&&!(received instanceof Float64Array))throw Error('Invalid ID list')
 validCount(received.length)
 for(const id of received)if(!Number.isSafeInteger(id)||id<0)throw Error('Expected exact Number IDs')
 const payloadMs=performance.now()-start
 for(let i=0;i<received.length;i++)if(received[i]!==generated.ids[i])throw Error('Round-trip changed an ID')
 console.log({format:binary?'binary':'json',outputs:received.length,distinct:new Set(received).size,bytes:bytes.length,generationMs:Number(generated.generationMs.toFixed(2)),payloadMs:Number(payloadMs.toFixed(2)),capacityRetries:generated.capacityRetries})
}
main().catch(error=>{console.error(error);process.exitCode=1})
