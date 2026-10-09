import {markers,STAGES} from './rules.mjs';
import {loseBond,spendBond,spendEnergy,rescue} from './resources.mjs';
export {effectiveForm as currentForm} from './digivice.mjs';
import {effectiveForm as currentForm} from './digivice.mjs';
export function highestForm(actor){return Object.entries(actor.forms).filter(([,f])=>f.unlocked).sort((a,b)=>STAGES[b[1].stage].order-STAGES[a[1].stage].order)[0]?.[0];}
export function changeForm(actor,id,{floor=true}={}){const oldMax=markers(currentForm(actor)).hp,loss=oldMax-actor.hp;actor.formId=id;const max=markers(currentForm(actor)).hp;actor.hp=Math.max(floor?1:0,max-loss);if(!(id in actor.uses))actor.uses[id]=currentForm(actor).attributes.intelligence;}
export function evolve(actor,human,pair,id){const form=actor.forms[id];if(!form||!form.unlocked||pair.level<STAGES[form.stage].level||id===actor.formId)throw Error('Forma indisponível');if(human.energy===0)throw Error('Humano sem Energia');const higher=STAGES[form.stage].order>STAGES[currentForm(actor).stage].order;
 if(higher&&pair.bond<0&&id===highestForm(actor))throw Error('Laço negativo bloqueia o maior estágio');let loss=0;
 if(higher&&id===highestForm(actor)){if(actor.highestReached){loseBond(pair,1);loss=1;}actor.highestReached=true;}
 changeForm(actor,id);return {higher,bondLoss:loss};
}
export function maintain(actor,human,pair,{sustain=true,allowZero=false,rescueEnabled=false}={}){const rule=STAGES[currentForm(actor).stage];if(!rule.energy&&!rule.bond)return {energy:0,bond:0,devolved:false};
 if(!sustain||human.energy<rule.energy||pair.bond<rule.bond||(human.energy===rule.energy&&!allowZero)){const base=Object.keys(actor.forms).find(id=>actor.forms[id].stage==='rookie');changeForm(actor,base);return {energy:0,bond:0,devolved:true};}
 spendBond(pair,rule.bond);spendEnergy(human,rule.energy);const save=rescue(pair,human.energy,rescueEnabled);human.energy=save.value;return {energy:rule.energy,bond:rule.bond+save.cost,devolved:false,rescued:save.cost>0};
}
