import {getStageSpecies,getCreatorSpecies,findDigimon} from './digimon-database.js';
export const creatorSpecies=getCreatorSpecies();
export function selectableSpecies(stage){return getStageSpecies(stage).filter(d=>stage!=='rookie'||d.initialEligible).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));}
export function applySpecies(s,stage,id){const d=findDigimon(id),f=s.digimonForms?.[stage];if(!d||!f?.unlocked||!selectableSpecies(stage).some(x=>x.id===id))return false;
 const image=d.image.startsWith('./')?new URL(d.image,location.href).href:d.image;
 if(stage==='rookie'){s.digiName=(d.legacyName||d.name).toLocaleUpperCase('pt-BR');s.digiImage=image;s.digital=d.digitalAttribute;s.classification=d.classification;s.element=d.element;}else Object.assign(f,{name:d.name,image,digital:d.digitalAttribute,classification:d.classification,element:d.element});return true;
}
