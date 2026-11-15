const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const {test}=require('node:test')
const {join}=require('node:path')
test('all demo entrypoints restrict script execution to local external files',()=>{
 const directory=join(__dirname,'../Demo')
 for(const name of fs.readdirSync(directory).filter(name=>name.endsWith('.html'))){
  const html=fs.readFileSync(join(directory,name),'utf8')
  const policy=html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1]
  assert.ok(policy,`${name}: missing CSP`)
  assert.match(policy,/(?:^|;)\s*default-src 'none'(?:;|$)/)
  assert.doesNotMatch(policy,/unsafe-inline|unsafe-eval|https?:|\*/)
  for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
   const source=script[1].match(/\bsrc="([^"]+)"/i)?.[1]
   assert.ok(source,`${name}: inline scripts are forbidden`)
   const url=new URL(source,'https://demo.invalid/Demo/')
   assert.equal(url.origin,'https://demo.invalid',`${name}: external script origin`)
   assert.equal(script[2].trim(),'')
  }
 }
})
test('exact-Number demo renders safely without changing clocks or randomness',()=>{
 class Element{
  constructor(value=''){this.value=value;this.children=[];this.text=''}
  set textContent(value){this.text=String(value);this.children=[]}get textContent(){return this.text}
  set innerHTML(_){throw Error('Unsafe HTML sink')}set outerHTML(_){throw Error('Unsafe HTML sink')}insertAdjacentHTML(){throw Error('Unsafe HTML sink')}
  append(node){this.children.push(node)}prepend(node){this.children.unshift(node)}replaceChildren(){this.children=[]}
  get lastElementChild(){const parent=this;return{remove(){parent.children.pop()}}}addEventListener(type,fn){this[type]=fn}
 }
 const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)}
 const epoch=1480657492000;let now=epoch+1234
 class Clock extends Date{static now(){return now}}
 const math=Object.create(Math),originalRandom=math.random,originalNow=Clock.now
 element('machine').value='1';element('epoch').value=String(epoch)
 const context=vm.createContext({Date:Clock,Math:math,document:{getElementById:element,createElement:()=>new Element()}},{codeGeneration:{strings:false,wasm:false}})
 context.window=context
 vm.runInContext(fs.readFileSync(join(__dirname,'../Sources/Particle.js'),'utf8'),context)
 vm.runInContext(fs.readFileSync(join(__dirname,'../Demo/mechanics.js'),'utf8'),context)
 const click=()=>element('generate').click()
 function unchanged(){assert.equal(context.Date,Clock);assert.equal(Clock.now,originalNow);assert.equal(math.random,originalRandom)}
 function valid(machine,selectedEpoch=epoch){
  element('machine').value=String(machine);element('epoch').value=String(selectedEpoch);click()
  assert.equal(element('error').textContent,'')
  const bits=element('bits').children.map(cell=>cell.children[0].textContent).join(''),id=Number(element('id').textContent)
  assert.equal(bits.length,53);assert.equal(parseInt(bits,2),id);assert.ok(Number.isSafeInteger(id))
  assert.equal(JSON.parse(JSON.stringify({id})).id,id);unchanged()
 }
 valid(0);valid(1023,1000000000000)
 for(const value of ['', '-1','1024','1.5','Infinity','<img src=x onerror=alert(1)>']){element('machine').value=value;const before=element('id').textContent;click();assert.match(element('error').textContent,/machine ID/);assert.equal(element('id').textContent,before);unchanged()}
 element('machine').value='1'
 for(const value of ['', '-1','999999999999','Infinity','0.1',String(now+1),'<script>alert(1)</script>']){element('epoch').value=value;const before=element('id').textContent;click();assert.match(element('error').textContent,/epoch/);assert.equal(element('id').textContent,before);unchanged()}
 element('epoch').value=String(epoch)
 const original=context.Particle.generateParticle
 context.Particle.generateParticle=()=>{throw Error('<img src=x onerror=alert(1)>')};click();assert.equal(element('error').textContent,'<img src=x onerror=alert(1)>');unchanged();context.Particle.generateParticle=original
 for(let i=0;i<8;i++)valid(42)
 const last=element('id').textContent;click();assert.match(element('error').textContent,/8 IDs/);assert.equal(element('id').textContent,last)
 now++;valid(42);assert.equal(element('sequence').textContent,'0000')
 assert.equal(element('history').children.length,4)
})
