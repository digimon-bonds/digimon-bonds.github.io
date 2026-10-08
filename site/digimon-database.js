import snapshot from './data/digimon-data.js';
import {resolvePartnerImage} from './partner-image.js';

export const digimonStages=Object.freeze([
 {id:'baby',label:'BEBÊ'}, {id:'rookie',label:'NOVATO'},
 {id:'champion',label:'CAMPEÃO'}, {id:'ultimate',label:'PERFEITO'},
 {id:'mega',label:'MEGA'}, {id:'special',label:'ESPECIAIS'}, {id:'xbody',label:'X-BODY'}
]);
export const databaseVersion=snapshot.version;
export const elementalCycles=Object.freeze([
 Object.freeze([Object.freeze(['Fogo']),Object.freeze(['Madeira']),Object.freeze(['Água','Gelo'])]),
 Object.freeze([Object.freeze(['Elétrico']),Object.freeze(['Vento']),Object.freeze(['Terra'])]),
 Object.freeze([Object.freeze(['Luz']),Object.freeze(['Escuridão']),Object.freeze(['Metal'])])
]);
export const collectedAt=snapshot.collectedAt;
export const evolutionCategories=Object.freeze([
 {id:'standard',label:'Evolução comum'},
 {id:'spirit-base',label:'Base de Digiespírito'},
 {id:'spirit-human',label:'Digiespírito humano'},
 {id:'spirit-beast',label:'Digiespírito Fera'},
 {id:'spirit-combined',label:'Digiespírito combinado'},
 {id:'spirit-transcendent',label:'Digiespírito transcendente'},
 {id:'spirit-legendary',label:'Digiespíritos lendários'},
 {id:'fusion',label:'Fusão / Jogress'},
 {id:'special',label:'Condição especial'}, {id:'xbody',label:'Anticorpo X'}
].map(category=>Object.freeze(category)));
export const digimonDatabase=Object.freeze(snapshot.entries.map(entry=>Object.freeze({...entry,
 official:entry.official?Object.freeze({...entry.official}):undefined,
 evolutionComponents:entry.evolutionComponents?Object.freeze(entry.evolutionComponents.map(component=>Object.freeze({...component}))):undefined
})));
export const normalizeSearch=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
export function searchDigimon({query='',stage='all',evolutionCategory='all'}={}){
 const terms=normalizeSearch(query).split(/\s+/).filter(Boolean);
 return digimonDatabase.filter(d=>(stage==='all'||d.stage===stage)&&(evolutionCategory==='all'||d.evolutionCategory===evolutionCategory)&&terms.every(term=>normalizeSearch(d.name).includes(term)))
  .sort((a,b)=>Number(b.stage==='rookie'&&b.initialEligible)-Number(a.stage==='rookie'&&a.initialEligible)||a.name.localeCompare(b.name,'pt-BR'));
}
export function findDigimon(id){return digimonDatabase.find(d=>d.id===id);}
// Future Digivice selection excludes special routes unless explicitly requested.
export function getStageSpecies(stage,{includeSpecial=false,evolutionCategory='all'}={}){
 return digimonDatabase.filter(d=>(d.stage===stage||(includeSpecial&&d.stage==='special'&&d.progressionStage===stage))&&(evolutionCategory==='all'||d.evolutionCategory===evolutionCategory));
}
// Explicit adapter for the later Creator migration. Never unlocks a form or modifies a sheet.
export function toCreatorSpecies(entry){
 return {name:(entry.legacyName||entry.name).toLocaleUpperCase('pt-BR'),image:resolvePartnerImage(entry.image),digital:entry.digitalAttribute,
  element:entry.element,classification:entry.classification,occupied:Boolean(entry.partner)};
}
export function getCreatorSpecies({availableOnly=false}={}){
 return digimonDatabase.filter(d=>d.stage==='rookie'&&d.initialEligible&&(!availableOnly||d.availableAsPartner)).map(toCreatorSpecies);
}
