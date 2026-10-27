/* Independent player. Native window controls belong to the browser/OS. */
export function installDigiPetApp(host,payload){
 'use strict';if(host.DigiPetAppTrial)return;
 const doc=host.document,style=doc.createElement('style');
 style.textContent=`
 #db-pet-overlay{box-sizing:border-box;width:min(500px,calc(100vw - 12px));height:calc(100dvh - 12px);max-width:none;max-height:none;padding:0;margin:auto;border:0;background:transparent;box-shadow:none;overflow:hidden}
 #db-pet-overlay::backdrop{background:#020b1280;backdrop-filter:blur(3px)}
 #db-pet-frame{display:block;width:100%;height:100%;border:0;background:transparent}
 #db-pet-close{position:absolute;top:0;right:0;z-index:2;width:28px;height:28px;padding:0;border:1px solid #52757c;border-radius:8px;background:#112c37;color:#d7eae5;font:20px Arial;cursor:pointer}
 body.digipet-window{margin:0;background:#09151e;overflow:hidden}
 .digipet-window #db-pet-overlay{position:fixed;inset:0;width:100%;height:100dvh;margin:0;border:0;border-radius:0}
 `;
 let root=null,frame=null,peer=null,key='',trigger=null,previousOverflow='';
 function open(options={}){
  if(frame)return;
  const uid=String(options.userId||'');key='digimon-bonds:digi-pet:app-beta:'+(/^\d+$/.test(uid)?'u'+uid:'browser')+':v1';
  const standalone=options.standalone===true;trigger=options.trigger||doc.querySelector('[data-digipet-entry]');
  let initial=null,available=true;try{initial=host.localStorage.getItem(key);}catch{available=false;}
  const channel=host.crypto.randomUUID(),seed={channel,initial,available,parentOrigin:host.location.origin};
  root=doc.createElement(standalone?'main':'dialog');root.id='db-pet-overlay';root.setAttribute('aria-label','Digi-Pet');
  frame=doc.createElement('iframe');frame.id='db-pet-frame';frame.title='Digi-Pet de Agumon';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.dataset.channel=channel;
  const serialized=JSON.stringify(seed).replace(/</g,String.fromCharCode(92)+'u003c');frame.srcdoc=payload.document.replace('/*DIGIPET_FORUM_SEED*/',()=>`const forumSeed=${serialized};`);
  root.append(frame);doc.body.append(root);peer=frame.contentWindow;
  if(standalone){doc.body.classList.add('digipet-window');doc.getElementById('pet-window-status')?.remove();}
  else{const close=doc.createElement('button');close.type='button';close.id='db-pet-close';close.textContent='×';close.setAttribute('aria-label','Fechar Digi-Pet');close.addEventListener('click',shut);root.append(close);previousOverflow=doc.documentElement.style.overflow;doc.documentElement.style.overflow='hidden';root.addEventListener('close',dispose);root.showModal();close.focus();}
 }
 function dispose(){root?.remove();root=null;frame=null;peer=null;doc.documentElement.style.overflow=previousOverflow;trigger?.focus();}
 function shut(){if(doc.body.classList.contains('digipet-window')){host.close();return;}if(root?.open)root.close();}
 host.addEventListener('message',event=>{
  const data=event.data;if(!frame||event.source!==peer||event.origin!=='null'||data?.channel!==frame.dataset.channel)return;
  if(data.type==='digipet:close'){shut();return;}
  if(data.type!=='digipet:save'||typeof data.value!=='string'||data.value.length>500000)return;
  try{const saved=JSON.parse(data.value);if(saved.version!==3||!saved.stats||!saved.downtime)return;host.localStorage.setItem(key,data.value);}
  catch{peer.postMessage({type:'digipet:storage-error',channel:data.channel},'*');}
 });
 doc.head.append(style);host.DigiPetAppTrial={open,close:shut};
}
