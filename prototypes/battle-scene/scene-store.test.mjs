import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createSceneStore} from './scene-store.mjs';
import * as e from './scene-engine.mjs';
import {battleLogEntries} from './battle-log.mjs';

async function fixture(state){
 const dir=new URL('./.battle-state/tests/',import.meta.url);await mkdir(dir,{recursive:true});
 const file=new URL(randomUUID()+'.json',dir);
 if(state)await writeFile(file,JSON.stringify({revision:0,state,baseline:e.exampleBattle(),clients:{},maintenance:{},receipts:{}}));
 const store=await createSceneStore(file);
 const send=async(command,args=[],narrator=false,extra={})=>store.execute('player-session',{revision:(await store.read('player-session')).revision,requestId:randomUUID(),command,args,...extra},narrator);
 return {file,store,send};
}
test('server saves rolls before returning; reload and process restart never reroll or refund actions',async()=>{
 const {file,store,send}=await fixture();await send('claim',['ally']);
 const result=await send('beginAttack',[{actorId:'ally',targetId:'enemy',attribute:'power',mode:'normal',attack:{dice:[6,6,6]}}]);
 const fresh=await createSceneStore(file),restored=await fresh.read('player-session');
 assert.deepEqual(restored,result);assert.equal(restored.state.actors[0].remaining,0);
 await assert.rejects(send('beginAttack',[{actorId:'ally',targetId:'enemy',attribute:'power'}]),/aguardando|bloqueada/);
 assert.deepEqual((await store.read('player-session')).state.pending.attack,result.state.pending.attack);
});
test('server denies player resets, state replacement, foreign actors, forged modifiers and stale requests',async()=>{
 const {store,send}=await fixture();await send('claim',['ally']);
 await assert.rejects(send('restart'),/Narrador/);
 await assert.rejects(send('configureLab',[{actorId:'ally',hp:99}]),/Narrador/);
 await assert.rejects(send('replaceState',[e.exampleBattle()]),/indisponível/);
 await assert.rejects(send('beginAttack',[{actorId:'enemy',targetId:'ally',attribute:'power'}]),/controla/);
 await assert.rejects(send('beginAttack',[{actorId:'ally',targetId:'enemy',attribute:'power',mode:'advantage'}]),/Narrador/);
 await assert.rejects(store.execute('player-session',{revision:0,requestId:randomUUID(),command:'observe',args:['human-1']}),/mudou/);
 const reset=await send('restart',[],true);assert.equal(reset.state.round,1);assert.equal(reset.state.log.length,0);
});
test('duplicate requests are idempotent and concurrent revisions cannot roll twice',async()=>{
 const {store,send}=await fixture();const claimed=await send('claim',['ally']);
 const request={revision:claimed.revision,requestId:randomUUID(),command:'beginAttack',args:[{actorId:'ally',targetId:'enemy',attribute:'power'}]};
 const a=await store.execute('player-session',request),b=await store.execute('player-session',request);
 assert.deepEqual(a,b);await assert.rejects(store.execute('player-session',{...request,requestId:randomUUID()}),/mudou/);
 const forced=await send('forceTest',['attack']);assert.equal(forced.state.pairs[0].bond,a.state.pairs[0].bond-2);
 await assert.rejects(send('forceTest',['attack']),/forç|Forç|vez/);
});
test('lethal applied attack logs knockout once; surviving on 1 never logs knockout',async()=>{
 let s=e.exampleBattle();s.actors[1].hp=1;
 s=e.confirmDodge(e.rollDodge(e.confirmAttack(e.beginAttack(s,{actorId:'ally',targetId:'enemy',attribute:'power',staged:true},()=>.99)),{},()=>0));
 const {send}=await fixture(s);const result=await send('acceptResult',[],true);
 assert.equal(result.state.actors[1].hp,0);
 assert.equal(battleLogEntries(result.state).filter(l=>l.summary==='Morphomon está fora de batalha!').length,1);
 let saved=e.exampleBattle();saved.actors[0].hp=1;saved.pairs[0].bond=3;
 saved=e.confirmDodge(e.rollDodge(e.confirmAttack(e.beginAttack(saved,{actorId:'enemy',targetId:'ally',attribute:'power',staged:true},()=>.99)),{},()=>0));
 const second=await fixture(saved);await second.send('decideSurvival',[true],true);const alive=await second.send('acceptResult',[],true);
 assert.equal(alive.state.actors[0].hp,1);assert.equal(battleLogEntries(alive.state).some(l=>l.kind==='knockout'),false);
});
test('poison survival decision itself survives restart and blocks more actions until decided',async()=>{
 const s=e.exampleBattle();s.actors[0].hp=1;s.actors[0].conditions.poisoned={power:2};
 const {file,send}=await fixture(s);await send('claim',['ally']);
 const injured=await send('defend',['ally']);assert.equal(injured.state.resourceSurvival.id,'ally');
 assert.equal(battleLogEntries(injured.state).some(l=>l.kind==='knockout'),false);
 const restarted=await createSceneStore(file);assert.deepEqual((await restarted.read('player-session')).state.resourceSurvival,injured.state.resourceSurvival);
 await assert.rejects(send('observe',['human-1']),/Força para Lutar/);
 const healed=await send('resourceSurvival',[true]);assert.equal(healed.state.actors[0].hp,1);assert.equal(healed.state.pairs[0].bond,s.pairs[0].bond-3);
 assert.equal(battleLogEntries(healed.state).some(l=>l.kind==='knockout'),false);
});


test('accepting with Multi-Attack persists one payment and holds the final round open until the extra action resolves',async()=>{
 let s=e.observe(e.exampleBattle(),'human-1');
 s=e.acceptResult(e.confirmDodge(e.rollDodge(e.confirmAttack(e.beginAttack(s,{actorId:'enemy',targetId:'ally',attribute:'power',staged:true},()=>0)),{},()=>.99)));
 s=e.beginAttack(s,{actorId:'ally',targetId:'enemy',attribute:'power',staged:true},()=>0);
 const {file,store,send}=await fixture(s);await send('claim',['ally']);
 const before=await store.read('player-session'),request={revision:before.revision,requestId:randomUUID(),command:'confirmAttackMulti'};
 const reserved=await store.execute('player-session',request);
 assert.equal(reserved.state.pairs[0].bond,s.pairs[0].bond-2);
 assert.equal(reserved.state.actors[0].remaining,1);assert.equal(reserved.state.actors[0].multiUsed,true);
 assert.deepEqual(await store.execute('player-session',request),reserved);
 assert.deepEqual(await (await createSceneStore(file)).read('player-session'),reserved);
 const first=reserved.state.activeResolutionId;
 assert.equal(e.canContinueMulti(reserved.state,'ally'),true);
 await assert.rejects(send('rollDodge',[{}],true),/dois ataques/);
 await assert.rejects(send('confirmAttackMulti'),/indisponível/);
 const second=await send('beginAttack',[{actorId:'ally',targetId:'enemy',attribute:'power'}]);
 assert.equal(e.pendingResolutions(second.state).length,2);
 assert.equal(second.state.actors[0].remaining,0);
 assert.equal(second.state.actors[1].remaining,0); // Dodge still does not grant a new NPC attack.
 assert.equal(second.state.actors[1].hp,s.actors[1].hp);
 await assert.rejects(send('rollDodge',[{}],true,{resolutionId:first}),/dois ataques/);
 await assert.rejects(send('confirmAttackMulti'),/indisponível/);
 await send('confirmAttack');
 await assert.rejects(send('beginAttack',[{actorId:'ally',targetId:'enemy',attribute:'power'}]),/aguardando/);
 const restoredPair=(await (await createSceneStore(file)).read('player-session')).state;
 assert.equal(e.pendingResolutions(restoredPair).length,2);assert.equal(e.awaitingMultiAttacks(restoredPair),false);
 await send('rollDodge',[{}],true,{resolutionId:first});await send('confirmDodge',[],true);
 const applied=await send('acceptResult',[],true);assert.equal(applied.state.round,1);assert.equal(e.pendingResolutions(applied.state).length,1);
 await send('rollDodge',[{}],true,{resolutionId:second.state.activeResolutionId});await send('confirmDodge',[],true);
 const finished=await send('acceptResult',[],true);assert.equal(finished.state.round,2);
});

test('Multi-Attack acceptance rejects insufficient PL, NPC attackers and another player without mutating the saved roll',async()=>{
 let s=e.exampleBattle();s.pairs[0].bond=1;
 s=e.beginAttack(s,{actorId:'ally',targetId:'enemy',attribute:'power',staged:true},()=>0);
 const {store,send}=await fixture(s);await send('claim',['ally']);const before=await store.read('player-session');
 await assert.rejects(send('confirmAttackMulti'),/indisponível/);assert.deepEqual(await store.read('player-session'),before);
 await assert.rejects(store.execute('other-session',{revision:before.revision,requestId:randomUUID(),command:'confirmAttackMulti'}),/controla/);
 await assert.rejects(send('multiAttack',['digimon','ally']),/Comando indisponível/);
 const npc=e.beginAttack(e.exampleBattle(),{actorId:'enemy',targetId:'ally',attribute:'power',staged:true},()=>0);
 assert.equal(e.canAcceptAttackMulti(npc),false);assert.throws(()=>e.confirmAttackMulti(npc),/indisponível/);
});

test('human attack acceptance reserves only the human extra action and leaves the partner action independent',async()=>{
 let s=e.exampleBattle();s=e.beginAttack(s,{entityType:'human',actorId:'human-1',targetId:'enemy',staged:true},()=>0);
 const {send}=await fixture(s);await send('claim',['ally']);const n=(await send('confirmAttackMulti')).state;
 assert.equal(n.humans[0].remaining,1);assert.equal(n.humans[0].multiUsed,true);
 assert.equal(n.actors[0].remaining,1);assert.equal(n.actors[0].multiUsed,false);assert.equal(n.pairs[0].bond,s.pairs[0].bond-2);
});
