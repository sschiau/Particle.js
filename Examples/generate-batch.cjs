// Application backpressure helper, not a change to the synchronous Particle API.
const {performance}=require('node:perf_hooks')
const {setTimeout:wait}=require('node:timers/promises')
async function generateBatch(Particle,count=100000){
 if(!Number.isInteger(count)||count<0||count>1000000)throw new RangeError('Batch count must be between 0 and 1000000')
 const machineId=Particle.machineId,epoch=Particle.epoch
 const ids=new Float64Array(count)
 let retries=0,index=0
 const start=performance.now()
 while(index<count){
  if(Particle.machineId!==machineId||Particle.epoch!==epoch)throw Error('Do not reconfigure the singleton during a batch')
  try{ids[index]=Particle.generateParticle();index++}
  catch(error){
   if(error.code!=='ERR_SEQUENCE_EXHAUSTED')throw error
   retries++
   await wait(1) // Yield to real time; no spinning, clock caching, or future dates.
  }
 }
 return {ids,generationMs:performance.now()-start,capacityRetries:retries}
}
module.exports=generateBatch
