/* Copyright 2014-2017 Silviu Schiau. SPDX-License-Identifier: Apache-2.0 */
import { createGenerator, decode, DEFAULT_EPOCH, version } from '../Sources/Particle.mjs'

const $ = id => document.getElementById(id)
const generators = new Map()
let heldTimestamp = null
let currentTime = Date.now()
$('release').textContent = `V4 CANDIDATE · ${version}`
$('epoch').value = String(DEFAULT_EPOCH)

function generate() {
  const machineId = Number($('machine').value)
  const epoch = Number($('epoch').value)
  if (!$('machine').value || !Number.isInteger(machineId) || machineId < 0 || machineId > 1023) {
    $('error').textContent = 'Choose a whole computer number between 0 and 1023.'
    return false
  }
  if (!$('epoch').value || !Number.isSafeInteger(epoch) || epoch < 0 || epoch > Date.now()) {
    $('error').textContent = 'Choose a non-negative integer epoch no later than the current time.'
    return false
  }
  $('error').textContent = ''
  try {
    currentTime = $('freeze').checked ? (heldTimestamp ??= Date.now()) : Date.now()
    const key = `${machineId}:${epoch}`
    if (!generators.has(key)) generators.set(key, createGenerator({ machineId, epoch, clock: () => currentTime }))
    const id = generators.get(key).next()
    const fields = decode(id, { epoch })
    const bits = id.toString(2).padStart(63, '0')
    $('bits').replaceChildren()
    for (const [part, color] of [[bits.slice(0, 41), 'time'], [bits.slice(41, 51), 'machine'], [bits.slice(51), 'sequence']]) {
      for (const bit of part) {
        const cell = document.createElement('div')
        cell.className = `bit ${color}`
        const text = document.createElement('span')
        text.textContent = bit
        cell.append(text)
        $('bits').append(cell)
      }
    }
    $('time-label').textContent = 'Time / 41 bits'
    $('time').textContent = fields.elapsed.toLocaleString('en-US')
    $('machine-value').textContent = String(fields.machineId).padStart(4, '0')
    $('sequence').textContent = String(fields.sequence).padStart(4, '0')
    $('clock').textContent = new Date(fields.timestamp).toISOString().slice(11, 23) + ' UTC'
    $('time-math').textContent = `${fields.timestamp} − ${epoch} = ${fields.elapsed}`
    $('id').textContent = id.toString()
    $('decoded').textContent = new Date(fields.timestamp).toISOString()
    const difference = BigInt(Number(id)) - id
    $('rounding').textContent = `Exact bigint/string: ${id}. Casting this ID to Number changes its integer value by ${difference}. The API never makes that cast.`
    $('phase').textContent = $('freeze').checked ? 'Clock held · click again to increment the counter' : 'Exact ID · decoded with decode(id, { epoch })'
    const recent = document.createElement('span')
    recent.textContent = id.toString()
    $('history').prepend(recent)
    while ($('history').children.length > 4) $('history').lastElementChild.remove()
  } catch (error) {
    $('error').textContent = error.message
    return false
  }
  return true
}

$('generate').addEventListener('click', generate)
$('freeze').addEventListener('change', () => {
  heldTimestamp = $('freeze').checked ? Date.now() : null
  generate()
})
generate()
