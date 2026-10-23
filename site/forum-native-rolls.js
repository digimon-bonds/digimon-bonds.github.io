import {FORUM_ORIGIN,forumProfileId} from './forum-owner.js';

const BOT_ID='1',MARKER='!@DIGIMON#$BONDS%&';
const normalize=value=>String(value||'').normalize('NFC').replace(/\s+/g,' ').trim();
const postId=node=>/^p[1-9]\d*$/.test(node?.id||'')&&!node.parentElement?.closest?.('.post')?node.id:null;
const imageURLs=content=>[...content.querySelectorAll('img')].map(img=>new URL(img.getAttribute('src'),FORUM_ORIGIN).href);
const sameImages=(a,b)=>a.length===b.length&&a.every((value,i)=>value===b[i]);
// A normal permalink opens the attached result; the official view is explicit.
export const nativeRollOfficialView=(location,id)=>new URLSearchParams(location.search).get('bos_roll_post')===id.slice(1);
const topicReads=new WeakMap();
// Shared with the existing activity feed and last-message cards: one read per topic page.
export function readNativeRollTopic(host,ref){
 const url=new URL(ref,host.location.href);
 if(url.origin!==FORUM_ORIGIN||!/^\/t\d+(?:p\d+)?(?:-|$)/.test(url.pathname))return Promise.reject(Error('Tópico inválido.'));
 url.hash='';url.searchParams.delete('bos_roll_post');
 let reads=topicReads.get(host);if(!reads){reads=new Map();topicReads.set(host,reads);}
 const key=url.href,cached=reads.get(key);if(cached&&cached.expires>Date.now())return cached.pending;
 const entry={pending:null,expires:Infinity};
 const pending=(async()=>{
  const response=await host.fetch(key,{credentials:'same-origin',signal:AbortSignal.timeout(12000)});
  const received=new URL(response.url);if(!response.ok||received.origin!==FORUM_ORIGIN||received.pathname!==url.pathname)throw Error('Página oficial indisponível.');
  const html=await response.text();if(html.length>2000000)throw Error('Página oficial muito grande.');
  return new host.DOMParser().parseFromString(html,'text/html');
 })().then(doc=>{entry.expires=Date.now()+30000;return doc;}).catch(error=>{if(reads.get(key)===entry)reads.delete(key);throw error;});entry.pending=pending;reads.set(key,entry);return pending;
}
function author(post){
 const profile=post.querySelector('.postprofile[id="profile'+post.id.slice(1)+'"]'),native=profile?.querySelector('[data-bos-roll-origin]')||profile;
 const ids=[...new Set([...native?.querySelectorAll('dt a[href]')||[]].map(a=>forumProfileId(a.getAttribute('href'))).filter(Boolean))];
 const name=native?.querySelector('.bos-author-card > strong,dt > strong,dt > a:not(:has(img))')?.textContent;
 return {id:ids.length===1?ids[0]:null,name:normalize(name)};
}
// Read only the server HTML, before the existing formatter removes its preamble.
export function nativeRollMetadata(doc){
 return [...doc.querySelectorAll('.post[id^="p"]')].filter(postId).map(post=>{
  const content=post.querySelector('.postbody > .content'),who=author(post);
  const text=normalize(content?.textContent),match=text.match(/^O membro\s+['“](.+?)['”]\s+realizou a seguinte ação:/);
  const generated=who.id===BOT_ID&&match&&text.includes(MARKER)&&content.querySelector(':scope > div > hr')&&content.querySelector(':scope > div > img')&&!content.querySelector('table,style,article,section,script,iframe,form,input');
  return {id:post.id,authorId:who.id,authorName:who.name,actor:generated?normalize(match[1]):null,images:generated?imageURLs(content):[],narrative:!!(content&&who.id&&who.name&&!match&&(text||content.children.length))};
 });
}
// DOM order, never nearest matching author: an intervening post breaks the link.
export function nativeRollPlan(posts){
 const plan=[],linked=new Map(),seen=new Set();
 for(let i=0;i<posts.length;i++){
  const roll=posts[i],previous=posts[i-1];
  if(seen.has(roll.id))return [];seen.add(roll.id);
  if(roll.authorId!==BOT_ID||!roll.actor||!previous)continue;
  const source=previous.narrative?previous:linked.get(previous.id);
  if(!source||source.authorName!==roll.actor||!source.authorId||previous.actor&&previous.actor!==roll.actor)continue;
  linked.set(roll.id,source);plan.push({roll,source,previousId:previous.id});
 }
 return plan;
}
export function nativeRollLastAuthor(doc,ref){
 const url=new URL(ref,FORUM_ORIGIN),id='p'+url.hash.replace(/^#p?/,'');
 if(url.origin!==FORUM_ORIGIN||!/^p[1-9]\d*$/.test(id))return null;
 const pair=nativeRollPlan(nativeRollMetadata(doc)).find(item=>item.roll.id===id);if(!pair)return null;
 const profile=doc.getElementById(pair.source.id)?.querySelector('.postprofile'),img=profile?.querySelector('dt img[src]');
 let avatar=null;try{if(img){const image=new URL(img.getAttribute('src'),FORUM_ORIGIN);if(image.protocol==='https:')avatar=image.href;}}catch{}
 return {forumUserId:pair.source.authorId,username:pair.source.authorName,href:url.pathname+url.search+'#'+pair.source.id.slice(1),avatar};
}
const lastPostInstallations=new WeakMap();
export function installNativeRollLastPosts(host=window){
 if(host.location.origin!==FORUM_ORIGIN||lastPostInstallations.has(host))return lastPostInstallations.get(host);
 const doc=host.document,records=new Map(),jobs=new Map(),queue=[];let queued=false,running=0,stopped=false;
 const active=()=>doc.documentElement.classList.contains('bonds-os-preview')&&doc.documentElement.dataset.bosInitialized==='ready';
 function restore(){for(const [node,nodes] of records){node.replaceChildren(...nodes);node.removeAttribute('data-bos-roll-last-author');}records.clear();}
 function apply(node,ref,record){
  if(stopped||!active()||!node.isConnected||records.has(node)||!record)return;
  const current=[...node.querySelectorAll('a[href]')].find(a=>{try{return new URL(a.getAttribute('href'),host.location.href).href===ref;}catch{return false;}});if(!current)return;
  const copy=node.cloneNode(true);let changed=false;
  for(const link of copy.querySelectorAll('a[href]')){
   if(forumProfileId(link.getAttribute('href'))===BOT_ID){link.href='/u'+record.forumUserId;link.textContent=record.username;changed=true;}
   else if(new URL(link.getAttribute('href'),host.location.href).href===ref)link.href=record.href;
  }
  if(!changed)return;
  const avatar=copy.querySelector('.lastpost-avatar img');if(avatar){if(record.avatar){avatar.src=record.avatar;avatar.alt=record.username;}else avatar.remove();}
  records.set(node,[...node.childNodes]);node.replaceChildren(...copy.childNodes);node.dataset.bosRollLastAuthor=record.forumUserId;
 }
 function pump(){while(running<2&&queue.length){const job=queue.shift();running++;job().finally(()=>{running--;pump();});}}
 function scan(){
  if(stopped)return;if(!active()){restore();return;}
  for(const node of doc.querySelectorAll('.lastpost')){
   if(records.has(node)||![...node.querySelectorAll('a[href]')].some(a=>forumProfileId(a.getAttribute('href'))===BOT_ID))continue;
   const refs=[...node.querySelectorAll('a[href]')].map(a=>{try{return new URL(a.getAttribute('href'),host.location.href);}catch{return null;}});
   const url=refs.find(u=>u&&u.origin===FORUM_ORIGIN&&/^\/t\d+(?:p\d+)?(?:-|$)/.test(u.pathname)&&/^#p?[1-9]\d*$/.test(u.hash));if(!url)continue;
   const ref=url.href;if(!jobs.has(ref)){
    let finish;const result=new Promise(resolve=>{finish=resolve;});jobs.set(ref,result);
    queue.push(async()=>{try{finish(nativeRollLastAuthor(await readNativeRollTopic(host,ref),ref));}catch{finish(null);}});pump();
   }
   jobs.get(ref).then(record=>apply(node,ref,record));
  }
 }
 function schedule(){if(queued||stopped)return;queued=true;const run=()=>{queued=false;scan();};if(host.requestAnimationFrame)host.requestAnimationFrame(run);else queueMicrotask(run);}
 const observer=new host.MutationObserver(schedule);observer.observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-bos-initialized']});
 doc.addEventListener('bonds-os-ready',schedule);doc.addEventListener('bonds-os-failed',restore);
 const controller={refresh:schedule,restore(){stopped=true;observer.disconnect();restore();}};lastPostInstallations.set(host,controller);schedule();return controller;
}
const category=group=>group.classList.contains('vantagem')?'VANTAGEM':group.classList.contains('desvantagem')?'DESVANTAGEM':'PADRÃO';
function renderedPayload(post,metadata){
 const content=post.querySelector('.postbody > .content');
 if(post.dataset.rollsRoyceProcessado!=='true'||!content||author(post).id!==BOT_ID||!sameImages(imageURLs(content),metadata.images))return null;
 if([...content.querySelectorAll('*')].some(node=>!['DIV','IMG','BR','SPAN','STRONG','B','HR'].includes(node.tagName)||node.hasAttribute('contenteditable')||node.getAttributeNames().some(name=>/^on/i.test(name))))return null;
 const groups=[...content.querySelectorAll('.padrao,.vantagem,.desvantagem')];
 if(!groups.length||groups.some(group=>!/^\d+ SUCESSOS? TOTA(?:L|IS)$/.test(group.getAttribute('data-sucessos')||'')||!group.querySelector('img')))return null;
 if(groups.reduce((count,group)=>count+group.querySelectorAll('img').length,0)!==metadata.images.length)return null;
 return content;
}
export function createNativeRollPresentation(host,metadata){
 const doc=host.document,root=doc.documentElement,records=new Map(),groups=new Map(),plan=nativeRollPlan(metadata);
 let failed=false,focusedHash=null;
 const active=()=>root.classList.contains('bonds-os-preview')&&root.dataset.bosInitialized==='ready'&&host.getComputedStyle(root).getPropertyValue('--bos-native-roll-view').trim()==='1';
 const make=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};
 function restore(){
  root.removeAttribute('data-bos-roll-attachments');
  for(const record of records.values())reveal(record);
  for(const group of groups.values())group.remove();records.clear();groups.clear();
 }
 function reveal(record){record.post.removeAttribute('data-bos-roll-attached');if(record.display.value)record.post.style.setProperty('display',record.display.value,record.display.priority);else record.post.style.removeProperty('display');}
 function discardMirror(id){const record=records.get(id);if(!record)return;reveal(record);record.card.remove();records.delete(id);}
 function groupFor(source){
  if(groups.get(source.id)?.isConnected)return groups.get(source.id);groups.get(source.id)?.remove();groups.delete(source.id);
  const content=source.querySelector('.postbody > .content'),group=make('details','bos-native-rolls'),summary=make('summary','bos-native-rolls-title');
  group.open=true;group.dataset.bosRollSource=source.id;summary.append(make('span','','ROLL // RESULTADO'),make('span','bos-native-rolls-kind','ROLAGEM NATIVA'));
  group.append(summary,make('div','bos-native-rolls-list'));content.after(group);groups.set(source.id,group);return group;
 }
 function mirror(post,content){
  const card=make('article','bos-native-roll-entry'),head=make('header','bos-native-roll-entry-head'),official=make('a','','Ver post oficial ↗');
  const search=new URLSearchParams(host.location.search);search.set('bos_roll_post',post.id.slice(1));
  official.href=host.location.pathname+'?'+search.toString()+'#'+post.id.slice(1);head.append(make('span','','FORUMEIROS // #'+post.id.slice(1)),official);
  const payload=content.cloneNode(true);payload.className='bos-native-roll-payload';payload.setAttribute('contenteditable','false');
  for(const node of [payload,...payload.querySelectorAll('[id]')])node.removeAttribute('id');
  for(const group of payload.querySelectorAll('.padrao,.vantagem,.desvantagem')){
   group.classList.add('bos-native-roll-dice');const label=make('div','bos-native-roll-dice-heading');
   label.append(make('span','',category(group)),make('strong','',group.getAttribute('data-sucessos')));group.prepend(label);
  }
  card.append(head,payload);return card;
 }
 function refresh(){
  if(failed)return;
  try{
   if(!active()){restore();return;}
   const posts=[...doc.querySelectorAll('.post[id^="p"]')].filter(postId),byId=new Map(posts.map(post=>[post.id,post])),kept=new Set();
   if(byId.size!==posts.length){restore();return;}
   for(const item of plan){
    const post=byId.get(item.roll.id),source=byId.get(item.source.id),previous=posts[posts.indexOf(post)-1],who=source&&author(source);
    const content=post&&renderedPayload(post,item.roll);
    if(!source||!content||previous?.id!==item.previousId||who.id!==item.source.authorId||who.name!==item.source.authorName){discardMirror(item.roll.id);continue;}
    // Show exactly one representation, including links to the latest roll on mobile.
    if(nativeRollOfficialView(host.location,post.id)){discardMirror(post.id);continue;}
    let old=records.get(post.id);if(old&&old.post!==post){discardMirror(post.id);old=null;}
    const fingerprint=content.outerHTML;
    if(!old||old.fingerprint!==fingerprint||!old.card.isConnected){
     const card=mirror(post,content),group=groupFor(source);if(old?.card.isConnected)old.card.replaceWith(card);else group.querySelector('.bos-native-rolls-list').append(card);
     const display=old?.display||{value:post.style.getPropertyValue('display'),priority:post.style.getPropertyPriority('display')};
     records.set(post.id,{post,card,fingerprint,display});
    }
    if(post.dataset.bosRollAttached!==source.id)post.dataset.bosRollAttached=source.id;
    // Commit the mirror and hide its original in the same task, independent of CSS races.
    if(post.style.getPropertyValue('display')!=='none'||post.style.getPropertyPriority('display')!=='important')post.style.setProperty('display','none','important');
    kept.add(post.id);
   }
   for(const id of records.keys())if(!kept.has(id))discardMirror(id);
   for(const [id,group] of groups)if(!group.querySelector('.bos-native-roll-entry')){group.remove();groups.delete(id);}
   if(records.size){if(root.dataset.bosRollAttachments!=='ready')root.dataset.bosRollAttachments='ready';}else root.removeAttribute('data-bos-roll-attachments');
   const hash=host.location.hash,linked=records.get(hash.replace(/^#(?:p)?/,'p'));
   if(hash!==focusedHash&&linked){focusedHash=hash;linked.card.scrollIntoView?.({block:'center'});}else if(!hash)focusedHash=null;
  }catch(error){failed=true;restore();host.console?.warn('[BONDS OS] Roll anexado indisponível; posts oficiais preservados.',error);}
 }
 return {refresh,restore};
}
const installations=new WeakMap();
export function installNativeRollAttachments(host=window){
 if(host.location.origin!==FORUM_ORIGIN||installations.has(host))return installations.get(host);
 const doc=host.document,root=doc.documentElement,captured=new Map();let queued=false,loading=false,failed=false,presentation=null;
 host.__bondsReadRollTopic=ref=>readNativeRollTopic(host,ref);
 const active=()=>root.classList.contains('bonds-os-preview')&&root.dataset.bosInitialized==='ready';
 async function scan(){
  if(failed)return;
  // Capture native preambles before the platform formatter removes them, when possible.
  if(!presentation)try{for(const item of nativeRollMetadata(doc))if(item.actor||item.narrative&&!captured.get(item.id)?.actor)captured.set(item.id,item);}catch{captured.clear();}
  if(!active()){presentation?.restore();return;}
  if(presentation){presentation.refresh();return;}
  if(loading||![...doc.querySelectorAll('.post[data-rolls-royce-processado="true"]')].filter(postId).some(post=>author(post).id===BOT_ID))return;
  const liveIDs=[...doc.querySelectorAll('.post[id^="p"]')].filter(postId).map(post=>post.id),early=liveIDs.map(id=>captured.get(id)).filter(Boolean);
  const formatted=[...doc.querySelectorAll('.post[data-rolls-royce-processado="true"]')].filter(postId);
  if(formatted.length&&formatted.every(post=>captured.get(post.id)?.actor)){presentation=createNativeRollPresentation(host,early);presentation.refresh();return;}
  loading=true;
  try{
   const raw=await readNativeRollTopic(host,host.location.href);
   if(failed||!active())return;
   presentation=createNativeRollPresentation(host,nativeRollMetadata(raw));presentation.refresh();
  }catch(error){failed=true;presentation?.restore();host.console?.warn('[BONDS OS] Mantida a apresentação normal dos dados.',error);}
  finally{loading=false;}
 }
 function schedule(){if(queued||failed)return;queued=true;const run=()=>{queued=false;scan();};if(host.requestAnimationFrame)host.requestAnimationFrame(run);else queueMicrotask(run);}
 const observer=new host.MutationObserver(schedule);
 observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-bos-roll-attached','data-bos-initialized','data-sucessos','data-rolls-royce-processado']});
 host.addEventListener('hashchange',schedule);doc.addEventListener('bonds-os-ready',schedule);doc.addEventListener('bonds-os-failed',()=>presentation?.restore());
 const controller={refresh:schedule,restore:()=>{failed=true;observer.disconnect();presentation?.restore();}};installations.set(host,controller);scan();return controller;
}
