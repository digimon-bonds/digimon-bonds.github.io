(() => {
 'use strict';
 const D=window.GRIMOIRE_DATA,KEY='pype-grimorio-v1';
 const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const initial=()=>({version:1,level:2,profile:structuredClone(D.profile),prepared:['charm','missile','shield','sleep','laughter'],favorites:['missile','familiar'],notes:{observations:'Hipótese nº 1: a sorte talvez seja uma corrente de possibilidades.\n\nRegistrar a previsão antes do resultado. Lembrar dos corvos que não trouxeram azar.',free:'',treasures:'Estatueta de jade: um sapo com pequenas esferas douradas nos olhos.\n\nPoção de cura × 1 — recupera 2d4 + 2 PV.\nCajado / foco arcano. Armadura de couro e escudo na bagagem; a ficha não indica treinamento com eles.',strategy:'Não confundir a Sorte dos halflings (repetir um 1 natural em teste de d20) com o talento Sortudo (pontos iguais à proficiência).',progress:'Nível 2: especialização em Arcanismo já escolhida.\nFutura escola: confirmar Adivinhação com o mestre.',collage:''},spellNotes:{},customSpells:[],collages:[],usedSlots:{},luckUsed:0,recoveryUsed:false});
 const lastInitialFolio = 20;
 const maxAlbumSpreads = 20;
 const slotsPerSpread = 4;
 const imagePattern = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
 let state=validate(window.PYPE_PUBLIC_BOOK), savedLocally=false, storageOK=true;
 const usesServer = false;
 let bookRevision, pendingSnapshot, writing=false, saveTimer, imageTarget;
 let section=-1,selected='missile',filter='all',query='',notePage=0,turnTimer;
 let albumSpread=0, albumTurn;
 const sections=['Índice','De onde vim','Reservas da Trama','Magias',null,'Observações','Diário de viagem','Achados e pistas','Coleções & Lembranças','O que ficou por dizer'];
 const chapters = [0, 1, 3, 2, 6, 9, 8];
 const mod=n=>Math.floor((Number(n)-10)/2),signed=n=>(n>=0?'+':'')+n,pb=()=>2+Math.floor((state.level-1)/4),dc=()=>8+pb()+mod(state.profile.abilities.INT),atk=()=>signed(pb()+mod(state.profile.abilities.INT)),row=()=>D.progression[state.level-1],spells=()=>[...D.spells,...state.customSpells],prepared=()=>state.prepared.filter(id=>spells().some(s=>s.id===id&&s.level>0&&s.level<=row()[1].length));
 function validate(raw){
  if(!raw||raw.version!==1||!Number.isInteger(raw.level)||raw.level<1||raw.level>20)throw Error('Formato de cópia inválido.');
  const base=initial();
  if(!raw.profile||!raw.profile.abilities)throw Error('Perfil ausente.');
  for(const k of Object.keys(base.profile.abilities))if(!Number.isInteger(raw.profile.abilities[k])||raw.profile.abilities[k]<1||raw.profile.abilities[k]>30)throw Error('Atributo inválido.');
  for(const k of ['name','species','background','alignment','school','notes'])if(typeof raw.profile[k]!=='string')throw Error('Perfil inválido.');
  for(const k of ['hp','maxHp','ac'])if(!Number.isFinite(raw.profile[k])||raw.profile[k]<0)throw Error('Valor do perfil inválido.');
  for(const k of ['prepared','favorites'])if(!Array.isArray(raw[k])||raw[k].some(v=>typeof v!=='string'))throw Error('Lista inválida.');
  if(!Array.isArray(raw.customSpells)||raw.customSpells.length>1000)throw Error('Magias inválidas.');
  const ids=new Set(D.spells.map(s=>s.id));
  for(const s of raw.customSpells){if(!s||typeof s.id!=='string'||ids.has(s.id)||!Number.isInteger(s.level)||s.level<0||s.level>9)throw Error('Magia inválida.');for(const k of ['name','en','school','time','range','components','duration','effect','practical'])if(typeof s[k]!=='string')throw Error('Campos da magia inválidos.');ids.add(s.id);}
  if(!raw.notes||Array.isArray(raw.notes)||Object.values(raw.notes).some(v=>typeof v!=='string'))throw Error('Notas inválidas.');
  if(!raw.spellNotes||Object.values(raw.spellNotes).some(v=>typeof v!=='string'))throw Error('Notas de magias inválidas.');
  if (!Array.isArray(raw.collages) || raw.collages.length > maxAlbumSpreads * slotsPerSpread || raw.collages.some(
   c => c !== null && (!c || typeof c.caption !== 'string' || typeof c.src !== 'string' || !imagePattern.test(c.src))
  )) throw Error('Colagem inválida.');
  if (raw.albumSize != null && (!Number.isInteger(raw.albumSize) || raw.albumSize < 1 || raw.albumSize > maxAlbumSpreads)) {
   throw Error('Quantidade de folhas do álbum inválida.');
  }
  if (raw.portrait != null && (typeof raw.portrait !== 'string' || !imagePattern.test(raw.portrait))) {
   throw Error('Retrato inválido.');
  }
  if(!raw.usedSlots||Object.values(raw.usedSlots).some(v=>!Number.isInteger(v)||v<0||v>4))throw Error('Espaços inválidos.');
  return {...base,...raw,profile:{...base.profile,...raw.profile},notes:{...base.notes,...raw.notes},prepared:[...new Set(raw.prepared)],favorites:[...new Set(raw.favorites)],luckUsed:Math.max(0,Math.min(6,Number(raw.luckUsed)||0))};
 }
 function status(message, retry=false) {
  $('#save-status').textContent = message;
  $('#retry-save').hidden = !retry;
 }

 async function loadBook() {
  try {
   const saved = localStorage.getItem(KEY);
   if (saved) {
    state = validate(JSON.parse(saved));
    const quote = state.notes.indexQuote?.trim().replace(/^[“"]|[”"]$/gu, '').replace(/\s+/gu, ' ');
    if (/^Se a possibilidade é diferente de zero, já é o bastante para (?:tentar|continuar andando)\.?$/u.test(quote || '')) {
     state.notes.indexQuote = window.PYPE_PUBLIC_BOOK.notes.indexQuote;
    }
    savedLocally = true;
   }
  } catch {
   storageOK = false;
  }

  if (usesServer) {
   try {
    const response = await fetch('/api/livro', { cache: 'no-store', signal: AbortSignal.timeout(3500) });
    if (!response.ok) throw Error('Servidor indisponível.');
    const remote = await response.json();
    if (remote) state = validate(remote);
    bookRevision = response.headers.get('ETag');
    if (bookRevision) pendingSnapshot = remote ? null : (savedLocally ? JSON.stringify(state) : null);
   } catch {
    status('Arquivo do livro indisponível', true);
   }
  }

  if (!state.catalogRevision) {
   state.prepared = state.prepared.filter(id => id !== 'ice' && id !== 'charm');
   if (state.prepared.length >= 5) state.prepared = state.prepared.slice(0, 4);
   state.prepared.push('charm');
   state.favorites = state.favorites.map(id => id === 'ice' ? 'silent' : id);
   state.catalogRevision = 2;
   if (pendingSnapshot) pendingSnapshot = JSON.stringify(state);
  }
  if (!usesServer) status(storageOK ? 'Salvo no navegador' : 'Use Exportar para salvar');
  if (pendingSnapshot) flushBook();
  else if (bookRevision) status(bookRevision === '"empty"' ? 'Pronto para salvar no livro' : 'Salvo no livro');
 }

 function save() {
  const snapshot = JSON.stringify(state);
  try {
   localStorage.setItem(KEY, snapshot);
   storageOK = true;
  } catch {
   storageOK = false;
  }
  if (!usesServer) {
   status(storageOK ? 'Salvo no navegador' : 'Use Exportar para salvar');
   return;
  }
  pendingSnapshot = snapshot;
  status('Salvando no livro…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushBook, 160);
 }

 async function flushBook() {
  if (writing || !pendingSnapshot) return;
  if (!bookRevision) {
   status('Arquivo do livro indisponível. Use Exportar.', true);
   return;
  }
  writing = true;
  try {
   while (pendingSnapshot) {
    const snapshot = pendingSnapshot;
    const response = await fetch('/api/livro', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json', 'If-Match': bookRevision },
     body: snapshot,
     keepalive: new Blob([snapshot]).size < 60 * 1024,
    });
    if (response.status === 412) {
     status('Outra aba salvou primeiro. Exporte esta versão antes de recarregar.');
     return;
    }
    if (!response.ok) throw Error('Falha ao salvar.');
    bookRevision = response.headers.get('ETag');
    if (pendingSnapshot === snapshot) pendingSnapshot = null;
   }
   status('Salvo no livro');
  } catch {
   status('Falha ao salvar no livro. Tente novamente ou exporte.', true);
  } finally {
   writing = false;
  }
 }
 $('#retry-save').onclick = () => {
  if (bookRevision) flushBook();
  else if (!pendingSnapshot) location.reload();
  else toast('Exporte esta versão antes de recarregar a página.');
 };
 document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && bookRevision) flushBook();
 });
 function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(turnTimer);turnTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4300);}
 function page(title, number, content) {
  const heading = section === 8 ? '' :
   `<div class="page-top"><span>PYPE ERVAFINA</span><span>${esc(title)}</span></div>`;
  return `<div class="page-content">${heading}${content}</div>
  <span class="page-number">${String(number).padStart(2, '0')}</span>`;
 }
 function note(key, placeholder='', cls='', fallback='') {
  return `<textarea data-note="${esc(key)}" class="${cls}" aria-label="${esc(placeholder || 'Anotações')}" placeholder="${esc(placeholder)}">${esc(state.notes[key] ?? fallback)}</textarea>`;
 }

 const journalSide = chapter => ({ 6: 'free', 9: 'verso' })[chapter];
 const maxJournalSpreads = 500;

 function journalPageCount(side) {
  let count = 0;
  for (const key of Object.keys(state.notes)) {
   if (key === 'free' && side === 'free') count = Math.max(count, 1);
   if (!key.startsWith(side)) continue;
   const suffix = key.slice(side.length);
   if (/^\d+$/.test(suffix)) count = Math.max(count, Math.min(maxJournalSpreads * 2, Number(suffix) + 1));
  }
  return count;
 }

 function journalSpreads(side) {
  return Math.max(1, Math.ceil(journalPageCount(side) / 2));
 }

 function spreads() {
  return [{ section: -1, part: 0 }, ...chapters.flatMap(chapter =>
   Array.from({ length: journalSide(chapter) ? journalSpreads(journalSide(chapter)) : chapter === 8 ? albumSpreads() : 1 },
    (_, part) => ({ section: chapter, part })))];
 }

 function currentSpread() {
  const part = journalSide(section) ? notePage : section === 8 ? albumSpread : 0;
  return spreads().findIndex(place => place.section === section && place.part === part);
 }

 function titlePages() {
  return ['', `<div class="opening-front">
    <span class="chapter">${esc(state.profile.name)}</span>
    <span class="opening-ornament" aria-hidden="true">✧</span>
    <h1>Observações sobre<br>Incidências Favoráveis,<br>Coincidências e Outras Improbabilidades.</h1>
    <span class="opening-author">Caderno de campo</span>
  </div>`];
 }

 function render() {
  const first = currentSpread() * 2 - 1;
  const book = $('#book');
  book.classList.toggle('title-spread', section === -1);
  book.classList.toggle('album', section === 8);
  const pages = {
   '-1': titlePages, 0: indexPages, 1: profilePages, 2: reservesPages,
   3: spellPages, 6: notesPages, 8: collagePages, 9: notesPages,
  }[section]();
  const title = sections[section];
  for (const [index, id] of ['#left-page', '#right-page'].entries()) {
   const leaf = $(id);
   leaf.classList.toggle('title-leaf', section === -1 && index === 1);
   leaf.classList.toggle('inside-front', section === -1 && index === 0);
   leaf.classList.toggle('album-leaf', section === 8);
   leaf.classList.toggle('journal-leaf', Boolean(journalSide(section)));
   leaf.innerHTML = section === -1 ? pages[index] : page(title, first + index, pages[index]);
   leaf.querySelector('.page-content')?.scrollTo(0, 0);
  }
  if (journalSide(section) && fitSavedJournalText()) {
   save();
   render();
   return;
  }
  $('#folio').textContent = section === -1 ? 'Folha de rosto' : `${title} · ${first}–${first + 1}`;
  $('#prev').disabled = section === -1;
  $('#next').disabled = currentSpread() === spreads().length - 1;
 }

 function go(chapter, part=0) {
  const next = spreads().findIndex(place => place.section === chapter && place.part === part);
  const previous = currentSpread();
  if (next < 0 || next === previous) return;
  turnLeaf(next > previous ? 1 : -1, () => {
   if (section !== chapter) {
    filter = 'all';
    query = '';
   }
   section = chapter;
   if (journalSide(chapter)) notePage = part;
   if (chapter === 8) albumSpread = part;
  });
 }

 function editableText(tag, key, label, fallback, style='') {
  return `<${tag} class="${style}" contenteditable="plaintext-only" role="textbox" aria-label="${esc(label)}" data-index="${key}">${esc(state.notes[key] ?? fallback)}</${tag}>`;
 }

 function indexPages() {
  const links = chapters.slice(1).map(chapter => {
   const number = spreads().findIndex(place => place.section === chapter) * 2 - 1;
   return `<button class="index-row" data-nav="${chapter}"><span>${sections[chapter]}</span><span>${number} ↗</span></button>`;
  }).join('');
  return [
   `${editableText('h2','indexTitle','Título do índice','Uma cartografia do improvável.')}
   ${editableText('p','indexSubtitle','Nota do índice','Para encontrar o fio da meada, ou perdê-lo com método.','subtitle')}
   <nav class="index-list" aria-label="Índice do grimório">${links}</nav>`,
   `<span class="chapter">NOTA DO AUTOR</span>${inkArt('cosmos','intro-art')}
   ${editableText('p','indexQuote','Epígrafe',window.PYPE_PUBLIC_BOOK.notes.indexQuote,'quote')}
   ${editableText('p','indexThought','Pensamento do autor','Há quem colecione moedas. Eu coleciono as vezes em que elas caem do lado errado.','handwritten')}
   ${editableText('p','indexSignature','Assinatura','Pype Ervafina','subtitle')}`,
  ];
 }

 function profilePages() {
  return [
   `<h2>De onde vim</h2>
   ${editableText('p','origins','Minhas origens','Nasci numa carroça de mercadores. Cresci entre ervas, cachimbos e dados, fazendo perguntas que costumavam render mais suspiros do que respostas.','handwritten')}
   <h3>Waterdeep</h3>
   ${editableText('p','waterdeep','Minhas memórias de Waterdeep','Fui estudar magia e cogumelos na academia. Foi lá que conheci Celebrindal. De todas as coincidências que anotei, essa continua sendo a minha preferida.','handwritten')}
   <h3>Doze anos na Agrestia</h3>
   ${editableText('p','feywild','Minhas memórias da Agrestia','Na Agrestia, o tempo tinha seus próprios modos. Passei doze anos tentando entendê-los. Ainda me pego imaginando o caminho de volta.','handwritten')}`,
   `<h2>Meu retrato</h2>${portraitCard()}<h3>À margem do retrato</h3>
   <textarea data-profile="notes" aria-label="Anotações sobre mim">${esc(state.profile.notes)}</textarea>`,
  ];
 }

 function reservesPages() {
  const slots = row()[1];
  const circles = slots.map((count, i) => {
   const used = Math.min(count, state.usedSlots[i+1] || 0);
   const marks = Array.from({ length: count }, (_, j) =>
    `<button class="slot ${j >= used ? 'available' : ''}" data-slot="${i+1}" data-used="${j+1}"
     aria-label="${i+1}º círculo, espaço ${j+1} ${j >= used ? 'disponível' : 'gasto'}"></button>`).join('');
   return `<div class="slot-group"><span>${i+1}º círculo</span><div class="slots">${marks}</div><small>${count-used}/${count}</small></div>`;
  }).join('');
  return [
   `<h2>O que a Trama ainda me empresta</h2>
   <p class="handwritten">Faço um risco a cada feitiço. Depois de uma noite inteira de repouso, começo a conta de novo.</p>
   ${circles}<div class="list-bottom"><button class="small-btn ink-button" data-action="rest">Descansei por uma noite</button></div>
   ${arcaneReminders()}
   <div class="note-box"><p>Se eu parar um pouco para estudar o grimório, posso recuperar até ${Math.ceil(state.level/2)} círculos somados, nenhum de sexto ou maior. Faço isso uma vez antes da próxima noite de descanso.</p>
   <button class="small-btn" data-action="recovery">${state.recoveryUsed ? '✓ Já recuperei · desfazer' : 'Anotar Recuperação Arcana'}</button></div>`,
   `<h2>O que ando estudando</h2>
   ${note('progress','Descobertas e estudos arcanos','notebook')}
   <details><summary>Atualizar meus círculos</summary>
   <label>Meu grau de estudo<select id="level-select">${Array.from({ length: 20 }, (_, i) =>
    `<option value="${i+1}" ${i+1 === state.level ? 'selected' : ''}>${i+1}</option>`).join('')}</select></label></details>`,
  ];
 }
 function arcaneReminders() {
  const reminders = [
   ['Meu empurrãozinho na sorte', 'Posso gastar um ponto para rolar meu d20 com vantagem, inclusive ao atacar. Quando alguém rolar um ataque contra mim, posso gastar um para impor desvantagem. Recupero meus pontos depois de uma noite inteira de descanso.'],
   ['Quando sai um 1', 'Se o d20 mostrar um 1 num ataque, teste ou salvaguarda, minha sorte de halfling me deixa rolar de novo. Fico com o novo resultado sem gastar um ponto de Sorte.'],
   ['Se me sobrar tempo', 'Com meu grimório à mão, posso conjurar as magias marcadas como ritual. Levo dez minutos a mais e poupo um espaço. Posso fazer isso mesmo se não tiver preparado o feitiço.'],
  ];
  return `<div class="arcane-reminders">${reminders.map(([title, text]) =>
   `<aside class="arcane-card"><h3>${title}</h3><p class="handwritten">${text}</p></aside>`).join('')}</div>`;
 }

 const spellFilters = [
  ['0', 'Truques'], ['1', '1º Círculo'], ['2', '2º Círculo'],
  ['prepared', 'Preparadas'], ['all', 'Todas'],
 ];

 function visibleSpells() {
  const preparedIds = prepared();
  const search = query.trim().toLocaleLowerCase();
  return spells().filter(spell => {
   if (filter === 'prepared' && !preparedIds.includes(spell.id)) return false;
   if (filter !== 'all' && filter !== 'prepared' && spell.level !== Number(filter)) return false;
   return `${spell.name} ${spell.en} ${spell.school}`.toLocaleLowerCase().includes(search);
  });
 }

 function spellRows(list=visibleSpells()) {
  if (!list.length) return '<p class="subtitle">Nenhuma magia nesta seleção.</p>';
  const preparedIds = prepared();
  return list.map(spell => `<button class="spell-row ${spell.id === selected ? 'selected' : ''}" data-spell="${esc(spell.id)}">
   <span class="spell-sigil" aria-hidden="true">${spell.ritual ? '☾' : spell.level === 0 ? '✧' : '✦'}</span>
   <span><strong>${esc(spell.name)} <em>(${esc(spell.en)})</em></strong>
   <small>${esc(spell.school)} · ${spell.level === 0 ? 'Truque' : spell.level + 'º círculo'}${spell.ritual ? ' · Ritual' : ''}</small></span>
   ${preparedIds.includes(spell.id) ? '<span class="row-end prepared-star" aria-label="Preparada">★</span>' : ''}
  </button>`).join('');
 }

 function spellPages() {
  const list = visibleSpells();
  if (!list.some(spell => spell.id === selected)) selected = list[0]?.id || '';
  const spell = list.find(entry => entry.id === selected);
  return [
   `<h2>Meus feitiços</h2>
   <p class="handwritten">Marco com uma estrela os feitiços que preparei para o dia.</p>
   <input class="search" id="spell-search" aria-label="Buscar magia" placeholder="Buscar por nome ou escola…" value="${esc(query)}">
   <div class="filters">${spellFilters.map(([value, label]) => `<button data-filter="${value}" aria-pressed="${filter === value}" class="${filter === value ? 'active' : ''}">${label}</button>`).join('')}</div>
   <div id="spell-list" class="spell-list">${spellRows(list)}</div>
   <div class="list-bottom"><button class="small-btn" data-action="add-spell">+ Transcrever magia</button></div>`,
   spell ? spellDetail(spell) : '<h2>Uma página à espera de tinta</h2>',
  ];
 }

 function preparationStar(spell) {
  const marked = prepared().includes(spell.id);
  const label = spell.level === 0 ? 'Truque sempre disponível' :
   spell.level > row()[1].length ? 'Círculo indisponível' :
   marked ? 'Retirar da preparação do dia' : 'Preparar para o dia';
  return `<button class="favorite prepared-star" data-prepare="${esc(spell.id)}"
   title="${label}" aria-label="${label}" aria-pressed="${marked}"
   ${spell.level === 0 || spell.level > row()[1].length ? 'disabled' : ''}>${marked ? '★' : '☆'}</button>`;
 }
 function spellDetail(s){return `<span class="chapter">${s.level===0?'TRUQUE':s.level+'º CÍRCULO'} · ${esc(s.school).toUpperCase()}</span><div class="spell-head"><h2>${esc(s.name)}</h2>${preparationStar(s)}</div><p class="subtitle" style="margin-top:0"><em>(${esc(s.en)})</em></p>${inkArt(s.art||'cosmos','spell-art')}<div class="spell-meta">${[['Conjuração',s.time],['Alcance',s.range],['Componentes',s.components],['Duração',s.duration]].map(([k,v])=>`<div><b>${k}</b>${esc(v)}</div>`).join('')}</div><div class="tags"><span class="tag">${s.concentration?'Concentração':'Sem concentração'}</span>${s.ritual?'<span class="tag">Ritual</span>':''}${s.level === 0 ? '<span class="tag">À vontade</span>' : ''}</div><p class="spell-effect">${esc(s.effect)}</p><div class="practical"><b>Na prática</b><br>${esc(s.practical)}</div><label>Notas à margem</label><textarea class="spell-notes" data-spell-note="${esc(s.id)}" aria-label="Notas pessoais sobre ${esc(s.name)}" placeholder="Uma aplicação, uma descoberta, uma ideia…">${esc(state.spellNotes[s.id]??s.note??'')}</textarea>${state.customSpells.some(c=>c.id===s.id)?`<button class="small-btn" data-edit-spell="${esc(s.id)}">Editar registro</button>`:''}`;}
 function journalKey(side, index) {
  return side === 'free' && index === 0 ? 'free' : side + index;
 }

 function sheetControls(kind, canAdd, canTear) {
  if (!canAdd && !canTear) return '';
  return `<div class="sheet-controls">
   ${canAdd ? `<button class="small-btn" data-action="${kind}-add">+ Acrescentar uma folha</button>` : ''}
   ${canTear ? `<button class="small-btn tear-button" data-action="${kind}-tear">Rasgar folha</button>` : ''}
  </div>`;
 }

 function notesPages() {
  const side = journalSide(section);
  const label = sections[section];
  const count = journalSpreads(side);
  const placeholder = side === 'free' ? 'Lugar, data e o que aconteceu…' : 'Conversas, pensamentos e coisas que não quero esquecer…';
  return [0, 1].map(leaf => {
   const index = notePage * 2 + leaf;
   const key = journalKey(side, index);
   return `${leaf ? '<div class="journal-title-spacer" aria-hidden="true"></div>' : `<h2 class="journal-title">${label}</h2>`}
   <textarea class="journal-text" data-journal="${index}" data-note="${key}"
    aria-label="${label}, página ${index + 1}" placeholder="${placeholder}">${esc(state.notes[key] || '')}</textarea>
   <div class="journal-tools">${leaf ? sheetControls('journal', notePage === count - 1 && count < maxJournalSpreads, notePage > 0) : ''}</div>`;
  });
 }

 function journalOverflows(field) {
  return field.clientHeight > 0 && field.scrollHeight > field.clientHeight + 1;
 }

 function fitSavedJournalText() {
  const side = journalSide(section);
  for (const field of $('#book').querySelectorAll('#left-page [data-journal], #right-page [data-journal]')) {
   if (!journalOverflows(field)) continue;
   const text = field.value;
   const index = Number(field.dataset.journal);
   const count = journalPageCount(side);
   if (count >= maxJournalSpreads * 2) continue;

   let low = 0;
   let high = text.length;
   while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    field.value = text.slice(0, mid);
    if (journalOverflows(field)) high = mid;
    else low = mid;
   }
   if (!low) {
    field.value = text;
    continue;
   }
   const whitespace = text.slice(0, low).search(/\s+\S*$/);
   let cut = whitespace > low * .85 ? whitespace : low;
   if (/[\uD800-\uDBFF]/.test(text[cut - 1])) cut--;
   if (!cut) {
    field.value = text;
    continue;
   }
   for (let pageIndex = count; pageIndex > index + 1; pageIndex--) {
    const value = state.notes[journalKey(side, pageIndex - 1)];
    const key = journalKey(side, pageIndex);
    if (value !== undefined) state.notes[key] = value;
    else delete state.notes[key];
   }
   state.notes[field.dataset.note] = text.slice(0, cut);
   state.notes[journalKey(side, index + 1)] = text.slice(cut);
   return true;
  }
  return false;
 }

 function addJournalSheet() {
  const side = journalSide(section);
  const next = journalSpreads(side);
  if (next >= maxJournalSpreads) return;
  turnLeaf(1, () => {
   state.notes[journalKey(side, next * 2)] = '';
   notePage = next;
   save();
  });
  $('#left-page .journal-text')?.focus({ preventScroll: true });
 }

 function tearJournalSheet() {
  if (notePage === 0) return;
  const side = journalSide(section);
  const count = journalPageCount(side);
  const first = notePage * 2;
  if ([first, first + 1].some(index => state.notes[journalKey(side, index)]?.trim()) &&
      !confirm('Rasgar esta folha e apagar as anotações dos dois lados?')) return;
  turnLeaf(-1, () => {
   for (let index = first; index < count; index++) {
    const key = journalKey(side, index);
    const value = state.notes[journalKey(side, index + 2)];
    if (value !== undefined) state.notes[key] = value;
    else delete state.notes[key];
   }
   notePage--;
   save();
  });
  $('#next').focus({ preventScroll: true });
 }

 function portraitCard() {
  const image = state.portrait
   ? `<img src="${state.portrait}" alt="Retrato de Pype Ervafina">`
   : '<span class="photo-placeholder">Retrato de Pype</span>';
  return `<figure class="photo-mount portrait">
    <div class="photo-window">${image}</div>
    <figcaption>
     <button class="small-btn" data-photo="portrait">${state.portrait ? 'Trocar retrato' : 'Colar retrato'}</button>
     ${state.portrait ? '<button class="small-btn" data-remove-image="portrait">Retirar</button>' : ''}
    </figcaption>
   </figure>`;
 }

 function albumSpreads() {
  const filled = Math.ceil((state.collages.findLastIndex(Boolean) + 1) / slotsPerSpread);
  // For books saved before the album had a size, end at folio 20 unless a photo needs more pages.
  const preceding = chapters.filter(chapter => chapter !== 8).reduce((sum, chapter) => sum + (journalSide(chapter) ? journalSpreads(journalSide(chapter)) : 1), 0);
  state.albumSize ??= Math.max(1, lastInitialFolio / 2 - preceding, filled);
  return Math.max(state.albumSize, filled);
 }

 function albumSlot(index) {
  const picture = state.collages[index];
  if (!picture) return `<button class="photo-mount photo-empty" data-photo="${index}"
    aria-label="Inserir lembrança ${index + 1}">
    <span aria-hidden="true">✧</span>
    <span>Espaço para lembranças de futuras aventuras</span>
    <small>+ Inserir imagem</small>
   </button>`;

  return `<figure class="photo-mount album-photo">
    <div class="photo-window"><img src="${picture.src}" alt="${esc(picture.caption || 'Lembrança de aventura')}"></div>
    <textarea data-caption="${index}" aria-label="Legenda da lembrança ${index + 1}" placeholder="O que ficou dessa lembrança?" rows="3">${esc(picture.caption)}</textarea>
    <figcaption>
      <button class="small-btn" data-photo="${index}">Trocar</button>
      <button class="small-btn" data-remove-image="${index}">Retirar</button>
    </figcaption>
   </figure>`;
 }

 function collagePages() {
  const first = albumSpread * slotsPerSpread;
  return [0, 1].map(side => {
   const slot = first + side * 2;
   return `${!side ? '<h2 class="album-title">Coleções &amp; Lembranças</h2>' : '<span class="album-title album-title-spacer" aria-hidden="true"></span>'}
   <div class="album-photos">${albumSlot(slot)}${albumSlot(slot + 1)}</div>
   ${side ? sheetControls('album', albumSpread === albumSpreads()-1 && albumSpreads() < maxAlbumSpreads, albumSpreads() > 1) : ''}
   ${!side && albumSpread === 0 ? `<details class="album-notes"><summary>Notas da coleção</summary>${note('collage','Notas da coleção')}</details>` : ''}`;
  });
 }

 function addAlbumSheet() {
  const count = albumSpreads();
  if (count >= maxAlbumSpreads) return;
  turnLeaf(1, () => {
   state.albumSize = count + 1;
   albumSpread = count;
   save();
  });
  $('[data-action="album-tear"]')?.focus({ preventScroll: true });
 }

 function tearAlbumSheet() {
  const count = albumSpreads();
  if (count < 2) return;
  const first = albumSpread * slotsPerSpread;
  if (state.collages.slice(first, first + slotsPerSpread).some(Boolean) &&
      !confirm('Rasgar esta folha e apagar as fotos e legendas dos dois lados?')) return;
  turnLeaf(albumSpread > 0 ? -1 : 1, () => {
   state.collages.splice(first, slotsPerSpread);
   state.albumSize = count - 1;
   albumSpread = Math.max(0, albumSpread - 1);
   save();
  });
  $('#prev').focus({ preventScroll: true });
 }

 function copyLeaf(original) {
  const copy = original.cloneNode(true);
  copy.removeAttribute('id');
  copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  return copy;
 }

 function turnLeaf(direction, setPage) {
  albumTurn?.cancel();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
   setPage();
   render();
   return;
  }
  const forward = direction > 0;
  const turningSide = $(forward ? '#right-page' : '#left-page');
  const restingSide = $(forward ? '#left-page' : '#right-page');
  const face = copyLeaf(turningSide);
  const restingLeaf = copyLeaf(restingSide);
  const turningScroll = turningSide.querySelector('.page-content')?.scrollTop || 0;
  const restingScroll = restingSide.querySelector('.page-content')?.scrollTop || 0;

  setPage();
  render();

  const sheet = document.createElement('div');
  sheet.className = `album-sheet ${forward ? 'album-sheet-forward' : 'album-sheet-back'}`;
  sheet.inert = true;
  sheet.setAttribute('aria-hidden', 'true');
  const back = copyLeaf(restingSide);
  back.classList.add('album-sheet-backside');
  sheet.append(face, back);

  restingLeaf.classList.add('resting-leaf', forward ? 'resting-left' : 'resting-right');
  restingLeaf.inert = true;
  restingLeaf.setAttribute('aria-hidden', 'true');
  $('#book').append(restingLeaf, sheet);
  face.querySelector('.page-content')?.scrollTo(0, turningScroll);
  restingLeaf.querySelector('.page-content')?.scrollTo(0, restingScroll);

  const turn = sheet.animate([
   { transform: 'rotateY(0deg)' },
   { transform: `rotateY(${forward ? -180 : 180}deg)` },
  ], { duration: 560, easing: 'cubic-bezier(.36,.07,.25,1)', fill: 'forwards' });
  const finish = () => {
   restingLeaf.remove();
   sheet.remove();
  };
  turn.finished.then(finish, finish);
  albumTurn = turn;
 }

 function movePage(direction) {
  const next = spreads()[currentSpread() + direction];
  if (next) go(next.section, next.part);
 }

 function changeLevel(level) {
  state.level = Math.max(1, Math.min(20, level));
  state.prepared = prepared().slice(0, row()[0]);
  for (const circle of Object.keys(state.usedSlots)) {
   const total = row()[1][circle - 1];
   if (total === undefined) delete state.usedSlots[circle];
   else state.usedSlots[circle] = Math.min(state.usedSlots[circle], total);
  }
  state.luckUsed = Math.min(state.luckUsed, pb());
  save();
  render();
 }

 $('#cover-art').innerHTML = inkArt('cosmos');
 const desk = $('#desk');
 $('#open-book').disabled = true;
 loadBook().finally(() => {
  render();
  $('#open-book').disabled = false;
 });
 $('#open-book').onclick = async () => {
  if (desk.classList.contains('is-opening')) return;
  desk.classList.add('is-opening');
  const motions = $('#book').getAnimations({ subtree: true });
  await Promise.allSettled(motions.map(motion => motion.finished));
  desk.classList.remove('is-opening', 'is-closed');
  $('#next').focus({ preventScroll: true });
 };
 function closeBook() {
  albumTurn?.cancel();
  section = -1;
  desk.classList.add('is-closed');
  render();
  $('#open-book').focus({ preventScroll: true });
 }
 $('#close-book').onclick = closeBook;
 $('#home').onclick = event => { event.preventDefault(); closeBook(); };
 $('#prev').onclick = () => movePage(-1);
 $('#next').onclick = () => movePage(1);
 document.addEventListener('keydown', event => {
  if (desk.classList.contains('is-closed') || $('#editor').open || event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  movePage(event.key === 'ArrowRight' ? 1 : -1);
 });
 document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;
  if(b.dataset.nav!==undefined)go(+b.dataset.nav);
  if(b.dataset.spell){selected=b.dataset.spell;$('#spell-list').querySelectorAll('.spell-row').forEach(el=>el.classList.toggle('selected',el.dataset.spell===selected));$('#right-page').innerHTML=page(sections[section],currentSpread()*2,spellDetail(spells().find(s=>s.id===selected)));}
  if(b.dataset.filter){filter=b.dataset.filter;render();}
  if (b.dataset.prepare) {
   const spell = spells().find(entry => entry.id === b.dataset.prepare);
   if (!spell || spell.level === 0 || spell.level > row()[1].length) return;
   if (state.prepared.includes(spell.id)) {
    state.prepared = state.prepared.filter(id => id !== spell.id);
   } else {
    if (prepared().length >= row()[0]) {
     return toast(`Já preparei ${row()[0]} magias. Preciso desmarcar uma antes de preparar outra.`);
    }
    state.prepared.push(spell.id);
   }
   save();
   render();
   const nextStar = $('[data-prepare]:not(:disabled)');
   (nextStar || $('[data-filter="prepared"]'))?.focus({ preventScroll: true });
  }
  if(b.dataset.slot){let k=b.dataset.slot,u=+b.dataset.used;state.usedSlots[k]=(state.usedSlots[k]||0)>=u?u-1:u;save();render();}
  if(b.dataset.editSpell)showEditor(b.dataset.editSpell);
  if (b.dataset.photo) {
   imageTarget = b.dataset.photo;
   $('#image-file').click();
  }
  if (b.dataset.removeImage !== undefined) {
   if (b.dataset.removeImage === 'portrait') state.portrait = null;
   else state.collages[Number(b.dataset.removeImage)] = null;
   save();
   render();
  }
  switch(b.dataset.action){case 'rest':state.usedSlots={};state.luckUsed=0;state.recoveryUsed=false;save();render();toast('Minhas reservas estão de volta.');break;case 'recovery':state.recoveryUsed=!state.recoveryUsed;save();render();break;case 'journal-add':addJournalSheet();break;
   case 'journal-tear':tearJournalSheet();break;
   case 'album-add':addAlbumSheet();break;
   case 'album-tear':tearAlbumSheet();break;
   case 'add-spell':showEditor();break;}
 });
 let journalSelection;
 document.addEventListener('beforeinput', event => {
  const field = event.target;
  if (field.matches('.journal-text')) journalSelection = [field.selectionStart, field.selectionEnd];
 });
 document.addEventListener('input',e=>{let t=e.target;
  if (t.matches('.journal-text')) {
   if (e.isComposing) return;
   if (journalOverflows(t)) {
    t.value = state.notes[t.dataset.note] || '';
    t.setSelectionRange(...(journalSelection || [t.value.length, t.value.length]));
    t.scrollTop = 0;
    toast('A folha está cheia. Continue na página seguinte ou acrescente uma folha ao fim desta seção.');
    return;
   }
   t.scrollTop = 0;
  }
  if(t.id==='spell-search'){query=t.value;let list=visibleSpells();if(!list.some(s=>s.id===selected))selected=list[0]?.id||'';$('#spell-list').innerHTML=spellRows();$('#right-page').innerHTML=page(sections[section],currentSpread()*2,selected?spellDetail(spells().find(s=>s.id===selected)):'<h2>Nenhum registro.</h2><p>Experimente outra busca.</p>');return;}
  if(t.dataset.index){state.notes[t.dataset.index]=t.innerText;save();}
  if(t.dataset.note!==undefined){state.notes[t.dataset.note]=t.value;save();}
  if(t.dataset.spellNote){state.spellNotes[t.dataset.spellNote]=t.value;save();}
  if(t.dataset.caption!==undefined){state.collages[+t.dataset.caption].caption=t.value;save();}
  if(t.dataset.profile&&!['hp','maxHp','ac'].includes(t.dataset.profile)){state.profile[t.dataset.profile]=t.value;save();}
 });
 document.addEventListener('compositionend', event => {
  if (event.target.matches('.journal-text')) event.target.dispatchEvent(new Event('input', { bubbles: true }));
 });
 document.addEventListener('change',e=>{let t=e.target;if(t.id==='level-select')changeLevel(+t.value);
  if (t.id === 'image-file' && t.files[0]) {
   const file = t.files[0];
   t.value = '';
   addImage(file, imageTarget);
  }
 });
 document.addEventListener('paste', event => {
  if (![1, 8].includes(section) || desk.classList.contains('is-closed') || $('#editor').open) return;
  const item = Array.from(event.clipboardData?.items || []).find(entry => entry.type.startsWith('image/'));
  if (!item) return;
  event.preventDefault();
  if (section === 1) return addImage(item.getAsFile(), 'portrait');
  const first = albumSpread * slotsPerSpread;
  const slots = Array.from({ length: slotsPerSpread }, (_, offset) => first + offset);
  const available = slots.find(index => !state.collages[index]);
  if (available === undefined) return toast('Vire a página ou escolha uma imagem para trocar.');
  addImage(item.getAsFile(), String(available));
 });

 async function addImage(file, target) {
  if (!file || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) {
   return toast('Use PNG, JPEG, WebP ou GIF.');
  }
  if (file.size > 20 * 1024 * 1024) return toast('Escolha uma imagem menor que 20 MB.');
  let src;
  try {
   const bitmap = await createImageBitmap(file);
   const canvas = document.createElement('canvas');
   const ratio = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
   canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
   canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
   const ctx = canvas.getContext('2d');
   ctx.fillStyle = '#e9d8b3';
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
   bitmap.close();
   src = canvas.toDataURL('image/jpeg', .8);
  } catch {
   return toast('Não foi possível abrir esta imagem.');
  }
  if (target === 'portrait') state.portrait = src;
  else {
   const index = Number(target);
   while (state.collages.length <= index) state.collages.push(null);
   state.collages[index] = { src, caption: state.collages[index]?.caption || '' };
  }
  save();
  render();
 }
 let editing=null;
 function showEditor(id=null){editing=id;$('#spell-form').reset();if(id){let s=state.customSpells.find(s=>s.id===id);for(const el of $('#spell-form').elements){if(!el.name)continue;if(el.type==='checkbox')el.checked=!!s[el.name];else el.value=s[el.name]??'';}}$('#editor').showModal();}
 $('#cancel-editor').onclick=()=>$('#editor').close();$('#spell-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),s={id:editing||'custom-'+crypto.randomUUID(),art:'cosmos'};for(const k of ['name','en','school','time','range','components','duration','effect','practical'])s[k]=String(f.get(k)||'').trim();s.level=+f.get('level');s.ritual=f.has('ritual');s.concentration=f.has('concentration');if(editing)state.customSpells[state.customSpells.findIndex(x=>x.id===editing)]=s;else state.customSpells.push(s);selected=s.id;filter='all';query='';save();$('#editor').close();render();toast('Magia registrada.');};
 $('#export').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pype-grimorio-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Cópia exportada. Ela inclui suas notas, magias e imagens.');};
 $('#import').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>40*1024*1024)throw Error('Cópia maior que 40 MB.');const next=validate(JSON.parse(await file.text()));if(!confirm('Substituir o conteúdo atual por esta cópia? Exporte antes se quiser conservar o estado atual.'))return;state=next;albumSpread=0;notePage=0;save();render();toast('Cópia importada.');}catch(err){toast('Não foi possível importar: '+err.message);}finally{e.target.value='';}};
 // API somente de leitura para diagnóstico local e expansões.
 window.grimoire={snapshot:()=>structuredClone(state),rules:()=>({level:state.level,dc:dc(),attack:atk(),proficiency:pb(),preparedLimit:row()[0],slots:[...row()[1]]})};
})();
