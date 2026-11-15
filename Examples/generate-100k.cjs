// Node 26+. At 8 IDs/ms, 100000 unique IDs need at least about 12.5 seconds.
const Particle=require('../Sources/Particle.js')
const generateBatch=require('./generate-batch.cjs')
async function main(){
 Particle.machineId=1;Particle.epoch=1480657492000
 console.log('Generating 100000 exact Number IDs with real-clock backpressure (at least about 12.5 seconds).')
 const {ids,generationMs,capacityRetries}=await generateBatch(Particle)
 console.log({outputs:ids.length,distinct:new Set(ids).size,generationMs:Number(generationMs.toFixed(2)),capacityRetries,first:ids[0],last:ids.at(-1)})
}
main().catch(error=>{console.error(error);process.exitCode=1})
