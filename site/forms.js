import {stages, progress, bonuses, projectedForm} from './progression.js';
import {species, elements, effects, normalizeElement,normalizeElementFields} from './catalog.js';
import {archetypes} from './archetypes.js';
import {creatorSpecies,selectedSpecies,initializeSpecies} from './species-selection.js';
import {labelKey,speciesKey,uniqueLabelMatch} from './import-labels.js';
import {resolvePartnerImage} from './partner-image.js';
import {validImageBackground} from './partner-cutouts.js';

export const stageOrder=['baby','rookie','champion','ultimate','mega'];
export const stageNames={baby:'BEBÊ',rookie:'NOVATO',champion:'CAMPEÃO',ultimate:'PERFEITO',mega:'MEGA'};
export const stageRules={baby:{min:1,max:1,total:4,hpBase:0,hpHeart:3,damage:1,dodge:0,rank:0},rookie:stages.Novato,champion:stages.Campeão,ultimate:stages.Perfeito,mega:stages.Mega};
const keys=['poder','coracao','inteligencia','agilidade'];
export function setSignatureElement(s,stage,index,value){
 const element=normalizeElement(value),f=s.digimonForms?.[stage],attack=f?.signatureAttacks?.[index];
 if(!f?.unlocked||!attack||!elements.includes(element))return false;
 attack.element=element;
 if(stage==='rookie'&&index===0)s.attackElement=element;
 // Upgrades replay their original attack snapshot. Keep the corrected element
 // consistent without changing ranks, effects or progression rewards.
 for(const event of s.updates||[])if(event.type==='form-upgrade'&&event.target==='attack'&&event.stage===stage&&event.index===index&&event.base)event.base.element=element;
 return true;
}
// Correct an existing effect in its original sources so history replay keeps it.
export function setSignatureEffect(s,stage,index,effectIndex,value,extraElement){
 const form=s.digimonForms?.[stage];if(!form?.unlocked||!Number.isInteger(index)||!Number.isInteger(effectIndex)||effectIndex<0)return false;
 const attack=activeForm({...s,activeDigimonStage:stage}).signatureAttacks[index];
 if(!attack?.effects[effectIndex]||!effects.some(e=>e.name===value))return false;
 if(value!=='MULTI-ELEMENTO'&&attack.effects.some((e,i)=>i!==effectIndex&&e.name===value))throw Error('Esse Efeito já está neste Ataque.');
 const occupied=attack.effects.filter((e,i)=>i!==effectIndex&&e.name==='MULTI-ELEMENTO').map(e=>e.element);
 const element=value==='MULTI-ELEMENTO'?(extraElement??(attack.effects[effectIndex].name===value?attack.effects[effectIndex].element:elements.find(e=>e!==attack.element&&!occupied.includes(e)))):'';
 if(value==='MULTI-ELEMENTO'&&(!elements.includes(element)||element===attack.element||occupied.includes(element)))throw Error('Escolha um Elemento adicional diferente dos já utilizados.');
 const next=structuredClone(s),replacement={name:value,element},primary=stage==='rookie'&&index===0;
 const replace=list=>{if(list?.[effectIndex])list[effectIndex]={...replacement};};
 replace(next.digimonForms[stage].signatureAttacks[index]?.effects);
 if(primary&&effectIndex===0){next.effect=value;next.effectElement=element;}
 const label=({rookie:'Novato',champion:'Campeão',ultimate:'Perfeito',mega:'Mega'})[stage];
 for(let n=0;n<(next.updates||[]).length;n++){
  const event=next.updates[n],original=s.updates[n];
  if(primary&&event.type==='baseline')replace(event.effects);
  if(index===0&&event.type==='form'&&event.form?.stage===label)replace(event.form.attack?.effects);
  const independent=event.type==='form-upgrade'&&event.target==='attack'&&event.stage===stage&&event.index===index;
  if(independent)replace(event.base?.effects);
  const legacy=event.type==='upgrade'&&index===0&&(event.attackStage||'Novato')===label;
  if((independent||legacy)&&event.choice==='effect'){
   const before=progress({...s,updates:s.updates.slice(0,n)});
   const previous=independent?(before.formAttacks[stage+':'+index]||original.base):primary?{effects:before.effects}:before.forms.find(f=>f.stage===label)?.attack;
   if(previous?.effects.length===effectIndex){event.name=value;event.element=element;}
  }
 }
 // Validate the complete replay before committing; no rewards, ranks or XP change.
 progress(next);initializeForms(next);
 const updated=activeForm({...next,activeDigimonStage:stage}).signatureAttacks[index]?.effects[effectIndex];
 if(updated?.name!==value||updated.element!==element)return false;
 Object.assign(s,next);return true;
}
export function blankForm(stage){const r=stageRules[stage];return {unlocked:stage==='rookie',speciesId:'',name:'',image:'',personality:'',digital:'',element:'',classification:'',attributes:Object.fromEntries(keys.map(k=>[k,r.min])),qualities:stage==='baby'?[]:[{name:'',rank:1}],signatureAttacks:stage==='baby'?[]:[{name:'',rank:r.rank,element:'',effects:[{name:'',element:''}]}],imageMode:'cutout',imageBackground:'#17313b',imagePosition:'center',zoom:1};}
export function rookieForm(s){const p=progress(s);return {...blankForm('rookie'),unlocked:s.digimonForms?.rookie?.unlocked??true,speciesId:s.digiSpeciesId||'',speciesName:selectedSpecies(s)?.name||'',name:s.digiName,image:s.digiImage,personality:s.digiPersonality,digital:s.digital,element:selectedSpecies(s)?.element||s.element,classification:s.classification,attributes:{...s.digi},qualities:p.qualities.filter(q=>q.stage==='Novato').map(q=>({name:q.name,rank:q.rank})),signatureAttacks:[{name:s.attack,rank:p.attackRank,element:s.attackElement||s.element,effects:structuredClone(p.effects)},...structuredClone(s.digimonForms?.rookie?.signatureAttacks?.slice(1)||[])].map((a,i)=>p.formAttacks['rookie:'+i]||a),imageMode:s.imageMode||'original',imageBackground:s.imageBackground||'#17313b',imagePosition:s.imagePosition,zoom:s.zoom};}
export function initializeForms(s){
 const archetype=archetypes.find(a=>a.id===s.archetype)||uniqueLabelMatch(archetypes,s.archetype);if(archetype)s.archetype=archetype.id;
 initializeSpecies(s);const chosen=uniqueLabelMatch(creatorSpecies,s.digiName,speciesKey);if(chosen&&speciesKey(chosen.name)===speciesKey(selectedSpecies(s)?.legacyName||selectedSpecies(s)?.name)){s.digiName=chosen.name;for(const key of ['digital','classification'])if(labelKey(s[key])===labelKey(chosen[key]))s[key]=chosen[key];}
 normalizeElementFields(s);s.digiImage=resolvePartnerImage(s.digiImage);
 for(const f of Object.values(s.digimonForms||{}))f.image=resolvePartnerImage(f.image);
 for(const key of ['element','attackElement','effectElement'])s[key]=normalizeElement(s[key]);
 for(const f of Object.values(s.digimonForms||{})){f.element=normalizeElement(f.element);for(const a of f.signatureAttacks||[]){a.element=normalizeElement(a.element);for(const e of a.effects||[])e.element=normalizeElement(e.element);}}
 if(!s.digimonForms){s.digimonForms=Object.fromEntries(stageOrder.map(k=>[k,blankForm(k)]));for(const f of progress(s).forms){const k=stageOrder.find(k=>stageNames[k]===f.stage.toUpperCase());if(k)s.digimonForms[k]={...blankForm(k),unlocked:true,name:f.name,image:f.image,digital:f.digital,element:f.element,classification:f.classification,attributes:{...f.digi},qualities:progress(s).qualities.filter(q=>q.stage===f.stage).map(q=>({name:q.name,rank:q.rank})),signatureAttacks:[structuredClone(f.attack)]};}}
 const rookieSaved=s.digimonForms.rookie||{};const extra=structuredClone(rookieSaved.signatureAttacks?.slice(1)||[]);const extraQualities=structuredClone(rookieSaved.qualities?.slice(1)||[]);s.digimonForms.rookie=rookieForm(s);s.digimonForms.rookie.signatureAttacks=s.digimonForms.rookie.signatureAttacks.slice(0,1).concat(extra);s.digimonForms.rookie.qualities=s.digimonForms.rookie.qualities.slice(0,1).concat(extraQualities);if(!stageOrder.includes(s.activeDigimonStage))s.activeDigimonStage='rookie';return s;
}
export function parseForms(raw,s){if(raw===undefined)return initializeForms(s);if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Linha evolutiva inválida.');const result={};for(const stage of stageOrder){const f=raw[stage],r=stageRules[stage];if(!f||typeof f.unlocked!=='boolean')throw Error('Bloqueio de estágio inválido.');if(f.speciesId!==undefined&&typeof f.speciesId!=='string')throw Error('Espécie da forma inválida.');for(const k of ['name','image','personality','digital','element','classification','imagePosition'])if(typeof f[k]!=='string')throw Error('Dados da forma inválidos.');if(!['center','top','bottom','left','right'].includes(f.imagePosition)||!Number.isFinite(f.zoom)||f.zoom<1||f.zoom>2)throw Error('Imagem da forma inválida.');if(!f.attributes||keys.some(k=>!Number.isInteger(f.attributes[k])||f.attributes[k]<r.min||f.attributes[k]>r.max))throw Error('Atributos da forma inválidos.');if(!Array.isArray(f.qualities)||f.qualities.length>100||f.qualities.some(q=>typeof q.name!=='string'||!Number.isInteger(q.rank)||q.rank<1||q.rank>3))throw Error('Qualidades da forma inválidas.');if(!Array.isArray(f.signatureAttacks)||f.signatureAttacks.length>100||f.signatureAttacks.some(a=>typeof a.name!=='string'||typeof a.element!=='string'||!Number.isInteger(a.rank)||a.rank<1||a.rank>4||!Array.isArray(a.effects)||a.effects.length>3||a.effects.some(e=>typeof e.name!=='string'||typeof e.element!=='string')))throw Error('Ataques da forma inválidos.');if(f.imageMode!==undefined&&!['original','cutout'].includes(f.imageMode)||f.imageBackground!==undefined&&!validImageBackground(f.imageBackground))throw Error('Aparência da imagem inválida.');result[stage]={...blankForm(stage),...structuredClone(f)};}s.digimonForms=result;return initializeForms(s);}
export function activeForm(s){return {...(s.activeDigimonStage==='rookie'?rookieForm(s):projectedForm(s,s.activeDigimonStage)),speciesName:selectedSpecies(s,s.activeDigimonStage)?.name||'',stage:s.activeDigimonStage};}
export function formMetrics(s,stage=s.activeDigimonStage){const f=stage==='rookie'?rookieForm(s):s.digimonForms[stage],r=stageRules[stage],b=bonuses(progress(s));return {pv:r.hpBase+r.hpHeart*f.attributes.coracao+b.pv,damage:r.damage*f.attributes.poder+b.damage,dodge:f.attributes.agilidade+r.dodge+b.dodge,uses:f.attributes.inteligencia+b.uses};}
export function unlockStage(s,stage){if(!stageOrder.includes(stage))throw Error('Estágio inválido.');initializeForms(s);s.digimonForms[stage].unlocked=true;}
export function lockStage(s,stage){if(!stageOrder.includes(stage))throw Error('Estágio inválido.');initializeForms(s);s.digimonForms[stage].unlocked=false;}
export function formIssues(s,stage){const f=activeForm({...s,activeDigimonStage:stage}),r=stageRules[stage];if(!f.unlocked)return [];const errors=[];if(!f.name.trim())errors.push('Informe o nome da forma.');if(!validImageURL(f.image))errors.push('Informe uma URL de imagem http ou https.');if(keys.reduce((n,k)=>n+f.attributes[k],0)!==r.total)errors.push(`Distribua ${r.total} pontos de Atributos nesta forma.`);if(!elements.includes(f.element))errors.push('Selecione o Elemento da forma.');if(stage!=='baby'&&(!f.qualities.length||f.qualities.some(q=>!q.name.trim())))errors.push('Complete as Qualidades da forma.');if(stage!=='baby'&&!f.signatureAttacks.length)errors.push('Cadastre o Ataque de Assinatura da forma.');for(const a of f.signatureAttacks){if(!a.name.trim()||!elements.includes(a.element))errors.push('Complete Nome e Elemento do Ataque.');for(const e of a.effects){if(!effects.some(x=>x.name===e.name))errors.push('Selecione um Efeito oficial.');if(e.name==='MULTI-ELEMENTO'&&(!elements.includes(e.element)||e.element===a.element))errors.push('Selecione um Elemento adicional diferente.');}}return errors;}
// JSON is the complete private archive. The forum export omits every locked form.
export function publicArchive(s){const copy=structuredClone(s);initializeForms(copy);for(const k of stageOrder)if(!copy.digimonForms[k].unlocked)copy.digimonForms[k]={...blankForm(k),unlocked:false};if(!copy.digimonForms.rookie.unlocked){for(const k of ['digiSpeciesId','digiName','digiImage','digital','classification','digiPersonality','quality','attack','element','attackElement','effect','effectElement'])copy[k]='';copy.digi={poder:1,coracao:1,inteligencia:1,agilidade:1};copy.omitPublicRestoration=true;}else{const names=Object.fromEntries(stageOrder.map(k=>[stageNames[k],copy.digimonForms[k].unlocked]));if((copy.updates||[]).some(e=>e.type==='form'&&!names[e.form?.stage?.toUpperCase()]||e.type==='form-upgrade'&&!copy.digimonForms[e.stage]?.unlocked||e.type==='upgrade'&&e.choice==='quality'&&e.stage!=='Novato'&&!names[e.stage?.toUpperCase()]))copy.omitPublicRestoration=true;}return copy;}

export function availableAttacks(s,stage=s.activeDigimonStage){return stageOrder.slice(1,stageOrder.indexOf(stage)+1).filter(k=>s.digimonForms[k].unlocked).flatMap(k=>(k==='rookie'?rookieForm(s):projectedForm(s,k)).signatureAttacks.map(a=>({...a,sourceStage:k})));}

function validImageURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}

export function addSignatureAttack(s){initializeForms(s);const k=s.activeDigimonStage,f=s.digimonForms[k];if(k==='baby'||!f.unlocked||f.signatureAttacks.length>=100)return false;f.signatureAttacks.push({name:'',rank:stageRules[k].rank,element:'',effects:[{name:'',element:''}]});return true;}
export function removeSignatureAttack(s,index){const f=s.digimonForms[s.activeDigimonStage];if(!f?.unlocked||!Number.isInteger(index)||index<1||index>=f.signatureAttacks.length)return false;f.signatureAttacks.splice(index,1);return true;}

// Keep removals in the same source used to rebuild the displayed form.
function qualityRemoval(s,index){
 const stage=s.activeDigimonStage,f=activeForm(s),raw=s.digimonForms?.[stage];
 if(!raw?.unlocked||!Number.isInteger(index)||index<0||index>=f.qualities.length||stage!=='baby'&&f.qualities.length<=1)return null;
 const q=f.qualities[index],label=stageNames[stage][0]+stageNames[stage].slice(1).toLowerCase(),p=progress(s);
 const globalIndex=stage==='rookie'?p.qualities.map((q,i)=>({q,i})).filter(x=>x.q.stage==='Novato')[index]?.i:p.qualities.findIndex(x=>x.stage===label&&x.name===q.name);
 const baseline=(s.updates||[]).find(e=>e.type==='baseline');
 const baseIndex=stage==='rookie'?baseline?.qualities?.map((q,i)=>({q,i})).filter(x=>x.q.stage==='Novato')[index]?.i:baseline?.qualities?.findIndex(x=>x.stage===label&&x.name===q.name);
 const rawIndex=stage==='rookie'?-1:index<raw.qualities.length?index:-1;
 // Earned capacities and upgrades must retain their reward history.
 if((s.updates||[]).some(e=>e.type==='upgrade'&&(e.target==='quality'&&e.index===globalIndex||e.choice==='quality'&&(e.stage||'Novato')===label&&e.name.trim()===q.name)||e.type==='form-upgrade'&&e.target==='quality'&&e.stage===stage&&e.index===index))return null;
 if(!(baseIndex>=0)&&rawIndex<0)return null;
 return {stage,raw,rawIndex,baseline,baseIndex,globalIndex};
}
export function canRemoveFormQuality(s,index){return !!qualityRemoval(s,index);}
export function removeFormQuality(s,index){
 const source=qualityRemoval(s,index);if(!source)return false;
 const {stage,raw,rawIndex,baseline,baseIndex,globalIndex}=source;
 if(baseIndex>=0){baseline.qualities.splice(baseIndex,1);for(const e of s.updates)if(e.type==='upgrade'&&e.target==='quality'&&e.index>globalIndex)e.index--;}
 if(rawIndex>=0){raw.qualities.splice(rawIndex,1);for(const e of s.updates||[])if(e.type==='form-upgrade'&&e.target==='quality'&&e.stage===stage&&e.index>index)e.index--;}
 if(stage==='rookie'){const remaining=baseline.qualities.filter(q=>q.stage==='Novato');s.quality=remaining[0]?.name||'';raw.qualities=rookieForm(s).qualities;}
 initializeForms(s);return true;
}
