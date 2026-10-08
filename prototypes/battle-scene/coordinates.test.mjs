import test from 'node:test';import assert from 'node:assert/strict';import * as e from './scene-engine.mjs';
const complete=s=>{for(const a of s.actors)if(a.remaining)s=e.skipAction(s,'digimon',a.id);for(const h of s.humans)if(h.remaining)s=e.humanWait(s,h.id);return e.nextRound(e.closeRound(s));};
const config={actorId:'ally',targetId:'enemy',attribute:'power',bond:0,mode:'normal'};
test('observe enables coordinates only next round; human action grants own partner one attack die once',()=>{
 let s=e.initialBattle();assert.throws(()=>e.giveCoordinates(s,'human-1'));
 s=e.observe(s,'human-1');assert.equal(s.humans[0].remaining,0);assert.throws(()=>e.giveCoordinates(s,'human-1'));s=complete(s);
 const original=e.attackPreview(s,config).pool;s=e.giveCoordinates(s,'human-1');assert.equal(s.humans[0].remaining,0);assert.equal(e.attackPreview(s,config).pool,original+1);
 s=e.beginAttack(s,config,()=>.99);assert.equal(s.pending.attack.pool,original+1);assert.equal(s.pending.context.guidanceBonus,1);s=e.rollDodge(s,{},()=>0);s=e.acceptResult(s);
 s=e.multiAttack(s,'digimon','ally');assert.equal(s.actors[0].remaining,1);assert.equal(e.attackPreview(s,config).pool,original);assert.throws(()=>e.multiAttack(s,'digimon','ally'));
 s=e.multiAttack(s,'human','human-1');assert.throws(()=>e.giveCoordinates(s,'human-1'));
});
test('unused observation and coordinates expire, do not leak to other partners, reset clears preparation',()=>{
 let s=e.addParticipant(e.initialBattle(),'ally');s=e.observe(s,'human-1');const reset=e.restartScene(s);assert.doesNotThrow(()=>e.observe(reset,'human-1'));
 s=complete(s);s=e.giveCoordinates(s,'human-1');assert.equal(e.attackPreview(s,{...config,actorId:'ally-1'}).guidanceBonus,0);s=complete(s);assert.equal(e.attackPreview(s,config).guidanceBonus,0);assert.throws(()=>e.giveCoordinates(s,'human-1'));assert.doesNotThrow(()=>e.observe(s,'human-1'));
 let unused=e.observe(e.initialBattle(),'human-1');unused=complete(complete(unused));assert.throws(()=>e.giveCoordinates(unused,'human-1'));
});
