import test from 'node:test';import assert from 'node:assert/strict';
import {exampleBattle,defend,markers,currentForm} from './scene-engine.mjs';import {draftNpc,createNpc} from './npc.mjs';
test('NPC draft stays outside the live scene until valid creation, preserving prior actions',()=>{
 const state=defend(exampleBattle(),'ally'),before=structuredClone(state),draft=draftNpc(state);
 assert.equal(state.actors.length,2);assert.equal(draft.actors.at(-1).forms.rookie.name,'');
 assert.throws(()=>createNpc(state,{name:''}));assert.throws(()=>createNpc(state,{name:'NPC',image:'javascript:alert(1)'}));
 assert.deepEqual(state,before);
 const next=createNpc(state,{name:'Ogremon teste',image:'https://example.test/npc.png',stage:'champion',element:'Escuridão',digitalAttribute:'Vírus',attributes:{power:4,heart:4,intelligence:3,agility:3},hp:12,qualities:[],attacks:[],conditions:['disoriented']});
 const npc=next.actors.at(-1);assert.equal(npc.forms.rookie.name,'Ogremon teste');assert.equal(npc.forms.rookie.stage,'champion');assert.equal(npc.hp,26);assert.equal(npc.forms.rookie.image,'https://example.test/npc.png');assert.ok(npc.conditions.disoriented);assert.equal(next.actors[0].remaining,0);assert.equal(next.humans.length,state.humans.length);
});

test('each NPC stage enforces its budget and derives full PV and signature uses',()=>{
 const cases=[['baby',[1,1,1,1],3,1,1,0],['rookie',[4,3,3,2],14,8,3,3],['champion',[5,4,3,2],26,10,3,3],['ultimate',[6,4,4,2],35,18,3,4],['mega',[6,6,4,2],56,24,4,4]];
 for(const [stage,values,hp,damage,dodge,uses] of cases){
  const attributes=Object.fromEntries(['power','heart','intelligence','agility'].map((key,i)=>[key,values[i]]));
  const next=createNpc(exampleBattle(),{name:'NPC',stage,attributes,hp:1,qualities:[],attacks:[]}),actor=next.actors.at(-1);
  assert.equal(actor.hp,hp);assert.equal(actor.uses.rookie,uses);
  assert.deepEqual(markers(currentForm(actor)),{hp,damage,dodge});
  assert.throws(()=>createNpc(exampleBattle(),{name:'NPC',stage,attributes:{...attributes,power:values[0]+1}}));
  if(stage!=='baby')assert.throws(()=>createNpc(exampleBattle(),{name:'NPC',stage,attributes:{...attributes,agility:values[3]-1}}));
 }
});
