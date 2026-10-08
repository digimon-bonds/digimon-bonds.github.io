import test from 'node:test';import assert from 'node:assert/strict';import * as e from './scene-engine.mjs';
const attack=(s,actorId,targetId)=>e.beginAttack(s,{actorId,targetId,attribute:'power',staged:true},()=>0);
const resolve=s=>e.acceptResult(e.confirmDodge(e.rollDodge(e.confirmAttack(s),{},()=>.99)));
for(const first of ['enemy','ally'])test(`${first} can start; target dodges then counterattacks in same round without narrator release`,()=>{
 const second=first==='enemy'?'ally':'enemy';let s=attack(e.exampleBattle(),first,second);
 assert.throws(()=>attack(s,second,first),/primeiro/);
 s=e.confirmDodge(e.rollDodge(e.confirmAttack(s),{},()=>.99));assert.throws(()=>attack(s,second,first),/primeiro/);
 s=e.acceptResult(s);assert.equal(s.round,1);assert.equal(e.actorById(s,second).remaining,1);
 s=attack(s,second,first);assert.equal(s.pending.context.actorId,second);s=resolve(s);
 assert.throws(()=>attack(s,second,first),/bloqueada/);
 assert.throws(()=>e.closeRound(s));s=e.observe(s,'human-1');
 assert.equal(e.roundStatus(s).ready,true);s=e.nextRound(e.closeRound(s));assert.equal(s.round,2);
 assert.doesNotThrow(()=>attack(s,second,first));
});
test('several incoming attacks must all resolve before counterattack; unrelated ally remains free',()=>{
 let s=e.addParticipant(e.addParticipant(e.exampleBattle(),'enemy'),'ally');
 s=attack(s,'enemy','ally');s=attack(s,'enemy-1','ally');
 assert.doesNotThrow(()=>attack(s,'ally-1','enemy'));const ids=e.pendingResolutions(s).map(r=>r.id);
 s=resolve(e.selectResolution(s,ids[0]));assert.throws(()=>attack(s,'ally','enemy'),/primeiro/);
 s=resolve(e.selectResolution(s,ids[1]));assert.doesNotThrow(()=>attack(s,'ally','enemy'));
});
test('Defense still consumes normal action; Multi-Attack permits an extra attack after dodge',()=>{
 let s=attack(e.exampleBattle(),'enemy','ally');s=e.defend(s,'ally');s=resolve(s);
 assert.throws(()=>attack(s,'ally','enemy'),/bloqueada/);s=e.multiAttack(s,'digimon','ally');
 assert.doesNotThrow(()=>attack(s,'ally','enemy'));
});
