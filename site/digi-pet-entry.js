import {getForumUser} from './forum-identity.js';
// Prototype UI gate only. No password is sent to the forum or persisted.
// Not an authorization boundary for official RPG rewards or private data.
const PASSWORD_DIGEST='b495fa6faea84d41afbdfd509659becbb8751936c5ac74fe715c830c4621e6a0';
const trigger=document.querySelector('[data-digipet-entry]');
let runtimePromise;
function loadRuntime(){
 if(window.DigiPetAppTrial)return Promise.resolve(window.DigiPetAppTrial);
 if(runtimePromise)return runtimePromise;
 runtimePromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('./digi-pet-trial.js',import.meta.url).href;
  script.onload=()=>window.DigiPetAppTrial?resolve(window.DigiPetAppTrial):reject(Error('Protótipo indisponível.'));
  script.onerror=()=>{script.remove();reject(Error('Não foi possível carregar o Digi-Pet. Tente novamente.'));};document.head.append(script);
 }).catch(error=>{runtimePromise=null;throw error;});return runtimePromise;
}
if(trigger){
 const gate=document.createElement('dialog');gate.id='digipet-access';gate.setAttribute('aria-labelledby','digipet-access-title');
 gate.innerHTML='<form><small>DIGI-PET / ACESSO DE TESTE</small><h2 id="digipet-access-title">Um pequeno mundo digital.</h2><p>Informe a senha de teste para encontrar seu parceiro.</p><label for="digipet-password">Senha de acesso</label><input id="digipet-password" type="password" autocomplete="off" required maxlength="128"><p class="digipet-access-error" role="alert" aria-live="polite"></p><div><button type="button" data-cancel-pet>VOLTAR</button><button type="button" data-inline-pet hidden>ABRIR AQUI</button><button type="submit">ENTRAR NO DIGI-PET</button></div></form>';
 document.body.append(gate);
 const form=gate.querySelector('form'),input=gate.querySelector('input'),submit=gate.querySelector('[type=submit]'),message=gate.querySelector('[role=alert]');let generation=0,verifiedUser=null;const inline=gate.querySelector('[data-inline-pet]');
 trigger.addEventListener('click',()=>{if(gate.open)return;generation++;verifiedUser=null;inline.hidden=true;input.value='';message.textContent='';submit.disabled=false;submit.textContent='ENTRAR NO DIGI-PET';gate.showModal();input.focus();});
 gate.querySelector('[data-cancel-pet]').addEventListener('click',()=>gate.close());
 gate.addEventListener('close',()=>{generation++;verifiedUser=null;inline.hidden=true;input.value='';trigger.focus();});
 inline.addEventListener('click',async()=>{if(!verifiedUser)return;const userId=verifiedUser.userId;inline.disabled=true;try{const runtime=await loadRuntime();if(!gate.open)return;gate.close();runtime.open({userId,trigger});}catch(error){message.textContent=error.message;}finally{inline.disabled=false;}});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submit.disabled)return;const attempt=++generation,value=input.value;input.value='';submit.disabled=true;message.textContent='';
  try{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
   if(attempt!==generation||!gate.open)return;
   if([...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')!==PASSWORD_DIGEST){message.textContent='Senha incorreta. Tente novamente.';input.focus();return;}
   const userId=getForumUser()?.forumUserId||null,token=crypto.randomUUID();
   const url=new URL('./digi-pet-window.html',import.meta.url);url.hash=token;
   const width=Math.min(500,screen.availWidth),height=Math.min(920,screen.availHeight-60);
   // Exact-source handshake also works with partitioned third-party storage.
   let popup=null,timer;
   const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',claim);gate.removeEventListener('close',cleanup);};
   const fallback=()=>{cleanup();if(attempt!==generation||!gate.open)return;verifiedUser={userId};inline.hidden=false;message.textContent='Permita pop-ups para abrir em janela própria, ou escolha Abrir aqui.';};
   const claim=event=>{
    if(event.origin!==location.origin||event.source!==popup||event.data?.type!=='digipet:claim'||event.data.token!==token)return;
    if(attempt!==generation||!gate.open){cleanup();return;}
    const uid=String(userId||''),key='digimon-bonds:digi-pet:app-beta:'+(/^\d+$/.test(uid)?'u'+uid:'browser')+':v1';
    let initial=null;try{initial=localStorage.getItem(key);}catch{}
    popup.postMessage({type:'digipet:launch',token,userId,initial},location.origin);cleanup();gate.close();
   };
   window.addEventListener('message',claim);gate.addEventListener('close',cleanup);
   popup=window.open(url.href,'bonds-digipet-'+token,'popup=yes,resizable=yes,scrollbars=no,width='+width+',height='+height);
   if(!popup){fallback();return;}
   popup.focus();timer=setTimeout(fallback,8000);
  }catch(error){if(attempt===generation&&gate.open)message.textContent=error.message||'Não foi possível abrir o Digi-Pet.';}
  finally{submit.disabled=false;submit.textContent='ENTRAR NO DIGI-PET';}
 });
}
