// Session UI rules, deliberately separate from combat and authentication.
export function controlLocked(state,actorId){
 const actor=state.actors.find(a=>a.id===actorId);if(!actor)return false;
 const human=state.humans.find(h=>h.pairId===actor.pairId);
 const ids=[actor.id,human?.id];
 return !!state.pairs.find(p=>p.id===actor.pairId)?.turnFinalized||
  state.log.some(e=>e.round===state.round&&ids.includes(e.actorId))||
  !!(state.pending&&ids.includes(state.pending.context?.actorId||state.pending.entityId));
}
export function canChoose(state,mode,selectedId,candidateId,busy=false,mayControl=()=>true){
 const actor=state.actors.find(a=>a.id===candidateId);
 return !busy&&!!actor&&mayControl(actor)&&(mode==='narrator'||actor.side==='ally'&&actor.controller==='player'&&(!selectedId||selectedId===candidateId||!controlLocked(state,selectedId)));
}
export function canOperate(state,mode,selectedId,entityId,mayControl=()=>true){
 const ownerActor=state.actors.find(a=>a.id===entityId)||state.actors.find(a=>a.pairId===state.humans.find(h=>h.id===entityId)?.pairId);if(!ownerActor||!mayControl(ownerActor))return false;
 if(mode==='narrator')return true;
 const actor=state.actors.find(a=>a.id===selectedId),human=state.humans.find(h=>h.pairId===actor?.pairId);
 return !!actor&&(entityId===actor.id||entityId===human?.id);
}
