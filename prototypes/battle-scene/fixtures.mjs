import {markers} from './rules.mjs';
const quality=(id,name,rank)=>({id,name,rank});
const attack=(id,name,rank,element,effect='pesado')=>({id,name,rank,element,effect});
// Apenas fichas de laboratório; as projeções não representam uma linha evolutiva canônica.
function forms(){return {
 baby:{name:'Núcleo de Teste',stage:'baby',element:'Neutro',digitalAttribute:'Free',image:'assets/black-strabimon.png',unlocked:true,attributes:{power:1,heart:1,intelligence:1,agility:1},qualities:[],attacks:[]},
 rookie:{name:'Black Strabimon',stage:'rookie',element:'Escuridão',digitalAttribute:'Vírus',image:'assets/black-strabimon.png',unlocked:true,attributes:{power:3,heart:3,intelligence:3,agility:3},qualities:[quality('furtivo','Furtivo',1)],attacks:[attack('claw','Garra Sombria',1,'Escuridão','desorientador'),attack('claw-heavy','Impacto da Garra',1,'Escuridão')]},
 champion:{name:'Projeção Campeão',stage:'champion',element:'Escuridão',digitalAttribute:'Vírus',image:'assets/alphamon.png',unlocked:true,attributes:{power:4,heart:4,intelligence:3,agility:3},qualities:[quality('furtivo','Furtivo',1),quality('reflex','Reflexos Rápidos',1)],attacks:[attack('claw','Garra Sombria',1,'Escuridão','desorientador'),attack('impact','Impacto Digital',2,'Metal')]},
 ultimate:{name:'Projeção Perfeito',stage:'ultimate',element:'Metal',digitalAttribute:'Vacina',image:'assets/alphamon.png',unlocked:false,attributes:{power:4,heart:4,intelligence:4,agility:4},qualities:[quality('reflex','Reflexos Rápidos',2)],attacks:[attack('impact','Impacto Digital',2,'Metal'),attack('seal','Selo Digital',3,'Luz','atordoador')]},
 mega:{name:'Alphamon',stage:'mega',element:'Luz',digitalAttribute:'Vacina',image:'assets/alphamon.png',unlocked:false,attributes:{power:5,heart:5,intelligence:4,agility:4},qualities:[quality('reflex','Reflexos Rápidos',2)],attacks:[attack('seal','Selo Digital',3,'Luz','atordoador'),attack('force','Digital Force // LAB',4,'Luz')]}
 };}
export function initialBattle(){const allyForms=forms(),enemyForms=forms();enemyForms.rookie={...enemyForms.rookie,name:'Black Strabimon // NPC',attributes:{power:3,heart:4,intelligence:2,agility:3},qualities:[quality('reflex','Reflexos Rápidos',1)],attacks:[attack('npc-claw','Garra da Sombra',1,'Escuridão','quebra-bloqueio')]};
 return {scene:{name:'Ecos no Terminal',audio:false},round:1,phase:'open',actors:[
 {id:'ally',side:'ally',controller:'player',pairId:'pair-1',formId:'rookie',forms:allyForms,hp:markers(allyForms.rookie).hp,uses:{rookie:3},conditions:{},defending:false,remaining:1,multiUsed:false,highestReached:false,effectTargets:[],usedAttacks:[],position:{x:0,y:0,scale:1}},
 {id:'enemy',side:'enemy',controller:'narrator',pairId:null,formId:'rookie',forms:enemyForms,hp:markers(enemyForms.rookie).hp,uses:{rookie:2},conditions:{},defending:false,remaining:1,multiUsed:false,highestReached:false,effectTargets:[],usedAttacks:[],position:{x:0,y:0,scale:1}}
 ],humans:[{id:'human-1',pairId:'pair-1',name:'Operador de Teste',energy:11,characteristics:{body:3,mind:4,presence:2},talents:[{id:'martial',name:'Artes Marciais // LAB',rank:1},{id:'boken',name:'Boken // LAB',rank:1},quality('strategy','Estrategista',1)],remaining:1,multiUsed:false,skipped:false}],pairs:[{id:'pair-1',level:2,bond:7}],pending:null,result:null,log:[],narratives:[],turnFinalized:false};
}
