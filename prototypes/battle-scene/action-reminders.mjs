export function actionReminders(state,actorId){
 const actor=state.actors.find(a=>a.id===actorId);if(!actor)return [];
 const human=state.humans.find(h=>h.pairId===actor.pairId),items=[];
 if(human?.energy>0&&human.remaining>0)items.push('Faça sua Ação de Humano');
 if(actor.hp>0&&actor.remaining>0)items.push('Faça sua Ação de Digimon');
 return items.length?items:['Todas as Ações realizadas! Aguarde!'];
}
