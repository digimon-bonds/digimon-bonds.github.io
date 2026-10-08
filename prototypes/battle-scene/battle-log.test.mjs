import test from 'node:test';import assert from 'node:assert/strict';
import * as e from './scene-engine.mjs';import {battleLogEntries} from './battle-log.mjs';
const attack=s=>e.beginAttack(s,{actorId:'enemy',targetId:'ally',attribute:'power',staged:true},()=>.99);
test('log remains empty through attack review and dodge, only adds the applied result once',()=>{
 let s=attack(e.initialBattle());assert.equal(battleLogEntries(s).length,0);
 s=e.confirmAttack(s);s=e.rollDodge(s,{},()=>.99);s=e.confirmDodge(s);assert.equal(battleLogEntries(s).length,0);
 s=e.acceptResult(s);assert.equal(battleLogEntries(s).length,1);assert.throws(()=>e.acceptResult(s));assert.equal(battleLogEntries(s).length,1);
});
test('log excludes every system note and formats hits, signature misses and evolution',()=>{
 const context={actor:{name:'Gabumon'},target:{name:'Morphomon'},targetType:'digimon'};
 const log=['scene-edit','arrival','departure','round','maintenance','skip','defend','test','survival','condition','stunned','canceled','attack-roll','dodge-roll','force','narrative'].map(kind=>({kind,summary:'Nota interna'}));
 log.push({kind:'attack',context,hit:true,actualDamage:7,damage:12}, {kind:'attack',context:{...context,actor:{name:'Morphomon'},target:{name:'Gabumon'},signature:{name:'Pó de Escamas'}},hit:false}, {kind:'evolution',summary:'EVOLUÇÃO: Patamon digivolve para… Angemon!'});
 assert.deepEqual(battleLogEntries({log}).map(e=>e.summary),['Gabumon usou Ataque Comum em Morphomon e tirou 7 de PV.','Morphomon usou “Pó de Escamas” em Gabumon e errou.','EVOLUÇÃO: Patamon digivolve para… Angemon!']);
 assert.equal(log[0].summary,'Nota interna');
});
test('fatal damage reports actual PV removed after survival, human damage names Energy',()=>{
 let s=e.initialBattle();s.actors[0].hp=2;s=attack(s);s=e.confirmDodge(e.rollDodge(e.confirmAttack(s),{},()=>0));s=e.acceptResult(e.decideSurvival(s,true));
 assert.match(battleLogEntries(s)[0].summary,/tirou 1 de PV\.$/);
 const human={...s.log.find(e=>e.kind==='attack'),context:{...s.result.context,targetType:'human'},actualDamage:2};assert.match(battleLogEntries({log:[human]})[0].summary,/tirou 2 de Energia\.$/);
});
