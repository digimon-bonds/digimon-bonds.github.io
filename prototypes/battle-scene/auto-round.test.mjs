import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from './scene-engine.mjs';
import {advanceCompletedRound as advance} from './auto-round.mjs';

const attack=(s,actorId,targetId)=>e.beginAttack(s,{actorId,targetId,attribute:'power',staged:true},()=>0);
const dodge=s=>e.confirmDodge(e.rollDodge(e.confirmAttack(s),{},()=>.99));
test('last accepted result opens the next round, restores actions and keeps the result visible',()=>{
 let s=e.observe(e.exampleBattle(),'human-1');
 s=e.acceptResult(dodge(attack(s,'enemy','ally')));
 assert.equal(advance(s),s); // The ally still has an attack.
 s=dodge(attack(s,'ally','enemy'));
 assert.equal(advance(s),s); // Rolling the last dodge is not acceptance.
 s=e.acceptResult(s);const old=structuredClone(s),next=advance(s);
 assert.equal(next.round,2);assert.equal(next.phase,'open');
 assert.equal(next.actors.every(a=>a.remaining===1),true);
 assert.equal(next.humans[0].remaining,1);
 assert.deepEqual(next.result,old.result);assert.deepEqual(s,old);
 assert.equal(next.log.filter(l=>l.kind==='maintenance').length,1);
 assert.equal(advance(next),next); // No second upkeep or round from rendering/rechecking.
 assert.doesNotThrow(()=>attack(next,'ally','enemy'));
 assert.doesNotThrow(()=>e.giveCoordinates(next,'human-1'));
});
test('unused human action and any outstanding queued result prevent automatic advancement',()=>{
 let s=e.exampleBattle();s=e.acceptResult(dodge(attack(s,'enemy','ally')));
 s=e.acceptResult(dodge(attack(s,'ally','enemy')));
 assert.equal(advance(s),s);
 s=e.observe(s,'human-1');assert.equal(advance(s).round,2);
 let multi=e.addParticipant(e.exampleBattle(),'enemy');multi=e.observe(multi,'human-1');
 multi=attack(multi,'enemy','ally');const first=multi.activeResolutionId;
 multi=attack(multi,'enemy-1','ally');multi=e.skipAction(multi,'digimon','ally');
 multi=e.acceptResult(dodge(e.selectResolution(multi,first)));
 assert.equal(advance(multi),multi);assert.equal(e.pendingResolutions(multi).length,1);
});
