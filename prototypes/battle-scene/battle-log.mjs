// The engine keeps its full local audit trail. The player-facing log only
// contains completed attacks and evolution events, never pending dice/config.
export function battleLogEntries(state){
 return state.log.filter(e=>e.kind==='attack'||e.kind==='evolution'||e.kind==='knockout').map(e=>{
  if(e.kind==='evolution'||e.kind==='knockout')return e;
  const c=e.context,move=c.signature?`“${c.signature.name}”`:'Ataque Comum';
  const action=`${c.actor.name} usou ${move} em ${c.target.name}`;
  const damage=e.actualDamage??Math.max(0,e.hpBefore-e.hpAfter);
  const resource=c.targetType==='human'?'Energia':'PV';
  return {...e,summary:e.hit?`${action} e tirou ${damage} de ${resource}.`:`${action} e errou.`};
 });
}
