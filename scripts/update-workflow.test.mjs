import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../site/rules.js';
import {initializeForms} from '../site/forms.js';
import {progressionPlan,progress,withUpdate} from '../site/progression.js';
let renderUpdate;
const previousLocation=globalThis.location;
try{globalThis.location=new URL('https://digimon-bonds.github.io/');({renderUpdate}=await import('../site/update-ui.js'));}
finally{if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;}

test('the update destination displays the applied XP exactly, including after choosing a gain',()=>{
 const original=initializeForms(fresh()),plan=progressionPlan(original,2,2);
 assert.equal(plan.amount,12);
 const value=s=>renderUpdate(s,String).match(/id="new-exp"[^>]*value="(\d+)"/)[1];
 assert.equal(value(original),'0');
 assert.equal(value(plan.next),'2');
 const upgraded=withUpdate(plan.next,{type:'upgrade',target:'quality',index:0});
 assert.equal(progress(upgraded).exp,2);
 assert.equal(value(upgraded),'2');
});
