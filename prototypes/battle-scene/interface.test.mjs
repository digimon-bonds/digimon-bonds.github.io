import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,addParticipant,configureLab,defend,nextRound} from './engine.mjs';
import {canChoose,canOperate,controlLocked} from './interface-policy.mjs';
test('player chooses an ally and cannot take over another pair or NPC after acting',()=>{
 let s=addParticipant(initialBattle(),'ally'),other=s.actors.find(a=>a.side==='ally'&&a.id!=='ally');
 assert.equal(canChoose(s,'player',null,'ally'),true);
 assert.equal(canChoose(s,'player',null,'enemy'),false);
 assert.equal(canOperate(s,'player','ally','human-1'),true);
 assert.equal(canOperate(s,'player','ally','enemy'),false);
 assert.equal(canOperate(s,'player','ally',other.id),false);
 s=defend(s,'ally');assert.equal(controlLocked(s,'ally'),true);
 assert.equal(canChoose(s,'player','ally',other.id),false);
 assert.equal(canChoose(s,'narrator','ally','enemy'),true);
 assert.equal(canChoose(s,'narrator','ally','enemy',true),false);
 s.round++;assert.equal(controlLocked(s,'ally'),false);
});
test('lab edits presentation and selected form abilities without changing another participant',()=>{
 const s=initialBattle(),n=configureLab(s,{actorId:'ally',formId:'rookie',humanName:'Kiyomasa',qualities:[{id:'q',name:'Furtivo',rank:2}],attacks:[{id:'a',name:'Blue Blaster',rank:1,element:'Água/Gelo',effect:'desorientador'}]});
 assert.equal(n.humans[0].name,'Kiyomasa');assert.equal(n.actors[0].forms.rookie.attacks[0].name,'Blue Blaster');
 assert.deepEqual(n.actors[1],s.actors[1]);assert.deepEqual(n.actors[0].forms.champion,s.actors[0].forms.champion);
 assert.throws(()=>configureLab(s,{actorId:'ally',qualities:[{id:'x',name:'',rank:4}]}));
 assert.throws(()=>configureLab(s,{actorId:'ally',attacks:[{id:'x',name:'Attack',rank:1,element:'Escuridão',effect:'inventado'}]}));
});
