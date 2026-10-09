import {renderDigivice,deviceDefaults} from '/creator/digivices.js';
import {currentForm,markers} from './engine.mjs';

// Presentation only: the same command nodes, permissions and handlers are retained.
export function initCommandOverlay(){
 const arena=document.querySelector('#arena'),panel=document.querySelector('#commandPanel');
 const frame=document.createElement('div');frame.className='arena-frame';arena.before(frame);frame.append(arena);
 const launch=document.createElement('button');launch.id='openCommands';launch.className='arena-action';launch.type='button';launch.disabled=true;
 launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-controls','commandDialog');launch.setAttribute('aria-expanded','false');
 launch.setAttribute('aria-label','AÇÃO — Abrir controle de combate');
 const device=document.createElement('template');device.innerHTML=renderDigivice({...deviceDefaults,digiName:'',digiImage:'',zoom:1,imagePosition:'center',deviceSkin:'clean'},v=>String(v),()=>false);const illustration=device.content.querySelector('svg');illustration.classList.add('action-device');illustration.querySelectorAll('image').forEach(img=>img.setAttribute('href','/creator/'+img.getAttribute('href')));launch.append(illustration);launch.insertAdjacentHTML('beforeend',actionScreen()+'<small id="commandCue">CONTROLE DE COMBATE</small>');frame.append(launch);
 const dialog=document.createElement('dialog');dialog.id='commandDialog';dialog.setAttribute('aria-label','Controle de combate');frame.append(dialog);
 const close=document.createElement('button');close.id='closeCommands';close.type='button';close.className='command-close';close.textContent='VOLTAR À ARENA ×';
 panel.querySelector('.console-status').replaceWith(close);
 const context=document.createElement('div');context.id='commandContext';context.className='command-context';context.setAttribute('aria-label','Participantes da cena');panel.querySelector('.command-deck-heading').after(context);
 const support=panel.querySelector('.command-support'),inventory=document.createElement('details');inventory.className='command-inventory';
 const summary=document.createElement('summary');summary.textContent='RECURSOS DA DUPLA';support.before(inventory);inventory.append(summary,support);
 dialog.append(panel);
 launch.addEventListener('click',openCommands);close.addEventListener('click',closeCommands);
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeCommands();});
 dialog.addEventListener('close',()=>{launch.setAttribute('aria-expanded','false');document.body.classList.remove('commands-open');launch.focus({preventScroll:true});});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog.open&&!document.querySelector('dialog[open]:not(#commandDialog)')){event.preventDefault();closeCommands();}});
 window.addEventListener('resize',fitAboveCards);
}
function fitAboveCards(){
 const dialog=document.querySelector('#commandDialog');if(!dialog.open)return;
 const frame=document.querySelector('.arena-frame').getBoundingClientRect();
 const cards=[...document.querySelectorAll('.combatant-dock')].map(node=>node.getBoundingClientRect().top);
 if(cards.length)dialog.style.maxHeight=Math.max(200,Math.min(...cards)-frame.top-parseFloat(getComputedStyle(dialog).top)-24)+'px';
}
export function openCommands(){
 const dialog=document.querySelector('#commandDialog'),launch=document.querySelector('#openCommands');
 if(dialog.open||launch.disabled)return;
 dialog.show();document.body.classList.add('commands-open');launch.setAttribute('aria-expanded','true');
 fitAboveCards();
 document.querySelector('#closeCommands').focus({preventScroll:true});
}
export function closeCommands(){document.querySelector('#commandDialog')?.close();}
export function syncCommandOverlay({state,actor,busy}){
 const launch=document.querySelector('#openCommands');launch.disabled=busy||!actor;
 const incoming=actor&&state.pending?.context?.targetId===actor.id;
 document.querySelector('#commandCue').textContent=incoming?'ATAQUE RECEBIDO · REAGIR':state.pending?'ROLAGEM EM ANDAMENTO':'CONTROLE DE COMBATE';
 launch.classList.toggle('reaction-ready',!!incoming);
 if(!actor)closeCommands();
 fitAboveCards();
 const context=document.querySelector('#commandContext');context.replaceChildren(...['ally','enemy'].map(side=>{const group=document.createElement('div');group.className='context-team '+side;group.setAttribute('aria-label',side==='ally'?'Aliados':'Inimigos');group.append(...state.actors.filter(unit=>unit.side===side).map(unit=>{
  const form=currentForm(unit),chip=document.createElement('div');chip.className='context-unit '+unit.side;
  const img=document.createElement('img');img.src=form.image;img.alt='';
  const name=document.createElement('b');name.textContent=form.name;
  const hp=document.createElement('small');hp.textContent=`PV ${unit.hp} / ${markers(form).hp}`;
  chip.append(img,name,hp);return chip;
 }));return group;}));
}

// Compact pixel lettering stays crisp without loading an additional font.
function actionScreen(){const glyphs=['01110/10001/10001/11111/10001/10001/10001','01111/10000/10000/10000/10000/10000/01111','01110/10001/10001/11111/10001/10001/10001','01110/10001/10001/10001/10001/10001/01110'];let pixels='';glyphs.forEach((glyph,i)=>glyph.split('/').forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1')pixels+=`<rect x="${i*7+x}" y="${y+3}" width=".86" height=".86"/>`;})));for(const [x,y] of [[9,10],[8,11],[15,1],[16,0],[17,1],[18,0]])pixels+=`<rect x="${x}" y="${y}" width=".86" height=".86"/>`;return '<span class="action-lcd" aria-hidden="true"><svg class="action-lettering" viewBox="0 0 26 12" fill="currentColor" focusable="false">'+pixels+'</svg></span>';}
