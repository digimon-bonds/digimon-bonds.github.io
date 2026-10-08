// Fontes e decisões de laboratório: RULES.md. Nenhuma dependência do App publicado.
export const STAGES = {
 baby: {label:'Bebê',hpBase:0,hpFactor:3,damageFactor:1,dodgeBonus:0,energy:0,bond:0,level:1,order:0},
 rookie: {label:'Novato',hpBase:5,hpFactor:3,damageFactor:2,dodgeBonus:1,energy:0,bond:0,level:1,order:1},
 champion: {label:'Campeão',hpBase:10,hpFactor:4,damageFactor:2,dodgeBonus:1,energy:1,bond:0,level:2,order:2},
 ultimate: {label:'Perfeito',hpBase:15,hpFactor:5,damageFactor:3,dodgeBonus:1,energy:2,bond:1,level:5,order:3},
 mega: {label:'Mega',hpBase:20,hpFactor:6,damageFactor:4,dodgeBonus:2,energy:3,bond:2,level:8,order:4}
};
export const ATTRIBUTES={power:'Poder',heart:'Coração',intelligence:'Inteligência',agility:'Agilidade'};
export const CHARACTERISTICS={body:'Corpo',mind:'Mente',presence:'Presença'};
export const ELEMENTS=['Fogo','Madeira','Água/Gelo','Elétrico','Vento','Terra','Luz','Escuridão','Metal','Neutro'];
const dominates={Fogo:'Madeira',Madeira:'Água/Gelo','Água/Gelo':'Fogo','Elétrico':'Vento',Vento:'Terra',Terra:'Elétrico',Luz:'Escuridão','Escuridão':'Metal',Metal:'Luz'};
export const CONDITIONS={poisoned:'Envenenado',stunned:'Atordoado',disoriented:'Desorientado',weak:'Fraco',vulnerable:'Vulnerável',immobilized:'Imobilizado',incapacitated:'Incapacitado',stimulated:'Estimulado'};
export function markers(form){const s=STAGES[form.stage];if(!s)throw Error('Estágio não suportado');return {hp:s.hpBase+s.hpFactor*form.attributes.heart+(form.combatBonuses?.hp||0),damage:s.damageFactor*form.attributes.power+(form.combatBonuses?.damage||0),dodge:form.attributes.agility+s.dodgeBonus+(form.combatBonuses?.dodge||0)};}
export function elementalRelation(attack,defender){return dominates[attack]===defender?1:dominates[defender]===attack?-1:0;}
export function digitalBonus(attacker,defender){return {Vacina:'Vírus','Vírus':'Data',Data:'Vacina'}[attacker.digitalAttribute]===defender.digitalAttribute?({baby:0,rookie:1,champion:2,ultimate:3,mega:4}[attacker.stage]):0;}
