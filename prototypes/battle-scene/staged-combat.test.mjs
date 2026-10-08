import test from 'node:test';import assert from 'node:assert/strict';import * as e from './scene-engine.mjs';
import {createNpc} from './npc.mjs';import {adjustResources} from './narrator-tools.mjs';import {canChoose} from './interface-policy.mjs';
const attack=(s,target='ally')=>e.beginAttack(s,{actorId:'enemy',targetId:target,attribute:'power',staged:true},()=>.99);
test('attacker may force before confirming; defender alone then rolls, reviews and confirms; early application blocked',()=>{
 let s=attack(e.initialBattle());assert.equal(s.pending.attackConfirmed,false);assert.throws(()=>e.rollDodge(s,{},()=>0));
 const bond=s.pairs[0].bond; // Enemy has no partnership, cannot invent PL.
 assert.throws(()=>e.forceTest(s,'attack',()=>0));assert.equal(s.pairs[0].bond,bond);
 s=e.confirmAttack(s);assert.throws(()=>e.acceptResult(s));s=e.rollDodge(s,{},()=>.99);assert.throws(()=>e.acceptResult(s));s=e.confirmDodge(s);assert.throws(()=>e.forceTest(s,'dodge'));assert.doesNotThrow(()=>e.acceptResult(s));
 let a=e.beginAttack(e.initialBattle(),{actorId:'ally',targetId:'enemy',attribute:'power',staged:true},()=>.5);a=e.forceTest(a,'attack',()=>.99);assert.equal(a.pairs[0].bond,5);assert.throws(()=>e.forceTest(a,'attack'));a=e.confirmAttack(a);assert.throws(()=>e.forceTest(a,'attack'));
});
test('fatal Digimon hit requires explicit survival decision and spends 3 PL once',()=>{
 let s=e.initialBattle();s.actors[0].hp=1;s=attack(s);s=e.confirmAttack(s);s=e.rollDodge(s,{},()=>0);s=e.confirmDodge(s);
 assert.equal(e.survivalOffer(s).id,'ally');assert.throws(()=>e.acceptResult(s));s=e.decideSurvival(s,true);s=e.acceptResult(s);assert.equal(s.actors[0].hp,1);assert.equal(s.pairs[0].bond,4);assert.equal(s.result.costs.rescueBond,3);
 let decline=e.initialBattle();decline.actors[0].hp=1;decline=attack(decline);decline=e.confirmDodge(e.rollDodge(e.confirmAttack(decline),{},()=>0));decline=e.acceptResult(e.decideSurvival(decline,false));assert.equal(decline.actors[0].hp,0);assert.equal(decline.pairs[0].bond,7);
});
test('NPC can target human; Body plus Talent dodge is reactive and lethal damage affects imported Energy',()=>{
 let s=e.initialBattle();s.humans[0].energy=1;s=attack(s,'human-1');s=e.confirmAttack(s);
 assert.equal(e.dodgePreview(s,{}).pool,s.humans[0].characteristics.body);assert.equal(e.dodgePreview(s,{qualityId:'martial'}).pool,4);assert.throws(()=>e.beginAttack(s,{actorId:'human-1',entityType:'human',targetId:'enemy',attribute:'body'}),/primeiro/);
 s=e.rollDodge(s,{},()=>0);assert.equal(s.humans[0].remaining,1);s=e.confirmDodge(s);assert.equal(e.survivalOffer(s).resource,'Energia');s=e.acceptResult(e.decideSurvival(s,true));assert.equal(s.humans[0].energy,1);assert.equal(s.actors[0].hp,14);assert.equal(s.pairs[0].bond,4);
});
test('Narrator creates allied NPC pair and edits resources atomically without giving actions or player control',()=>{
 let s=createNpc(e.initialBattle(),{name:'NPC parceiro',humanName:'NPC humano',hp:8,level:1,bond:6,energy:10,characteristics:{body:2,mind:2,presence:2}},'ally');const a=s.actors.at(-1),h=s.humans.at(-1);assert.equal(a.side,'ally');assert.equal(a.controller,'narrator');assert.equal(h.name,'NPC humano');assert.equal(canChoose(s,'player',null,a.id),false);assert.equal(canChoose(s,'narrator',null,a.id),true);
 s=e.skipAction(s,'digimon',a.id);s=adjustResources(s,{actorId:a.id,hp:6,energy:4,bond:2});assert.equal(s.actors.at(-1).remaining,0);assert.equal(s.humans.at(-1).energy,4);assert.equal(s.pairs.at(-1).bond,2);assert.throws(()=>adjustResources(s,{actorId:a.id,hp:999,energy:4,bond:2}));
});

test('human targeted by pending attack cannot be edited, removed or evolved through the partner',()=>{
 const s=attack(e.initialBattle(),'human-1');
 assert.throws(()=>e.removeParticipant(s,'ally'),/Resolva/);
 assert.throws(()=>e.configureLab(s,{actorId:'ally',formId:'rookie'}),/Resolva/);
 assert.throws(()=>e.evolveAction(s,'ally','champion'),/Resolva/);
 assert.throws(()=>adjustResources(s,{actorId:'ally',hp:1,energy:1,bond:1}),/Aplique/);
 assert.equal(s.humans[0].energy,11);
});

test('separate staged attacks retain independent review and survival decisions',()=>{
 let s=e.addParticipant(e.initialBattle(),'enemy');const id=s.actors.at(-1).id;
 s=e.beginAttack(s,{actorId:'enemy',targetId:'ally',attribute:'power',staged:true},()=>.99);
 const first=s.activeResolutionId;
 s=e.beginAttack(s,{actorId:id,targetId:'human-1',attribute:'power',staged:true},()=>.99);
 const second=s.activeResolutionId;
 s=e.confirmAttack(s);s=e.rollDodge(s,{},()=>0);s=e.confirmDodge(s);
 s=e.selectResolution(s,first);assert.equal(s.pending.attackConfirmed,false);assert.equal(s.pending.dodge,null);
 s=e.selectResolution(s,second);assert.equal(s.pending.attackConfirmed,true);assert.equal(s.pending.defenseConfirmed,true);
 s=e.acceptResult(s);assert.equal(e.pendingResolutions(s).length,1);
 s=e.selectResolution(s,first);assert.equal(s.pending.attackConfirmed,false);
});

test('Defense may spend the available action after receiving an attack, before rolling dodge',()=>{
 let s=attack(e.initialBattle());s=e.confirmAttack(s);const bond=s.pairs[0].bond;
 s=e.defend(s,'ally');assert.equal(s.actors[0].remaining,0);assert.equal(s.actors[0].defending,true);assert.equal(s.pairs[0].bond,bond);
 assert.equal(e.dodgePreview(s,{}).mode,'advantage');s=e.rollDodge(s,{},()=>.4);assert.equal(s.pending.dodge.mode,'advantage');
 let late=e.confirmAttack(attack(e.initialBattle()));late=e.rollDodge(late,{},()=>0);assert.throws(()=>e.defend(late,'ally'),/Aplique/);assert.equal(late.actors[0].remaining,1);
 let spent=e.initialBattle();spent=e.skipAction(spent,'digimon','ally');spent=attack(spent);assert.throws(()=>e.defend(spent,'ally'));
});
