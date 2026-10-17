import {getStageSpecies,getCreatorSpecies,findDigimon} from './digimon-database.js';
import {speciesKey} from './import-labels.js';
import {resolvePartnerImage} from './partner-image.js';
export const creatorSpecies=getCreatorSpecies();
export function selectableSpecies(stage){return getStageSpecies(stage).filter(d=>stage!=='rookie'||d.initialEligible).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));}
export function applySpecies(s,stage,id){const d=findDigimon(id),f=s.digimonForms?.[stage];if(!d||!f?.unlocked||!selectableSpecies(stage).some(x=>x.id===id))return false;
 const image=resolvePartnerImage(d.image);
 if(stage==='rookie'){s.digiSpeciesId=d.id;s.digiName=d.name;s.digiImage=image;s.imageMode='cutout';s.digital=d.digitalAttribute;s.classification=d.classification;s.element=d.element;}else Object.assign(f,{speciesId:d.id,name:d.name,image,imageMode:'cutout',digital:d.digitalAttribute,classification:d.classification,element:d.element});return true;
}

// A nickname is presentation; the Digibank ID remains the species identity.
export function selectedSpecies(s,stage='rookie'){
 const f=stage==='rookie'?{speciesId:s.digiSpeciesId,name:s.digiName,image:s.digiImage}:s.digimonForms?.[stage];
 if(!f)return null;
 const entries=selectableSpecies(stage);
 if(f.speciesId)return entries.find(d=>d.id===f.speciesId)||null;
 const named=entries.filter(d=>[d.name,d.legacyName].filter(Boolean).some(name=>speciesKey(name)===speciesKey(f.name)));
 if(named.length===1)return named[0];
 // Recover old renamed drafts only from an exact, unique bundled image.
 const pictured=f.image?entries.filter(d=>resolvePartnerImage(d.image)===resolvePartnerImage(f.image)):[];
 return pictured.length===1?pictured[0]:null;
}
export function initializeSpecies(s){
 const chosen=selectedSpecies(s);if(chosen)s.digiSpeciesId=chosen.id;
 for(const [stage,f] of Object.entries(s.digimonForms||{})){
  const d=selectedSpecies(s,stage);if(d)f.speciesId=d.id;
 }
 return s;
}
