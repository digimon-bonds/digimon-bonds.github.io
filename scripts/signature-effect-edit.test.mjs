import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,parseProject} from '../site/rules.js';
import {initializeForms,blankForm,activeForm,setSignatureEffect} from '../site/forms.js';
import {historicalBase,progressionPlan,withUpdate,progress} from '../site/progression.js';

function character(){const s=fresh();s.talent='Foco';s.quality='Furtivo';s.attack='Koyōsetsu';s.element=s.attackElement='Madeira';s.effect='DESORIENTADOR';return initializeForms(s);}
function restored(s,stage='rookie'){for(let n=0;n<3;n++)s=parseProject(JSON.parse(JSON.stringify(initializeForms(s))));return activeForm({...s,activeDigimonStage:stage}).signatureAttacks;}

test('creation and imported Rank 2 attacks can replace Desorientador with Eficiente permanently',()=>{
 for(const imported of [false,true]){
  let s=character();if(imported){s.digimonForms.rookie.signatureAttacks[0].rank=2;s=historicalBase(s,2,2);}
  const before=progress(s);assert.equal(setSignatureEffect(s,'rookie',0,0,'EFICIENTE'),true);
  const attack=restored(s)[0];assert.equal(attack.effects[0].name,'EFICIENTE');assert.equal(attack.rank,before.attackRank);assert.equal(progress(s).level,before.level);assert.equal(progress(s).exp,before.exp);assert.deepEqual(progress(s).pending,before.pending);
 }
});

test('correcting the initial effect survives subsequent rank upgrades and preserves a separately earned effect',()=>{
 let s=historicalBase(character(),1,9);s=progressionPlan(s,2,0).next;
 s=withUpdate(s,{type:'upgrade',choice:'attack'});s=withUpdate(s,{type:'upgrade',choice:'Força'});s=withUpdate(s,{type:'upgrade',name:'Mapa'});
 s=progressionPlan(s,3,0).next;s=withUpdate(s,{type:'upgrade',target:'talent',index:0});s=withUpdate(s,{type:'upgrade',choice:'effect',name:'PESADO'});s=withUpdate(s,{type:'upgrade',name:'Scanner'});
 const before=progress(s),eventCount=s.updates.length;assert.equal(setSignatureEffect(s,'rookie',0,0,'EFICIENTE'),true);assert.deepEqual(restored(s)[0].effects.map(e=>e.name),['EFICIENTE','PESADO']);assert.equal(progress(s).attackRank,2);assert.equal(progress(s).exp,before.exp);assert.equal(s.updates.length,eventCount);
 assert.equal(setSignatureEffect(s,'rookie',0,1,'VAMPIRISMO'),true);assert.deepEqual(restored(s)[0].effects.map(e=>e.name),['EFICIENTE','VAMPIRISMO']);assert.equal(s.updates.find(e=>e.choice==='effect').name,'VAMPIRISMO');
});

test('independent attack snapshots and their earned effects retain corrections across replay',()=>{
 let s=historicalBase(character(),1,9);s.digimonForms.champion={...blankForm('champion'),unlocked:true,signatureAttacks:[{name:'Golpe',rank:2,element:'Gelo',effects:[{name:'DESORIENTADOR',element:''}]}]};s=progressionPlan(s,2,0).next;
 s=withUpdate(s,{type:'form-upgrade',target:'attack',stage:'champion',index:0,choice:'effect',base:structuredClone(s.digimonForms.champion.signatureAttacks[0]),name:'PESADO',element:''});s=withUpdate(s,{type:'upgrade',choice:'Força'});s=withUpdate(s,{type:'upgrade',name:'Mapa'});
 assert.equal(setSignatureEffect(s,'champion',0,0,'EFICIENTE'),true);assert.equal(setSignatureEffect(s,'champion',0,1,'VENENOSO'),true);assert.deepEqual(restored(s,'champion')[0].effects.map(e=>e.name),['EFICIENTE','VENENOSO']);assert.equal(restored(s,'champion')[0].rank,2);assert.equal(restored(s)[0].effects[0].name,'DESORIENTADOR');
});

test('multi-element corrections clear stale elements and reject duplicate or invalid changes atomically',()=>{
 let s=character();assert.equal(setSignatureEffect(s,'rookie',0,0,'MULTI-ELEMENTO'),true);let effect=restored(s)[0].effects[0];assert.notEqual(effect.element,'Madeira');assert.equal(setSignatureEffect(s,'rookie',0,0,'MULTI-ELEMENTO','Gelo'),true);assert.equal(restored(s)[0].effects[0].element,'Gelo');
 const before=JSON.stringify(s);assert.throws(()=>setSignatureEffect(s,'rookie',0,0,'MULTI-ELEMENTO','Madeira'));assert.equal(JSON.stringify(s),before);assert.equal(setSignatureEffect(s,'rookie',0,0,'EFICIENTE'),true);assert.equal(restored(s)[0].effects[0].element,'');assert.equal(setSignatureEffect(s,'rookie',0,0,'INVALIDO'),false);assert.equal(setSignatureEffect(s,'champion',0,0,'EFICIENTE'),false);
 s=historicalBase(s,1,9);s=progressionPlan(s,2,0).next;s=withUpdate(s,{type:'upgrade',choice:'effect',name:'PESADO'});const snapshot=JSON.stringify(s);assert.throws(()=>setSignatureEffect(s,'rookie',0,0,'PESADO'));assert.equal(JSON.stringify(s),snapshot);
});
