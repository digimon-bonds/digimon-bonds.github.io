// One-time, exact-origin/source launch handshake; never contains the password.
const status=document.getElementById('pet-window-status'),sessionKey='digimon-bonds:digi-pet:window-session:v1';
try{
 const token=location.hash.slice(1);let session;
 if(token){
  history.replaceState(null,'',location.pathname+location.search);
  if(!/^[\da-f-]{36}$/i.test(token)||!window.opener)throw Error('Abra o Digi-Pet pelo card no App.');
  const source=window.opener;
  const grant=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{window.removeEventListener('message',receive);reject(Error('Acesso expirado. Abra novamente pelo card no App.'));},10000);
   function receive(event){if(event.source!==source||event.origin!==location.origin||event.data?.type!=='digipet:launch'||event.data.token!==token)return;clearTimeout(timer);window.removeEventListener('message',receive);resolve(event.data);}
   window.addEventListener('message',receive);source.postMessage({type:'digipet:claim',token},location.origin);
  });
  session={userId:grant.userId||null};sessionStorage.setItem(sessionKey,JSON.stringify(session));
  // Preserve the old embedded save on first launch; never overwrite a popup save.
  const uid=String(session.userId||''),key='digimon-bonds:digi-pet:app-beta:'+(/^\d+$/.test(uid)?'u'+uid:'browser')+':v1';
  try{if(grant.initial&&typeof grant.initial==='string'&&grant.initial.length<=500000&&!localStorage.getItem(key)){const saved=JSON.parse(grant.initial);if(saved.version===3&&saved.stats&&saved.downtime)localStorage.setItem(key,grant.initial);}}catch{}
 }else session=JSON.parse(sessionStorage.getItem(sessionKey)||'null');
 if(!session)throw Error('Abra o Digi-Pet pelo card no App.');
 window.opener=null;
 const script=document.createElement('script');script.src=new URL('./digi-pet-trial.js',import.meta.url).href;
 script.onload=()=>{if(window.DigiPetAppTrial)window.DigiPetAppTrial.open({userId:session.userId,standalone:true});else status.textContent='Não foi possível abrir. Recarregue esta janela.';};
 script.onerror=()=>{status.textContent='Não foi possível carregar o Digi-Pet. Recarregue esta janela.';};document.head.append(script);
}catch(error){status.textContent=error.message;const link=document.createElement('a');link.href='./';link.textContent='Voltar ao Digimon App';status.append(link);}
