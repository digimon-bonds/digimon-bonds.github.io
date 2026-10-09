import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from './scene-engine.mjs';
import {digiviceOptions,readDeviceSlots} from './digivice.mjs';
import {applySceneCommand,createSceneRepository,newSceneData} from './scene-repository.mjs';
const attack={actorId:'ally',targetId:'enemy',attribute:'power',mode:'normal'};
function scene(devices){const s=e.initialBattle();s.pairs[0].level=devices.length+1;s.humans[0].devices=devices;return s;}
const boosters=rank=>Array.from({length:rank},(_,i)=>({name:'Booster',rank:i+1}));
const protocol=(name,detail='Instalado')=>[{name:'Protocolos Especiais',rank:1,protocol:name,detail}];
const use=(s,choice)=>e.useDigivice(s,'human-1',choice);
test('no upgrades are granted at level 1; malformed ranks and client-granted functions are rejected',()=>{
 const s=scene([]);assert.throws(()=>use(s,{function:'Booster',kind:'attack'}));
 assert.throws(()=>use(scene([{name:'Booster',rank:3}]),{function:'Booster',kind:'attack'}));
 assert.throws(()=>use(s,{function:'Scanner de Cards'}));assert.equal(s.humans[0].remaining,1);
});
test('Booster 1 spends only the human action and applies to the next attack exactly once',()=>{
 let s=use(scene(boosters(1)),{function:'Booster',kind:'attack'});assert.equal(s.humans[0].remaining,0);assert.equal(s.actors[0].remaining,1);assert.equal(s.pairs[0].bond,7);
 assert.equal(e.attackPreview(s,attack).mode,'advantage');s=e.beginAttack(s,{...attack,staged:true},()=>.5);assert.equal(s.pending.attack.mode,'advantage');assert.equal(s.actors[0].boosterNext,undefined);
 s=e.forceTest(s,'attack',()=>.5);assert.equal(s.pending.attack.mode,'advantage');assert.equal(s.humans[0].digiviceUses.booster,1);
});
test('Booster 2 enables dodge without spending the Digimon action; Booster 3 has two uses per combat',()=>{
 assert.throws(()=>use(scene(boosters(1)),{function:'Booster',kind:'dodge'}));
 let s=use(scene(boosters(2)),{function:'Booster',kind:'dodge'});s=e.beginAttack(s,{...attack,actorId:'enemy',targetId:'ally'},()=>.5);assert.equal(e.dodgePreview(s,{}).mode,'advantage');s=e.rollDodge(s,{},()=>.5);assert.equal(s.actors[0].remaining,1);assert.equal(s.actors[0].boosterNext,undefined);
 assert.equal(digiviceOptions(scene(boosters(3)).humans[0],4).booster.limit,2);
 s.humans[0].remaining=1;assert.throws(()=>use(s,{function:'Booster',kind:'attack'}));
});
test('protocol damage and dodge markers expire after the next Digimon action, not on dodge',()=>{
 let s=use(scene(protocol('Reforço de Dano')),{function:'Protocolos Especiais',id:'device-0'});assert.equal(e.attackPreview(s,attack).baseDamage,8);
 s=e.acceptResult(e.rollDodge(e.beginAttack(s,attack,()=>0),{},()=>0));assert.equal(e.markers(e.currentForm(s.actors[0])).damage,6);assert.equal(s.humans[0].digiviceUses['device-0'],true);
 s=use(scene(protocol('Reforço de Esquiva')),{function:'Protocolos Especiais',id:'device-0'});s=e.beginAttack(s,{...attack,actorId:'enemy',targetId:'ally'},()=>0);assert.equal(e.dodgePreview(s,{}).pool,5);s=e.acceptResult(e.rollDodge(s,{},()=>0));assert.equal(e.markers(e.currentForm(s.actors[0])).dodge,5);s=e.defend(s,'ally');assert.equal(e.markers(e.currentForm(s.actors[0])).dodge,4);
});
test('PV protocol grants and removes exactly 10 current/max PV; restart clears uses and active buffs',()=>{
 let s=scene(protocol('Reforço de PV'));const hp=s.actors[0].hp;s=use(s,{function:'Protocolos Especiais',id:'device-0'});assert.equal(s.actors[0].hp,hp+10);assert.equal(e.markers(e.currentForm(s.actors[0])).hp,hp+10);
 const reset=e.restartScene(s);assert.equal(reset.actors[0].hp,hp);assert.equal(reset.humans[0].digiviceUses,undefined);assert.equal(reset.humans[0].devices.length,1);
 s=e.skipAction(s,'digimon','ally');assert.equal(s.actors[0].hp,hp);assert.equal(s.actors[0].digiviceProtocols,undefined);
});
test('fixed element, rank-2 quality and temporary attack come from acquisition parameters',()=>{
 let s=use(scene(protocol('Troca de Elemento','Luz.')),{function:'Protocolos Especiais',id:'device-0',element:'Fogo'});const f=e.currentForm(s.actors[0]);assert.equal(f.element,'Luz');assert.ok(f.attacks.every(a=>a.element==='Luz'));assert.equal(s.actors[0].forms.rookie.element,'Escuridão');
 s=use(scene(protocol('Qualidade Temporária','Reflexos Rápidos')),{function:'Protocolos Especiais',id:'device-0'});assert.equal(e.currentForm(s.actors[0]).qualities.at(-1).rank,2);
 s=use(scene(protocol('Ataque Temporário','Pulso | Luz | Pesado')),{function:'Protocolos Especiais',id:'device-0'});assert.deepEqual(e.currentForm(s.actors[0]).attacks.at(-1),{id:'device-0',name:'Pulso',element:'Luz',effect:'pesado',rank:1,temporary:true});
 assert.throws(()=>use(scene(protocol('Ataque Temporário','Sem parâmetros')),{function:'Protocolos Especiais',id:'device-0'}));
});
test('installed slot parsing tolerates punctuation/case, ignores prose, preserves protocol detail',()=>{
 const d=readDeviceSlots('Tem Booster Nível 3.\n01. BOOSTER. | Nível 1\n02. Protocolos Especiais | Nível 1 | Troca de Elemento — Luz.');assert.equal(d.length,2);assert.equal(d[0].name,'Booster');assert.equal(d[1].detail,'Luz.');
});
test('activation cannot modify a roll already made or another player’s partner',()=>{
 const s=e.beginAttack(scene(boosters(1)),attack,()=>.5);assert.throws(()=>use(s,{function:'Booster',kind:'attack'}));
 assert.throws(()=>applySceneCommand(scene(boosters(1)),'useDigivice',['human-1',{function:'Booster',kind:'attack'}],{narrator:false,actorId:'enemy'}));
});
test('saved activation survives repository reload and cannot be replayed to grant more uses',async()=>{
 let stored;let repo=createSceneRepository(newSceneData(scene(boosters(1))),async data=>stored=structuredClone(data));
 await repo.execute('owner',{command:'useDigivice',args:['human-1',{function:'Booster',kind:'attack'}],revision:0,requestId:'digivice-use'},true);
 repo=createSceneRepository(stored,async()=>{});const loaded=await repo.read('owner');assert.equal(loaded.state.actors[0].boosterNext,'attack');assert.equal(loaded.state.humans[0].remaining,0);assert.equal(loaded.state.humans[0].digiviceUses.booster,1);
});
