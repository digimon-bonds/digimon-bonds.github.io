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
 gate.innerHTML='<form><small>DIGI-PET / ACESSO DE TESTE</small><h2 id="digipet-access-title">Um pequeno mundo digital.</h2><p>Informe a senha de teste para encontrar seu parceiro.</p><label for="digipet-password">Senha de acesso</label><input id="digipet-password" type="password" autocomplete="off" required maxlength="128"><p class="digipet-access-error" role="alert" aria-live="polite"></p><div><button type="button" data-cancel-pet>VOLTAR</button><button type="submit">ENTRAR NO DIGI-PET</button></div></form>';
 document.body.append(gate);
 const form=gate.querySelector('form'),input=gate.querySelector('input'),submit=gate.querySelector('[type=submit]'),message=gate.querySelector('[role=alert]');let generation=0;
 trigger.addEventListener('click',()=>{if(gate.open)return;generation++;input.value='';message.textContent='';submit.disabled=false;submit.textContent='ENTRAR NO DIGI-PET';gate.showModal();input.focus();});
 gate.querySelector('[data-cancel-pet]').addEventListener('click',()=>gate.close());
 gate.addEventListener('close',()=>{generation++;input.value='';trigger.focus();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submit.disabled)return;const attempt=++generation,value=input.value;input.value='';submit.disabled=true;message.textContent='';
  try{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
   if(attempt!==generation||!gate.open)return;
   if([...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')!==PASSWORD_DIGEST){message.textContent='Senha incorreta. Tente novamente.';input.focus();return;}
   submit.textContent='ABRINDO…';const runtime=await loadRuntime();if(attempt!==generation||!gate.open)return;
   gate.close();runtime.open({userId:getForumUser()?.forumUserId,trigger});
  }catch(error){if(attempt===generation&&gate.open)message.textContent=error.message||'Não foi possível abrir o Digi-Pet.';}
  finally{submit.disabled=false;submit.textContent='ENTRAR NO DIGI-PET';}
 });
}
