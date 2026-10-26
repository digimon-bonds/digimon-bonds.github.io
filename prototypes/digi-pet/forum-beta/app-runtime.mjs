/* Local-only Digi-Pet player, isolated from the App and official RPG data. */
export function installDigiPetApp(host,payload){
 'use strict';
 if(host.DigiPetAppTrial)return;
 const doc=host.document;
 const style=doc.createElement('style');style.textContent=`
 #db-pet-overlay{box-sizing:border-box;width:min(700px,calc(100vw - 24px));height:min(900px,calc(100dvh - 24px));max-width:none;max-height:none;margin:auto;padding:0;border:1px solid #547981;border-radius:18px;background:#081923;color:#cbe1df;box-shadow:0 20px 90px #000b;overflow:hidden;font:12px 'Segoe UI',Arial,sans-serif}
 #db-pet-overlay::backdrop{background:#020b12ba;backdrop-filter:blur(4px)}
 #db-pet-overlay header{display:flex;align-items:center;justify-content:space-between;height:42px;box-sizing:border-box;padding:0 12px 0 16px;border-bottom:1px solid #2d4d57;background:#112c37;color:#bbd7da;font:10px Consolas,monospace;letter-spacing:1px}
 #db-pet-close{min-width:32px;height:30px;padding:0;border:1px solid #52757c;border-radius:7px;background:#193a46;color:#d7eae5;font:22px Arial;cursor:pointer}
 #db-pet-frame{display:block;width:100%;height:calc(100% - 42px);border:0;background:#09151e}
 @media(max-width:480px){#db-pet-overlay{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:12px}}
 `;
 const dialog=doc.createElement('dialog');dialog.id='db-pet-overlay';dialog.setAttribute('aria-label','Digi-Pet · protótipo');
 const header=doc.createElement('header'),label=doc.createElement('span');label.textContent='DIGI-PET / ACESSO DE TESTE';
 const close=doc.createElement('button');close.id='db-pet-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar Digi-Pet');header.append(label,close);dialog.append(header);
 let frame=null,peer=null,overflow='',key='',trigger=null;
 function open(options={}){
  if(dialog.open)return;
  const uid=String(options.userId||'');
  key='digimon-bonds:digi-pet:app-beta:'+( /^\d+$/.test(uid)?'u'+uid:'browser')+':v1';
  trigger=options.trigger||doc.querySelector('[data-digipet-entry]');
  let initial=null,available=true;try{initial=host.localStorage.getItem(key);}catch{available=false;}
  const channel=host.crypto.randomUUID(),seed={channel,initial,available,parentOrigin:host.location.origin};
  const serialized=JSON.stringify(seed).replace(/</g,String.fromCharCode(92)+'u003c');
  frame=doc.createElement('iframe');frame.id='db-pet-frame';frame.title='Digi-Pet de Agumon';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.dataset.channel=channel;
  frame.srcdoc=payload.document.replace('/*DIGIPET_FORUM_SEED*/',()=>`const forumSeed=${serialized};`);
  dialog.append(frame);peer=frame.contentWindow;overflow=doc.documentElement.style.overflow;doc.documentElement.style.overflow='hidden';dialog.showModal();close.focus();
 }
 const shut=()=>{if(dialog.open)dialog.close();};
 dialog.addEventListener('close',()=>{frame?.remove();frame=null;peer=null;doc.documentElement.style.overflow=overflow;trigger?.focus();});
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))shut();});
 host.addEventListener('message',event=>{
  const data=event.data;if(!frame||event.source!==peer||event.origin!=='null'||data?.channel!==frame.dataset.channel)return;
  if(data.type==='digipet:close'){shut();return;}
  if(data.type!=='digipet:save'||typeof data.value!=='string'||data.value.length>500000)return;
  try{const saved=JSON.parse(data.value);if(saved.version!==3||!saved.stats||!saved.downtime)return;host.localStorage.setItem(key,data.value);}
  catch{peer.postMessage({type:'digipet:storage-error',channel:data.channel},'*');}
 });
 close.addEventListener('click',shut);doc.head.append(style);doc.body.append(dialog);
 host.DigiPetAppTrial={open,close:shut};
}
