import {FORUM_ORIGIN,normalizeForumUser,sheetURL,extractSheetOwner} from '../forum-owner.js';
const APP_ORIGIN='https://digimon-bonds.github.io';
// This augments the already installed overlay. It never creates another iframe or login.
export function installForumAppBridge(host=window){
 if(host.location.origin!==FORUM_ORIGIN||host.__bondsForumAppBridge)return;host.__bondsForumAppBridge=true;
 const doc=host.document,known=new WeakSet(),cache=new Map();let approved=null,identityChallenge=null;
 const frame=()=>doc.getElementById('db-app-frame');
 const send=(target,data)=>target.contentWindow?.postMessage({...data,version:1},APP_ORIGIN);
 function identity(){const data=host._userdata;return data&&String(data.session_logged_in)==='1'?normalizeForumUser({forumUserId:data.user_id,forumUsername:data.username}):null;}
 async function publicDocument(url){const response=await host.fetch(url,{credentials:'same-origin',signal:AbortSignal.timeout(12000)});if(!response.ok||new URL(response.url).origin!==FORUM_ORIGIN)throw Error('Leitura pública indisponível');const html=await response.text();if(html.length>2000000)throw Error('Página muito grande');return new host.DOMParser().parseFromString(html,'text/html');}
 async function approvedURLs(){if(!approved)approved=publicDocument(FORUM_ORIGIN+'/f9-fichas-aprovadas').then(page=>new Set([...page.querySelectorAll('a.topictitle[href]')].map(link=>sheetURL(link.getAttribute('href'))).filter(Boolean))).catch(error=>{approved=null;throw error;});return approved;}
 async function readOwner(url){if(!cache.has(url))cache.set(url,(async()=>{if(!(await approvedURLs()).has(url))return null;const page=await publicDocument(url),owner=extractSheetOwner(page);return owner.ownerForumUserId?{url,...owner}:null;})().catch(()=>{cache.delete(url);return null;}));return cache.get(url);}
 function attach(){const target=frame();if(!target||known.has(target))return;known.add(target);target.addEventListener('load',()=>send(target,{type:'bonds:identity:available'}));send(target,{type:'bonds:identity:available'});}
 host.addEventListener('message',async event=>{
  const target=frame(),data=event.data;
  if(!target||event.source!==target.contentWindow||event.origin!==APP_ORIGIN||!data||data.version!==1||typeof data.requestId!=='string'||!/^[\w-]{20,80}$/.test(data.requestId))return;
  if(data.type==='bonds:identity:request'){identityChallenge=data.requestId;send(target,{type:'bonds:identity',requestId:data.requestId,currentUser:identity()});}
  if(data.type==='bonds:sheet-owners:request'){
   const urls=[...new Set((Array.isArray(data.urls)?data.urls:[]).map(sheetURL).filter(Boolean))].slice(0,10),results=[];
   // Two reads at a time; cache is confined to this forum page's lifetime.
   for(let i=0;i<urls.length;i+=2)results.push(...await Promise.all(urls.slice(i,i+2).map(readOwner)));
   if(frame()===target)send(target,{type:'bonds:sheet-owners',requestId:data.requestId,owners:results.filter(Boolean)});
  }
 });
 doc.addEventListener('click',event=>{if(event.target.closest?.('#db-app-button')&&frame()&&identityChallenge)send(frame(),{type:'bonds:identity',requestId:identityChallenge,currentUser:identity()});});
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
 const observer=new host.MutationObserver(attach);observer.observe(doc.documentElement,{childList:true,subtree:true});
}
if(typeof window!=='undefined')installForumAppBridge();
