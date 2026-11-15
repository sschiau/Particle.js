const assert=require('node:assert/strict')
const {readFileSync}=require('node:fs')
const {createHash}=require('node:crypto')
const {join}=require('node:path')
const {performance}=require('node:perf_hooks')
const {runInNewContext}=require('node:vm')
const {cpus}=require('node:os')
const Particle=require('../Sources/Particle.js')
const generateBatch=require('../Examples/generate-batch.cjs')
const {encodeNumberPayload,decodeNumberPayload}=require('../Examples/number-payload.cjs')
if(Number(process.versions.node.split('.')[0])<26)throw Error('Use Node 26 or newer')
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex')
const sourceFile=join(__dirname,'../Sources/Particle.js')
const payloadFile=join(__dirname,'../Sources/binary.js')
const count=100000,epoch=1480657492000
function median(values){return [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]}
function check(expected,actual){assert.equal(actual.length,expected.length);for(let i=0;i<expected.length;i++)assert.equal(actual[i],expected[i])}
async function main(){
 Particle.machineId=1;Particle.epoch=epoch
 const live=await generateBatch(Particle,count)
 const liveDistinct=new Set(live.ids).size
 assert.equal(liveDistinct,count)
 for(let i=0;i<count;i++){
  assert.ok(Number.isSafeInteger(live.ids[i]));if(i)assert.ok(live.ids[i]>live.ids[i-1])
  assert.ok(Particle.timeFromParticle(live.ids[i])<=Date.now())
 }
 const exact=new Array(count);for(let i=0;i<count;i++)exact[i]=live.ids[i]
 const codecs={
  json:{encode:ids=>Buffer.from(JSON.stringify({ids}),'utf8'),decode:bytes=>{const ids=JSON.parse(bytes.toString('utf8')).ids;assert.ok(Array.isArray(ids));assert.equal(ids.length,count);for(const id of ids)assert.ok(Number.isSafeInteger(id)&&id>=0);return ids}},
  binary:{encode:encodeNumberPayload,decode:bytes=>{const ids=decodeNumberPayload(bytes);for(const id of ids)assert.ok(Number.isSafeInteger(id));return ids}}
 }
 const runs={json:[],binary:[]},repeats=9
 for(let i=0;i<repeats;i++)for(const name of i%2?['binary','json']:['json','binary']){
  const codec=codecs[name];check(exact,codec.decode(codec.encode(exact)))
  const start=performance.now(),bytes=codec.encode(exact),encoded=performance.now()
  const incoming=Buffer.from(bytes),copied=performance.now(),decoded=codec.decode(incoming),finished=performance.now()
  check(exact,decoded)
  runs[name].push({encodeMs:encoded-start,copyMs:copied-encoded,decodeMs:finished-copied,totalMs:finished-start,payloadBytes:bytes.length})
 }
 const payload={}
 for(const name of ['json','binary']){
  payload[name]={}
  for(const key of Object.keys(runs[name][0]))payload[name][key]=median(runs[name].map(x=>x[key]))
  payload[name].maximumObservedMs=Math.max(...runs[name].map(x=>x.totalMs))
 }
 const oldFile=join(__dirname,'Particle-v3.0.3.js'),oldContext={}
 runInNewContext(readFileSync(oldFile,'utf8'),oldContext)
 oldContext.Particle.machineId=1;oldContext.Particle.epoch=epoch
 const oldStart=performance.now(),oldIds=new Array(count)
 for(let i=0;i<count;i++)oldIds[i]=oldContext.Particle.generateParticle()
 const oldMs=performance.now()-oldStart,oldDistinct=new Set(oldIds).size
 console.log(JSON.stringify({node:process.version,cpu:cpus()[0]?.model,count,layout:{timeBits:40,machineBits:10,counterBits:3,idsPerMillisecondPerAllocation:8},hashes:{source:hash(sourceFile),payload:hash(payloadFile),legacy:hash(oldFile)},method:'Live issuance uses the unchanged synchronous API and fresh native Date.now readings. An application helper awaits a 1ms timer only on sequence exhaustion. One 100000-ID live run includes scheduling/backpressure. JSON is default; optional binary uses the identical exact-ID corpus. Payload medians cover nine warmed encode/copy/decode+safe-integer-validation samples, alternating codec order; no network or database. Issuance and codec timings are reported separately. The original v3.0.3 diagnostic runs in an isolated VM and returns rounded/colliding Numbers; its timing is not a fair correctness-equivalent speed ratio.',issuance:{generationMs:live.generationMs,outputs:count,distinct:liveDistinct,capacityRetries:live.capacityRetries,theoreticalMinimumApproxMs:count/8},payload,runs,legacyDiagnostic:{generationMs:oldMs,outputs:count,distinct:oldDistinct,unsafeNumbers:oldIds.filter(id=>!Number.isSafeInteger(id)).length,warning:'These original outputs are not comparable to 100000 distinct exact IDs.'}},null,2))
}
main().catch(error=>{console.error(error);process.exitCode=1})
