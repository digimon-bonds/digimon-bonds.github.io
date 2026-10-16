import test from 'node:test';import assert from 'node:assert/strict';
import * as e from './scene-engine.mjs';
import {signatureUsePlan,optionalEffects,signatureElements,effectsOf} from './signature-effects.mjs';
import {actionReminders} from './action-reminders.mjs';
import {applySceneCommand,newSceneData,createSceneRepository} from './scene-repository.mjs';
function fixture(effects){const s=e.addParticipant(e.exampleBattle(),'enemy');const actor=s.actors[0],form=e.currentForm(actor);form.element='Neutro';form.attacks=[{id:'technique',name:'Técnica de teste',rank:2,element:'Fogo',sourceEffects:effects}];actor.uses.rookie=8;for(const target of s.actors.slice(1)){target.hp=100;e.currentForm(target).element='Neutro';}return s;}
const config=extra=>({actorId:'ally',targetId:'enemy',attribute:'heart',signatureId:'technique',...extra});
function hit(s,extra={}){s=e.beginAttack(s,config(extra),()=>.7);s=e.rollDodge(s,{},()=>0);return e.acceptResult(s);}
test('one signature roll fans out into independent elemental thresholds, dodges and costs',()=>{
 let s=fixture(['ataque-multiplo','pesado']);e.currentForm(s.actors[1]).element='Madeira';e.currentForm(s.actors[2]).element='Neutro';let rolled=0;
 s=e.beginAttack(s,config({additionalTargetIds:[s.actors[2].id]}),()=>{rolled++;return .5;});
 assert.equal(rolled,s.pending.attack.pool);assert.equal(s.actors[0].uses.rookie,6);assert.equal(e.pendingResolutions(s).length,2);
 const [a,b]=s.resolutions;assert.deepEqual(a.pending.attack.dice,b.pending.attack.dice);assert.equal(a.pending.attack.mode,'advantage');assert.equal(b.pending.attack.mode,'normal');assert.equal(a.pending.attack.successes,rolled);assert.equal(b.pending.attack.successes,rolled);
 // A face 3 succeeds only with elemental advantage, using the very same values.
 let t=fixture(['ataque-multiplo']);e.currentForm(t.actors[1]).element='Madeira';t=e.beginAttack(t,config({additionalTargetIds:[t.actors[2].id]}),()=>.4);assert(t.resolutions[0].pending.attack.successes>0);assert.equal(t.resolutions[1].pending.attack.successes,0);
 s=e.rollDodge(s,{},()=>0);s=e.acceptResult(s);assert(s.actors[1].hp<100);assert.equal(s.actors[2].hp,100);
 s=e.selectResolution(s,b.id);s=e.rollDodge(s,{},()=>0);const secondDamage=e.attackResult(s.pending);assert.equal(secondDamage.heavy,0);s=e.acceptResult(s);assert(s.actors[2].hp<100);assert.equal(s.actors[0].uses.rookie,6);
});
test('force and confirm share a volley without rerolling costs or losing target-specific modes',()=>{
 let s=fixture(['ataque-multiplo']);e.currentForm(s.actors[1]).element='Madeira';s=e.beginAttack(s,config({staged:true,additionalTargetIds:[s.actors[2].id]}),()=>0);s=e.forceTest(s,'attack',()=>.4);s=e.confirmAttack(s);
 assert(s.resolutions.every(entry=>entry.pending.attackConfirmed));assert.deepEqual(s.resolutions[0].pending.attack.dice,s.resolutions[1].pending.attack.dice);assert(s.resolutions[0].pending.attack.successes>0);assert.equal(s.resolutions[1].pending.attack.successes,0);assert.equal(s.actors[0].uses.rookie,6);assert.equal(s.pairs[0].bond,5);
});
test('Efficient, overload and extra-use costs validate normal resources, including combined effects',()=>{
 const s=fixture(['eficiente','sobrecarregado']);const actor=s.actors[0],sig=e.currentForm(actor).attacks[0];
 assert.deepEqual(signatureUsePlan(actor,sig,{overload:3}),{uses:3,bond:0,firstFree:true});
 let n=e.beginAttack(s,config({overload:3}),()=>.7);assert.equal(n.actors[0].uses.rookie,5);assert.equal(n.pending.attack.pool,8);
 actor.uses.rookie=0;assert.equal(signatureUsePlan(actor,sig).uses,0);actor.usedAttacks.push(sig.id);assert.throws(()=>signatureUsePlan(actor,sig),/insuficientes/);assert.equal(signatureUsePlan(actor,sig,{extraUse:true}).bond,1);assert.throws(()=>signatureUsePlan(actor,sig,{overload:1,extraUse:true}),/insuficientes/);
 actor.uses.rookie=1;assert.throws(()=>signatureUsePlan(actor,sig,{extraUse:true}),/esgotados/);assert.throws(()=>e.beginAttack(s,config({overload:-1})),/inválid/);
});
test('automatic combined effects include heavy, disorientation, immobilization and vampirism',()=>{
 let s=fixture(['pesado','desorientador','imobilizador','vampirismo']);s.actors[0].hp=3;s.actors[1].npcLevel=4;s=hit(s);assert.equal(s.result.heavy,3);assert.equal(s.result.healing,4);assert(s.actors[1].conditions.disoriented);assert(s.actors[1].conditions.immobilized);
 s.actors[0].remaining=1;delete s.actors[1].conditions.disoriented;s=hit(s);assert.equal(s.actors[1].conditions.disoriented,undefined);assert(s.actors[1].conditions.immobilized);
});
test('optional stun cancels damage and poison is limited to one target per attacker per combat',()=>{
 let s=fixture(['atordoador','pesado']);s=hit(s,{chosenEffects:['atordoador']});assert.equal(s.result.damage,0);assert.equal(s.result.heavy,0);assert(s.actors[1].conditions.stunned);assert.equal(optionalEffects(s.actors[0],e.currentForm(s.actors[0]).attacks[0],'enemy').length,0);
 s=fixture(['venenoso']);s=hit(s,{chosenEffects:['venenoso']});assert.equal(s.actors[1].conditions.poisoned.power,3);s.actors[0].remaining=1;assert.throws(()=>e.beginAttack(s,config({targetId:s.actors[2].id,chosenEffects:['venenoso']})),/indisponível/);
});
test('weakness and block break reduce damage and apply their own distinct conditions',()=>{
 for(const [effect,condition] of [['enfraquecedor','weak'],['quebra-bloqueio','vulnerable']]){const base=hit(fixture([effect]));const changed=hit(fixture([effect]),{chosenEffects:[effect]});assert.equal(changed.result.damage,Math.ceil(base.result.damage/2));assert(changed.actors[1].conditions[condition]);}
});
test('healing uses attribute plus quality, applies rank plus successes and clamps to max PV',()=>{
 let s=fixture(['curativo']);s.actors[0].hp=2;const max=e.markers(e.currentForm(s.actors[0])).hp;
 s=e.beginAttack(s,config({targetId:'ally',signatureMode:'curativo'}),()=>.7);assert.equal(s.pending.kind,'test');assert.equal(s.pending.roll.pool,3);assert.equal(s.actors[0].uses.rookie,7);s=e.acceptResult(s);assert.equal(s.actors[0].hp,7);assert.equal(s.result.kind,'signature-support');assert.equal(s.humans[0].remaining,1);
 s.actors[0].remaining=1;s.actors[0].hp=max-1;s=e.beginAttack(s,config({targetId:'ally',signatureMode:'curativo'}),()=>.7);s=e.acceptResult(s);assert.equal(s.actors[0].hp,max);
});
test('cheer uses one action, no dice and stimulates up to maximum uses, including its caster',()=>{
 let s=fixture(['animador']);let rolls=0;s=e.beginAttack(s,config({targetId:'ally',signatureMode:'animador',supportTargetIds:['ally','human-1']}),()=>{rolls++;return 0;});assert.equal(rolls,0);s=e.acceptResult(s);assert(s.actors[0].conditions.stimulated);assert(s.humans[0].conditions.stimulated);assert.equal(s.actors[0].remaining,0);assert.equal(s.actors[0].uses.rookie,7);
 assert.throws(()=>e.beginAttack(fixture(['animador']),config({targetId:'ally',signatureMode:'animador',supportTargetIds:['ally','human-1','enemy','enemy-1']})),/quantidade/);
});
test('explosion waits for narrator proximity choice; collateral damage is level-based and independent',()=>{
 let s=fixture(['explosivo']);s=e.beginAttack(s,config({chosenEffects:['explosivo']}),()=>.7);s=e.rollDodge(s,{},()=>0);assert.throws(()=>e.acceptResult(s),/Narrador/);assert.throws(()=>applySceneCommand(s,'setExplosionTargets',[[s.actors[2].id]],{narrator:false,actorId:'ally'}),/Narrador/);
 s=e.setExplosionTargets(s,[s.actors[2].id]);s=e.acceptResult(s);const blast=e.pendingResolutions(s).find(entry=>entry.pending.context.fixedDamage!==undefined);assert(blast);assert.equal(s.actors[2].hp,100);s=e.selectResolution(s,blast.id);assert.equal(e.attackResult(s.pending).damage,2);assert.throws(()=>e.forceTest(s,'dodge'),/dano direto/);s=e.confirmDodge(s);s=e.acceptResult(s);assert.equal(s.actors[2].hp,98);
});
test('additional elements are selected from saved technique metadata; arbitrary elements are rejected',()=>{
 const s=fixture(['multi-elemento','pesado']);const sig=e.currentForm(s.actors[0]).attacks[0];sig.effectDetails=[{name:'Multi-Elemento',element:'Metal'},{name:'Multi-Elemento',element:'Água/Gelo'}];assert.deepEqual(signatureElements(sig),['Fogo','Metal','Água/Gelo']);assert.equal(e.attackPreview(s,config({element:'Metal'})).element,'Metal');assert.throws(()=>e.attackPreview(s,config({element:'Luz'})),/Elemento/);
});
test('reminders track separate human and Digimon actions without modifying combat state',()=>{
 const s=fixture([]);assert.equal(actionReminders(s,'ally').length,2);s.actors[0].remaining=0;assert.deepEqual(actionReminders(s,'ally'),['Faça sua Ação de Humano']);s.humans[0].remaining=0;assert.deepEqual(actionReminders(s,'ally'),['Todas as Ações realizadas! Aguarde!']);
});

test('saved volley reloads with identical dice and a replay cannot refund or duplicate its uses',async()=>{
 let persisted=newSceneData(fixture(['ataque-multiplo','sobrecarregado']));let repo=createSceneRepository(persisted,async next=>persisted=structuredClone(next));
 let snapshot=await repo.execute('player',{command:'claim',args:['ally'],revision:0,requestId:'claim'},false);
 const command={command:'beginAttack',args:[config({overload:1,additionalTargetIds:[snapshot.state.actors[2].id]})],revision:snapshot.revision,requestId:'volley'};
 snapshot=await repo.execute('player',command,false);const faces=structuredClone(snapshot.state.resolutions.map(entry=>entry.pending.attack.dice));assert.equal(snapshot.state.actors[0].uses.rookie,5);
 repo=createSceneRepository(persisted,async next=>persisted=structuredClone(next));snapshot=await repo.execute('player',command,false);assert.equal(snapshot.state.actors[0].uses.rookie,5);assert.deepEqual(snapshot.state.resolutions.map(entry=>entry.pending.attack.dice),faces);assert.equal(snapshot.state.resolutions.length,2);
});
test('poison ticks once for the entire signature volley, not once per target',()=>{
 let s=fixture(['ataque-multiplo']);s.actors[0].conditions.poisoned={power:2};const hp=s.actors[0].hp;
 s=e.beginAttack(s,config({additionalTargetIds:[s.actors[2].id]}),()=>.7);s=e.rollDodge(s,{},()=>0);s=e.acceptResult(s);assert.equal(s.actors[0].hp,hp);
 const entry=e.pendingResolutions(s)[0];s=e.selectResolution(s,entry.id);s=e.rollDodge(s,{},()=>0);s=e.acceptResult(s);assert.equal(s.actors[0].hp,hp-2);
});
test('support recipients cannot be removed while the saved technique awaits acceptance',()=>{
 let s=fixture(['curativo']);s=e.beginAttack(s,config({signatureMode:'curativo'}),()=>.7);assert.throws(()=>e.removeParticipant(s,'enemy'),/Resolva/);
});
test('poison and stimulation affect human actions too, without spending the partner action',()=>{
 let s=fixture([]);s.humans[0].conditions={poisoned:{power:2},stimulated:{}};const before=s.humans[0].energy;
 s=e.beginAttack(s,{actorId:'human-1',entityType:'human',targetId:'enemy',attribute:'body'},()=>.7);assert.equal(s.pending.attack.mode,'advantage');s=e.rollDodge(s,{},()=>0);s=e.acceptResult(s);assert.equal(s.humans[0].energy,before-2);assert.equal(s.actors[0].remaining,1);assert.equal(s.humans[0].conditions.stimulated,undefined);
});

test('legacy poison receipts still prevent choosing a second target in the same combat',()=>{
 const s=fixture(['venenoso']);s.actors[0].effectTargets=['venenoso:enemy'];
 assert.deepEqual(optionalEffects(s.actors[0],e.currentForm(s.actors[0]).attacks[0],s.actors[2].id),[]);
 assert.throws(()=>e.beginAttack(s,config({targetId:s.actors[2].id,chosenEffects:['venenoso']})),/indisponível/);
});
