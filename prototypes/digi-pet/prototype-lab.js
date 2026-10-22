/* TEST ONLY: opt-in localhost catalogue. Never grants real inventory/rewards,
 * never persists the mock RPG scene. Disabled outside test mode / localhost. */
(() => {
 'use strict';
 const C=globalThis.DigiDowntimeConfig,R=globalThis.RPGRewardRules,F=globalThis.DigiPetConfig.FOOD_CONFIG;
 if(globalThis.DigiPetConfig.PET_CONFIG.mode!=='test'||!['127.0.0.1','localhost','[::1]'].includes(location.hostname)||new URLSearchParams(location.search).get('lab')!=='16')return;
 let scene=R.createScene(),tab='food',modifier=0,note=scene.lastAction,selectedTest='Poder';
 const dialog=document.createElement('dialog');dialog.id='prototype-lab';dialog.setAttribute('aria-labelledby','lab-title');document.querySelector('.pet-experience').append(dialog);
 const e=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const btn=(text,fn,disabled=false)=>{const b=e('button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;};
 function art(row,src,alt){const img=e('img');img.src=src;img.alt=alt;row.prepend(img);}
 const pct=n=>`${new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n)}%`;
 const p=text=>dialog.append(e('p',text,'lab-copy'));
 function act(result){scene=result.scene;note=result.feedback;show();}
 function row(name,text,chance,action){const n=e('section',undefined,'lab-row'),body=e('div');body.append(e('h3',name),e('p',text),e('small',chance,'lab-chance'));n.append(body);if(action)n.append(action);dialog.append(n);return n;}
 function show(){
  dialog.replaceChildren();const head=e('header'),title=e('div');title.append(e('small','EXCLUSIVO DO PROTÓTIPO LOCAL'),e('h2','Catálogo de teste'));title.lastChild.id='lab-title';head.append(title,btn('×',()=>dialog.close()));head.lastChild.setAttribute('aria-label','Fechar catálogo');dialog.append(head);
  p('Todos os exemplos estão liberados aqui. A bancada usa uma ficha fictícia; nada é salvo, gasto ou enviado à ficha real.');
  const nav=e('nav',undefined,'lab-tabs');for(const [key,label]of [['food','Comida'],['items','Itens'],['cards','Cards'],['special','Especiais'],['chances','Chances']]){const b=btn(label,()=>{tab=key;show();});b.setAttribute('aria-pressed',String(tab===key));nav.append(b);}dialog.append(nav);
  const chooser=e('div',undefined,'lab-disposition');for(const [value,label]of [[0,'Neutra'],[5,'Boa +5'],[-5,'Baixa −5']]){const b=btn(label,()=>{modifier=value;show();});b.setAttribute('aria-pressed',String(modifier===value));chooser.append(b);}dialog.append(chooser);
  const chances=R.probabilities(modifier);
  if(tab==='food'){
   p('Chances abaixo são por exploração. A preferência alimentar continua valendo no Digi-Pet; esta simulação só demonstra o efeito básico.');
   for(const food of F){const n=row(food.name,`+${food.satiety} Saciedade${food.energy?` · +${food.energy} Energia`:''}${food.mood?` · +${food.mood} Humor`:''} · ${food.price?food.price+' CR':'grátis, infinito'}`,food.price?`Exploração direta: ${pct(chances.foodEach)}`:'Não ocupa a tabela de prêmios; sempre disponível.',btn('Simular alimento',()=>act(R.feed(scene,food.id))));const img=e('img');img.src=food.image;img.alt='';n.prepend(img);}
  }else if(tab==='items'){
   p('Consumíveis para usar em um Tópico/Luta. PV do Digimon e Energia do humano são separados das necessidades do pet; Laço é diferente de Companhia.');
   for(const item of C.careItems){const n=row(item.name,`${item.description} Consumível: 1 unidade por uso. ${item.price} CR. Quantidade de teste: ${scene.inventory.care[item.id]}`,`Direto: ${pct(chances.careEach)}${['care-pack','energy-patch'].includes(item.id)?` · Evento: ${pct(chances.eventEach)} para +2 unidades`:''}`,btn('Simular uso',()=>act(R.useItem(scene,item.id)),scene.inventory.care[item.id]===0));art(n,item.image,item.name);}
  }else if(tab==='cards'){
   p('Regras v1: ative no turno do humano; 1 card por turno, sem acumular cards. Todos expiram ao fim do turno de ativação. Comuns são consumidos; raros ficam na ficha e podem ser reutilizados pelo Scanner em outro turno.');
   for(const c of C.cards){const n=row(`${c.name} // ${c.rarity}`,`${R.cardText(c)} ${c.consumable?'Uso único, exemplar consumido na ativação.':'Permanente; requer Scanner. Bônus vale durante este turno.'} Cópias de teste: ${scene.inventory.cards[c.id]}`,`Direto: ${pct(c.rarity==='COMMON'?chances.commonEach:chances.rareEach)}${c.rarity==='COMMON'?` · Restauração: ${pct(chances.restorationEach)} por card restaurado`:''}`,btn('Ativar no mock',()=>act(R.activateCard(scene,c.id)),scene.cardUsedThisTurn||scene.inventory.cards[c.id]===0));art(n,c.image,'Carta azul · '+c.name);}
  }else if(tab==='special'){
   row('FRAGMENTOS DE CARD',`0 / ${C.fragmentGoal} para começar. ${C.fragmentGoal} metades restauram um Card Comum inteiro.`,`${pct(chances.categories.fragment)}: +1 fragmento · ${pct(chances.eventEach)}: evento com +2`);
   row('PREPARADO +1d6',`${C.trainingGoal} Digi-Cycles completos de treino no mesmo atributo. Bônus de +1d6 para somar em UMA rolagem apropriada; não acumula outro PREPARADO. Sem aplicação automática.`,`Não é drop aleatório; é recompensa de treino (${C.trainingGoal} ciclos).`);
   row('XP DE CONVIVÊNCIA',`${C.cyclesPerXP} Digi-Cycles completos = 1 XP pendente. Não é transferido à ficha nesta etapa.`,`Ganho garantido por progresso, sem rolagem.`);
  }else{
   p(`Probabilidade efetiva com modificador ${modifier>=0?'+':''}${modifier}, enumerando as 100 faces possíveis. As porcentagens individuais consideram os sorteios internos uniformes.`);
   const table=e('table'),thead=e('thead'),tr=e('tr');tr.append(e('th','Resultado'),e('th','Chance'));thead.append(tr);table.append(thead);const tbody=e('tbody');for(const entry of C.loot){const line=e('tr');line.append(e('td',entry.name),e('td',pct(chances.categories[entry.id])));tbody.append(line);}table.append(tbody);dialog.append(table);
   p(`Cards no total: ${pct(chances.categories.common+chances.categories.rare)}. Comum por card: ${pct(chances.commonEach)}; raro por card: ${pct(chances.rareEach)}. Alimento especial: ${pct(chances.foodEach)} por tipo.`);
   row('CRÉDITOS','Resultado comum: 8–20 CR. Evento Reserva Digital: +40 CR.',`${pct(chances.categories.credits)} para 8–20 CR; ${pct(chances.eventEach)} para +40 CR.`);
   row('EVENTOS RAROS','Reserva Digital (+40 CR), Dados Preservados (+2 fragmentos), Caravana (+2 Care Pack), Sinal Antigo (+2 Energy Patch).',`${pct(chances.categories.rareFind)} no total; ${pct(chances.eventEach)} por evento. Não concedem card automaticamente.`);
  }
  const sandbox=e('section',undefined,'lab-scene');sandbox.append(e('small',`FICHA FICTÍCIA · TURNO ${scene.turn}`));
  const stats=e('div',undefined,'lab-human-stats');for(const text of [`PV Digimon ${scene.digimon.hp}/${scene.digimon.maxHp}`,`Energia Humano ${scene.human.energy}/${scene.human.maxEnergy}`,`Laço ${scene.human.bond}/${scene.human.maxBond}`])stats.append(e('strong',text));sandbox.append(stats);
  const active=scene.activeCard?C.cards.find(c=>c.id===scene.activeCard.id):null,attribute=active?.effect.kind==='attribute'?active.effect:null;
  sandbox.append(e('p',`Poder ${scene.attributes.power+(attribute?.attribute==='power'?attribute.amount:0)} · Inteligência ${scene.attributes.intelligence+(attribute?.attribute==='intelligence'?attribute.amount:0)}${active?' · Card ativo: '+active.name:''}`));
  if(tab==='food')sandbox.append(e('p',`Pet fictício: Saciedade ${scene.pet.satiety} · Humor ${scene.pet.mood} · Energia ${scene.pet.energy} · Companhia ${scene.pet.companionship}`));
  if(tab==='cards'){
   const label=e('label','Scanner disponível '),checkbox=e('input');checkbox.type='checkbox';checkbox.checked=scene.scanner;checkbox.addEventListener('change',()=>{scene.scanner=checkbox.checked;show();});label.append(checkbox);sandbox.append(label);
   const tests=e('div',undefined,'lab-roll-controls'),select=e('select');select.setAttribute('aria-label','Teste da ficha fictícia');for(const name of ['Poder','Coração','Inteligência','Agilidade','Ataque','Esquiva']){const option=e('option',name);option.value=name;select.append(option);}select.value=selectedTest;select.addEventListener('change',()=>{selectedTest=select.value;});tests.append(select,btn('Registrar teste',()=>act(R.recordRoll(scene,select.value))),btn('Próximo turno',()=>act(R.nextTurn(scene))));sandbox.append(tests);
  }
  const status=e('p',note,'lab-status');status.setAttribute('role','status');sandbox.append(status,btn('Reiniciar bancada',()=>{scene=R.createScene();note=scene.lastAction;show();}));dialog.append(sandbox);
  if(!dialog.open)dialog.showModal();
 }
 const launch=btn('Catálogo de itens · TESTE',()=>show());launch.id='open-prototype-lab';launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-controls','prototype-lab');document.querySelector('.experience-footer').append(launch);
 if(!document.querySelector('dialog[open]'))show();
})();
