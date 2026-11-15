const assert=require('node:assert/strict')
const {readFileSync}=require('node:fs')
const {test}=require('node:test')
const {runInNewContext}=require('node:vm')
const {join}=require('node:path')
const sourcePath=join(__dirname,'../Sources/Particle.js')
const source=readFileSync(sourcePath,'utf8')
const legacyPath=join(__dirname,'../Benchmarks/Particle-v3.0.3.js')
const legacySource=readFileSync(legacyPath,'utf8')
const EPOCH=1480657492000,MAX_ELAPSED=1099511627775
function load(code=source,initial=EPOCH+100,extra={}){
  const state={now:initial,clockReads:0,randomReads:0}
  class Clock extends Date {constructor(){super(state.now)}static now(){state.clockReads++;return state.now}}
  const math=Object.create(Math);math.random=()=>{state.randomReads++;return 0.25}
  const sandbox={Date:Clock,Math:math,...extra}
  runInNewContext(code,sandbox,{filename:code===source?sourcePath:legacyPath,contextCodeGeneration:{strings:false,wasm:false}})
  return {api:sandbox.Particle,state,sandbox}
}
function configured(now=EPOCH+100,extra={}){const result=load(source,now,extra);result.api.machineId=1;result.api.epoch=EPOCH;return result}

test('original API, global export, CommonJS return value, and Number output remain',()=>{
  const exported=require('../Sources/Particle.js')
  assert.equal(exported,globalThis.Particle)
  assert.deepEqual(Object.keys(exported),['version','author','machineId','epoch','generateParticle','timeFromParticle'])
  assert.equal(exported.version,'4.0.2')
  const {api}=configured();assert.equal(typeof api.generateParticle(),'number')
})

test('classic browser and CommonJS paths work without eval or prototype modification',()=>{
  const {sandbox,api}=configured(EPOCH+1,{module:{exports:{}}})
  assert.equal(sandbox.module.exports,api)
  assert.equal(runInNewContext('String.prototype.lpad',sandbox),undefined)
  for(const extra of [{module:null},{module:1},{module:{exports:null}},{self:null},{self:1},{self:{Object:null}}])assert.equal(configured(EPOCH+1,extra).api.version,'4.0.2')
  const {sandbox:realm}=load();runInNewContext('self={Object};',realm)
  runInNewContext(source,realm,{filename:sourcePath,contextCodeGeneration:{strings:false,wasm:false}})
  assert.equal(realm.self.Particle.version,'4.0.2')
})

test('machine and epoch inputs are validated strictly, without coercion',()=>{
  const empty=load().api;assert.throws(()=>empty.generateParticle(),/Machine ID/)
  for(const value of [undefined,null,'1',1.5,NaN,Infinity,true,{},[]]){const {api}=configured();api.machineId=value;assert.throws(()=>api.generateParticle(),/integer Number/)}
  for(const value of [-1,1024]){const {api}=configured();api.machineId=value;assert.throws(()=>api.generateParticle(),/range/)}
  for(const value of [undefined,null,'1480657492000',0.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,true,{},[]]){
    const {api}=configured();api.epoch=value
    assert.throws(()=>api.generateParticle(),/safe integer/);assert.throws(()=>api.timeFromParticle(0),/safe integer/)
  }
  for(const value of [-1,999999999999,Number.MAX_SAFE_INTEGER]){const {api}=configured();api.epoch=value;assert.throws(()=>api.generateParticle(),/at least 13 digits/)}
})

test('eight exact IDs in a millisecond increase by one; the ninth fails without polling',()=>{
  const {api,state}=configured()
  const ids=Array.from({length:8},()=>api.generateParticle())
  assert.equal(new Set(ids).size,8)
  assert.equal(ids[0],100*8192+8)
  for(let i=0;i<8;i++){assert.ok(Number.isSafeInteger(ids[i]));assert.equal(ids[i],ids[0]+i);assert.equal(api.timeFromParticle(ids[i]),state.now)}
  assert.throws(()=>api.generateParticle(),{code:'ERR_SEQUENCE_EXHAUSTED'})
  assert.throws(()=>api.generateParticle(),{code:'ERR_SEQUENCE_EXHAUSTED'})
  assert.equal(state.clockReads,10);assert.equal(state.randomReads,0)
  state.now++;const next=api.generateParticle()
  assert.equal(next,101*8192+8);assert.ok(next>ids[7]);assert.equal(api.timeFromParticle(next),state.now)
})

test('all 1024 machines and all eight slots are disjoint even when switching back',()=>{
  const {api,state}=configured(EPOCH)
  const ids=new Set()
  for(let machineId=0;machineId<1024;machineId++){
    api.machineId=machineId
    for(let sequence=0;sequence<8;sequence++){
      const id=api.generateParticle();assert.equal(id,machineId*8+sequence)
      assert.equal(api.timeFromParticle(id),EPOCH);ids.add(id)
    }
  }
  assert.equal(ids.size,8192)
  api.machineId=0;assert.throws(()=>api.generateParticle(),{code:'ERR_SEQUENCE_EXHAUSTED'})
  state.now++;assert.equal(api.generateParticle(),8192)
})

test('zero and Number.MAX_SAFE_INTEGER round-trip at time and machine boundaries',()=>{
  const zero=configured(EPOCH);zero.api.machineId=0
  assert.equal(zero.api.generateParticle(),0);assert.equal(zero.api.timeFromParticle(0),EPOCH)
  for(const epoch of [1000000000000,EPOCH,Number.MAX_SAFE_INTEGER-MAX_ELAPSED-2]){
    const {api,state}=configured(epoch+MAX_ELAPSED);api.epoch=epoch;api.machineId=1023
    let id
    for(let i=0;i<8;i++)id=api.generateParticle()
    assert.equal(id,Number.MAX_SAFE_INTEGER)
    assert.equal(api.timeFromParticle(id),state.now)
    assert.ok(Number.isSafeInteger(api.timeFromParticle(id)))
  }
})

test('100000 deterministic issuances are distinct and read a clock on every call',()=>{
  const {api,state}=configured(EPOCH)
  const ids=new Set()
  let previous=-1
  for(let i=0;i<100000;i++){
    state.now=EPOCH+Math.floor(i/8)
    const id=api.generateParticle();assert.ok(Number.isSafeInteger(id));assert.ok(id>previous)
    assert.equal(api.timeFromParticle(id),state.now);ids.add(id);previous=id
  }
  assert.equal(ids.size,100000);assert.equal(state.clockReads,100000);assert.equal(state.randomReads,0)
})

test('configuration changes retain state for every machine/epoch allocation',()=>{
  const {api}=configured()
  const first=api.generateParticle()
  api.machineId=2;const other=api.generateParticle();assert.notEqual(other,first)
  api.machineId=1;assert.equal(api.generateParticle(),first+1)
  api.epoch=EPOCH+1;const shifted=api.generateParticle();assert.notEqual(shifted,first)
  api.epoch=EPOCH;assert.equal(api.generateParticle(),first+2)
  api.machineId='1';assert.throws(()=>api.generateParticle(),/integer Number/)
  api.machineId=1;assert.equal(api.generateParticle(),first+3)
  api.epoch=null;assert.throws(()=>api.generateParticle(),/safe integer/)
  api.epoch=EPOCH;assert.equal(api.generateParticle(),first+4)
})

test('clock failures and overflow do not consume counter state',()=>{
  const {api,state}=configured();const first=api.generateParticle()
  state.now--;assert.throws(()=>api.generateParticle(),{code:'ERR_CLOCK_ROLLBACK'})
  api.machineId=2;assert.throws(()=>api.generateParticle(),{code:'ERR_CLOCK_ROLLBACK'})
  api.machineId=1;state.now++;assert.equal(api.generateParticle(),first+1)
  for(const now of [NaN,Infinity,'1480657492000',EPOCH+0.5,Number.MAX_SAFE_INTEGER+1]){state.now=now;assert.throws(()=>api.generateParticle(),/Clock must/)}
  state.now=EPOCH-1;assert.throws(()=>api.generateParticle(),{code:'ERR_CLOCK_BEFORE_EPOCH'})
  state.now=EPOCH+MAX_ELAPSED+1;assert.throws(()=>api.generateParticle(),{code:'ERR_TIMESTAMP_OVERFLOW'})
  state.now=EPOCH+100;assert.equal(api.generateParticle(),first+2)
  const edge=configured(EPOCH+MAX_ELAPSED-1);const before=edge.api.generateParticle()
  edge.state.now=EPOCH+MAX_ELAPSED+1;assert.throws(()=>edge.api.generateParticle(),{code:'ERR_TIMESTAMP_OVERFLOW'})
  edge.state.now=EPOCH+MAX_ELAPSED-1;assert.equal(edge.api.generateParticle(),before+1)
})

test('decoder accepts exact IDs and legacy rounded IDs in disjoint ranges',()=>{
  const {api}=configured()
  api.machineId=undefined;assert.equal(api.timeFromParticle(100*8192+8),EPOCH+100)
  for(const elapsed of [0,1,1234,MAX_ELAPSED]){
    const old=load(legacySource,EPOCH+elapsed);old.api.machineId=1023;old.api.epoch=EPOCH
    const id=old.api.generateParticle(),decoded=api.timeFromParticle(id)
    assert.ok(decoded===old.state.now||decoded===old.state.now+1)
  }
  assert.equal(api.timeFromParticle(2**63),EPOCH+MAX_ELAPSED+2)
  for(const value of [undefined,null,'1',{},[],true,Symbol('id')])assert.throws(()=>api.timeFromParticle(value),/must be a Number/)
  for(const value of [NaN,Infinity,-1,0.1])assert.throws(()=>api.timeFromParticle(value),/non-negative integer/)
  for(const value of [Number.MAX_SAFE_INTEGER+1,2**64])assert.throws(()=>api.timeFromParticle(value),/outside/)
})

test('reentrant clocks cannot reset counters or corrupt captured configuration',()=>{
  for(const differentAllocation of [false,true]){
    const {api,state,sandbox}=configured();let inside=false;const inner=[]
    sandbox.Date.now=()=>{
      state.clockReads++
      if(!inside){
        inside=true
        if(differentAllocation){api.machineId=2;inner.push(api.generateParticle());api.machineId=1}
        inner.push(api.generateParticle())
      }
      return state.now
    }
    const outer=api.generateParticle()
    assert.equal(outer,100*8192+8+1)
    assert.equal(new Set([...inner,outer]).size,inner.length+1)
    assert.equal(api.generateParticle(),outer+1)
  }
})

test('separate instances need unique assignments and a safe restart watermark',()=>{
  const a=configured(),b=configured()
  const first=a.api.generateParticle()
  assert.equal(b.api.generateParticle(),first,'cloned allocations can collide; state is process-local')
  const restart=configured();assert.equal(restart.api.generateParticle(),first,'reloading loses counter state')
  restart.state.now++;assert.ok(restart.api.generateParticle()>first)
})
test('binary Number payload has a portable little-endian frame and preserves Number values',()=>{
  const {encodeNumberPayload:encode,decodeNumberPayload:decode}=require('../binary.js')
  const golden=encode([1,2])
  assert.equal(golden.toString('hex'),'504e463102000000000000000000f03f0000000000000040')
  const view=new DataView(golden.buffer,golden.byteOffset,golden.byteLength)
  assert.equal(view.getFloat64(8,true),1);assert.equal(view.getFloat64(16,true),2)
  for(const values of [[],[0,-0,1,Number.MAX_SAFE_INTEGER,2**62,2**63],new Float64Array([1,2,3])]){
    const actual=decode(encode(values))
    assert.ok(actual instanceof Float64Array)
    assert.equal(actual.length,values.length)
    for(let i=0;i<values.length;i++)assert.ok(Object.is(values[i],actual[i]))
  }
})

test('binary payload rejects malformed, oversized, and invalid-value frames before use',()=>{
  const {encodeNumberPayload:encode,decodeNumberPayload:decode,MAX_IDS,validCount}=require('../binary.js')
  for(const value of [null,{},'1',new Uint32Array([1])])assert.throws(()=>encode(value),TypeError)
  for(const value of [NaN,Infinity,-1,0.5,2**64,'1',null])assert.throws(()=>encode([value]),TypeError)
  assert.throws(()=>encode(new Array(MAX_IDS+1)),RangeError)
  for(const value of [null,'1',-1,0.5,NaN,Infinity])assert.throws(()=>validCount(value),RangeError)
  for(const value of [null,{},new Uint8Array(8)])assert.throws(()=>decode(value),TypeError)
  assert.throws(()=>decode(Buffer.alloc(7)),RangeError)
  assert.throws(()=>decode(Buffer.alloc(8+MAX_IDS*8+1)),RangeError)
  const wrongMagic=encode([]);wrongMagic[0]=0;assert.throws(()=>decode(wrongMagic),TypeError)
  const hugeCount=encode([]);hugeCount.writeUInt32LE(MAX_IDS+1,4);assert.throws(()=>decode(hugeCount),RangeError)
  const truncated=encode([1]).subarray(0,15);assert.throws(()=>decode(truncated),RangeError)
  const extra=Buffer.concat([encode([]),Buffer.alloc(1)]);assert.throws(()=>decode(extra),RangeError)
  for(const value of [NaN,Infinity,-1,0.5,2**64]){
    const malformed=encode([1]);malformed.writeDoubleLE(value,8)
    assert.throws(()=>decode(malformed),TypeError)
  }
})

test('binary payload captures each input once and owns decoded output storage',()=>{
  const {encodeNumberPayload:encode,decodeNumberPayload:decode}=require('../binary.js')
  const input=[];let reads=0
  Object.defineProperty(input,0,{get(){reads++;return reads===1?1:NaN}})
  const payload=encode(input),decoded=decode(payload)
  assert.equal(reads,1);assert.equal(decoded[0],1)
  payload.writeDoubleLE(2,8);assert.equal(decoded[0],1)
})
