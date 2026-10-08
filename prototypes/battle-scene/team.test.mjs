import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from './engine.mjs';
import {secureD6Fraction,rollDie} from './dice.mjs';
const high=()=>.9,low=()=>0;
test('crypto d6 rejects excess uint32 values, every face has equal accepted interval',()=>{
 const queue=[4294967295,4294967292,5];assert.equal(rollDie(()=>secureD6Fraction(()=>queue.shift())),6);
 for(let i=0;i<6;i++){assert.equal(rollDie(()=>secureD6Fraction(()=>i)),i+1);assert.equal(rollDie(()=>secureD6Fraction(()=>4294967286+i)),i+1);}
});
test('human attacks with Body and a Talent; signature uses and Digimon action stay independent',()=>{
 let s=e.initialBattle();s=e.beginAttack(s,{entityType:'human',actorId:'human-1',targetId:'enemy',qualityId:'boken',effort:true},high);
 assert.equal(s.pending.attack.pool,5);assert.equal(s.pending.context.baseDamage,1);assert.equal(s.humans[0].remaining,0);assert.equal(s.humans[0].energy,10);assert.equal(s.actors[0].remaining,1);assert.equal(s.actors[0].uses.rookie,3);
 s=e.rollDodge(s,{},low);assert.equal(e.attackResult(s.pending).damage,6);s=e.acceptResult(s);assert.equal(s.actors[1].hp,11);assert.equal(s.actors[0].remaining,1);
 assert.throws(()=>e.beginAttack(s,{entityType:'human',actorId:'human-1',targetId:'enemy'},high));
});
test('5 by 5 has isolated resources and turns, limits both sides, and removes whole partnerships',()=>{
 let s=e.initialBattle();for(let i=0;i<4;i++){s=e.addParticipant(s,'ally');s=e.addParticipant(s,'enemy');}
 assert.equal(s.actors.length,10);assert.equal(s.humans.length,5);assert.equal(s.pairs.length,5);assert.equal(new Set(s.actors.map(a=>a.id)).size,10);
 assert.throws(()=>e.addParticipant(s,'ally'));assert.throws(()=>e.addParticipant(s,'enemy'));
 const second=s.actors.find(a=>a.id==='ally-1'),pair=e.pairOf(s,second);s=e.removeParticipant(s,second.id);assert.ok(!s.humans.some(h=>h.pairId===pair.id));s=e.addParticipant(s,'ally');
 for(const p of s.pairs){const a=s.actors.find(a=>a.pairId===p.id),h=s.humans.find(h=>h.pairId===p.id);s=e.skipAction(s,'digimon',a.id);s=e.skipAction(s,'human',h.id);s=e.finalizeTurn(s,'Narrativa '+p.id,p.id);assert.throws(()=>e.multiAttack(s,'digimon',a.id));}
 assert.equal(s.turnFinalized,true);assert.equal(s.narratives.length,5);assert.throws(()=>e.closeRound(s));for(const a of s.actors.filter(a=>a.side==='enemy'))s=e.skipAction(s,'digimon',a.id);s=e.nextRound(e.closeRound(s));assert.equal(s.round,2);assert.ok(s.pairs.every(p=>!p.turnFinalized));assert.ok(s.actors.every(a=>a.remaining===1));
});
test('finalizing one partnership does not lock another and cannot edit roster after a roll',()=>{
 let s=e.addParticipant(e.initialBattle(),'ally');s=e.skipAction(s,'digimon','ally');s=e.skipAction(s,'human','human-1');s=e.finalizeTurn(s,'Dupla um');assert.equal(s.turnFinalized,false);
 s=e.beginAttack(s,{actorId:'ally-1',targetId:'enemy',attribute:'power'},high);assert.equal(s.actors[0].remaining,0);assert.equal(s.actors[2].remaining,0);assert.equal(s.pairs[0].bond,7);assert.throws(()=>e.addParticipant(s,'enemy'));assert.throws(()=>e.removeParticipant(s,'ally-1'));
});
