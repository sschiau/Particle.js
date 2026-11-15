/* Copyright 2014-2026 Silviu Schiau. SPDX-License-Identifier: Apache-2.0 */
'use strict';
const $=id=>document.getElementById(id);
function generate(){
 const machine=Number($('machine').value),epoch=Number($('epoch').value);
 if(!$('machine').value||!Number.isInteger(machine)||machine<0||machine>1023){$('error').textContent='Choose a whole machine ID between 0 and 1023.';return false;}
 if(!$('epoch').value||!Number.isSafeInteger(epoch)||epoch<1000000000000||epoch>Date.now()){$('error').textContent='Choose an epoch of at least 13 digits, no later than the current time.';return false;}
 try{
  Particle.machineId=machine;Particle.epoch=epoch;
  const id=Particle.generateParticle(),instant=Particle.timeFromParticle(id);
  const time=Math.floor(id/8192),sequence=id%8;
  const timeBits=time.toString(2).padStart(40,'0'),machineBits=machine.toString(2).padStart(10,'0'),sequenceBits=sequence.toString(2).padStart(3,'0');
  if(!Number.isSafeInteger(id)||parseInt(timeBits+machineBits+sequenceBits,2)!==id)throw Error('Fields do not match the exact Number output.');
  $('bits').replaceChildren();
  for(const[bits,color]of[[timeBits,'time'],[machineBits,'machine'],[sequenceBits,'sequence']])for(const bit of bits){
   const cell=document.createElement('div'),text=document.createElement('span');cell.className='bit '+color;text.textContent=bit;cell.append(text);$('bits').append(cell);
  }
  $('time-label').textContent='Time / 40 bits';
  $('time').textContent=time.toLocaleString('en-US');$('machine-value').textContent=String(machine).padStart(4,'0');$('sequence').textContent=String(sequence).padStart(4,'0');
  $('clock').textContent=new Date(instant).toISOString().slice(11,23)+' UTC';
  $('time-math').textContent=`${instant} − ${epoch} = ${time}; ID = ${time} × 8192 + ${machine} × 8 + ${sequence}`;
  $('id').textContent=String(id);$('decoded').textContent=new Date(instant).toISOString();
  $('rounding').textContent=`Safe integer: ${Number.isSafeInteger(id)} · JSON round-trip unchanged: ${JSON.parse(JSON.stringify({id})).id===id} · 40 + 10 + 3 = 53 bits`;
  $('phase').textContent='Exact Number · counter 0–7 · real clock on every call';
  const recent=document.createElement('span');recent.textContent=String(id);$('history').prepend(recent);while($('history').children.length>4)$('history').lastElementChild.remove();
  $('error').textContent='';return true;
 }catch(error){$('error').textContent=error.message;return false;}
}
$('generate').addEventListener('click',generate);
generate();
