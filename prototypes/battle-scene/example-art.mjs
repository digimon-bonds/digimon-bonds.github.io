import {sheetArt} from './sheet-art.mjs';
// Visual variety only: these are still fictional laboratory stats and abilities.
export function illustrateExample(state,actor,index){
 const names=['Gabumon','Morphomon','Patamon','Biyomon','Salamon','Veemon'];const art=sheetArt.find(a=>a.name===names[index%names.length])||sheetArt[index%sheetArt.length];
 const form=actor.forms.rookie;form.name=art.name;form.image=art.image;[form.element,form.digitalAttribute]=[art.element,art.digitalAttribute];for(const a of form.attacks)a.element=form.element;
 for(const [id,f] of Object.entries(actor.forms))if(id!=='rookie'){f.name=art.name+' // projeção LAB '+id;f.image=art.image;}
 for(const f of Object.values(actor.forms))for(const attack of f.attacks)attack.name='Ataque de teste // '+art.name;
 const human=state.humans.find(h=>h.pairId===actor.pairId);if(human)human.name='Operador de '+art.name+' // LAB';
 return state;
}
