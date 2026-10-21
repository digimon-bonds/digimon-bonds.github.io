import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,parseProject} from '../site/rules.js';
import {initializeForms,blankForm,activeForm,removeFormQuality,canRemoveFormQuality} from '../site/forms.js';
import {historicalBase,progressionPlan,withUpdate,progress} from '../site/progression.js';

function imported(){
 const s=initializeForms(fresh());s.quality='Furtivo';s.talent='Observador';initializeForms(s);
 s.digimonForms.rookie.qualities.push({name:'',rank:1},{name:'',rank:1});
 return historicalBase(s,1,4);
}
function roundTrip(s){for(let n=0;n<3;n++){initializeForms(s);s=parseProject(JSON.parse(JSON.stringify(s)));}return s;}

test('imported rookie qualities are removed from their persistent baseline, including the first entry',()=>{
 let s=imported();assert.equal(activeForm(s).qualities.length,3);
 assert.equal(removeFormQuality(s,1),true);s=roundTrip(s);assert.deepEqual(activeForm(s).qualities.map(q=>q.name),['Furtivo','']);
 assert.equal(removeFormQuality(s,0),true);s=roundTrip(s);assert.deepEqual(activeForm(s).qualities,[{name:'',rank:1}]);assert.equal(s.quality,'');
 assert.equal(removeFormQuality(s,0),false);assert.equal(removeFormQuality(s,-1),false);assert.equal(removeFormQuality(s,4),false);
});

test('creation and update forms remove only the chosen quality without changing other forms',()=>{
 for(const updated of [false,true]){
  let s=updated?imported():initializeForms(fresh());s.activeDigimonStage='champion';s.digimonForms.champion={...blankForm('champion'),unlocked:true,qualities:[{name:'Furtivo',rank:1},{name:'',rank:1},{name:'Defensor',rank:1}]};
  const rookie=structuredClone(s.digimonForms.rookie);
  assert.equal(removeFormQuality(s,1),true);s=roundTrip(s);assert.deepEqual(activeForm(s).qualities.map(q=>q.name),['Furtivo','Defensor']);assert.deepEqual(s.digimonForms.rookie,rookie);
 }
});

test('removing an earlier baseline quality preserves the target and rank of later progression rewards',()=>{
 let s=imported();s.updates[0].qualities[2].name='Corajoso';s=progressionPlan(s,1,5).next;s=withUpdate(s,{type:'upgrade',target:'quality',index:2});
 assert.equal(canRemoveFormQuality(s,2),false);assert.equal(removeFormQuality(s,2),false);
 assert.equal(removeFormQuality(s,1),true);s=roundTrip(s);assert.deepEqual(activeForm(s).qualities,[{name:'Furtivo',rank:1},{name:'Corajoso',rank:2}]);assert.equal(s.updates.at(-1).index,1);assert.equal(progress(s).exp,5);
});

test('independent quality upgrades stay on the same quality when an earlier manual entry is removed',()=>{
 let s=imported();s.digimonForms.champion={...blankForm('champion'),unlocked:true,qualities:[{name:'',rank:1},{name:'Defensor',rank:1}]};s=progressionPlan(s,1,5).next;s=withUpdate(s,{type:'form-upgrade',target:'quality',stage:'champion',index:1,base:{name:'Defensor',rank:1}});s.activeDigimonStage='champion';
 assert.equal(removeFormQuality(s,0),true);s=roundTrip(s);assert.deepEqual(activeForm(s).qualities,[{name:'Defensor',rank:2}]);assert.equal(s.updates.at(-1).index,0);
});

test('baby forms may remove their last manual quality and locked forms cannot be changed',()=>{
 const s=initializeForms(fresh());s.activeDigimonStage='baby';s.digimonForms.baby.qualities=[{name:'Pequeno',rank:1}];assert.equal(removeFormQuality(s,0),false);s.digimonForms.baby.unlocked=true;assert.equal(removeFormQuality(s,0),true);assert.deepEqual(activeForm(s).qualities,[]);
});
