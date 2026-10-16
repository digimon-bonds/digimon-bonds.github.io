import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from './engine.mjs';
import {combatLevel} from './combat-level.mjs';
import {newSceneData,createSceneRepository} from './scene-repository.mjs';
import {adjustResources} from './narrator-tools.mjs';
import {battleLogEntries} from './battle-log.mjs';
import {createNpc} from './npc.mjs';
import {emptyBattle} from './scene-engine.mjs';
const high=()=>.99,low=()=>0;
function fixture(level=1,legacy=false){const s=e.initialBattle(),a=s.actors[0],target=s.actors[1];a.hp=1;a.forms.rookie.attributes.power=3;a.forms.rookie.attacks=[{id:'drain',name:'Draining Lights',rank:1,element:'Luz',effect:legacy?null:'vampirismo',sourceEffects:['vampirismo']}];target.pairId=null;target.npcLevel=level;target.forms[target.formId].stage='mega';target.hp=100;return s;}
function attack(s,{hit=true,extra={}}={}){let n=e.beginAttack(s,{actorId:s.actors[0].id,targetId:s.actors[1].id,attribute:'power',signatureId:'drain',useEffect:false,...extra},high);n=e.rollDodge(n,{},low);if(!hit)n.pending.dodge.successes=n.pending.attack.successes+1;return e.acceptResult(n);}
test('Mega NPC level 1 heals only 1 PV; vampirism is automatic on actual signature damage',()=>{const s=fixture(),n=attack(s);assert.equal(n.result.base,6);assert.equal(n.result.healing,1);assert.equal(n.actors[0].hp,2);assert.equal(n.pairs.length,s.pairs.length);assert.equal(n.actors[1].pairId,null);assert.equal(n.actors[1].bond,undefined);assert.match(battleLogEntries(n).at(-1).summary,/Vampirismo: recuperou 1 PV/);});
test('vampirism uses target level, caps PV and never heals on miss or zero actual damage',()=>{
 const s=fixture(4),n=attack(s);assert.equal(n.result.healing,4);assert.equal(n.actors[0].hp,5);
 const cap=fixture(8);cap.actors[0].hp=e.markers(e.currentForm(cap.actors[0])).hp-1;assert.equal(attack(cap).result.healing,1);
 const miss=attack(fixture(8),{hit:false});assert.equal(miss.result.healing,0);assert.equal(miss.actors[0].hp,1);
 const full=fixture();full.actors[0].hp=e.markers(e.currentForm(full.actors[0])).hp;assert.equal(attack(full).result.healing,0);
 const zero=fixture();let pending=e.beginAttack(zero,{actorId:zero.actors[0].id,targetId:zero.actors[1].id,attribute:'power',signatureId:'drain'},high);pending=e.rollDodge(pending,{},low);pending.actors[1].hp=0;assert.equal(e.acceptResult(pending).result.healing,0);
});
test('legacy imported vampirism works without reimport and can heal again on the same target',()=>{let s=attack(fixture(2,true));assert.equal(s.result.healing,2);s.actors[0].remaining=1;s.actors[1].hp=100;s=attack(s);assert.equal(s.result.healing,2);assert.equal(s.actors[0].hp,5);});
test('target partnership level is used for paired targets; NPC level validates separately',()=>{const s=fixture(3);assert.equal(combatLevel(s,s.actors[0]),s.pairs[0].level);assert.equal(combatLevel(s,s.actors[1]),3);s.actors[1].npcLevel=11;assert.throws(()=>combatLevel(s,s.actors[1]),/1 a 10/);});
test('NPC creation and narrator adjustments persist an independent level without granting PL',async()=>{
 const s=createNpc(emptyBattle(),{name:'Alphamon',stage:'mega',level:1,attributes:{power:4,heart:5,intelligence:5,agility:4},qualities:[],attacks:[]});
 const a=s.actors[0];assert.equal(a.npcLevel,1);assert.equal(s.pairs.length,0);
 assert.throws(()=>adjustResources(s,{actorId:a.id,hp:a.hp,npcLevel:0}),/1 a 10/);
 const repo=createSceneRepository(newSceneData(s),async()=>{});
 const request={command:'adjustResources',args:[{actorId:a.id,hp:a.hp,npcLevel:6}],revision:0,requestId:'level'};
 await assert.rejects(repo.execute('player',request,false),/Narrador/);
 let saved=await repo.execute('narrator',request,true);assert.equal(saved.state.actors[0].npcLevel,6);assert.equal(saved.state.pairs.length,0);
 saved=await repo.execute('narrator',{command:'restart',revision:1,requestId:'restart'},true);assert.equal(saved.state.actors[0].npcLevel,6);
});
test('old saved NPCs default to level 1 without altering PV, actions or the input snapshot',async()=>{const s=fixture();delete s.actors[1].npcLevel;const old=structuredClone(s),repo=createSceneRepository(newSceneData(s),async()=>{}),saved=await repo.read('reader');assert.equal(saved.state.actors[1].npcLevel,1);delete saved.state.actors[1].npcLevel;assert.deepEqual(saved.state,s);assert.deepEqual(s,old);});
