const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const { join } = require('node:path');

test('demo rejects malicious input, avoids eval, and restores globals on errors', () => {
class Element {
 constructor(value='') { this.value=value; this.children=[]; this.text=''; }
 set textContent(value) { this.text=String(value); this.children=[]; }
 get textContent() { return this.text; }
 set innerHTML(_) { throw new Error('Unsafe HTML insertion'); }
 set outerHTML(_) { throw new Error('Unsafe HTML insertion'); }
 insertAdjacentHTML() { throw new Error('Unsafe HTML insertion'); }
 append(node) { this.children.push(node); }
 prepend(node) { this.children.unshift(node); }
 replaceChildren() { this.children=[]; }
 get lastElementChild() { const parent=this; return {remove() {parent.children.pop();}}; }
 addEventListener(type, fn) { this[type]=fn; }
}
const elements = new Map();
const element = id => {if (!elements.has(id)) elements.set(id,new Element());return elements.get(id);};
element('machine').value='1';element('epoch').value='1480657492000';
const math = Object.create(Math), originalRandom = math.random;
const context = vm.createContext({Date,Math:math,document:{getElementById:element,createElement:()=>new Element()}},{codeGeneration:{strings:false,wasm:false}});
context.window=context;
vm.runInContext(fs.readFileSync(join(__dirname, '../Sources/Particle.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(join(__dirname, '../Demo/mechanics.js'),'utf8'),context);
const click = () => element('generate').click();
function restored() {assert.equal(context.Date,Date);assert.equal(math.random,originalRandom);}
function valid(machine,epoch) {
 element('machine').value=String(machine);element('epoch').value=String(epoch);click();
 assert.equal(element('error').textContent,'');
 const bits=element('bits').children.map(c=>c.children[0].textContent).join('');
 assert.equal(Number(BigInt('0b'+bits)),Number(element('id').textContent));
 assert.equal(element('machine-value').textContent,String(machine).padStart(4,'0'));restored();
}
valid(0,1480657492000);valid(1023,1000000000000);
let rejected=0;
for (const value of ['', '-1','1024','1.5','Infinity','1e309','<img src=x onerror=alert(1)>','<script>alert(1)</script>']) {
 element('machine').value=value;const prior=element('id').textContent;click();
 assert.match(element('error').textContent,/machine ID/);assert.equal(element('id').textContent,prior);restored();rejected++;
}
element('machine').value='1';
for(const value of ['', '-1','999999999999','Infinity','1e309','1480657492000.5',String(Date.now()+86400000),'<img src=x onerror=alert(1)>']) {
 element('epoch').value=value;const prior=element('id').textContent;click();
 assert.match(element('error').textContent,/epoch/);assert.equal(element('id').textContent,prior);restored();rejected++;
}
element('epoch').value='1480657492000';
const originalGenerate=context.Particle.generateParticle;
context.Particle.generateParticle=()=>{throw new Error('<img src=x onerror=alert(1)>');};
click();assert.equal(element('error').textContent,'<img src=x onerror=alert(1)>');restored();
context.Particle.generateParticle=originalGenerate;
for(let i=0;i<10;i++) valid(42,1480657492000);
assert.equal(element('history').children.length,4);

});
