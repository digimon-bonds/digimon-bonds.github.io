// The GitHub UI uses the existing service without navigating away or relying on third-party cookies.
const remote=location.hostname==='digimon-bonds.github.io';
const origin=remote?'https://bonds-character-app.mateuzim-alves.chatgpt.site':location.origin;
const narratorKey='bonds-battle-narrator-session';
const clientKey='bonds-battle-client';
function clientIdentity(){
 let value=localStorage.getItem(clientKey);
 if(!/^[a-f0-9]{64}$/.test(value||'')){
  value=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  localStorage.setItem(clientKey,value);
 }
 return value;
}
export async function apiFetch(path,options={}){
 const headers=new Headers(options.headers);
 if(remote){
  headers.set('X-Bonds-Client',clientIdentity());
  const session=sessionStorage.getItem(narratorKey);
  if(session)headers.set('Authorization','Bearer '+session);
 }
 const response=await fetch(new URL(path,origin),{...options,headers,credentials:remote?'omit':'same-origin'});
 if(remote&&new URL(path,origin).pathname==='/api/narrator'&&response.ok){
  const data=await response.clone().json();
  if(data.sessionToken)sessionStorage.setItem(narratorKey,data.sessionToken);
  else if(data.authorized===false)sessionStorage.removeItem(narratorKey);
 }
 return response;
}
