/* Compact local views. Domain/reward resolution belongs to pet-downtime.js. */
(() => {
 'use strict';
 const D=globalThis.DigiDowntime,C=D.config;
 const panel=document.createElement('dialog');panel.id='downtime-dialog';panel.setAttribute('aria-labelledby','downtime-title');document.querySelector('.pet-experience').append(panel);
 let currentView=null,presentingId=null,rollTimers=[],openingPanel=false;
 function finishPresentation(){
  rollTimers.forEach(clearTimeout);rollTimers=[];currentView=null;
  if(presentingId){const r=state.downtime.results.find(r=>r.id===presentingId);if(r)r.seen=true;presentingId=null;save();}
 }
 function closePanel(){finishPresentation();panel.close();}
 function refreshBeforePanel(){openingPanel=true;try{update();}finally{openingPanel=false;}}
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 function button(text,fn,disabled=false){const b=el('button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;}
 function line(text){panel.append(el('p',text,'downtime-copy'));}
 function heading(eyebrow,title){
  panel.replaceChildren();const h=el('div',undefined,'downtime-heading'),label=el('div');label.append(el('small',eyebrow,'eyebrow'));const titleEl=el('h2',title);titleEl.id='downtime-title';label.append(titleEl);const close=button('×',closePanel);close.setAttribute('aria-label','Fechar painel');h.append(label,close);panel.append(h);
 }
 function open(view){currentView=view;if(!panel.open)panel.showModal();}
 function commit(result){state=result.state;save();render();if(result.feedback)showSystemFeedback(result.feedback);return result;}
 function field(id,tag='p',cls=''){const node=el(tag,'',cls);node.id=id;return node;}
 function trainingText(){const d=state.downtime;if(d.prepared)return `PREPARADO // ${d.prepared.label} · +1d6 em UM teste. Pronto para uma cena futura.`;return Object.entries(C.attributes).map(([key,name])=>`${name}: ${d.training[key]}/${C.trainingGoal}`).join(' · ');}
 function recentResult(){
  const d=state.downtime,a=state.activity;
  if(a?.kind==='train')return `Treino em andamento: ${C.attributes[a.attribute]||'Atributo'} · ${formatTime(a.endsAt-Date.now())}`;
  if(a?.kind==='explore')return `Exploração em andamento · ${formatTime(a.endsAt-Date.now())}`;
  const last=state.history.find(x=>x.action==='train'&&x.phase==='completed'),exp=d.results[0];
  if(last&&(!exp||last.at>=exp.at)){const key=last.detail;return d.prepared?`PREPARADO // ${d.prepared.label} · +1d6 disponível`:`Treino ${C.attributes[key]||''} concluído${C.attributes[key]?` · ${d.training[key]}/${C.trainingGoal} ciclos`:''}. ${d.cycleCompleted?'Progresso registrado.':'Falta o cuidado do dia para registrar progresso.'}`;}
  if(exp)return `${exp.title} · ${exp.reward.text}`;
  return 'Nenhuma atividade principal concluída ainda.';
 }
 function refreshCycleFields(){
  const d=state.downtime,row=d.ledger[d.currentCycleDate],progress=d.totalDigiCycles%C.cyclesPerXP;
  byId('cycle-progress-number').textContent=`${progress} / ${C.cyclesPerXP}`;
  const rail=byId('cycle-progress-rail');rail.style.setProperty('--progress',`${progress/C.cyclesPerXP*100}%`);rail.setAttribute('aria-valuenow',String(progress));
  byId('cycle-next-gain').textContent=`Próximo XP em ${C.cyclesPerXP-progress} ciclos`;
  byId('cycle-total-label').textContent=`${d.totalDigiCycles} Digi-Cycles no total · ${d.pendingBondXP} XP pendente`;
  byId('cycle-care-check').textContent=`${row.care?'✓':'○'} Cuidado do dia ${row.care?'realizado':'pendente'}`;
  byId('cycle-major-check').textContent=`${row.finished?'✓':'○'} ${row.major?(row.major==='train'?'Treinar':'Explorar')+(row.finished?' concluído':' em andamento'):'Escolher Treinar ou Explorar'}`;
  byId('cycle-status').textContent=row.completed?'Ciclo de hoje concluído. Amanhã há uma nova escolha.':row.finished&&!row.care?'Falta cuidar: alimente, converse, brinque, descanse ou limpe o habitat.':!row.care&&!row.major?'Faltam um cuidado e uma atividade principal concluída.':row.major?'Aguarde a atividade terminar para completar o ciclo.':'Falta concluir Treinar ou Explorar.';
  const last=state.history.find(x=>!['debug','simulation'].includes(x.action));
  byId('cycle-last-action').textContent=last?`${engine.labels[last.action]}${last.phase==='started'?' · início':''}${last.detail?' · '+(C.attributes[last.detail]||last.detail):''}`:'Nenhuma ação registrada.';
  byId('cycle-recent-result').textContent=recentResult();byId('cycle-training-status').textContent=trainingText();
 }
 function summary(){
  heading('ROTINA DO PARCEIRO','Digi-Cycle');const d=state.downtime,row=d.ledger[d.currentCycleDate];
  const memory=el('section',undefined,'cycle-memory');memory.append(el('small','MEMÓRIA DE CONVIVÊNCIA','eyebrow'),field('cycle-progress-number','strong'),el('span','Digi-Cycles para o próximo ganho','cycle-subtitle'));
  const rail=field('cycle-progress-rail','div','cycle-progress');rail.setAttribute('role','progressbar');rail.setAttribute('aria-label','Digi-Cycles para o próximo XP');rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax',String(C.cyclesPerXP));rail.append(el('i'));memory.append(rail,field('cycle-next-gain'),field('cycle-total-label','small'));panel.append(memory);
  line(`${d.currentCycleDate} · ${d.debugDayOffset?'DIA SIMULADO · ':''}uma escolha principal por dia.`);
  const steps=el('section',undefined,'cycle-steps');steps.append(el('small','CICLO DE HOJE','eyebrow'),field('cycle-care-check'),field('cycle-major-check'),field('cycle-status','p','cycle-hint'));panel.append(steps);
  const log=el('section',undefined,'cycle-log');log.append(el('small','ÚLTIMA AÇÃO','eyebrow'),field('cycle-last-action'),el('small','RESULTADO RECENTE','eyebrow'),field('cycle-recent-result'));panel.append(log);
  const train=el('section',undefined,'reward-tile');train.append(el('small','TREINO & PREPARAÇÃO','eyebrow'),field('cycle-training-status'));panel.append(train);
  line(`${C.cyclesPerXP} Digi-Cycles = 1 XP de convivência. Repetir cuidados no mesmo dia não acelera esse ganho. Recompensas são locais e pendentes, sem envio à ficha.`);
  open('cycle');refreshCycleFields();
 }
 function openTraining(){
  refreshBeforePanel();heading('ATIVIDADE PRINCIPAL','O que vamos treinar?');
  line(`Duração: ${formatTime(ACTIVITY_CONFIG.durations[P.mode].train)} · ${ACTIVITY_CONFIG.train.effects.energy} Energia · ${ACTIVITY_CONFIG.train.effects.satiety} Saciedade ao concluir.`);
  line(`Escolha um atributo. Após ${C.trainingGoal} Digi-Cycles completos no mesmo treino, receba +1d6 em UM teste desse atributo. Um cuidado no dia também é necessário.`);
  const grid=el('div',undefined,'downtime-grid');
  for(const [attribute,name]of Object.entries(C.attributes)){const progress=state.downtime.training[attribute],choice=button(`${name} · ${progress}/${C.trainingGoal}`,()=>{closePanel();interact('train',{attribute});},Boolean(engine.availability(state,'train')));choice.append(el('small',`Faltam ${C.trainingGoal-progress} ciclos`),el('small',`Recompensa: +1d6 em ${name}`));grid.append(choice);}
  if(state.downtime.prepared)line(trainingText());
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
  panel.append(button('INICIAR EXPLORAÇÃO',()=>{closePanel();interact('explore',{zone:zone.id});},Boolean(state.activity||state.downtime.majorActivityUsed)));
  open('explore');
 }
 function inventory(tab='food'){
  const d=state.downtime,i=d.inventory;
  heading('MOCHILA DO PARCEIRO','Inventário');const wallet=el('section',undefined,'inventory-wallet');wallet.append(el('strong',`${d.credits} CR`),el('span','Créditos digitais · saldo local'));panel.append(wallet);
  const tabs=el('div',undefined,'inventory-tabs');for(const [key,label]of [['food','Comida'],['items','Itens'],['cards','Cards'],['special','Especiais']]){const b=button(label,()=>inventory(key));b.setAttribute('aria-pressed',String(tab===key));tabs.append(b);}panel.append(tabs);
  if(tab==='food'){
   line('Compre aqui e ofereça em ALIMENTAR. Cada porção é um consumível; DIGIMEAT é grátis e infinito.');
   for(const f of FOOD_CONFIG){
    const row=el('section',undefined,'inventory-row'),txt=el('div'),image=el('img');image.src=f.image;image.alt='';image.className='food-asset';row.append(image);txt.append(el('strong',f.name),el('small',`Quantidade: ${f.price?i.food[f.id]||0:'∞'} · ${f.price?f.price+' CR por unidade':'grátis'}`,'item-quantity'),el('small',`+${f.satiety} Saciedade${f.energy?` · +${f.energy} Energia`:''}${f.mood?` · +${f.mood} Humor`:''}`),el('small','Consumível · oferecer ao parceiro','item-kind'));row.append(txt);
    if(f.price)row.append(button('Comprar',()=>{const r=commit(D.buy(state,f.id));inventory('food');byId('downtime-title').focus?.();if(!r.ok)line(r.feedback);},d.credits<f.price));panel.append(row);
   }
  }else if(tab==='items'){
   line('Consumíveis para as necessidades do pet. Nenhum item altera PV, Energia ou outros valores da ficha do RPG.');
   for(const item of C.careItems){const row=el('section',undefined,'inventory-row care-item-row'),txt=el('div'),tools=el('div',undefined,'item-tools');
    txt.append(el('strong',item.name),el('small',`Quantidade: ${i.care[item.id]||0} · ${item.price} CR`,'item-quantity'),el('small',item.description),el('small','Consumível · gasta 1 unidade ao usar','item-kind'));
    tools.append(button('Comprar',()=>{commit(D.buyCare(state,item.id));inventory('items');},d.credits<item.price),button('Usar',()=>{commit(D.useCare(state,item.id));inventory('items');},Boolean(state.activity)||!(i.care[item.id]>0)));row.append(txt,tools);panel.append(row);
   }
   if(state.activity)line('Usar fica disponível quando a atividade terminar.');
  }else if(tab==='cards'){
   line(`CARDS · ${i.cards.length} encontrados. +1d6 em um teste indicado; um uso futuro. Os efeitos ainda não são aplicados ao RPG.`);
   if(!i.cards.length)line('Sua primeira descoberta está no próximo sinal.');
   const collection=el('div',undefined,'collection-grid'),groups=new Map();for(const card of i.cards){if(!groups.has(card.id))groups.set(card.id,{card,quantity:0});groups.get(card.id).quantity++;}
   for(const {card,quantity}of groups.values()){const tile=el('section',undefined,'collection-item'),image=el('img');image.src=card.image;image.alt='';tile.append(image,el('small',`${card.rarity} · Quantidade: ${quantity}`),el('strong',card.name),el('p',`+1d6 em um teste de ${card.effect.test}`),el('small','Consumível futuro · 1 teste por card'),button('Ver Card',()=>revealCard(card)));collection.append(tile);}panel.append(collection);
  }else{
   const fragments=el('section',undefined,'reward-tile');fragments.append(el('small','FRAGMENTOS DE CARD','eyebrow'),el('h3',`${i.fragments} / 3`),el('p','Material consumível de restauração. Reúna 3 para obter um Card Comum.'),button('RESTAURAR CARD',()=>{const r=commit(D.restoreCard(state));if(r.ok)revealCard(r.card);},i.fragments<3));panel.append(fragments);
   const data=el('section',undefined,'reward-tile');data.append(el('small','RECURSO DE DADOS','eyebrow'),el('h3',`Quantidade: ${i.data['data-resource']||0}`),el('p','Material especial guardado. Não consumível nesta etapa; uso futuro a definir.'));panel.append(data);
   if(d.prepared){const tile=el('section',undefined,'reward-tile');tile.append(el('small','BENEFÍCIO PRONTO','eyebrow'),el('h3',`PREPARADO // ${d.prepared.label}`),el('p','Quantidade: 1 · +1d6 em um teste apropriado. Consumível futuro; não acumula.'));panel.append(tile);}
   line(`${d.pendingBondXP} XP de convivência pendente · recompensa não consumível, aguardando integração futura.`);
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
   panel.append(button('Guardar e continuar',closePanel));
  },1550));
 }
 // Native close events are queued. A stale event from the activity chooser must
 // not cancel a newly opened result (especially with fast debug completion).
 panel.addEventListener('close',()=>{if(!panel.open)finishPresentation();});
 panel.addEventListener('cancel',finishPresentation);
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
  byId('cycle-detail').textContent=`${d.debugDayOffset?'TESTE · ':''}${row.care?'✓ Cuidado':'○ Cuidado'} · ${d.totalDigiCycles%C.cyclesPerXP}/${C.cyclesPerXP} ciclos → 1 XP${d.pendingBondXP?` · ${d.pendingBondXP} pendente`:''}`;
  byId('credits-summary').textContent=`${d.credits} CR`;
  if(currentView==='cycle'&&panel.open)refreshCycleFields();
  room.dataset.exploring=String(state.activity?.kind==='explore');
  const pending=d.results.find(r=>!r.seen);if(pending&&!openingPanel&&!document.querySelector('dialog[open]'))resultView(pending);
 };
 globalThis.DowntimeUI={openTraining,openExploration,inventory,summary};render();
})();
