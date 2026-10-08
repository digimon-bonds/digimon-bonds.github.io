import {entityById,entityName,pairOf,currentForm,markers,pendingResolutions} from './scene-engine.mjs';
export function adjustResources(state,config){
 const next=structuredClone(state),actor=next.actors.find(a=>a.id===config.actorId);if(!actor)throw Error('Participante indisponível.');
 const human=next.humans.find(h=>h.pairId===actor.pairId),pair=pairOf(next,actor),ids=[actor.id,human?.id];
 if(pendingResolutions(next).some(r=>ids.includes(r.pending.context?.actorId||r.pending.entityId)||ids.includes(r.pending.context?.targetId)))throw Error('Aplique os resultados desta dupla antes de editar os recursos.');
 const value=(v,max)=>{if(!Number.isInteger(v)||v<0||v>max)throw Error('Valor fora do limite (0 a '+max+').');return v;};
 actor.hp=value(config.hp,markers(currentForm(actor)).hp);if(!actor.hp)actor.remaining=0;
 if(pair){if(!Number.isInteger(config.bond)||config.bond< -99||config.bond>pair.level+5)throw Error('PL fora do limite da dupla.');pair.bond=config.bond;human.energy=value(config.energy,9+pair.level);if(!human.energy)human.remaining=0;}
 next.log.push({id:next.log.length+1,round:next.round,kind:'adjustment',actorId:actor.id,summary:`Narrador ajustou os recursos de ${entityName(actor)}${human?' / '+human.name:''}.`});return next;
}
export function flipSprite(state,id){const next=structuredClone(state),a=next.actors.find(a=>a.id===id);if(!a)throw Error('Participante indisponível.');a.flipped=!a.flipped;return next;}
