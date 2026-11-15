const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const { test } = require('node:test')
const { join } = require('node:path')
const api = require('../Sources/Particle.js')

test('demo uses exact IDs, rejects malicious input, and recovers from inert errors without eval', () => {
  class Element {
    constructor(value = '') { this.value = value; this.checked = false; this.children = []; this.text = '' }
    set textContent(value) { this.text = String(value); this.children = [] }
    get textContent() { return this.text }
    set innerHTML(_) { throw new Error('Unsafe HTML insertion') }
    set outerHTML(_) { throw new Error('Unsafe HTML insertion') }
    insertAdjacentHTML() { throw new Error('Unsafe HTML insertion') }
    append(node) { this.children.push(node) }
    prepend(node) { this.children.unshift(node) }
    replaceChildren() { this.children = [] }
    get lastElementChild() { const parent = this; return { remove() { parent.children.pop() } } }
    addEventListener(type, fn) { this[type] = fn }
  }
  const elements = new Map()
  const element = id => {
    if (!elements.has(id)) elements.set(id, new Element())
    return elements.get(id)
  }
  element('machine').value = '1'
  let failNext = false
  const context = vm.createContext({
    ...api, Date,
    createGenerator(options) {
      const generator = api.createGenerator(options)
      return { next() { if (failNext) throw new Error('<img src=x onerror=alert(1)>'); return generator.next() } }
    },
    document: { getElementById: element, createElement: () => new Element() }
  }, { codeGeneration: { strings: false, wasm: false } })
  // The production file is an ES module. Inject its tested imports into a strict VM
  // so DOM behavior can be exercised with parsing sinks forbidden.
  const script = fs.readFileSync(join(__dirname, '../Demo/mechanics.js'), 'utf8').replace(/^import .* from .*\n/m, '')
  vm.runInContext(`'use strict';\n${script}`, context)
  const click = () => element('generate').click()
  function valid(machineId, epoch) {
    element('machine').value = String(machineId)
    element('epoch').value = String(epoch)
    click()
    assert.equal(element('error').textContent, '')
    const bits = element('bits').children.map(cell => cell.children[0].textContent).join('')
    assert.equal(BigInt('0b' + bits).toString(), element('id').textContent)
    assert.equal(element('machine-value').textContent, String(machineId).padStart(4, '0'))
    assert.equal(context.Date, Date)
  }
  valid(0, api.DEFAULT_EPOCH)
  valid(1023, 0)
  for (const value of ['', '-1', '1024', '1.5', 'Infinity', '1e309', '<img src=x onerror=alert(1)>', '<script>alert(1)</script>']) {
    element('machine').value = value
    const prior = element('id').textContent
    click()
    assert.match(element('error').textContent, /computer number/)
    assert.equal(element('id').textContent, prior)
  }
  element('machine').value = '1'
  for (const value of ['', '-1', 'Infinity', '1e309', '0.5', String(Date.now() + 86400000), '<script>alert(1)</script>']) {
    element('epoch').value = value
    const prior = element('id').textContent
    click()
    assert.match(element('error').textContent, /epoch/)
    assert.equal(element('id').textContent, prior)
  }
  element('epoch').value = String(api.DEFAULT_EPOCH)
  failNext = true
  click()
  assert.equal(element('error').textContent, '<img src=x onerror=alert(1)>')
  failNext = false
  element('freeze').checked = true
  element('freeze').change()
  const first = BigInt(element('id').textContent)
  click()
  assert.equal(BigInt(element('id').textContent), first + 1n)
  for (let i = 0; i < 10; i++) valid(42, api.DEFAULT_EPOCH)
  assert.equal(element('history').children.length, 4)
})
