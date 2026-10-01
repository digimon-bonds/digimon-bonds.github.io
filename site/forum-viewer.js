if(new URLSearchParams(location.search).get('embed')==='full')document.documentElement.classList.add('forum-full');
for(const b of document.querySelectorAll('[data-hotspot]')){const values=b.dataset.hotspot.split(',').map(Number);if(values.length===4&&values.every(n=>Number.isFinite(n)&&n>=0&&n<=100))['left','top','width','height'].forEach((key,i)=>b.style[key]=values[i]+'%');}
const tabs=[...document.querySelectorAll('[data-preview-tab]')];
function select(tab,focus=false){for(const button of tabs){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;const panel=document.getElementById(button.getAttribute('aria-controls'));if(panel)panel.hidden=!selected;}if(focus)tab.focus();}
for(const tab of tabs){tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',event=>{let index=tabs.indexOf(tab);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();select(tabs[index],true);});}
if(tabs[0])select(tabs[0]);
const stages=[...document.querySelectorAll('[data-stage]')];
let active=stages.findIndex(b=>b.getAttribute('aria-selected')==='true');if(active<0)active=1;
let timer;
function stageSelect(index,focus=false){
 if(index<0||index>=stages.length)return;
 clearTimeout(timer);active=index;
 stages.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;document.getElementById(b.getAttribute('aria-controls')).hidden=i!==index;});
 const panel=document.getElementById(stages[index].getAttribute('aria-controls')),locked=panel.dataset.locked==='true',status=document.getElementById('form-status');
 panel.classList.remove('scan','forum-denied');void panel.offsetWidth;panel.classList.add(locked?'forum-denied':'scan');status.textContent=locked?'ACCESS DENIED // EVOLUTION DATA LOCKED':'DIGIVOLUTION DATA REQUESTED…';
 timer=setTimeout(()=>{status.textContent=locked?'ACCESS LOCKED // CLEARANCE INSUFFICIENT':'DATA STREAM FOUND';panel.classList.remove('scan','forum-denied');},450);
 if(focus)stages[index].focus();
}
for(const [i,b] of stages.entries()){b.addEventListener('click',()=>stageSelect(i));b.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=Math.min(i+1,stages.length-1);else if(e.key==='ArrowLeft')n=Math.max(0,i-1);else if(e.key==='Home')n=0;else if(e.key==='End')n=stages.length-1;else return;e.preventDefault();stageSelect(n,true);});}
for(const b of document.querySelectorAll('[data-form-nav]'))b.addEventListener('click',()=>{const next=active+(b.dataset.formNav==='next'?1:-1);stageSelect(next);document.getElementById(stages[active].getAttribute('aria-controls'))?.querySelector('[data-form-nav="'+b.dataset.formNav+'"]:not(:disabled)')?.focus();});

import('./sheet-layout.js').then(({styleSheet})=>styleSheet(document.getElementById('preview')));
