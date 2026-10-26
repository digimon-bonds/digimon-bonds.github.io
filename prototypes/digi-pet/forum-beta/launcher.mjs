/* Omegamon-only UI trial. No RPG/backend authority or account permissions.
 * The forum additionally limits the bootstrap to administrators. */
export function installDigiPetBeta(host,payload){
 'use strict';
 const permitted=()=>host.location.origin==='https://digimonbonds.forumeiros.com'&&String(host._userdata?.session_logged_in)==='1'&&String(host._userdata?.user_id)==='1'&&String(host._userdata?.username).toLowerCase()==='omegamon';
 if(!permitted()||host.document.getElementById('db-pet-button'))return;
 const doc=host.document,key='digimon-bonds:digi-pet:forum-beta:u1:v1';
 const style=doc.createElement('style');style.id='db-pet-styles';style.textContent=`
 #db-pet-button{position:fixed!important;top:16px!important;right:18px!important;left:auto!important;bottom:auto!important;width:76px!important;height:auto!important;min-width:0!important;min-height:0!important;padding:0!important;border:0!important;margin:0!important;background:transparent!important;box-shadow:none!important;z-index:2147483000!important;cursor:pointer!important;line-height:0!important;overflow:visible!important}
 #db-pet-button img{display:block!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;object-fit:contain!important;filter:none!important;opacity:1!important;transform:none!important}
 #db-pet-button:focus-visible{outline:2px solid #e6c46e!important;outline-offset:5px!important;border-radius:8px!important}
 #db-pet-overlay{box-sizing:border-box;width:min(700px,calc(100vw - 24px));height:min(900px,calc(100dvh - 24px));max-width:none;max-height:none;margin:auto;padding:0;border:1px solid #547981;border-radius:18px;background:#081923;color:#cbe1df;box-shadow:0 20px 90px #000b;overflow:hidden;z-index:2147483100;font:12px 'Segoe UI',Arial,sans-serif}
 #db-pet-overlay::backdrop{background:#020b12b8;backdrop-filter:blur(4px)}
 #db-pet-overlay header{display:flex;align-items:center;justify-content:space-between;height:42px;box-sizing:border-box;padding:0 12px 0 16px;border-bottom:1px solid #2d4d57;background:#112c37;color:#bbd7da;font:10px Consolas,monospace;letter-spacing:1px}
 #db-pet-close{min-width:32px;height:30px;padding:0;border:1px solid #52757c;border-radius:7px;background:#193a46;color:#d7eae5;font:22px Arial;cursor:pointer}
 #db-pet-frame{display:block;width:100%;height:calc(100% - 42px);border:0;background:#09151e}
 @media(max-width:480px){#db-pet-button{width:64px!important;right:12px!important;top:12px!important}#db-pet-overlay{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:12px}}
 `;
 const button=doc.createElement('button');button.type='button';button.id='db-pet-button';button.setAttribute('aria-label','Abrir Digi-Pet · teste Omegamon');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','db-pet-overlay');button.title='Digi-Pet · teste exclusivo de Omegamon';
 const image=doc.createElement('img');image.src=payload.button;image.alt='';image.draggable=false;button.append(image);
 const dialog=doc.createElement('dialog');dialog.id='db-pet-overlay';dialog.setAttribute('aria-label','Digi-Pet · teste de Omegamon');
 const header=doc.createElement('header'),label=doc.createElement('span');label.textContent='DIGI-PET / TESTE OMEGAMON';const close=doc.createElement('button');close.id='db-pet-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar Digi-Pet');header.append(label,close);dialog.append(header);
 let frame=null,peer=null,overflow='',available=true;
 const safeJSON=value=>JSON.stringify(value).replace(/</g,String.fromCharCode(92)+'u003c');
 function open(){
  if(!permitted()||dialog.open)return;
  let initial=null;available=true;try{initial=host.localStorage.getItem(key);}catch{available=false;}
  const channel=host.crypto.randomUUID();
  const seed={channel,initial,available,parentOrigin:host.location.origin};
  frame=doc.createElement('iframe');frame.id='db-pet-frame';frame.title='Digi-Pet de Agumon';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');
  frame.srcdoc=payload.document.replace('/*DIGIPET_FORUM_SEED*/',()=>`const forumSeed=${safeJSON(seed)};`);
  frame.dataset.channel=channel;dialog.append(frame);peer=frame.contentWindow;
  overflow=doc.documentElement.style.overflow;doc.documentElement.style.overflow='hidden';dialog.showModal();button.setAttribute('aria-expanded','true');close.focus();
 }
 function shut(){if(dialog.open)dialog.close();}
 dialog.addEventListener('close',()=>{frame?.remove();frame=null;peer=null;doc.documentElement.style.overflow=overflow;button.setAttribute('aria-expanded','false');button.focus();});
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))shut();});
 host.addEventListener('message',event=>{
  const data=event.data;if(!permitted()||event.source!==peer||event.origin!=='null'||!frame||data?.channel!==frame.dataset.channel)return;
  if(data.type==='digipet:close'){shut();return;}
  if(data.type!=='digipet:save'||typeof data.value!=='string'||data.value.length>500000)return;
  try{const saved=JSON.parse(data.value);if(saved.version!==3||!saved.stats||!saved.downtime)return;host.localStorage.setItem(key,data.value);}
  catch{available=false;peer.postMessage({type:'digipet:storage-error',channel:data.channel},'*');}
 });
 button.addEventListener('click',open);close.addEventListener('click',shut);
 doc.head.append(style);doc.body.append(button,dialog);
}
