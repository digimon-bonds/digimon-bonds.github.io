import test from 'node:test';import assert from 'node:assert/strict';
import {exampleBattle,defend} from './scene-engine.mjs';import {draftNpc,createNpc} from './npc.mjs';
test('NPC draft stays outside the live scene until valid creation, preserving prior actions',()=>{
 const state=defend(exampleBattle(),'ally'),before=structuredClone(state),draft=draftNpc(state);
 assert.equal(state.actors.length,2);assert.equal(draft.actors.at(-1).forms.rookie.name,'');
 assert.throws(()=>createNpc(state,{name:''}));assert.throws(()=>createNpc(state,{name:'NPC',image:'javascript:alert(1)'}));
 assert.deepEqual(state,before);
 const next=createNpc(state,{name:'Ogremon teste',image:'https://example.test/npc.png',stage:'champion',element:'Escuridão',digitalAttribute:'Vírus',attributes:{power:4,heart:4,intelligence:3,agility:2},hp:12,qualities:[],attacks:[],conditions:['disoriented']});
 const npc=next.actors.at(-1);assert.equal(npc.forms.rookie.name,'Ogremon teste');assert.equal(npc.forms.rookie.stage,'champion');assert.equal(npc.hp,12);assert.equal(npc.forms.rookie.image,'https://example.test/npc.png');assert.ok(npc.conditions.disoriented);assert.equal(next.actors[0].remaining,0);assert.equal(next.humans.length,state.humans.length);
});
