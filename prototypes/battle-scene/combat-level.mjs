export function combatLevel(state,entity){
 const level=state.pairs.find(p=>p.id===entity.pairId)?.level??entity.npcLevel??1;
 if(!Number.isInteger(level)||level<1||level>10)throw Error('Nível de Laço deve ser de 1 a 10.');
 return level;
}
// Older NPCs had no level field. They start at level 1, never at a level
// inferred from their evolution stage, and receive no partnership or PL.
export function hydrateNpcLevels(state){for(const actor of state.actors)if(!state.pairs.some(p=>p.id===actor.pairId))actor.npcLevel??=1;return state;}
