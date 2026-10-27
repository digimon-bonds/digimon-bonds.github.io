// One-time local launch grant; never contains the password. Not RPG authorization.
const status=document.getElementById('pet-window-status'),sessionKey='digimon-bonds:digi-pet:window-session:v1';
try{
 const token=location.hash.slice(1);let session;
 if(token){
  history.replaceState(null,'',location.pathname+location.search);
  if(!/^[\da-f-]{36}$/i.test(token))throw Error('Abra o Digi-Pet pelo card no App.');
  const key='digimon-bonds:digi-pet:launch:'+token,raw=localStorage.getItem(key);localStorage.removeItem(key);
  const grant=raw?JSON.parse(raw):null;
  if(!grant||!Number.isFinite(grant.at)||Date.now()-grant.at<0||Date.now()-grant.at>30000)throw Error('Acesso expirado. Abra novamente pelo card no App.');
  session={userId:grant.userId||null};sessionStorage.setItem(sessionKey,JSON.stringify(session));
 }else session=JSON.parse(sessionStorage.getItem(sessionKey)||'null');
 if(!session)throw Error('Abra o Digi-Pet pelo card no App.');
 // The pet remains usable after the App/forum window is closed.
 window.opener=null;
 const script=document.createElement('script');script.src=new URL('./digi-pet-trial.js',import.meta.url).href;
 script.onload=()=>{if(window.DigiPetAppTrial)window.DigiPetAppTrial.open({userId:session.userId,standalone:true});else status.textContent='Não foi possível abrir. Recarregue esta janela.';};
 script.onerror=()=>{status.textContent='Não foi possível carregar o Digi-Pet. Recarregue esta janela.';};document.head.append(script);
}catch(error){status.textContent=error.message;const link=document.createElement('a');link.href='./';link.textContent='Voltar ao Digimon App';status.append(link);}
