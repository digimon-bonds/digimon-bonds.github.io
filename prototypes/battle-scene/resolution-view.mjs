// Local inspection follows the controlled participant, independently of the server's last selected ticket.
export function preferredResolution(state,actorId,explicitId=null){
 const entries=(state.resolutions||[]).filter(entry=>entry.round===undefined||entry.round===state.round),ids=[actorId,...state.humans.filter(h=>h.pairId===state.actors.find(a=>a.id===actorId)?.pairId).map(h=>h.id)];
 if(explicitId&&entries.some(entry=>entry.id===explicitId))return explicitId;
 const pending=entries.filter(entry=>entry.pending);
 const reaction=pending.find(({pending:p})=>p.kind==='attack'&&ids.includes(p.context?.targetId)&&p.attackConfirmed!==false&&!p.dodge);
 const owns=entry=>ids.includes(entry.pending.context?.actorId||entry.pending.entityId);
 const own=pending.find(entry=>entry.id===state.activeResolutionId&&owns(entry))||pending.find(owns);
 const incoming=pending.find(({pending:p})=>ids.includes(p.context?.targetId));
 return (reaction||own||incoming)?.id||state.activeResolutionId;
}
