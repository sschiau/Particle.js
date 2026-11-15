/* Copyright 2014-2017 Silviu Schiau. SPDX-License-Identifier: Apache-2.0 */

'use strict';
const $ = id => document.getElementById(id);

function captureParticle() {
 const NativeDate = window.Date, nativeRandom = Math.random;
 let instant, draw;
 try {
  window.Date = class extends NativeDate { constructor(...args) { super(...args); if (!args.length) instant = this.getTime(); } };
  Math.random = () => { draw = nativeRandom(); return draw; };
  const id = Particle.generateParticle();
  return { id, instant, sequence: Math.floor(draw * 4095) };
 } finally { window.Date = NativeDate; Math.random = nativeRandom; }
}
function generate() {
 const machine = Number($('machine').value), epoch = Number($('epoch').value);
 if (!$('machine').value || !Number.isInteger(machine) || machine < 0 || machine > 1023) { $('error').textContent = 'Choose a whole machine ID between 0 and 1023.'; return false; }
 if (!$('epoch').value || !Number.isSafeInteger(epoch) || epoch < 1000000000000 || epoch > Date.now()) { $('error').textContent = 'Choose an epoch of at least 13 digits, no later than the current time.'; return false; }
 $('error').textContent = '';
 try {
  Particle.machineId = machine; Particle.epoch = epoch;
  const sample = captureParticle();
  const time = 1099511627775 + sample.instant - epoch;
  const timeBits = time.toString(2), machineBits = machine.toString(2).padStart(10, '0'), sequenceBits = sample.sequence.toString(2).padStart(12, '0');
  const exactBits = timeBits + machineBits + sequenceBits;
  const exact = BigInt('0b' + exactBits);
  if (Number(exact) !== sample.id) throw new Error('Captured fields do not match the library output.');
  $('bits').replaceChildren();
  for (const [bits, color] of [[timeBits,'time'],[machineBits,'machine'],[sequenceBits,'sequence']]) for (const bit of bits) {
   const cell = document.createElement('div'); cell.className = 'bit ' + color;  const text = document.createElement('span'); text.textContent = bit; cell.append(text); $('bits').append(cell);
  }
  $('time-label').textContent = `Time / ${timeBits.length} bits`;
  $('time').textContent = time.toLocaleString('en-US'); $('machine-value').textContent = machine.toString().padStart(4,'0'); $('sequence').textContent = sample.sequence.toString().padStart(4,'0');
  $('clock').textContent = new Date(sample.instant).toISOString().slice(11,23) + ' UTC';
  $('time-math').textContent = `${sample.instant} − ${epoch} + 1099511627775 = ${time}`;
  $('id').textContent = sample.id.toString();
  $('decoded').textContent = new Date(Particle.timeFromParticle(sample.id)).toISOString();
  const difference = BigInt(sample.id) - exact;
  $('rounding').textContent = `Exact packed integer: ${exact} · Stored Number as an integer: ${BigInt(sample.id)} · Rounding difference: ${difference > 0n ? '+' : ''}${difference}`;
  $('phase').textContent = 'Complete · decoded with Particle.timeFromParticle';
  const recent = document.createElement('span'); recent.textContent = sample.id.toString(); $('history').prepend(recent); while ($('history').children.length > 4) $('history').lastElementChild.remove();
 } catch (error) { $('error').textContent = error.message; }
 return !$('error').textContent;
}
$('generate').addEventListener('click',generate);
generate();
