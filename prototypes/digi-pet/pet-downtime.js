/* Local downtime domain; no DOM, network, sheet or Battle Link dependency.
 * SECURITY BOUNDARY: every value below is user-editable and UNTRUSTED.
 * Replace persistence + RNG + clock/transactions on the server before rewards
 * can affect the RPG. A client date/ledger cannot provide anti-cheat security. */
(() => {
 'use strict';
 const E=globalThis.DigiPetEngine,C=globalThis.DigiDowntimeConfig,P=globalThis.DigiPetConfig;
 const base={...E},clone=x=>structuredClone(x),count=x=>Number.isFinite(x)?Math.max(0,Math.floor(x)):0;
 let rng=globalThis.ExplorationRNG;
 const dateFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:C.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
 function dateKey(at,offset=0){const p=Object.fromEntries(dateFormatter.formatToParts(new Date(at+offset*86400000)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
 function fresh(){return {version:1,totalDigiCycles:0,currentCycleDate:'',cycleCompleted:false,majorActivityUsed:null,pendingBondXP:0,ledger:{},training:{power:0,heart:0,intelligence:0,agility:0},prepared:null,credits:0,inventory:{food:{},care:{},cards:[],fragments:0},results:[],sequence:0,debugDayOffset:0,forcedRoll:null};}
 function sync(s,at){
  s.downtime??=fresh();const d=s.downtime,key=dateKey(at,d.debugDayOffset);
  d.ledger[key]??={care:false,major:null,attribute:null,finished:false,completed:false};
  const row=d.ledger[key];d.currentCycleDate=key;d.cycleCompleted=row.completed;d.majorActivityUsed=row.major;
  return row;
 }
 function creditCycle(s,key){
  const d=s.downtime,row=d.ledger[key];if(!row||row.completed||!row.care||!row.finished)return;
  row.completed=true;d.totalDigiCycles++;
  if(d.totalDigiCycles%C.cyclesPerXP===0)d.pendingBondXP++;
  if(row.major==='train'&&Object.hasOwn(C.attributes,row.attribute)&&!d.prepared){
   d.training[row.attribute]++;
   if(d.training[row.attribute]>=C.trainingGoal){d.training[row.attribute]=0;d.prepared={attribute:row.attribute,label:C.attributes[row.attribute],effect:'+1d6',uses:1,sourceDate:key};}
  }
 }
 function care(s,at){const row=sync(s,at);row.care=true;creditCycle(s,s.downtime.currentCycleDate);sync(s,at);}
 function disposition(s){
  const cfg=C.disposition,values={...s.stats,mood:E.mood(s).visibleMood};
  const excellent=!s.waste&&Object.values(values).every(v=>v>cfg.excellent);
  const good=!s.waste&&Object.entries(cfg.good).every(([k,v])=>values[k]>=v);
  const low=Object.values(values).some(v=>v<cfg.low)||s.waste;
  return {label:excellent?'EXCELENTE DISPOSIÇÃO':good?'BOA DISPOSIÇÃO':low?'BAIXA DISPOSIÇÃO':'DISPOSIÇÃO ESTÁVEL',modifier:good?cfg.bonus:low?-cfg.bonus:0,values,waste:s.waste};
 }
 function add(map,id,n=1){map[id]=(map[id]||0)+n;}
 function log(s,action,at,detail){s.history.unshift({action,at,phase:'completed',detail});s.history=s.history.slice(0,P.PET_CONFIG.historyLimit);s.counts[action]=(s.counts[action]||0)+1;}
 function pick(items){return items[rng.integer(0,items.length-1)];}
 function card(s,rarity,source){
  const template=pick(C.cards.filter(c=>c.rarity===rarity)),d=s.downtime;
  const item={...clone(template),instanceId:`card-${++d.sequence}`,source};d.inventory.cards.push(item);return item;
 }
 function reward(s,kind){
  const d=s.downtime,i=d.inventory;
  if(kind==='nothing')return {text:'O setor estava tranquilo. Nenhum item encontrado desta vez.'};
  if(kind==='credits'){const n=rng.integer(C.credits.min,C.credits.max);d.credits+=n;return {text:`+${n} Créditos`,credits:n};}
  if(kind==='food'){const f=pick(P.FOOD_CONFIG.filter(f=>f.price>0));add(i.food,f.id);return {text:`+1 ${f.name}`,food:f.id};}
  if(kind==='care'){const item=pick(C.careItems);add(i.care,item.id);return {text:`+1 ${item.name}`,item:item.id};}
  if(kind==='fragment'){i.fragments++;return {text:'+1 Fragmento de Card',fragments:1};}
  if(kind==='common'||kind==='rare'){const item=card(s,kind==='rare'?'RARE':'COMMON','exploration');return {text:item.name,card:clone(item)};}
  if(kind==='rareFind'){
   // A rare find is deliberately not a card: varied valuable supplies.
   const roll=rng.integer(1,4);
   if(roll===1){d.credits+=40;return {text:'Reserva digital · +40 Créditos',credits:40};}
   if(roll===2){i.fragments+=2;return {text:'Dados preservados · +2 Fragmentos',fragments:2};}
   if(roll===3){add(i.care,'care-pack',2);return {text:'Caravana de dados · +2 CARE PACK',item:'care-pack'};}
   add(i.care,'energy-patch',2);return {text:'Sinal antigo · +2 ENERGY PATCH',item:'energy-patch'};
  }
  const roll=rng.integer(1,4);
  if(roll===1){d.credits+=25;return {text:'Cache monetário · +25 Créditos',credits:25};}
  if(roll===2){const f=pick(P.FOOD_CONFIG.filter(f=>f.price>0)),n=rng.integer(1,2);add(i.food,f.id,n);return {text:`Cache de alimentos · +${n} ${f.name}`,food:f.id};}
  if(roll===3){i.fragments++;return {text:'Cache fragmentado · +1 Fragmento',fragments:1};}
  add(i.care,'recovery-disk');return {text:'+1 RECOVERY DISK',item:'recovery-disk'};
 }
 function complete(s,activity,at){
  if(!['train','explore'].includes(activity.kind)||!activity.cycleDate)return;
  const d=s.downtime,row=d.ledger[activity.cycleDate];if(!row||row.finished)return;
  row.finished=true;
  if(activity.kind==='explore'){
   const natural=d.forcedRoll??rng.d100();d.forcedRoll=null;
   const modifier=activity.disposition.modifier,final=Math.min(100,Math.max(1,natural+modifier));
   const entry=C.loot.find(x=>final>=x.min&&final<=x.max);
   const result={id:`expedition-${++d.sequence}`,at,cycleDate:activity.cycleDate,zone:activity.zone,natural,modifier,final,kind:entry.id,title:entry.name,reward:reward(s,entry.id),seen:false};
   d.results.unshift(result);d.results=d.results.slice(0,30);
   s.eventSequence++;s.lastEvent={id:s.eventSequence,system:entry.id==='nothing'?'Agumon voltou. Não encontrou itens desta vez.':`Exploração concluída: ${result.reward.text}.`,context:entry.id==='nothing'?'finishedPlaying':'happy',at};
  }
  creditCycle(s,activity.cycleDate);sync(s,at);
 }
 function restoreData(raw){
  const d=fresh();if(!raw||raw.version!==1)return d;
  for(const key of ['totalDigiCycles','pendingBondXP','credits','sequence','debugDayOffset'])d[key]=count(raw[key]);
  d.debugDayOffset=Math.min(d.debugDayOffset,36500);
  for(const [key,row]of Object.entries(raw.ledger||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(key)&&row){d.ledger[key]={care:row.care===true,major:['train','explore'].includes(row.major)?row.major:null,attribute:Object.hasOwn(C.attributes,row.attribute)?row.attribute:null,finished:row.finished===true,completed:row.completed===true};}
  for(const key of Object.keys(d.training))d.training[key]=Math.min(C.trainingGoal-1,count(raw.training?.[key]));
  if(Object.hasOwn(C.attributes,raw.prepared?.attribute))d.prepared={attribute:raw.prepared.attribute,label:C.attributes[raw.prepared.attribute],effect:'+1d6',uses:1,sourceDate:raw.prepared.sourceDate};
  // An existing 2/3 training progress now satisfies the new 2-cycle goal.
  // Preserve existing Prepared and pending XP; never revoke previous awards.
  if(!d.prepared){const earned=Object.keys(d.training).find(key=>count(raw.training?.[key])>=C.trainingGoal);if(earned){d.prepared={attribute:earned,label:C.attributes[earned],effect:'+1d6',uses:1,sourceDate:'migration-2-cycles'};d.training[earned]=0;}}
  const inv=raw.inventory||{};
  for(const [group,allowed]of [['food',P.FOOD_CONFIG.map(f=>f.id)],['care',C.careItems.map(i=>i.id)]])for(const id of allowed)if(count(inv[group]?.[id]))d.inventory[group][id]=count(inv[group][id]);
  d.inventory.fragments=count(inv.fragments);
  d.inventory.cards=Array.isArray(inv.cards)?inv.cards.filter(c=>C.cards.some(t=>t.id===c.id)&&typeof c.instanceId==='string').map(c=>({...clone(C.cards.find(t=>t.id===c.id)),instanceId:c.instanceId,source:c.source==='restoration'?'restoration':'exploration'})):[];
  d.results=Array.isArray(raw.results)?raw.results.filter(r=>r&&typeof r.id==='string'&&Number.isInteger(r.natural)&&r.natural>=1&&r.natural<=100&&(C.loot.some(e=>e.id===r.kind)||r.kind==='cache')&&r.reward&&typeof r.reward.text==='string').filter(r=>r.reward.item!=='data-resource').slice(0,30).map(r=>{const result=clone(r),template=C.cards.find(c=>c.id===result.reward.card?.id);if(template)result.reward.card.image=template.image;return result;}):[];
  d.forcedRoll=Number.isInteger(raw.forcedRoll)&&raw.forcedRoll>=1&&raw.forcedRoll<=100?raw.forcedRoll:null;
  return d;
 }
 E.create=function(at=Date.now()){const s=base.create(at);s.downtime=fresh();sync(s,at);return s;};
 E.restore=function(raw,at=Date.now()){const s=base.restore(raw,at);s.downtime=restoreData(raw?.downtime);sync(s,at);return s;};
 E.advance=function(input,at=Date.now()){const source=clone(input);sync(source,source.lastUpdatedAt);const s=base.advance(source,at);sync(s,at);return s;};
 E.simulate=function(input,minutes,at=Date.now()){const s=base.simulate(E.advance(input,at),minutes,at);sync(s,at);return s;};
 E.debug=function(input,command,at=Date.now()){const s=base.debug(E.advance(input,at),command,at);sync(s,at);return s;};
 E.availability=function(s,action,at=Date.now()){
  if(['train','explore'].includes(action)){
   if(s.activity)return 'Há uma atividade em andamento.';
   const key=dateKey(at,s.downtime?.debugDayOffset),row=s.downtime?.ledger[key];
   if(row?.major)return 'A atividade principal de hoje já foi escolhida. Volte amanhã.';
   if(action==='train'&&s.downtime?.prepared)return 'PREPARADO ativo. Um novo benefício não pode ser acumulado.';
  }
  return base.availability(s,action,at);
 };
 E.act=function(input,action,at=Date.now(),options={}){
  const s=E.advance(input,at),d=s.downtime,reason=E.availability(s,action,at);
  const fail=(feedback,context=null)=>({state:s,ok:false,feedback,speechContext:context});
  if(reason){const context=action==='explore'&&!s.activity&&!d.majorActivityUsed?(s.stats.energy<25?'exploreTired':s.stats.satiety<20?'exploreHungry':null):action==='food'&&s.stats.satiety>=P.PET_CONFIG.foodRefusalAt?'foodRefused':null;return fail(context?null:reason,context);}
  if(action==='train'&&!Object.hasOwn(C.attributes,options.attribute))return fail('Escolha o atributo do treino.');
  if(action==='food'){
   const f=P.FOOD_CONFIG.find(f=>f.id===options.foodId);if(!f)return fail('Escolha um alimento.');
   if(f.price>0&&!(d.inventory.food[f.id]>0))return fail('Compre este alimento na loja antes de oferecer.');
  }
  let result;
  if(action==='explore'){
   const zone=C.zones.find(z=>z.id===(options.zone||'sector01'));if(!zone)return fail('Zona indisponível.');
   const readiness=disposition(s);s.activity={kind:'explore',startedAt:at,endsAt:at+P.ACTIVITY_CONFIG.durations[P.PET_CONFIG.mode].explore,zone:zone.id,disposition:readiness};
   for(const [k,v]of Object.entries(P.ACTIVITY_CONFIG.explore.effects))s.stats[k]=Math.max(0,s.stats[k]+v);
   s.lastInteractionAt=at;s.eventSequence++;s.lastEvent={id:s.eventSequence,system:'Agumon saiu para explorar.',context:'explore',at};
   result={state:s,ok:true,feedback:s.lastEvent.system,speechContext:'explore'};
  }else{
   result=base.act(s,action,at,options);if(!result.ok)return result;
   if(action==='food'){
    const f=P.FOOD_CONFIG.find(f=>f.id===options.foodId);
    if(f.price>0)result.state.downtime.inventory.food[f.id]--;
    else{ // Basic food: no favorite/special mood or company bonus.
     result.state.baseMood=s.baseMood;result.state.stats.companionship=s.stats.companionship;
    }
   }
  }
  const next=result.state;
  if(['train','explore'].includes(action)){
   const row=sync(next,at);row.major=action;next.activity.cycleDate=next.downtime.currentCycleDate;
   if(action==='train'){next.activity.attribute=options.attribute;row.attribute=options.attribute;}
  }else if(['food','talk','clean'].includes(action))care(next,at);
  sync(next,at);return result;
 };
 // A completed play session counts as care; starting it alone does not.
 const onComplete=complete;
 globalThis.DigiDowntime={config:C,dateKey,sync,disposition,
  complete(s,a,at){onComplete(s,a,at);if(['play','sleep'].includes(a.kind))care(s,at);},
  buy(input,id,at=Date.now()){
   const s=E.advance(input,at),f=P.FOOD_CONFIG.find(f=>f.id===id);
   if(!f||f.price<=0)return {state:s,ok:false,feedback:'DIGIMEAT já está sempre disponível.'};
   if(s.downtime.credits<f.price)return {state:s,ok:false,feedback:'Créditos insuficientes.'};
   s.downtime.credits-=f.price;add(s.downtime.inventory.food,id);log(s,'purchase',at,f.name);return {state:s,ok:true,feedback:`${f.name} comprado.`};
  },
  buyCare(input,id,at=Date.now()){
   const s=E.advance(input,at),item=C.careItems.find(x=>x.id===id);
   if(!item)return {state:s,ok:false,feedback:'Item indisponível.'};
   if(s.downtime.credits<item.price)return {state:s,ok:false,feedback:'Créditos insuficientes.'};
   s.downtime.credits-=item.price;add(s.downtime.inventory.care,id);log(s,'purchase',at,item.name);return {state:s,ok:true,feedback:`${item.name} comprado.`};
  },
  useCare(input,id,at=Date.now()){
   const s=E.advance(input,at),item=C.careItems.find(x=>x.id===id);
   return {state:s,ok:false,feedback:item?'Consumível destinado à ficha do RPG. Integração ainda desligada; simule na bancada de teste.':'Item indisponível.'};
  },
  restoreCard(input,at=Date.now()){
   const s=E.advance(input,at);if(s.downtime.inventory.fragments<C.fragmentGoal)return {state:s,ok:false,feedback:`São necessários ${C.fragmentGoal} fragmentos.`};
   s.downtime.inventory.fragments-=C.fragmentGoal;const item=card(s,'COMMON','restoration');log(s,'restoreCard',at,item.name);return {state:s,ok:true,card:item,feedback:'Card restaurado.'};
  },
  debug(input,command,at=Date.now(),value){
   let s=E.advance(input,at),d=s.downtime;
   if(command==='nextDay'){d.debugDayOffset++;sync(s,at);}
   if(command==='cycle'){const row=sync(s,at);row.care=true;row.major??='train';row.finished=true;creditCycle(s,d.currentCycleDate);sync(s,at);}
   if(command==='credits')d.credits+=50;
   if(command==='fragment')d.inventory.fragments++;
   if(command==='ready'){for(const k of Object.keys(s.stats))s.stats[k]=100;s.baseMood=100;s.waste=false;s.digestionDue=null;}
   if(command==='roll'&&Number.isInteger(value)&&value>=1&&value<=100)d.forcedRoll=value;
   if(command==='common'||command==='rare'){
    const item=card(s,command==='rare'?'RARE':'COMMON','exploration');d.results.unshift({id:`debug-${++d.sequence}`,at,natural:command==='rare'?100:95,modifier:0,final:command==='rare'?100:95,kind:command,title:'CARD DE TESTE',reward:{text:item.name,card:clone(item)},seen:false});
   }
   if(['finishTrain','finishExplore','finish'].includes(command)&&s.activity&& (command==='finish'||s.activity.kind===(command==='finishTrain'?'train':'explore'))){s.activity.endsAt=at; // test shortcut, no simulated production date
    s=E.advance(s,at);
   }
   return s;
  },
  setRngForTests(adapter){rng=adapter;}
 };
 E.condition=s=>s.activity?.kind==='explore'?'Explorando':base.condition(s);
})();
