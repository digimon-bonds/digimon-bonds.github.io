'use strict';
const storageKey = 'nsc:dokugiri-template-studio:draft:v1';
const catalogKey = 'nsc:dokugiri-template-studio:jutsus:v1';
const publicBase = 'https://digimon-bonds.github.io/naruto/template-dokugiri-studio/';
const defaults = {
 name: 'Genryuusai', quote: 'Se começar a ver coisas, me avisa!', number: '01', rp: 'Treino Solo', title: 'A delicadeza da dose',
 story: 'O sapo observava a bancada com uma paciência que Genryuusai invejava. Entre os dois, uma gota violeta repousava no fundo do frasco.\n\nEle inclinou o vidro contra a luz. A cor parecia mais escura do que no ensaio anterior. Talvez fosse a proporção. Talvez fosse o calor que atravessava as paredes do laboratório. Anotou as duas possibilidades na margem do caderno.\n\n*— Você também acha que falta alguma coisa?*\n\nO sapo coaxou.\n\nGenryuusai sorriu e puxou outro frasco para perto.',
 notes: 'Objetivo do treino:\nResultado da rolagem:\nConsiderações:', chosen: []
};
const initialCatalog = [
 {name:'Shōsen Jutsu',rank:'Variável',description:'O usuário concentra energia nas mãos e a direciona aos tecidos danificados, estimulando sua recuperação e favorecendo a cicatrização dos ferimentos.\n— A quantidade de HP recuperada seguirá a tabela convencional de cura do Iryōninjutsu, de acordo com o Rank utilizado.\n— O usuário deverá possuir Ninjutsu no Rank correspondente à intensidade da cura escolhida.\n— O procedimento poderá tratar ferimentos externos e internos, respeitando as limitações de recuperação e as condições especiais do paciente.',requirements:'Iryōninjutsu; Contenção de Chakra',range:'Até 5 metros',seals:'Boi modificado → Tigre (variável)'},
 {name:'Sumerudama',rank:'C',range:'10 metros',description:'O Sumerudama permite que o usuário expulse pela boca uma esfera de substância gasosa produzida através de processos internos de fermentação.\nQuando liberada, a esfera se rompe e produz uma nuvem de odor extremamente desagradável, espalhando-se pela região afetada.\n— Aplica o Efeito Náusea durante 1 round em indivíduos convencionais.\n— Personagens que possuam olfato aguçado ou suscetibilidade especial a enjoos poderão sofrer o efeito durante 3 rounds.\n— Esses indivíduos também poderão perder 20 HP por round de exposição, mesmo quando vencerem o teste contra Náusea.'},
 {name:'Dokugiri: Doku no Kiri — Bruma Nociva',rank:'C',range:'10 metros',seals:'Cobra → Tigre',requirements:'Corpo Venenoso',description:'Uma bruma tênue, carregada com chakra e peçonha, ocupa uma pequena região e ameaça os indivíduos que respirarem diretamente a manifestação.\n— A nuvem permanece até 2 rounds; um alvo exposto pode receber no máximo 1 Marca por round, mediante os testes e proteções aplicáveis.\n— Máscaras, barreiras e técnicas adequadas podem reduzir ou impedir a exposição, conforme suas próprias regras.'},
 {name:'Dokugiri: Dokubari — Agulhas de Peçonha',rank:'C',range:'15 metros',requirements:'Corpo Venenoso',description:'Por meio de chakra, o Dokugiri lança pequenos projéteis de peçonha solidificada, desenhados para ferir a pele e introduzir sua assinatura tóxica.\n— Um acerto válido aplica 1 Marca de Contaminação. Vários projéteis da mesma execução não acumulam Marcas adicionais.'}
];
function readSaved(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
let draft = {...defaults, ...readSaved(storageKey, {})};
let catalog = readSaved(catalogKey, initialCatalog);
if (!Array.isArray(catalog) || !catalog.length) catalog = initialCatalog;
const fields = ['number','rp','title','story','notes'];
const preview = document.querySelector('#preview');
const status = document.querySelector('#export-status');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const italicHTML = text => escapeHTML(text).replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
function wordCount(text) { return (text.replace(/\*/g,'').match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) || []).length; }
function drops(count) { return Array.from({length:count},(_,i)=>`<span class="dk-drop" style="--x:${8+i*84/(count-1)}%;--speed:${3.8+i%3*.7}s;--delay:-${i*.63}s"></span>`).join(''); }
function render() {
 const chosen = new Set(Array.isArray(draft.chosen) ? draft.chosen : []);
 const jutsus = catalog.filter(j => chosen.has(j.name));
 const cards = jutsus.map(j => {
  const metadata = [['Arte',j.art],['Classe',j.type],['Alcance',j.range],['Selos',j.seals],['Custo',j.cost],['CD',j.cd],['Requisitos',j.requirements]].filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n');
  return `<details class="dk-jutsu"><summary>${escapeHTML(j.name)}<span class="dk-rank">Rank ${escapeHTML(j.rank || '—')}</span></summary><div class="dk-jutsu-text">${escapeHTML(metadata)}${metadata?'\n\n':''}${escapeHTML(j.description || '')}</div></details>`;
 }).join('');
 preview.innerHTML = `<div class="dk-frame"><div class="dk-post" lang="pt-BR"><div class="dk-hero"><svg class="dk-hero-surface" viewBox="0 0 720 300" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dk-purple-surface" x2="1" y2="1"><stop stop-color="#211927"/><stop offset="1" stop-color="#3a2744"/></linearGradient></defs><path d="M0 57Q0 37 22 31C111 4 170 56 290 24S475 2 560 24S650 43 696 25Q720 16 720 42V300H0Z" fill="url(#dk-purple-surface)"/></svg><img class="dk-art" src="./assets/genryuusai-toad-cutout.png" alt="Genryuusai sentado sobre seu sapo"><div class="dk-hero-copy"><span class="dk-banner-origin">DOKUGIRI <span>/</span> SUNAGAKURE</span><div class="dk-entry-heading"><span class="dk-number">${escapeHTML(draft.number)}</span><div><span class="dk-type">${escapeHTML(draft.rp)}</span><h3 class="dk-title">${escapeHTML(draft.title)}</h3></div></div></div><svg class="dk-wave" viewBox="0 0 720 100" preserveAspectRatio="none" aria-hidden="true"><path class="dk-paper-wave" d="M0 46C115 85 220 9 362 39S586 100 720 36V100H0Z" fill="#faf3e6"/><path class="dk-ribbon-wave" d="M0 45.5C115 84.5 220 8.5 362 38.5S586 99.5 720 35.5V46C581 112 476 72 360 49S117 96 0 56Z" fill="#b296b9"/><path class="dk-liquid-edge" d="M635 64C642 61 646 61 648 66C650 71 645 77 647 82C649 87 655 86 656 81C657 75 652 72 654 67C656 63 660 61 665 59C670 57 675 54 678 58C681 63 674 73 677 80C679 86 687 85 689 79C691 72 685 67 687 60C689 54 692 51 697 48C702 45 705 43 707 46C709 50 704 55 706 59C708 64 714 62 715 58C716 54 711 51 713 46L720 36C695 48 665 62 635 64Z" fill="#795881"/><path class="dk-liquid-glint" d="M650 72C648 76 648 79 650 81M681 65C679 71 678 76 681 79M709 50L709 56" fill="none" stroke="#d9c4df" stroke-width="1" stroke-linecap="round" opacity=".5"/></svg></div><div class="dk-paper"><div class="dk-film"></div><div class="dk-entry"><div class="dk-venom-track" aria-hidden="true"><span class="dk-falling-drop"></span><svg class="dk-puddle" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M13 24C-5 17 14 12 30 12C42 12 19 2 47 3C83 0 79 9 72 12C68 17 99 12 98 22C98 29 77 25 72 31C67 41 31 39 28 32C25 27 3 32 13 24Z" fill="#835391"/><ellipse cx="9" cy="8" rx="5" ry="2" fill="#9764a5"/><ellipse cx="89" cy="34" rx="4" ry="2" fill="#835391"/><ellipse class="dk-puddle-ring" cx="55" cy="22" rx="8" ry="3" fill="none" stroke="#d7acd9" stroke-width="1.5"/></svg></div><div class="dk-prose"><p>${italicHTML(draft.story)}</p></div></div><details class="dk-ledger"><summary><img class="dk-bar-icon dk-frog" src="./assets/frog-purple.png" alt="" aria-hidden="true">Observações de campo</summary><div class="dk-note-body"><div class="dk-word-count">Nº DE PALAVRAS · ${wordCount(draft.story)}</div>${italicHTML(draft.notes)}</div></details><details class="dk-ledger"><summary><svg class="dk-bar-icon dk-scroll" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5h17v20H8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 5C1 1 1 12 8 10m17 15c7-4 7 7 0 3H8V10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12h9m-9 5h9m-9 5h6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Jutsus utilizados</summary>${cards || '<div class="dk-empty">Nenhuma técnica registrada neste relato.</div>'}</details><div class="dk-ending"><span class="dk-poison-seal" lang="ja" role="img" aria-label="Veneno">毒</span></div></div></div></div>`;
 document.querySelector('#technique-count').textContent = `(${jutsus.length})`;
}
function save() {
 try { localStorage.setItem(storageKey,JSON.stringify(draft));document.querySelector('#save-status').textContent='Rascunho salvo'; }
 catch { document.querySelector('#save-status').textContent='Sem armazenamento disponível'; }
}
for (const id of fields) {
 const field=document.getElementById(id);field.value=draft[id];
 field.addEventListener('input',()=>{draft[id]=field.value;save();render();});
}
function renderCatalog() {
 const container=document.querySelector('#techniques');container.replaceChildren();
 for (const item of catalog) {
  const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=draft.chosen?.includes(item.name) || false;
  box.addEventListener('change',()=>{const chosen=new Set(draft.chosen || []);box.checked?chosen.add(item.name):chosen.delete(item.name);draft.chosen=[...chosen];save();render();});
  label.append(box,document.createTextNode(`${item.name} · Rank ${item.rank || '—'}`));container.append(label);
 }
}
document.querySelector('#italic').addEventListener('click',()=>{const field=document.querySelector('#story');const start=field.selectionStart,end=field.selectionEnd;field.setRangeText('*'+field.value.slice(start,end)+'*',start,end,'select');field.dispatchEvent(new Event('input'));field.focus();});
document.querySelector('#import').addEventListener('click',()=>{
 const message=document.querySelector('#import-status');
 try {const raw=JSON.parse(document.querySelector('#import-data').value);const entries=Array.isArray(raw)?raw:raw.jutsus;if(!Array.isArray(entries)||!entries.length||entries.some(j=>!j||typeof j.name!=='string'||!j.name.trim()))throw Error();catalog=entries.map(j=>Object.fromEntries(['name','rank','description','art','type','range','seals','cost','cd','requirements'].map(k=>[k,typeof j[k]==='string'?j[k]:''])));localStorage.setItem(catalogKey,JSON.stringify(catalog));renderCatalog();render();message.textContent='Catálogo atualizado.';}catch{message.textContent='Confira o JSON. Cada jutsu precisa ter um nome.';}
});
async function exportCode() {
 const response=await fetch(document.querySelector('#template-style').href);if(!response.ok)throw Error('CSS indisponível');const css=await response.text();const article=preview.querySelector('.dk-frame').cloneNode(true);
 article.querySelectorAll('img').forEach(img=>img.setAttribute('src',new URL(img.getAttribute('src'),publicBase).href));
 return '<style>'+css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,])\s*/g,'$1').trim().replace(/\s*\)/g,' )')+'</style>'+article.outerHTML.replace(/\r?\n/g,'&#10;');
}
document.querySelector('#copy').addEventListener('click',async()=>{
 try {const code=await exportCode();document.querySelector('#export-code').value=code;try{await navigator.clipboard.writeText(code);status.textContent='Template copiado. Cole no modo fonte do fórum.';}catch{const field=document.querySelector('#export-code');field.hidden=false;field.value=code;field.focus();field.select();status.textContent='Código selecionado. Pressione Ctrl+C para copiar.';}}catch{status.textContent='Abra o Studio por um servidor HTTP para exportar o template.';}
});
document.querySelector('#download').addEventListener('click',async()=>{
 try {const code=await exportCode();const blob=new Blob(['<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Genryuusai</title><body>'+code+'</body></html>'],{type:'text/html'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='genryuusai-template.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch{status.textContent='Abra o Studio por um servidor HTTP para baixar o template.';}
});
renderCatalog();render();

