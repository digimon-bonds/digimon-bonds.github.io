import {ATTRIBUTES,STAGES} from './rules.mjs';
// https://digimonbonds.forumeiros.com/t6-03-digimon — initial distribution per form.
export const NPC_ATTRIBUTE_RULES={
 baby:{min:1,max:1,total:4},rookie:{min:1,max:4,total:12},
 champion:{min:2,max:5,total:14},ultimate:{min:2,max:6,total:16},mega:{min:2,max:6,total:18}
};
export function validateNpcAttributes(stage,attributes){
 const rule=NPC_ATTRIBUTE_RULES[stage];if(!rule)throw Error('Estágio inválido.');
 const values=Object.keys(ATTRIBUTES).map(key=>attributes?.[key]);
 if(values.some(value=>!Number.isInteger(value)||value<rule.min||value>rule.max))throw Error(`${STAGES[stage].label}: cada atributo deve ficar entre ${rule.min} e ${rule.max}.`);
 if(values.reduce((sum,value)=>sum+value,0)!==rule.total)throw Error(`${STAGES[stage].label}: distribua exatamente ${rule.total} pontos de atributos.`);
 return rule;
}
