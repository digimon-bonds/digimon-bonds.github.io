const pending=s=>(s.resolutions||[]).filter(r=>r.pending).map(r=>r.pending);
export function roundStatus(s){
 const resolutions=pending(s);if(!resolutions.length&&s.pending)resolutions.push(s.pending);
 const units=[...s.actors.map(a=>({id:a.id,name:a.forms[a.formId].name,type:'Digimon',available:a.hp>0&&a.remaining>0})),...s.humans.map(h=>({id:h.id,name:h.name,type:'Humano',available:h.energy>0&&h.remaining>0}))];
 const waiting=units.filter(u=>u.available);
 return {units,waiting,pending:resolutions.length,completed:units.length-waiting.length,total:units.length,ready:units.length>0&&s.phase==='open'&&!waiting.length&&!resolutions.length};
}
export function partnershipStatus(s,pairId){
 const actors=s.actors.filter(a=>a.pairId===pairId),humans=s.humans.filter(h=>h.pairId===pairId),ids=[...actors,...humans].map(a=>a.id),resolutions=pending(s);
 if(!resolutions.length&&s.pending)resolutions.push(s.pending);
 const unresolved=resolutions.some(p=>ids.includes(p.context?.actorId||p.entityId)||ids.includes(p.context?.targetId));
 const available=actors.some(a=>a.hp>0&&a.remaining>0)||humans.some(h=>h.energy>0&&h.remaining>0);
 return {complete:!available&&!unresolved,unresolved,available,label:unresolved?'AGUARDANDO RESOLUÇÃO':available?'AÇÃO DISPONÍVEL':'TURNO CONCLUÍDO'};
}
