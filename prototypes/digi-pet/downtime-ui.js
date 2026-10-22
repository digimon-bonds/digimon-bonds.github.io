/* Compact local views. Domain/reward resolution belongs to pet-downtime.js. */
(() => {
 'use strict';
 const D=globalThis.DigiDowntime,C=D.config;
 const panel=document.createElement('dialog');panel.id='downtime-dialog';panel.setAttribute('aria-labelledby','downtime-title');document.querySelector('.pet-experience').append(panel);
 let currentView=null,presentingId=null,rollTimers=[],openingPanel=false;
 function refreshBeforePanel(){openingPanel=true;try{update();}finally{openingPanel=false;}}
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 function button(text,fn,disabled=false){const b=el('button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;}
 function line(text){panel.append(el('p',text,'downtime-copy'));}
 function heading(eyebrow,title){
  panel.replaceChildren();const h=el('div',undefined,'downtime-heading'),label=el('div');label.append(el('small',eyebrow,'eyebrow'));const titleEl=el('h2',title);titleEl.id='downtime-title';label.append(titleEl);const close=button('×',()=>panel.close());close.setAttribute('aria-label','Fechar painel');h.append(label,close);panel.append(h);
 }
 function open(view){currentView=view;if(!panel.open)panel.showModal();}
 function commit(result){state=result.state;save();render();if(result.feedback)showSystemFeedback(result.feedback);return result;}
 function summary(){
  heading('ROTINA DO PARCEIRO','Digi-Cycle');const d=state.downtime,row=d.ledger[d.currentCycleDate];
  line(`${d.currentCycleDate} · ${d.debugDayOffset?'DIA SIMULADO · ':''}1 atividade principal por dia (${C.timeZone}).`);
  const steps=el('div',undefined,'cycle-steps');steps.append(el('p',`${row.care?'✓':'○'} Cuidar do parceiro`),el('p',`${row.finished?'✓':'○'} ${row.major?row.major==='train'?'Treino':'Exploração':'Escolher: treinar ou explorar'}`));panel.append(steps);
  line(row.completed?'Ciclo de hoje concluído. Os cuidados continuam disponíveis.':row.major&&!row.finished?'Atividade em andamento.':row.finished&&!row.care?'Atividade concluída. Falta um cuidado para completar o ciclo.':'Um cuidado e uma atividade concluída formam um dia de convivência.');
  const memory=el('section',undefined,'reward-tile');memory.append(el('small','MEMÓRIA DE CONVIVÊNCIA','eyebrow'),el('h3',`${d.totalDigiCycles%C.cyclesPerXP}/${C.cyclesPerXP} Digi-Cycles`),el('p',`${d.totalDigiCycles} ciclos completos · ${d.pendingBondXP} XP de convivência pendente`));panel.append(memory);
  line('A cada 10 ciclos: +1 XP pendente. O progresso recomeça em 0/10. Nada é enviado à ficha.');
  if(d.prepared)line(`PREPARADO // ${d.prepared.label} · +1d6 em um teste apropriado. Benefício local, ainda sem uso no RPG.`);
  else for(const [key,name]of Object.entries(C.attributes))line(`TREINO // ${name} · ${d.training[key]}/${C.trainingGoal}`);
  open('cycle');
 }
 function openTraining(){
  refreshBeforePanel();heading('ATIVIDADE PRINCIPAL','O que vamos treinar?');
  line(`Duração: ${formatTime(ACTIVITY_CONFIG.durations[P.mode].train)} · ${ACTIVITY_CONFIG.train.effects.energy} Energia · ${ACTIVITY_CONFIG.train.effects.satiety} Saciedade ao concluir.`);
  line('Treinar usa a atividade de hoje. 3 ciclos no mesmo atributo concedem PREPARADO +1d6. Só um benefício pode ficar ativo.');
  const grid=el('div',undefined,'downtime-grid');
  for(const [attribute,name]of Object.entries(C.attributes))grid.append(button(`${name} · ${state.downtime.training[attribute]}/${C.trainingGoal}`,()=>{panel.close();interact('train',{attribute});},Boolean(engine.availability(state,'train'))));
  panel.append(grid);const reason=engine.availability(state,'train');if(reason)line(reason);open('train');
 }
 function openExploration(){
  refreshBeforePanel();const ready=D.disposition(state),zone=C.zones[0];heading('ATIVIDADE PRINCIPAL',zone.name);
  line(`Duração: ${formatTime(ACTIVITY_CONFIG.durations[P.mode].explore)} · ${ACTIVITY_CONFIG.explore.effects.energy} Energia · ${ACTIVITY_CONFIG.explore.effects.satiety} Saciedade na saída.`);
  const tile=el('section',undefined,'reward-tile');tile.append(el('small','DISPOSIÇÃO NA SAÍDA','eyebrow'),el('h3',`${ready.label} · ${ready.modifier>0?'+':''}${ready.modifier}`));panel.append(tile);
  line('Boa: Saciedade, Humor e Energia ≥70; Companhia ≥60; sem sujeira. Todos acima de 90: excelente. Algum estado abaixo de 35 ou sujeira: −5. Bônus máximo +5, resultado até 100.');
  line(`Mínimo: ${ACTIVITY_CONFIG.explore.minEnergy} Energia e ${ACTIVITY_CONFIG.explore.minSatiety} Saciedade. Cuidar antes da partida melhora suas chances. A Disposição fica registrada ao sair.`);
  const details=el('details'),label=el('summary','Tabela D100');details.append(label);
  for(const entry of C.loot)details.append(el('p',`${String(entry.min).padStart(2,'0')}–${entry.max} · ${entry.max-entry.min+1}% · ${entry.name}`));panel.append(details);
  const reason=engine.availability(state,'explore');if(reason&&state.downtime.majorActivityUsed)line(reason);
  panel.append(button('INICIAR EXPLORAÇÃO',()=>{panel.close();interact('explore',{zone:zone.id});},Boolean(state.activity||state.downtime.majorActivityUsed)));
  open('explore');
 }
 function inventory(tab='food'){
  heading('SUPRIMENTOS LOCAIS',`Inventário · ${state.downtime.credits} Créditos`);
  const tabs=el('div',undefined,'inventory-tabs');for(const [key,label]of [['food','Comida / Loja'],['items','Itens'],['cards','Cards']]){const b=button(label,()=>inventory(key));b.setAttribute('aria-pressed',String(tab===key));tabs.append(b);}panel.append(tabs);
  const d=state.downtime,i=d.inventory;
  if(tab==='food'){
   line('Compre primeiro, depois ofereça em COMIDA. DIGIMEAT é gratuito e infinito.');
   for(const f of FOOD_CONFIG){
    const row=el('section',undefined,'inventory-row'),txt=el('div');txt.append(el('strong',f.name),el('small',`${f.price?`${i.food[f.id]||0} no estoque · ${f.price} CR`:'∞ disponível · grátis'} · +${f.satiety} Saciedade${f.energy?` · +${f.energy} Energia`:''}${f.mood?` · +${f.mood} Humor`:''}`));row.append(txt);
    if(f.price)row.append(button('Comprar',()=>{const r=commit(D.buy(state,f.id));inventory('food');byId('downtime-title').focus?.();if(!r.ok)line(r.feedback);},d.credits<f.price));panel.append(row);
   }
  }else if(tab==='items'){
   line('CARE ITEMS · Reservados para validação futura. Sem efeitos na ficha.');
   for(const item of C.careItems)line(`${item.name} ×${i.care[item.id]||0}`);
   line(`DATA ITEMS · Recurso de Dados ×${i.data['data-resource']||0}`);
   line(`CARD FRAGMENTS · ${i.fragments}/3`);
   panel.append(button('RESTAURAR CARD · 3 fragmentos',()=>{const r=commit(D.restoreCard(state));if(r.ok)revealCard(r.card);},i.fragments<3));
  }else{
   line(`CARDS · ${i.cards.length} encontrados. +1d6 em um teste indicado; um uso futuro. Os efeitos ainda não são aplicados ao RPG.`);
   if(!i.cards.length)line('Sua primeira descoberta está no próximo sinal.');
   for(const card of i.cards){const row=el('section',undefined,'inventory-row'),txt=el('div');txt.append(el('strong',card.name),el('small',`${card.rarity} · +1d6 em um teste de ${card.effect.test}`));row.append(txt,button('Ver',()=>revealCard(card)));panel.append(row);}
   line(`FRAGMENTOS · ${i.fragments}/3`);panel.append(button('RESTAURAR CARD',()=>{const r=commit(D.restoreCard(state));if(r.ok)revealCard(r.card);},i.fragments<3));
  }
  open(`inventory:${tab}`);
 }
 function cardContent(card){
  const wrap=el('div',undefined,`card-reveal ${card.rarity==='RARE'?'is-rare':''}`),image=el('img');image.src=card.image;image.alt=`Arte provisória de ${card.name}`;
  wrap.append(el('small',card.rarity==='RARE'?'SINAL EXCEPCIONAL // CARD RARO':'SIGNAL DETECTED // CARD DATA FOUND','eyebrow'),image,el('small',`CARD // ${card.rarity}`),el('h3',card.name),el('p',`+1d6 em UM teste de ${card.effect.test}.`),el('p',card.description));panel.append(wrap);line('Benefício registrado na coleção local. Sem aplicação ou consumo na ficha nesta etapa.');
 }
 function revealCard(card){heading('DADOS RESTAURADOS','Card encontrado');cardContent(card);panel.append(button('Ver coleção',()=>inventory('cards')));open('card');}
 function resultView(result){
  presentingId=result.id;heading('EXPLORAÇÃO CONCLUÍDA','ROLANDO… D100');const stage=el('div',undefined,'roll-stage'),number=el('strong','D100'),caption=el('p','Decodificando o sinal…');stage.append(number,caption);panel.append(stage);open('result');
  rollTimers.push(setTimeout(()=>{number.textContent=String(result.natural);caption.textContent=`D100 natural ${result.natural} · Disposição ${result.modifier>=0?'+':''}${result.modifier} → ${result.final}`;},750));
  rollTimers.push(setTimeout(()=>{
   byId('downtime-title').textContent=result.title;stage.classList.add('roll-resolved');
   if(result.reward.card)cardContent(result.reward.card);else{const tile=el('section',undefined,'reward-tile');tile.append(el('small',result.title,'eyebrow'),el('h3',result.reward.text));panel.append(tile);}
   panel.append(button('Guardar e continuar',()=>panel.close()));
  },1550));
 }
 panel.addEventListener('close',()=>{
  rollTimers.forEach(clearTimeout);rollTimers=[];currentView=null;
  if(presentingId){const r=state.downtime.results.find(r=>r.id===presentingId);if(r)r.seen=true;presentingId=null;save();}
 });
 byId('open-cycle').addEventListener('click',()=>{refreshBeforePanel();summary();});
 byId('open-inventory').addEventListener('click',()=>{refreshBeforePanel();inventory();});
 // Developer tools remain behind Ctrl+Shift+D. Never shipped as normal controls.
 const debugBox=el('div',undefined,'debug-grid');byId('history-dialog').insertBefore(debugBox,byId('close-history'));
 const commands=[['cycle','Completar Digi-Cycle'],['nextDay','Simular próximo dia'],['finishTrain','Completar Treino'],['finishExplore','Completar Exploração'],['common','Forçar Card Comum'],['rare','Forçar Card Raro'],['credits','+50 Créditos'],['fragment','+1 Fragmento'],['ready','Todos os estados 100']];
 for(const [command,label]of commands)debugBox.append(button(label,()=>{state=D.debug(state,command);save();render();byId('test-feedback').textContent='Dados locais de teste alterados. O dia simulado aparece no Digi-Cycle.';}));
 const input=el('input');input.type='number';input.min='1';input.max='100';input.value='95';input.setAttribute('aria-label','Forçar próximo D100 entre 1 e 100');debugBox.append(input,button('Forçar próximo D100',()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>100){byId('test-feedback').textContent='Use um inteiro entre 1 e 100.';return;}state=D.debug(state,'roll',Date.now(),n);save();byId('test-feedback').textContent=`Próxima exploração: D100 natural ${n} (a Disposição ainda se aplica).`;}));
 const renderCare=render;
 render=function(){
  renderCare();const d=state.downtime,row=d.ledger[d.currentCycleDate];
  byId('cycle-summary').textContent=`DIGI-CYCLE · ${row.completed?'CONCLUÍDO':row.major==='train'?'TREINO':row.major==='explore'?'EXPLORAÇÃO':'TREINAR OU EXPLORAR'}`;
  byId('cycle-detail').textContent=`${d.debugDayOffset?'TESTE · ':''}${row.care?'✓ Cuidado':'○ Cuidado'} · ${d.totalDigiCycles%C.cyclesPerXP}/10 memória${d.pendingBondXP?` · ${d.pendingBondXP} XP pendente`:''}`;
  byId('credits-summary').textContent=`${d.credits} CR`;
  room.dataset.exploring=String(state.activity?.kind==='explore');
  const pending=d.results.find(r=>!r.seen);if(pending&&!openingPanel&&!document.querySelector('dialog[open]'))resultView(pending);
 };
 globalThis.DowntimeUI={openTraining,openExploration,inventory,summary};render();
})();
