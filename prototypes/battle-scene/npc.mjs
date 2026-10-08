import {validateNpcAttributes} from './npc-rules.mjs';
import {addParticipant,configureLab,currentForm,markers} from './scene-engine.mjs';
export function draftNpc(state,side='enemy'){
 const next=addParticipant(state,side),actor=next.actors.at(-1);
 actor.forms={rookie:{name:'',stage:'rookie',element:'Neutro',digitalAttribute:'Unknown',image:'assets/npc-placeholder.svg',unlocked:true,attributes:{power:1,heart:1,intelligence:1,agility:1},qualities:[],attacks:[]}};
 actor.controller='narrator';if(actor.pairId){const h=next.humans.find(h=>h.pairId===actor.pairId);h.name='';h.controller='narrator';h.image='';h.talents=[];h.characteristics={body:1,mind:1,presence:1};}actor.formId='rookie';actor.hp=markers(currentForm(actor)).hp;actor.uses={rookie:1};
 return next;
}
export function createNpc(state,config,side='enemy'){
 if(!config.name?.trim())throw Error('Informe o nome do NPC.');
 if(config.image&&!/^https?:\/\//i.test(config.image)&&!config.image.startsWith('blob:')&&!/^data:image\/(png|jpeg|webp);base64,/i.test(config.image))throw Error('Use um link de imagem HTTP ou HTTPS.');
 validateNpcAttributes(config.stage,config.attributes);
 const draft=draftNpc(state,side),id=draft.actors.at(-1).id;
 const hp=markers({stage:config.stage,attributes:config.attributes}).hp;
 if(side==='ally'&&!config.humanName?.trim())throw Error('Informe o nome do Humano NPC.');const next=configureLab(draft,{...config,hp,actorId:id,formId:'rookie',active:true});
 const actor=next.actors.at(-1);if(config.stage==='baby')actor.uses.rookie=0;actor.remaining=state.phase==='closed'||!actor.hp?0:1;
 const arrival=next.log.findLast(e=>e.kind==='arrival'&&e.actorId===id);arrival.summary=currentForm(actor).name+' entrou na cena.';
 return next;
}
