import {modifier} from './dice.mjs';
export function conditionMode(actor,type,extra={advantages:[],disadvantages:[]}){const advantages=[...(extra.advantages||[])],disadvantages=[...(extra.disadvantages||[])];
 if(actor.conditions.stimulated)advantages.push('Estimulado');
 if(type==='attack'&&actor.conditions.disoriented)disadvantages.push('Desorientado');
 if(type==='dodge'&&actor.defending)advantages.push('Defender');
 if(type==='dodge'&&(actor.conditions.vulnerable||actor.conditions.incapacitated))disadvantages.push('Vulnerável');
 return {mode:modifier(advantages,disadvantages),advantages,disadvantages};
}
export function afterAction(actor){for(const id of ['disoriented','weak','vulnerable','immobilized','incapacitated','stimulated'])delete actor.conditions[id];}
