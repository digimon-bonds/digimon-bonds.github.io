import {currentForm,markers} from './engine.mjs';
const $=selector=>document.querySelector(selector);
let selectionPrompted=false;
export function setBattleLayer(layer){
 document.body.dataset.battleLayer=layer;
}
export function initBattleScreen(){
 document.body.classList.add('game-screen');setBattleLayer('arena');
 const shell=$('.battle-shell'),frame=$('.arena-frame');
 const hud=document.createElement('header');hud.className='battle-hud';
 hud.append($('.scene-back'),$('.page-head'),$('.view-switch'));shell.prepend(hud);
 const dock=document.createElement('div');dock.className='battle-dock';dock.append($('#controlledBanner'),$('#pairHud'));shell.append(dock);
 const tools=document.createElement('nav');tools.className='battle-tools';tools.setAttribute('aria-label','Painéis da batalha');hud.append(tools);
 const roster=document.createElement('div');roster.id='screenParticipantList';
 const participantPanel=document.createElement('section');participantPanel.append(roster,$('#controlPicker'));
 const narratorPanel=document.createElement('div');narratorPanel.append($('#narratorTerminal'),$('#roundProgression'),$('#roundChecklist'));
 const log=$('.log-panel');log.open=true;narratorPanel.querySelector('#narratorTerminal').open=true;
 const definitions=[['participants','Participantes',participantPanel],['resolutions','Resoluções',$('#resolutionPanel')],['log','Battle Log',log],['scene','Controle da cena',narratorPanel]];
 for(const [id,label,content] of definitions){
  const button=document.createElement('button');button.id='screen-'+id;button.type='button';button.textContent=label;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','drawer-'+id);button.setAttribute('aria-expanded','false');tools.append(button);
  const dialog=document.createElement('dialog');dialog.id='drawer-'+id;dialog.className='screen-drawer drawer-'+id;dialog.setAttribute('aria-label',label);
  const heading=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');title.textContent=label;close.textContent='FECHAR ×';close.type='button';close.setAttribute('aria-label','Fechar '+label);heading.append(title,close);
  dialog.append(heading,content);shell.append(dialog);
  button.addEventListener('click',()=>dialog.open?dialog.close():openBattleDrawer(id));close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
  dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');if(!$('#commandDialog').open&&document.body.dataset.battleLayer==='arena')button.focus({preventScroll:true});});
 }
 $('#controlPicker').querySelector('h2').textContent='ESCOLHA SUA DUPLA';
 const review=document.createElement('section');review.id='screenReview';review.setAttribute('aria-label','Resolução em andamento');review.append($('#commandRoll'),$('#commandDecision'));frame.append(review);
 frame.append($('#diceOverlay'));
 const alert=document.createElement('div');alert.className='arena-notice';alert.append($('#feedback'),$('#commandFlowStatus'));frame.append(alert);
 // The old stacked containers are empty; all live nodes above keep their handlers.
 $('.session-notes').hidden=true;
 $('#actionDialog').addEventListener('close',()=>{if(document.body.dataset.battleLayer==='configure'&&!$('#actionDialog').open)setBattleLayer($('#commandDialog').open?'commands':'arena');});
 $('#commandDialog').addEventListener('close',()=>{if(!['rolling','configure'].includes(document.body.dataset.battleLayer))setBattleLayer('arena');});
}
export function openBattleDrawer(id){
 const dialog=$('#drawer-'+id);if(!dialog||dialog.open||$('#commandPanel').getAttribute('aria-busy')==='true')return;
 $('#actionDialog').close();$('#commandDialog').close();setBattleLayer('arena');
 for(const other of document.querySelectorAll('.screen-drawer[open]'))other.close();
 dialog.show();$('#screen-'+id).setAttribute('aria-expanded','true');dialog.querySelector('header button').focus({preventScroll:true});
}
export function closeBattleDrawers(){for(const dialog of document.querySelectorAll('.screen-drawer[open]'))dialog.close();}
export function syncBattleScreen({state,mode,actor,busy,savingAttack=false}){
 const narrator=mode==='narrator';$('#screen-scene').hidden=!narrator;
 if(narrator){const label=document.createElement('b'),switcher=document.createElement('button');label.textContent=actor?'CONTROLANDO // '+currentForm(actor).name:'ADICIONE PARTICIPANTES';switcher.textContent='TROCAR';switcher.disabled=busy;switcher.onclick=()=>openBattleDrawer('participants');$('#controlledBanner').replaceChildren(label,switcher);}
 if(!narrator)$('#drawer-scene').close();
 const pending=(state.resolutions||[]).filter(entry=>entry.pending);
 $('#screen-resolutions').textContent='Resoluções'+(pending.length?' · '+pending.length:'');
 $('#screen-resolutions').classList.toggle('has-pending',pending.length>0);
 document.querySelectorAll('.battle-tools button').forEach(button=>button.disabled=busy);
 const roster=$('#screenParticipantList'),eligible=state.actors.filter(unit=>narrator||unit.side==='ally'&&unit.controller==='player').sort((a,b)=>Number(a.side==='enemy')-Number(b.side==='enemy'));
 roster.replaceChildren(...eligible.map(unit=>{
  const form=currentForm(unit),button=document.createElement('button'),img=document.createElement('img'),info=document.createElement('span'),name=document.createElement('b'),status=document.createElement('small');
  img.src=form.image;img.alt='';name.textContent=form.name;status.textContent=(unit.side==='ally'?'Aliado':'Inimigo')+' · PV '+unit.hp+' / '+markers(form).hp;info.append(name,status);button.append(img,info);button.className='screen-participant '+unit.side;button.setAttribute('aria-pressed',String(unit.id===actor?.id));
  const native=$('[data-unit="'+CSS.escape(unit.id)+'"]');button.disabled=busy||!native||native.disabled;button.addEventListener('click',()=>{native.click();$('#drawer-participants').close();});return button;
 }));
 for(const unit of state.actors){
  const reactions=pending.filter(entry=>{const p=entry.pending;if(p.kind!=='attack'||p.attackConfirmed===false||p.dodge)return false;return p.context.targetId===unit.id||state.humans.some(h=>h.id===p.context.targetId&&h.pairId===unit.pairId);});
  const node=$('#'+unit.id+'Combatant');if(!node)continue;node.classList.toggle('needs-dodge',reactions.length>0);
  if(reactions.length){const badge=document.createElement('span');badge.className='hud-reaction';badge.textContent='ESQUIVA NECESSÁRIA'+(reactions.length>1?' · '+reactions.length:'');$('#'+unit.id+'Hud').append(badge);}
 }
 // Reveal the selector automatically only when no participant has been chosen.
 if(actor||narrator)selectionPrompted=false;
 if(!narrator&&!actor&&!busy&&!selectionPrompted){selectionPrompted=true;openBattleDrawer('participants');}
 $('#screenReview').hidden=busy&&!savingAttack||!state.pending&&!state.resourceSurvival&&$('#incomingBanner').hidden;
 if(savingAttack)$('#commandCue').textContent='CONFIRMANDO ATAQUE';
 $('#openCommands').setAttribute('aria-label',savingAttack?'Confirmando ataque':busy?'Rolagem em andamento':'AÇÃO — Abrir controle de combate');
}
