/* Mock display identity; personality and rules are independent configuration. */
const mockPartner=Object.freeze({humanName:'Tamer',digimonName:'Agumon',species:'Agumon',stage:'Rookie',image:'assets/agumon.png'});
const engine=globalThis.DigiPetEngine;
const {PET_CONFIG:P,FOOD_CONFIG,ACTIVITY_CONFIG,PET_SPEECH}=globalThis.DigiPetConfig;
const byId=id=>document.getElementById(id),room=byId('room');
let state,storageAvailable=true,loadNotice='',seenEvent=0,feedbackUntil=0,historySignature='';
function validSave(raw){const c=raw?.version===1?raw.stats?.bond:raw?.stats?.companionship;return [1,2,3].includes(raw?.version)&&[raw.stats?.satiety,raw.stats?.energy,c,raw.version===3?raw.baseMood:raw.stats?.mood].every(x=>typeof x==='number'&&Number.isFinite(x));}
try{
 let rawText=localStorage.getItem(P.storageKey),source=P.storageKey;
 if(rawText===null)for(const key of P.legacyKeys){const value=localStorage.getItem(key);if(value!==null){rawText=value;source=key;break;}}
 if(rawText!==null){
  let raw;try{raw=JSON.parse(rawText);}catch{}
  if(!validSave(raw)){localStorage.setItem(`${P.storageKey}:backup:${Date.now()}`,rawText);loadNotice='Save anterior preservado em backup local. Novo protótipo iniciado.';state=engine.create();}
  else {state=engine.restore(raw);if(source!==P.storageKey||raw.version<3)loadNotice='Dados anteriores migrados. O save original foi preservado.';}
 }else state=engine.create();
}catch{state=engine.create();storageAvailable=false;}
seenEvent=state.eventSequence;
state=engine.advance(state);
function save(){try{localStorage.setItem(P.storageKey,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}byId('save-status').textContent=storageAvailable?'SALVO NESTE NAVEGADOR':'SEM SALVAMENTO · SESSÃO TEMPORÁRIA';}

// Two independent channels. System text never enters the pet speech component.
function showSystemFeedback(text){byId('system-feedback').textContent=text;feedbackUntil=Date.now()+10000;}
const speechRanks={dirty:120,hungry:100,tired:90,sad:80,lonely:70,play:60,train:60,sleep:60,happy:20,casual:10,greeting:15};
let currentSpeech=null,pendingSpeech=null;const speechCounts={};
function showPetSpeech(context,explicit=false){
 if(!PET_SPEECH[context])return;
 const now=Date.now(),priority=explicit?110:(speechRanks[context]||30);
 if(currentSpeech&&now<currentSpeech.until&&priority<=currentSpeech.priority){if(explicit&&context!==currentSpeech.context)pendingSpeech={context,expires:now+P.speechHoldMs*2};return;}
 if(!explicit&&currentSpeech?.context===context)return;
 if(explicit)pendingSpeech=null;
 const phrases=PET_SPEECH[context],index=speechCounts[context]||0;speechCounts[context]=index+1;
 byId('pet-thought-text').textContent=phrases[index%phrases.length];currentSpeech={context,priority,until:now+P.speechHoldMs};
}
function renderPetSpeech(){
 const now=Date.now(),need=engine.speechContext(state);
 if(pendingSpeech&&now>=currentSpeech.until){const queued=pendingSpeech;pendingSpeech=null;if(now<=queued.expires&&need!=='dirty'){showPetSpeech(queued.context,true);return;}}
 showPetSpeech(need);
}
function consumeEvent(){if(state.lastEvent&&state.lastEvent.id>seenEvent){seenEvent=state.lastEvent.id;showSystemFeedback(state.lastEvent.system);showPetSpeech(state.lastEvent.context,true);}}
const formatTime=ms=>{const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
const activityNames={play:'Brincando',train:'Treinando',sleep:'Descansando'};
function renderFoods(){
 const list=byId('food-list');list.replaceChildren();
 const names={favorite:'♥ Favorito',liked:'Gostou',neutral:'Neutro',disliked:'Não gosta'};
 for(const food of FOOD_CONFIG){
  const button=document.createElement('button');button.type='button';button.dataset.food=food.id;button.className='food-choice';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`#i-${food.icon}`);svg.append(use);svg.setAttribute('aria-hidden','true');button.append(svg);
  const text=document.createElement('span'),name=document.createElement('strong'),effects=document.createElement('small'),badge=document.createElement('em');name.textContent=food.name;
  effects.textContent=`+${food.satiety} Saciedade${food.energy?` · +${food.energy} Energia`:''}${food.mood?` · +${food.mood} Humor`:''}`;
  badge.textContent=state.discoveredFoods[food.id]?names[state.discoveredFoods[food.id].preference]:'? Preferência a descobrir';badge.dataset.preference=state.discoveredFoods[food.id]?.preference||'unknown';
  text.append(name,effects,badge);button.append(text);button.addEventListener('click',()=>{interact('food',{foodId:food.id});byId('food-dialog').close();});list.append(button);
 }
}
function render(){
 const mood=engine.mood(state),values={satiety:state.stats.satiety,mood:mood.visibleMood,energy:state.stats.energy,companionship:state.stats.companionship};
 for(const [key,value]of Object.entries(values)){
  const rounded=Math.round(value),element=byId(`stat-${key}`),track=byId(`meter-${key}`),card=element.closest('.pet-stat');
  element.textContent=rounded;track.style.setProperty('--level',`${value}%`);track.setAttribute('aria-valuenow',String(rounded));card.dataset.need=key;
  card.classList.toggle('needs-care',value<=(key==='mood'?P.thresholds.sad:key==='energy'?P.thresholds.tired:30));
  card.classList.toggle('is-dirty',key==='mood'&&state.waste);
  if(key==='mood')card.title=`Humor-base ${Math.round(mood.baseMood)} · penalidades temporárias ${Math.round(mood.baseMood-mood.visibleMood)}${state.waste?' · sujeira −20':''}`;
 }
 const condition=engine.condition(state).toUpperCase();if(byId('condition').textContent!==condition)byId('condition').textContent=condition;
 byId('waste').hidden=!state.waste;room.dataset.sleeping=String(state.activity?.kind==='sleep');room.dataset.habitat=state.habitat;
 document.querySelector('.room-shell').dataset.skin='street';
 document.querySelector('.scenery-interior').hidden=state.habitat!=='interior';document.querySelector('.scenery-exterior').hidden=state.habitat!=='exterior';
 byId('habitat-name').textContent=state.habitat==='interior'?'01 / QUARTO DIGITAL':'02 / JARDIM DIGITAL';
 document.querySelectorAll('.habitat-switch button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.habitat===state.habitat));b.disabled=Boolean(state.activity);});
 document.querySelectorAll('[data-action]').forEach(button=>{const action=button.dataset.action,reason=engine.availability(state,action);button.disabled=Boolean(reason)&&!(action==='food'&&!state.activity);button.setAttribute('aria-disabled',String(button.disabled));button.title=reason||'Cuidar de Agumon';});
 byId('sleep-button').textContent=state.activity?.kind==='sleep'?'☾ Acordar':'☾ Descansar';byId('sleep-button').setAttribute('aria-pressed',String(state.activity?.kind==='sleep'));
 byId('sleep-button').disabled=Boolean(state.activity&&state.activity.kind!=='sleep')||(!state.activity&&Boolean(engine.availability(state,'sleep')));
 byId('sleep-button').setAttribute('aria-disabled',String(byId('sleep-button').disabled));
 byId('activity-status').hidden=!state.activity;
 if(state.activity){byId('activity-label').textContent=activityNames[state.activity.kind];byId('activity-timer').textContent=formatTime(state.activity.endsAt-Date.now());byId('activity-timer').dateTime=new Date(state.activity.endsAt).toISOString();}
 if(Date.now()>=feedbackUntil){const text=state.activity?`A atividade termina em ${formatTime(state.activity.endsAt-Date.now())}.`:state.waste?'Há uma limpeza pendente. Clique na sujeira para limpar.':'Escolha um cuidado para Agumon.';if(byId('system-feedback').textContent!==text)byId('system-feedback').textContent=text;}
 const signature=JSON.stringify(state.history);
 if(signature!==historySignature){const list=byId('history-list');list.replaceChildren();for(const entry of state.history){const li=document.createElement('li');li.textContent=`${new Date(entry.at).toLocaleString('pt-BR')} · ${engine.labels[entry.action]}${entry.phase==='started'?' (início)':''}${entry.detail?' · '+entry.detail:''}`;list.append(li);}historySignature=signature;}
 byId('history-empty').hidden=state.history.length>0;byId('care-count').textContent=`Treinos concluídos: ${state.activityStats.trainingSessions}`;
 const latest=state.history[0];byId('last-action').textContent=latest?`Último: ${engine.labels[latest.action]}${latest.phase==='started'?' · início':''}`:'Pronto para o primeiro cuidado.';
 renderPetSpeech();
}
function update(){state=engine.advance(state);consumeEvent();save();render();}
function interact(action,options={}){const result=engine.act(state,action,Date.now(),options);state=result.state;consumeEvent();showSystemFeedback(result.feedback);if(!result.ok&&result.speechContext)showPetSpeech(result.speechContext,true);save();render();}
byId('partner-name').textContent=mockPartner.digimonName;byId('partner-species').textContent=mockPartner.species;byId('partner-stage').textContent=mockPartner.stage;byId('partner-image').src=mockPartner.image;
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.action==='food'&&!state.activity){update();renderFoods();byId('food-dialog').showModal();}else interact(button.dataset.action);}));
byId('close-food').addEventListener('click',()=>byId('food-dialog').close());
document.querySelectorAll('.habitat-switch button').forEach(button=>button.addEventListener('click',()=>{if(state.activity)return;state.habitat=button.dataset.habitat;update();}));
byId('sleep-button').addEventListener('click',()=>interact(state.activity?.kind==='sleep'?'wake':'sleep'));
byId('waste').addEventListener('click',()=>interact('clean'));
byId('open-history').addEventListener('click',()=>{update();byId('history-dialog').showModal();});byId('close-history').addEventListener('click',()=>byId('history-dialog').close());
document.querySelectorAll('[data-simulate]').forEach(button=>button.addEventListener('click',()=>{state=engine.simulate(state,Number(button.dataset.simulate));consumeEvent();save();render();byId('test-feedback').textContent=`+${button.dataset.simulate} minutos simulados.`;}));
document.querySelectorAll('[data-debug]').forEach(button=>button.addEventListener('click',()=>{state=engine.debug(state,button.dataset.debug);consumeEvent();save();render();byId('test-feedback').textContent='Ajuste aplicado apenas neste protótipo.';}));
byId('open-reset').addEventListener('click',()=>byId('reset-dialog').showModal());byId('cancel-reset').addEventListener('click',()=>byId('reset-dialog').close());
byId('confirm-reset').addEventListener('click',()=>{state=engine.create();seenEvent=0;currentSpeech=null;pendingSpeech=null;showSystemFeedback('Protótipo reiniciado.');showPetSpeech('greeting');save();render();byId('reset-dialog').close();byId('test-feedback').textContent='';});
const fullscreen=byId('fullscreen');if(!document.fullscreenEnabled)fullscreen.hidden=true;
fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.pet-experience').requestFullscreen();}catch{showSystemFeedback('Use F11 para ampliar a sala no navegador.');}});
document.addEventListener('fullscreenchange',()=>fullscreen.setAttribute('aria-label',document.fullscreenElement?'Sair da tela cheia':'Entrar em tela cheia'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});window.addEventListener('pagehide',update);
window.addEventListener('storage',event=>{if(event.key!==P.storageKey)return;try{const raw=JSON.parse(event.newValue);if(validSave(raw)){state=engine.advance(engine.restore(raw));consumeEvent();render();}}catch{}});
setInterval(update,1000);consumeEvent();if(loadNotice)showSystemFeedback(loadNotice);if(!currentSpeech)showPetSpeech('greeting');save();render();
