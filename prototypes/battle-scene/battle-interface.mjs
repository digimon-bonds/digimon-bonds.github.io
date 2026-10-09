import {syncCommandOverlay} from './command-overlay.mjs';
import {roundStatus,partnershipStatus} from './round-status.mjs';
import {conditionHelp} from './condition-help.mjs';
import {currentForm,markers,STAGES,CONDITIONS} from './engine.mjs';
import {canChoose,controlLocked} from './interface-policy.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const chip=(text,type='data')=>`<span class="hud-chip ${type}">${esc(text)}</span>`;
export function combatantHUD(state,actor,mode,controlled){
 const f=currentForm(actor),m=markers(f),human=state.humans.find(h=>h.pairId===actor.pairId),index=state.actors.filter(a=>a.side===actor.side).indexOf(actor)+1;
 return `<div class="hud-id">${String(index).padStart(2,'0')} // ${actor.side==='ally'?'ALLY':mode==='narrator'?'NPC // NARRATOR':'ENEMY'}${controlled?'<b>● CONTROLLED</b>':''}</div><h2>${esc(f.name)}</h2>${human?`<small class="hud-human">${human.image?`<img class="human-avatar" src="${esc(human.image)}" alt="Retrato de ${esc(human.name)}" referrerpolicy="no-referrer">`:""}${esc(human.name)}</small>`:''}<div class="hud-chips">${chip(STAGES[f.stage].label,'stage')}${chip(f.digitalAttribute,'attribute')}${chip(f.element,'element')}</div><div class="hp-caption"><span>PV${actor.hp>0&&actor.hp/m.hp<=.25?' // LOW HP':''}</span><strong>${actor.hp} / ${m.hp}</strong></div><div class="hp-track"><div class="hp-fill" style="width:${Math.max(0,Math.min(100,actor.hp/m.hp*100))}%"></div></div><progress class="sr-only" value="${actor.hp}" max="${m.hp}" aria-label="PV de ${esc(f.name)}"></progress><div class="condition-tags">${Object.keys(actor.conditions).map(id=>`<span class="hud-chip condition" tabindex="0" title="${esc(conditionHelp[id])}" aria-label="${esc(conditionHelp[id])}">${esc(CONDITIONS[id])}<span class="condition-tip" role="tooltip">${esc(conditionHelp[id])}</span></span>`).join('')}${actor.coordinatesRound===state.round?chip('COORDENADAS · +1d6','status'):''}${actor.defending?chip('DEFENDING','status'):''}${chip(actor.hp===0?'OUT':actor.conditions.stunned?'⚠ STUNNED':actor.remaining?'● AÇÃO DISPONÍVEL':'✓ AÇÃO CONCLUÍDA','status')}</div>`;
}
export function renderInterface({state,mode,playerId,busy,choose}){
 const $=s=>document.querySelector(s),narrator=mode==='narrator',actor=state.actors.find(a=>a.id===playerId),human=state.humans.find(h=>h.pairId===actor?.pairId),pair=state.pairs.find(p=>p.id===actor?.pairId);
 syncCommandOverlay({state,actor:narrator?state.actors.find(a=>a.id===$('#operator').value):actor,busy});
 document.body.dataset.view=mode;document.body.classList.toggle('rolling',busy);
 $('[id=narratorTerminal]').hidden=!narrator;
 document.querySelectorAll('[data-view]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.view===mode));b.disabled=busy||!!state.pending&&b.dataset.view===mode;});
 $('#controlPicker').hidden=narrator||!!actor;
 const lock=actor&&controlLocked(state,actor.id);
 $('#controlledBanner').innerHTML=narrator?'NARRATOR // CONTROLE LOCAL DA CENA':actor?`<small>CONTROLANDO</small><b>${esc(currentForm(actor).name)} // ${esc(human?.name)}</b><button id="changeControlled" ${lock||busy?'disabled':''}>${lock?'🔒 CONTROLE BLOQUEADO NESTA RODADA':'TROCAR PARTICIPANTE'}</button>`:'Escolha um aliado para iniciar seu turno.';
 $('#changeControlled')?.addEventListener('click',()=>choose(null));
 $('#playerChoices').innerHTML=state.actors.filter(a=>a.side==='ally'&&a.controller==='player').map(a=>{const h=state.humans.find(h=>h.pairId===a.pairId),f=currentForm(a);return `<button data-player-choice="${esc(a.id)}"><img src="${esc(f.image)}" alt=""><b>${esc(f.name)}</b><span>${esc(h?.name)}</span>${chip(STAGES[f.stage].label,'stage')}</button>`;}).join('');
 $('#playerChoices').querySelectorAll('button').forEach(b=>{b.disabled=!canChoose(state,mode,playerId,b.dataset.playerChoice,busy);b.onclick=()=>choose(b.dataset.playerChoice);});
 document.querySelectorAll('[data-unit]').forEach(b=>{b.hidden=!narrator;b.disabled=busy;});
 const progress=roundStatus(state);$('#roundProgression').hidden=!narrator;$('#roundProgressText').textContent=state.phase==='closed'?'RODADA ENCERRADA':progress.ready?'✓ RODADA CONCLUÍDA':progress.completed+' / '+progress.total+' AÇÕES CONCLUÍDAS · '+progress.pending+' RESOLUÇÕES PENDENTES';$('#roundChecklist').hidden=!narrator;$('#roundChecklist').innerHTML=narrator?(progress.ready?'<p>Todos os resultados foram aplicados. A próxima rodada abre automaticamente.</p>':'<b>O QUE FALTA?</b>'+progress.waiting.map(unit=>'<span>◷ '+esc(unit.name)+' · '+unit.type+' ainda tem ação</span>').join('')+(progress.pending?'<span>⚔ Aplicar '+progress.pending+' resolução(ões) na fila abaixo.</span>':'')):'';
 $('#roundDisplay').textContent='ROUND '+String(state.round).padStart(2,'0');
 const done=state.actors.filter(a=>!a.remaining||!a.hp).length;
 const humanDone=state.humans.filter(h=>!h.remaining||!h.energy).length;
 $('#roundOverview').textContent=narrator?`${done+humanDone} / ${state.actors.length+state.humans.length} ACTIONS COMPLETE`:!actor?'SELECIONE SEU PARTICIPANTE':partnershipStatus(state,actor.pairId).label;
 $('#sceneRoster').innerHTML=narrator?state.actors.map(a=>{const h=state.humans.find(h=>h.pairId===a.pairId);return `<div class="roster-unit ${a.side}"><img src="${esc(currentForm(a).image)}" alt=""><div class="roster-unit-info"><b>${esc(currentForm(a).name)}</b><div class="roster-unit-chips">${chip(a.side==='ally'?'Aliado':'Inimigo','data')}${chip(a.hp===0?'Fora de combate':a.conditions.stunned?'⚠ Incapacitado':a.remaining?'● Ação disponível':'✓ Ação concluída','status')}${h?chip('Humano · '+(h.remaining&&h.energy?'disponível':'concluída'),'status'):''}</div></div></div>`;}).join(''):'';
 if(!narrator&&!actor){document.querySelectorAll('.commands button,.human-panel button,.digimon-support button,.human-support button').forEach(b=>b.disabled=true);$('#pairHud').hidden=true;}else $('#pairHud').hidden=false;
 const operator=state.actors.find(a=>a.id===$('#operator').value),unpairedNPC=narrator&&!operator?.pairId;
 $('.human-panel').hidden=unpairedNPC;
 $('#commandFocus').textContent='SELECIONE UM COMANDO';
 $('#commandDescription').textContent=unpairedNPC?'Escolha a próxima ação deste Digimon.':'Duas ações. Uma conexão. Digimon acima, Humano abaixo.';
 if(unpairedNPC)$('#pairHud').hidden=true;
 document.querySelectorAll('.combatant').forEach(node=>{const controlled=narrator?node.id===($('#operator').value+'Combatant'):actor&&node.id===actor.id+'Combatant';node.classList.toggle('selected',!!controlled);});
 const resolution=$('#resolutionPanel');resolution.classList.toggle('standby',!busy&&!state.pending&&!state.result);
 $('#skipNpc').hidden=!narrator||$('#operator').value.startsWith('ally');
 $('#pairHud').classList.toggle('player-hud',!narrator);
 if(actor&&!narrator){
  const uses=actor.uses[actor.formId]??currentForm(actor).attributes.intelligence,max=currentForm(actor).attributes.intelligence;
  const blocks=[['ENERGIA',human.energy,9+pair.level],['LAÇO',pair.bond,pair.level+5],['SIGNATURE USES',uses,max]];
  let resources=$('#resourceMeters');if(!resources){resources=document.createElement('div');resources.id='resourceMeters';$('#pairHud').append(resources);}
  resources.innerHTML=blocks.map(([label,value,total])=>`<div><small>${label}</small><b>${value} / ${total}</b><meter min="0" max="${total}" value="${Math.max(0,value)}"></meter></div>`).join('');resources.hidden=false;
 }else if($('#resourceMeters'))$('#resourceMeters').hidden=true;
}
