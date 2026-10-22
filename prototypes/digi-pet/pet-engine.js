/* Timestamp-driven local care model. No RPG, backend or character-sheet dependency. */
(() => {
 'use strict';
 const {PET_CONFIG:P,FOOD_CONFIG:F,ACTIVITY_CONFIG:A,NEED_DECAY_CONFIG:N,MOOD_CONFIG:M,PARTNER_PROFILE:PROFILE,PREFERENCE_CONFIG:PR}=globalThis.DigiPetConfig;
 const hour=3600000,finite=x=>typeof x==='number'&&Number.isFinite(x),clamp=x=>Math.max(0,Math.min(100,x)),copy=x=>structuredClone(x);
 const labels={food:'Comida',play:'Brincar',train:'Treinar',explore:'Explorar',talk:'Conversar',sleep:'Descansar',wake:'Acordar',clean:'Limpar',simulation:'Teste de tempo',debug:'Ajuste de teste'};
 function create(now=Date.now()){return {version:3,stats:{satiety:P.initial.satiety,energy:P.initial.energy,companionship:P.initial.companionship},baseMood:P.initial.baseMood,skin:'street',habitat:'interior',waste:false,digestionDue:null,lastUpdatedAt:now,lastInteractionAt:now,lastTalkAt:null,activity:null,activityStats:{trainingSessions:0},discoveredFoods:{},history:[],counts:{},eventSequence:0,lastEvent:null};}
 function mood(state){
  const low={hunger:state.stats.satiety<=P.thresholds.hungry,exhaustion:state.stats.energy<=P.thresholds.tired,loneliness:state.stats.companionship<=P.thresholds.lonely};
  const needs=Object.values(low).filter(Boolean).length;
  const modifiers={dirty:state.waste?M.dirtyPenalty:0,hunger:low.hunger?M.hungerPenalty:0,exhaustion:low.exhaustion?M.exhaustionPenalty:0,loneliness:low.loneliness?M.lonelinessPenalty:0,stacked:needs>=2?(needs-1)*M.stackedNeedPenalty:0};
  return {baseMood:state.baseMood,dirtyMoodPenalty:modifiers.dirty,modifiers,visibleMood:clamp(state.baseMood-Object.values(modifiers).reduce((a,b)=>a+b,0)),badNeeds:needs};
 }
 function restore(raw,now=Date.now()){
  if(!raw||![1,2,3].includes(raw.version)||!raw.stats)return create(now);
  const s=create(now),legacy=raw.version<3;
  for(const key of Object.keys(s.stats)){
   const value=key==='companionship'&&raw.version===1?raw.stats.bond:raw.stats[key];
   if(!finite(value))return create(now);s.stats[key]=clamp(value);
  }
  const base=legacy?raw.stats.mood:raw.baseMood;if(!finite(base))return create(now);s.baseMood=clamp(base);
  s.waste=raw.waste===true;s.habitat=raw.habitat==='exterior'?'exterior':'interior';s.skin=P.skins.includes(raw.skin)?raw.skin:'street';
  // Legacy saves only stored displayed mood. Reconstruct the temporary causes once.
  if(legacy)s.baseMood=clamp(base+Object.values(mood(s).modifiers).reduce((a,b)=>a+b,0));
  const timestamp=(v,fallback=now)=>finite(v)&&v>=0?Math.min(v,now):fallback;
  s.lastUpdatedAt=timestamp(legacy?raw.lastTick:raw.lastUpdatedAt);s.lastInteractionAt=timestamp(raw.lastInteractionAt,s.lastUpdatedAt);
  s.lastTalkAt=raw.lastTalkAt===null?null:finite(raw.lastTalkAt)?timestamp(raw.lastTalkAt):finite(raw.lastActions?.talk)?timestamp(raw.lastActions.talk):null;
  s.digestionDue=finite(raw.digestionDue)&&raw.digestionDue>=0?Math.min(raw.digestionDue,now+N.digestionMs):null;
  if(raw.version===3&&raw.activity&&['play','train','sleep','explore'].includes(raw.activity.kind)&&finite(raw.activity.startedAt)&&finite(raw.activity.endsAt)&&raw.activity.endsAt>raw.activity.startedAt){
   const maxDuration=A.durations.production[raw.activity.kind];
   if(raw.activity.endsAt-raw.activity.startedAt<=maxDuration&&raw.activity.startedAt<=now)s.activity={kind:raw.activity.kind,startedAt:raw.activity.startedAt,endsAt:raw.activity.endsAt,...(raw.activity.cycleDate?{cycleDate:raw.activity.cycleDate,attribute:raw.activity.attribute,zone:raw.activity.zone,disposition:raw.activity.disposition}: {})};
  } else if(legacy&&raw.sleeping){s.activity={kind:'sleep',startedAt:now,endsAt:now+A.durations[P.mode].sleep};s.lastUpdatedAt=now;}
  s.activityStats.trainingSessions=finite(raw.activityStats?.trainingSessions)?Math.max(0,Math.floor(raw.activityStats.trainingSessions)):Math.max(0,Math.floor(raw.counts?.train||0));
  for(const food of F){const discovered=raw.discoveredFoods?.[food.id];if(discovered&&['favorite','liked','neutral','disliked'].includes(discovered.preference))s.discoveredFoods[food.id]={preference:discovered.preference,at:timestamp(discovered.at)};}
  for(const key of Object.keys(labels))if(finite(raw.counts?.[key]))s.counts[key]=Math.max(0,Math.floor(raw.counts[key]));
  s.history=Array.isArray(raw.history)?raw.history.filter(x=>x&&Object.hasOwn(labels,x.action)&&finite(x.at)).slice(0,P.historyLimit).map(x=>({action:x.action,at:timestamp(x.at),phase:['started','completed'].includes(x.phase)?x.phase:'completed',detail:typeof x.detail==='string'?x.detail.slice(0,80):''})):[];
  s.eventSequence=finite(raw.eventSequence)?Math.max(0,Math.floor(raw.eventSequence)):0;
  return s;
 }
 function record(s,action,at,phase='completed',detail=''){
  s.history.unshift({action,at,phase,detail});s.history=s.history.slice(0,P.historyLimit);
  if(phase==='completed')s.counts[action]=(s.counts[action]||0)+1;
 }
 function notify(s,system,context,at){s.eventSequence++;s.lastEvent={id:s.eventSequence,system,context,at};}
 function apply(s,effects){for(const [key,value]of Object.entries(effects)){if(key==='mood')s.baseMood=clamp(s.baseMood+value);else if(Object.hasOwn(s.stats,key))s.stats[key]=clamp(s.stats[key]+value);}}
 function decrease(s,key,amount){s.stats[key]=Math.max(Math.min(s.stats[key],N.floors[key]),s.stats[key]-amount);}
 function preferenceFor(foodId,profile=PROFILE){
  const profileRules=PR.profiles[profile.preferenceProfile];if(!profileRules||profileRules.element!==profile.element||profileRules.digitalAttribute!==profile.digitalAttribute)return 'neutral';
  return ['favorite','liked','neutral','disliked'].find(key=>profileRules[key].includes(foodId))||'neutral';
 }
 function finish(s,at){
  const completed=s.activity,kind=completed.kind;s.activity=null;
  if(kind==='play'){apply(s,A.play.effects);notify(s,'Agumon terminou de brincar.','finishedPlaying',at);}
  if(kind==='train'){const comfortable=mood(s).visibleMood>=M.trainingComfortMinimum;apply(s,A.train.effects);if(comfortable)apply(s,{mood:A.train.happyMoodGain});s.activityStats.trainingSessions++;notify(s,'Agumon terminou o treino.','finishedTraining',at);}
  if(kind==='sleep')notify(s,'Agumon terminou o descanso.','finishedResting',at);
  globalThis.DigiDowntime?.complete(s,completed,at);
  record(s,kind,at);
 }
 function advance(input,now=Date.now()){
  const s=copy(input);if(now<s.lastUpdatedAt){s.lastUpdatedAt=now;return s;}
  let cursor=s.lastUpdatedAt,decayBudget=N.maxDecayMs,companyBudget=N.maxCompanyLoss;
  function digest(){if(s.digestionDue!==null&&s.digestionDue<=cursor){s.waste=true;s.digestionDue=null;}}
  digest();
  if(s.activity&&s.activity.endsAt<=cursor)finish(s,cursor);
  while(cursor<now){
   const next=Math.min(now,s.activity?.endsAt??Infinity,s.digestionDue??Infinity);
   const elapsed=next-cursor,dt=Math.min(elapsed,decayBudget);decayBudget-=dt;
   decrease(s,'satiety',dt/hour*N.satietyPerHour);
   if(s.activity?.kind==='sleep')s.stats.energy=clamp(s.stats.energy+A.sleep.energyRecovery*elapsed/(s.activity.endsAt-s.activity.startedAt));
   else {
    decrease(s,'energy',dt/hour*N.energyPerHour);
    const eligible=Math.max(0,next-Math.max(cursor,s.lastInteractionAt+N.companyGraceMs));
    const loss=Math.min(companyBudget,eligible/hour*N.companyPerHour);decrease(s,'companionship',loss);companyBudget-=loss;
   }
   cursor=next;digest();if(s.activity&&s.activity.endsAt<=cursor)finish(s,cursor);
  }
  s.lastUpdatedAt=now;return s;
 }
 function availability(s,action,now=Date.now()){
  if(!Object.hasOwn(labels,action)||['simulation','debug'].includes(action))return 'Ação indisponível.';
  if(action==='clean')return s.waste?'':'O ambiente já está limpo.';
  if(action==='wake')return s.activity?.kind==='sleep'?'':'Agumon não está descansando.';
  if(s.activity)return 'Há uma atividade em andamento. Aguarde a conclusão'+(s.activity.kind==='sleep'?' ou acorde Agumon.':'.');
  if(action==='food'&&s.stats.satiety>=P.foodRefusalAt)return 'Agumon já está satisfeito. Nenhum alimento foi consumido.';
  if(action==='sleep'&&s.stats.energy>=100)return 'Agumon já está descansado.';
  if(A[action]?.minEnergy&&s.stats.energy<A[action].minEnergy)return 'Agumon precisa descansar antes dessa atividade.';
  if(A[action]?.minSatiety&&s.stats.satiety<A[action].minSatiety)return 'Ofereça uma comida antes dessa atividade.';
  return '';
 }
 function act(input,action,now=Date.now(),options={}){
  const s=advance(input,now),reason=availability(s,action,now);
  if(reason)return {state:s,ok:false,feedback:reason,speechContext:action==='food'&&s.stats.satiety>=P.foodRefusalAt?'foodRefused':null};
  if(action==='food'){
   const food=F.find(x=>x.id===options.foodId);if(!food)return {state:s,ok:false,feedback:'Escolha um alimento.',speechContext:null};
   const preference=preferenceFor(food.id),bonus=PR.bonuses[preference];
   apply(s,{satiety:food.satiety,energy:food.energy,mood:preference==='disliked'?0:food.mood+bonus.mood,companionship:preference==='disliked'?0:food.company+bonus.companionship});
   s.discoveredFoods[food.id]={preference,at:s.discoveredFoods[food.id]?.at??now};
   if(!s.waste&&s.digestionDue===null)s.digestionDue=now+N.digestionMs;
   s.lastInteractionAt=now;record(s,'food',now,'completed',food.name);
   const context={favorite:'eatingFavorite',liked:'eatingLiked',neutral:'eatingNeutral',disliked:'eatingDisliked'}[preference];
   notify(s,`Agumon comeu ${food.name}. Saciedade aumentou.`,context,now);
  } else if(['play','train','sleep'].includes(action)){
   s.activity={kind:action,startedAt:now,endsAt:now+A.durations[P.mode][action]};s.lastInteractionAt=now;
   record(s,action,now,'started');notify(s,`Agumon começou ${action==='play'?'a brincar':action==='train'?'o treino':'o descanso'}.`,action,now);
  } else if(action==='wake'){
   s.activity=null;s.lastInteractionAt=now;record(s,'wake',now);notify(s,'Agumon acordou. Recuperou apenas a energia do tempo descansado.','finishedResting',now);
  } else if(action==='clean'){
   s.waste=false;s.lastInteractionAt=now;record(s,'clean',now);notify(s,'Ambiente limpo. A penalidade temporária de sujeira foi removida.','clean',now);
  } else if(action==='talk'){
   const rewarded=s.lastTalkAt===null||now-s.lastTalkAt>=P.talkCooldownMs;
   if(rewarded){apply(s,P.talkEffects);s.lastTalkAt=now;}
   s.lastInteractionAt=now;record(s,'talk',now,'completed',rewarded?'Com ganho':'Sem ganho: intervalo de conversa');
   notify(s,rewarded?'Agumon passou um tempo com você. Companhia e Humor aumentaram.':'Conversa registrada. Novos ganhos ficam disponíveis após 1 minuto.','talk',now);
  }
  return {state:s,ok:true,feedback:s.lastEvent.system,speechContext:s.lastEvent.context};
 }
 function condition(s){
  if(s.activity)return {play:'Brincando',train:'Treinando',sleep:'Dormindo',explore:'Explorando'}[s.activity.kind];
  const m=mood(s);if(m.visibleMood<=P.thresholds.sad||m.badNeeds>=3)return 'Triste';
  if(s.stats.satiety<=P.thresholds.hungry)return 'Com fome';if(s.stats.energy<=P.thresholds.tired)return 'Cansado';if(s.stats.companionship<=P.thresholds.lonely)return 'Solitário';if(s.waste)return 'Incomodado';
  if(m.visibleMood>=P.thresholds.animated&&s.stats.energy>=P.thresholds.happy)return 'Animado';if(m.visibleMood>=P.thresholds.happy)return 'Feliz';return 'Tranquilo';
 }
 function speechContext(s){if(s.waste)return 'dirty';if(s.stats.satiety<=P.thresholds.hungry)return 'hungry';if(s.stats.energy<=P.thresholds.tired)return 'tired';if(mood(s).visibleMood<=P.thresholds.sad)return 'sad';if(s.stats.companionship<=P.thresholds.lonely)return 'lonely';if(s.activity)return s.activity.kind;if(mood(s).visibleMood>=P.thresholds.happy)return 'happy';return 'casual';}
 function simulate(input,minutes=5,now=Date.now()){
  const duration=Math.max(0,Math.min(minutes,7*24*60))*60000;const s=advance(advance(input,now),now+duration);
  for(const key of ['lastUpdatedAt','lastInteractionAt','lastTalkAt','digestionDue'])if(s[key]!==null)s[key]-=duration;
  if(s.activity){s.activity.startedAt-=duration;s.activity.endsAt-=duration;}
  s.history.forEach(x=>x.at-=duration);Object.values(s.discoveredFoods).forEach(x=>x.at-=duration);if(s.lastEvent)s.lastEvent.at-=duration;
  record(s,'simulation',now,'completed',`+${minutes} min`);return s;
 }
 function debug(input,command,now=Date.now()){
  let s=advance(input,now);
  if(command==='waste'){s.waste=true;s.digestionDue=null;}
  if(command==='complete'&&s.activity){const delta=Math.max(0,s.activity.endsAt-now);s=simulate(s,delta/60000,now);}
  if(command.startsWith('reduce:')){const key=command.slice(7);if(key==='mood')s.baseMood=clamp(s.baseMood-20);else if(Object.hasOwn(s.stats,key))s.stats[key]=clamp(s.stats[key]-20);}
  record(s,'debug',now,'completed',command);return s;
 }
 globalThis.DigiPetEngine={CONFIG:P,labels,create,restore,advance,act,availability,mood,condition,speechContext,preferenceFor,simulate,debug};
})();
