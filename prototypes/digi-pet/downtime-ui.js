/* Compact local views. Domain/reward resolution belongs to pet-downtime.js. */
(() => {
 'use strict';
 const D=globalThis.DigiDowntime,C=D.config,R=globalThis.RPGRewardRules;
 const panel=document.createElement('dialog');panel.id='downtime-dialog';panel.setAttribute('aria-labelledby','downtime-title');document.querySelector('.pet-experience').append(panel);
 let currentView=null,presentingId=null,openingPanel=false;
 function finishPresentation(){
  currentView=null;
  if(presentingId){const r=state.downtime.results.find(r=>r.id===presentingId);if(r)r.seen=true;presentingId=null;save();}
 }
 function closePanel(){finishPresentation();panel.close();}
 function refreshBeforePanel(){openingPanel=true;try{update();}finally{openingPanel=false;}}
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 function button(text,fn,disabled=false){const b=el('button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;}
 function line(text){panel.append(el('p',text,'downtime-copy'));}
 function heading(eyebrow,title,closable=true){
  panel.replaceChildren();const h=el('div',undefined,'downtime-heading'),label=el('div');label.append(el('small',eyebrow,'eyebrow'));const titleEl=el('h2',title);titleEl.id='downtime-title';label.append(titleEl);const close=button('×',closePanel);close.setAttribute('aria-label','Fechar painel');h.append(label);if(closable)h.append(close);panel.append(h);
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
  line(`Duração: ${formatTime(ACTIVITY_CONFIG.durations[P.mode].train)} · ${ACTIVITY_CONFIG.train.effects.energy} Energia · ${ACTIVITY_CONFIG.train.effects.satiety} Saciedade na saída.`);
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
   line('Consumíveis para usar em um Tópico/Luta: PV do Digimon, Energia do humano ou Pontos de Laço.');
   for(const item of C.careItems){const row=el('section',undefined,'inventory-row care-item-row'),txt=el('div'),tools=el('div',undefined,'item-tools');
    const image=el('img');image.src=item.image;image.alt=item.name;image.className='care-item-art';row.append(image);
    txt.append(el('strong',item.name),el('small',`Quantidade: ${i.care[item.id]||0} · ${item.price} CR`,'item-quantity'),el('small',item.description),el('small','Consumível do RPG · 1 unidade por uso futuro','item-kind'));
    tools.append(button('Comprar',()=>{commit(D.buyCare(state,item.id));inventory('items');},d.credits<item.price));row.append(txt,tools);panel.append(row);
   }
   line('PV do Digimon e Energia do humano são separados das necessidades do Digi-Pet. Experimente os efeitos na simulação do catálogo.');
  }else if(tab==='cards'){
   line(`CARDS · ${i.cards.length} encontrados. Comuns: uso único. Raros: permanentes, ativados pelo Scanner. Todo efeito dura somente o turno de ativação.`);
   if(!i.cards.length)line('Sua primeira descoberta está no próximo sinal.');
   const collection=el('div',undefined,'collection-grid'),groups=new Map();for(const card of i.cards){if(!groups.has(card.id))groups.set(card.id,{card,quantity:0});groups.get(card.id).quantity++;}
   for(const {card,quantity}of groups.values()){const c=R.definition(card),tile=el('section',undefined,'collection-item'),image=el('img');image.src=c.image;image.alt='';tile.append(image,el('small',`${c.rarity} · Quantidade: ${quantity}`),el('strong',c.name),el('p',R.cardText(c)),el('small',c.consumable?'Uso único · exemplar consumido':'Permanente na ficha · Scanner'),button('Ver Card',()=>revealCard(c)));collection.append(tile);}panel.append(collection);
  }else{
   const fragments=el('section',undefined,'reward-tile');fragments.append(fragmentArtwork(),el('small','FRAGMENTOS DE CARD','eyebrow'),el('h3',`${i.fragments} / ${C.fragmentGoal}`),el('p',`Reúna ${C.fragmentGoal} metades para restaurar um Card Comum inteiro.`),button('RESTAURAR CARD',()=>{const r=commit(D.restoreCard(state));if(r.ok)revealCard(r.card);},i.fragments<C.fragmentGoal));panel.append(fragments);
   if(d.prepared){const tile=el('section',undefined,'reward-tile');tile.append(el('small','BENEFÍCIO PRONTO','eyebrow'),el('h3',`PREPARADO // ${d.prepared.label}`),el('p','Quantidade: 1 · +1d6 em um teste apropriado. Consumível futuro; não acumula.'));panel.append(tile);}
   line(`${d.pendingBondXP} XP de convivência pendente · recompensa não consumível, aguardando integração futura.`);
  }
  open(`inventory:${tab}`);
 }
 function cardContent(card){
  const c=R.definition(card),wrap=el('div',undefined,`card-reveal ${c.rarity==='RARE'?'is-rare':''}`),image=el('img');image.src=c.image;image.alt=`Arte provisória de ${c.name}`;
  wrap.append(el('small',c.rarity==='RARE'?'SINAL EXCEPCIONAL // CARD RARO':'SIGNAL DETECTED // CARD DATA FOUND','eyebrow'),image,el('small',`CARD // ${c.rarity}`),el('h3',c.name),el('p',R.cardText(c)),el('p',c.description),el('p',c.consumable?'Uso único: o exemplar é consumido na ativação.':'Permanente na ficha: exige Scanner e não é consumido.'));panel.append(wrap);line('Regra inicial: 1 card por turno do humano, sem acumular cards. Expira ao fim desse turno. Uso em um Tópico/Luta; integração automática ainda desligada.');
 }
 function revealCard(card){heading('DADOS RESTAURADOS','Card encontrado',false);cardContent(card);panel.append(button('Ver inventário',()=>inventory('cards')));open('card');}
 function fragmentArtwork(){
  const art=el('div',undefined,'fragment-artwork'),image=el('img');image.src='assets/card-blue.svg';image.alt='Fragmento de card rasgado pela metade';art.append(image);return art;
 }
 function rewardContent(result){
  const r=result.reward,food=FOOD_CONFIG.find(f=>f.id===r.food),item=C.careItems.find(i=>i.id===r.item);
  const quantity=r.fragments??r.credits??Number(r.text.match(/\+(\d+)/)?.[1]||1);
  const tile=el('section',undefined,`loot-reveal loot-${result.kind}`);
  let label=r.text,detail='',tab='items';
  if(food){const image=el('img');image.src=food.image;image.alt=food.name;image.className='loot-food-art';tile.append(image);label=`+${quantity} ${food.name}`;detail=`+${food.satiety} Saciedade${food.energy?` · +${food.energy} Energia`:''}${food.mood?` · +${food.mood} Humor`:''} por porção`;tab='food';}
  else if(r.fragments){tile.append(fragmentArtwork());label=`+${r.fragments} ${r.fragments===1?'Fragmento de Card':'Fragmentos de Card'}`;detail=`${state.downtime.inventory.fragments} / ${C.fragmentGoal} fragmentos no inventário. Reúna ${C.fragmentGoal} para restaurar um card.`;tab='special';}
  else if(r.credits){tile.append(el('div','CR','loot-emblem loot-credits-art'));detail='Créditos para alimentos e cuidados na loja do inventário.';tab='food';}
  else if(item){const image=el('img');image.src=item.image;image.alt=item.name;image.className='loot-food-art';tile.append(image);detail=item.description;}
  else if(result.kind==='nothing'){tile.append(el('div','…','loot-emblem loot-empty-art'));detail='Agumon voltou bem. A atividade conta para o Digi-Cycle de hoje.';}
  else{tile.append(el('div','◇','loot-emblem loot-data-art'));detail='Registro anterior do protótipo.';tab='special';}
  tile.append(el('small',result.kind==='rareFind'?'UM ENCONTRO INESPERADO':'RESULTADO DA EXPLORAÇÃO','eyebrow'),el('h3',label),el('p',detail));panel.append(tile);
  if(result.kind!=='nothing')panel.append(el('p','Já adicionado ao seu inventário.','reward-saved'));
  return tab;
 }
 function resultView(result){
  // Loot is already resolved and persisted by the domain, including offline
  // completion. Present the prize directly; never roll or grant here.
  presentingId=result.id;heading('EXPLORAÇÃO CONCLUÍDA',result.kind==='fragment'&&result.reward.fragments?'FRAGMENTO DE CARD':result.title,result.kind==='nothing');
  const card=result.reward.card,tab=card?'cards':null;
  if(card)cardContent(card);
  const destination=card?tab:rewardContent(result);
  const actions=el('div',undefined,'reward-actions');
  if(result.kind!=='nothing'){
   actions.append(button('Ver inventário',()=>{finishPresentation();inventory(destination);}));
  }else actions.append(button('Voltar ao parceiro',closePanel));
  panel.append(actions);open('result');
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
