/* Mock display identity; personality and rules are independent configuration. */
const mockPartner=Object.freeze({humanName:'Tamer',digimonName:'Agumon',species:'Agumon',stage:'Rookie',sprites:{normal:'assets/agumon-normal.png',blink:'assets/agumon-blink.png'}});
const engine=globalThis.DigiPetEngine;
const {PET_CONFIG:P,FOOD_CONFIG,ACTIVITY_CONFIG,PET_SPEECH}=globalThis.DigiPetConfig;
const byId=id=>document.getElementById(id),room=byId('room');
let state,storageAvailable=true,loadNotice='',seenEvent=0,historySignature='';
function validSave(raw){const c=raw?.version===1?raw.stats?.bond:raw?.stats?.companionship;return [1,2,3].includes(raw?.version)&&[raw.stats?.satiety,raw.stats?.energy,c,raw.version===3?raw.baseMood:raw.stats?.mood].every(x=>typeof x==='number'&&Number.isFinite(x));}
try{
 let rawText=DigiPetPersistence.read(P.storageKey),source=P.storageKey;
 if(rawText===null)for(const key of P.legacyKeys){const value=DigiPetPersistence.read(key);if(value!==null){rawText=value;source=key;break;}}
 if(rawText!==null){
  let raw;try{raw=JSON.parse(rawText);}catch{}
  if(!validSave(raw)){DigiPetPersistence.backup(P.storageKey,rawText);loadNotice='Save anterior preservado em backup local. Novo protótipo iniciado.';state=engine.create();}
  else {state=engine.restore(raw);if(source!==P.storageKey||raw.version<3)loadNotice='Dados anteriores migrados. O save original foi preservado.';}
 }else state=engine.create();
}catch{state=engine.create();storageAvailable=false;}
seenEvent=state.eventSequence;
state=engine.advance(state);
function save(){try{DigiPetPersistence.write(P.storageKey,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}byId('save-status').textContent=storageAvailable?'SALVO NESTE NAVEGADOR':'SEM SALVAMENTO · SESSÃO TEMPORÁRIA';}

// Two independent channels. System text never enters the pet speech component.
let systemFeedbackTimer;
function showSystemFeedback(text){
 if(!text||text.startsWith('Agumon começou'))return;
 clearTimeout(systemFeedbackTimer);const toast=byId('system-feedback');toast.textContent=text;toast.hidden=false;
 systemFeedbackTimer=setTimeout(()=>{toast.hidden=true;toast.textContent='';},3200);
}
const petSpeech=PetSpeech.create({element:document.querySelector('.pet-thought'),textElement:byId('pet-thought-text'),library:PET_SPEECH,settings:P.speech,canSpeak:()=>!document.hidden});
function showPetSpeech(context,explicit=false){return petSpeech.speak(context,explicit,context==='dirty');}
let wasteWasVisible=state.waste;
function renderPetSpeech(){if(state.waste&&!wasteWasVisible)showPetSpeech('dirty',true);if(!state.waste&&petSpeech.current?.context==='dirty')petSpeech.hide();wasteWasVisible=state.waste;petSpeech.observe('casual');}
function consumeEvent(){if(state.lastEvent&&state.lastEvent.id>seenEvent){seenEvent=state.lastEvent.id;showSystemFeedback(state.lastEvent.system);showPetSpeech(state.lastEvent.context,true);if(state.lastEvent.context==='dirty')wasteWasVisible=state.waste;}}
const formatTime=ms=>{const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
const activityNames={play:'Brincando',train:'Treinando',sleep:'Descansando',explore:'Explorando'};
function renderFoods(){
 const list=byId('food-list');list.replaceChildren();
 const names={favorite:'♥ Favorito',liked:'Gostou',neutral:'Neutro',disliked:'Não gosta'};
 for(const food of FOOD_CONFIG){
  const button=document.createElement('button');button.type='button';button.dataset.food=food.id;button.className='food-choice';
  const image=document.createElement('img');image.src=food.image;image.alt='';image.className='food-asset';image.width=44;image.height=44;button.append(image);button.dataset.kind=food.id;
  const text=document.createElement('span'),name=document.createElement('strong'),effects=document.createElement('small'),badge=document.createElement('em');name.textContent=food.name;
  effects.textContent=`+${food.satiety} Saciedade${food.energy?` · +${food.energy} Energia`:''}${food.mood?` · +${food.mood} Humor`:''}`;
  effects.textContent+=food.price===0?' · ∞ gratuito':(' · estoque: '+(state.downtime.inventory.food[food.id]||0));button.disabled=food.price>0&&!(state.downtime.inventory.food[food.id]>0);
  badge.textContent=state.discoveredFoods[food.id]?names[state.discoveredFoods[food.id].preference]:'? Preferência a descobrir';badge.dataset.preference=state.discoveredFoods[food.id]?.preference||'unknown';
  badge.hidden=!state.discoveredFoods[food.id];
  text.append(name,effects,badge);button.append(text);button.addEventListener('click',()=>{interact('food',{foodId:food.id});closeFoods();});list.append(button);
 }
}
function render(){
 const mood=engine.mood(state),values={satiety:state.stats.satiety,mood:mood.visibleMood,energy:state.stats.energy,companionship:state.stats.companionship};
 for(const [key,value]of Object.entries(values)){
  const rounded=Math.round(value),element=byId(`stat-${key}`),track=byId(`meter-${key}`),card=element.closest('.pet-stat');
  element.textContent=rounded;track.style.setProperty('--level',`${value}%`);track.setAttribute('aria-valuenow',String(rounded));card.dataset.need=key;card.dataset.health=rounded<=20?'low':rounded<=60?'medium':'good';
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
 document.querySelectorAll('[data-action]').forEach(button=>{const action=button.dataset.action,reason=engine.availability(state,action);button.disabled=Boolean(reason)&&!(['food','explore'].includes(action)&&!state.activity&&(action==='food'||!state.downtime.majorActivityUsed));button.setAttribute('aria-disabled',String(button.disabled));button.title=reason||'Cuidar de Agumon';});
 byId('sleep-button').textContent=state.activity?.kind==='sleep'?'☾ Acordar':'☾ Descansar';byId('sleep-button').setAttribute('aria-pressed',String(state.activity?.kind==='sleep'));
 byId('sleep-button').disabled=Boolean(state.activity&&state.activity.kind!=='sleep')||(!state.activity&&Boolean(engine.availability(state,'sleep')));
 byId('sleep-button').setAttribute('aria-disabled',String(byId('sleep-button').disabled));
 byId('activity-status').hidden=!state.activity;
 if(state.activity){byId('activity-label').textContent=activityNames[state.activity.kind];byId('activity-timer').textContent=formatTime(state.activity.endsAt-Date.now());byId('activity-timer').dateTime=new Date(state.activity.endsAt).toISOString();}
 const signature=JSON.stringify(state.history);
 if(signature!==historySignature){const list=byId('history-list');list.replaceChildren();for(const entry of state.history){const li=document.createElement('li');li.textContent=`${new Date(entry.at).toLocaleString('pt-BR')} · ${engine.labels[entry.action]}${entry.phase==='started'?' (início)':''}${entry.detail?' · '+entry.detail:''}`;list.append(li);}historySignature=signature;}
 byId('history-empty').hidden=state.history.length>0;byId('care-count').textContent=`Treinos concluídos: ${state.activityStats.trainingSessions}`;
 renderPetSpeech();
 petSprites.refresh();
 petMotion.refresh();
 byId('pet-touch').disabled=Boolean(state.activity);
}
function update(){state=engine.advance(state);consumeEvent();save();render();}
function interact(action,options={}){const result=engine.act(state,action,Date.now(),options);state=result.state;consumeEvent();showSystemFeedback(result.feedback);if(!result.ok&&result.speechContext)showPetSpeech(result.speechContext,true);save();render();return result;}
byId('partner-name').textContent=mockPartner.digimonName;byId('partner-stage').textContent=mockPartner.stage;
const petSprites=PetSprites.create({
 element:byId('partner-image'),
 variants:mockPartner.sprites,
 canBlink:()=>!state.activity&&byId('food-dialog').hidden&&!document.querySelector('dialog[open]'),
});
const petMotion=PetMotion.create({breathElement:byId('pet-breath'),touchElement:byId('pet-touch'),canAnimate:()=>!state.activity&&byId('food-dialog').hidden&&!document.querySelector('dialog[open]')});
let lastTouchAt=-Infinity,lastTickleSpeechAt=-Infinity;
byId('pet-touch').addEventListener('click',()=>{
 const now=Date.now();if(state.activity||!byId('food-dialog').hidden||document.querySelector('dialog[open]')||now-lastTouchAt<P.touch.cooldownMs)return;
 lastTouchAt=now;petSprites.blinkOnce();petMotion.react();
 if(now-lastTickleSpeechAt>=P.touch.speechCooldownMs&&Math.random()<P.touch.speechChance&&showPetSpeech('tickled',true))lastTickleSpeechAt=now;
});
// Non-modal food bubble: anchored to the controls, without a backdrop or resize.
const foodBubble=byId('food-dialog'),foodTrigger=document.querySelector('[data-action="food"]');
document.querySelector('.interaction-deck').append(foodBubble);
foodTrigger.setAttribute('aria-controls','food-dialog');foodTrigger.setAttribute('aria-expanded','false');foodTrigger.setAttribute('aria-haspopup','dialog');
function closeFoods(restoreFocus=true){foodBubble.hidden=true;foodTrigger.setAttribute('aria-expanded','false');petSprites.refresh();petMotion.refresh();if(restoreFocus)foodTrigger.focus?.();}
function toggleFoods(){if(!foodBubble.hidden){closeFoods();return;}update();if(state.activity)return;renderFoods();foodBubble.hidden=false;foodTrigger.setAttribute('aria-expanded','true');petSprites.refresh();petMotion.refresh();byId('close-food').focus?.();}
document.addEventListener('pointerdown',event=>{if(!foodBubble.hidden&&!foodBubble.contains(event.target)&&!foodTrigger.contains(event.target))closeFoods(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!foodBubble.hidden){event.preventDefault();closeFoods();}});
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.action==='food'&&!state.activity){toggleFoods();}else if(button.dataset.action==='train'){globalThis.DowntimeUI.openTraining();}else if(button.dataset.action==='explore'){globalThis.DowntimeUI.openExploration();}else interact(button.dataset.action);}));
byId('close-food').addEventListener('click',()=>closeFoods());
document.querySelectorAll('.habitat-switch button').forEach(button=>button.addEventListener('click',()=>{if(state.activity)return;state.habitat=button.dataset.habitat;update();}));
byId('sleep-button').addEventListener('click',()=>interact(state.activity?.kind==='sleep'?'wake':'sleep'));
byId('waste').addEventListener('click',()=>interact('clean'));
byId('close-history').addEventListener('click',()=>byId('history-dialog').close());
document.addEventListener('keydown',event=>{if(event.ctrlKey&&event.shiftKey&&event.code==='KeyD'){event.preventDefault();if(!document.querySelector('dialog[open]')){update();byId('history-dialog').showModal();}}});
document.querySelectorAll('[data-simulate]').forEach(button=>button.addEventListener('click',()=>{state=engine.simulate(state,Number(button.dataset.simulate));consumeEvent();save();render();byId('test-feedback').textContent=`+${button.dataset.simulate} minutos simulados.`;}));
document.querySelectorAll('[data-debug]').forEach(button=>button.addEventListener('click',()=>{state=engine.debug(state,button.dataset.debug);consumeEvent();save();render();byId('test-feedback').textContent='Ajuste aplicado apenas neste protótipo.';}));
byId('open-reset').addEventListener('click',()=>byId('reset-dialog').showModal());byId('cancel-reset').addEventListener('click',()=>byId('reset-dialog').close());
byId('confirm-reset').addEventListener('click',()=>{state=engine.create();seenEvent=0;petSpeech.reset();showSystemFeedback('Protótipo reiniciado.');showPetSpeech('greeting');save();render();byId('reset-dialog').close();byId('test-feedback').textContent='';});
const fullscreen=byId('fullscreen');if(!document.fullscreenEnabled)fullscreen.hidden=true;
fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.pet-experience').requestFullscreen();}catch{showSystemFeedback('Use F11 para ampliar a sala no navegador.');}});
document.addEventListener('fullscreenchange',()=>fullscreen.setAttribute('aria-label',document.fullscreenElement?'Sair da tela cheia':'Entrar em tela cheia'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();else petSpeech.hide();});window.addEventListener('pagehide',update);
window.addEventListener('storage',event=>{if(event.key!==P.storageKey)return;try{const raw=JSON.parse(event.newValue);if(validSave(raw)){state=engine.advance(engine.restore(raw));consumeEvent();render();}}catch{}});
setInterval(update,1000);consumeEvent();if(loadNotice)showSystemFeedback(loadNotice);if(!petSpeech.current&&!state.waste)showPetSpeech('greeting');save();render();
