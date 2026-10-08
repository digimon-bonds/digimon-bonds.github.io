import {getStageSpecies,getCreatorSpecies,findDigimon} from './digimon-database.js';
import {resolvePartnerImage} from './partner-image.js';
export const creatorSpecies=getCreatorSpecies();
export function selectableSpecies(stage){return getStageSpecies(stage).filter(d=>stage!=='rookie'||d.initialEligible).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));}
export function applySpecies(s,stage,id){const d=findDigimon(id),f=s.digimonForms?.[stage];if(!d||!f?.unlocked||!selectableSpecies(stage).some(x=>x.id===id))return false;
 const image=resolvePartnerImage(d.image);
 if(stage==='rookie'){s.digiName=d.name;s.digiImage=image;s.imageMode='cutout';s.digital=d.digitalAttribute;s.classification=d.classification;s.element=d.element;}else Object.assign(f,{name:d.name,image,imageMode:'cutout',digital:d.digitalAttribute,classification:d.classification,element:d.element});return true;
}
