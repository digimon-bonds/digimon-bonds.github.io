import {FORUM_ORIGIN,forumProfileId} from './forum-owner.js';

const BOT_ID='1',MARKER='!@DIGIMON#$BONDS%&';
const normalize=value=>String(value||'').normalize('NFC').replace(/\s+/g,' ').trim();
const postId=node=>/^p[1-9]\d*$/.test(node?.id||'')&&!node.parentElement?.closest?.('.post')?node.id:null;
const imageURLs=content=>[...content.querySelectorAll('img')].map(img=>new URL(img.getAttribute('src'),FORUM_ORIGIN).href);
const sameImages=(a,b)=>a.length===b.length&&a.every((value,i)=>value===b[i]);
// A normal permalink opens the attached result; the official view is explicit.
export const nativeRollOfficialView=(location,id)=>new URLSearchParams(location.search).get('bos_roll_post')===id.slice(1);
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
  for(const record of records.values())record.post.removeAttribute('data-bos-roll-attached');
  for(const group of groups.values())group.remove();records.clear();groups.clear();
 }
 function discardMirror(id){const record=records.get(id);if(!record)return;record.post.removeAttribute('data-bos-roll-attached');record.card.remove();records.delete(id);}
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
    const fingerprint=content.outerHTML,old=records.get(post.id);
    if(!old||old.fingerprint!==fingerprint||!old.card.isConnected){
     const card=mirror(post,content),group=groupFor(source);if(old?.card.isConnected)old.card.replaceWith(card);else group.querySelector('.bos-native-rolls-list').append(card);
     records.set(post.id,{post,card,fingerprint});
    }
    post.dataset.bosRollAttached=source.id;
    kept.add(post.id);
   }
   for(const id of records.keys())if(!kept.has(id))discardMirror(id);
   for(const [id,group] of groups)if(!group.querySelector('.bos-native-roll-entry')){group.remove();groups.delete(id);}
   if(records.size)root.dataset.bosRollAttachments='ready';else root.removeAttribute('data-bos-roll-attachments');
   const hash=host.location.hash,linked=records.get(hash.replace(/^#(?:p)?/,'p'));
   if(hash!==focusedHash){focusedHash=hash;if(linked)linked.card.scrollIntoView?.({block:'center'});}
  }catch(error){failed=true;restore();host.console?.warn('[BONDS OS] Roll anexado indisponível; posts oficiais preservados.',error);}
 }
 return {refresh,restore};
}
const installations=new WeakMap();
export function installNativeRollAttachments(host=window){
 if(host.location.origin!==FORUM_ORIGIN||installations.has(host))return installations.get(host);
 const doc=host.document,root=doc.documentElement;let queued=false,loading=false,failed=false,presentation=null;
 const active=()=>root.classList.contains('bonds-os-preview')&&root.dataset.bosInitialized==='ready';
 async function scan(){
  if(failed)return;
  if(!active()){presentation?.restore();return;}
  if(presentation){presentation.refresh();return;}
  if(loading||![...doc.querySelectorAll('.post[data-rolls-royce-processado="true"]')].filter(postId).some(post=>author(post).id===BOT_ID))return;
  loading=true;
  try{
   const url=new URL(host.location.href);url.hash='';
   if(!/^\/t\d+(?:p\d+)?(?:-|$)/.test(url.pathname))return;
   const response=await host.fetch(url.href,{credentials:'same-origin',signal:AbortSignal.timeout(12000)});
   const received=new URL(response.url);if(!response.ok||received.origin!==FORUM_ORIGIN||received.pathname!==url.pathname)throw Error('Página oficial indisponível.');
   const html=await response.text();if(html.length>2000000)throw Error('Página oficial muito grande.');
   const raw=new host.DOMParser().parseFromString(html,'text/html');
   presentation=createNativeRollPresentation(host,nativeRollMetadata(raw));presentation.refresh();
  }catch(error){failed=true;presentation?.restore();host.console?.warn('[BONDS OS] Mantida a apresentação normal dos dados.',error);}
  finally{loading=false;}
 }
 function schedule(){if(queued||failed)return;queued=true;queueMicrotask(()=>{queued=false;scan();});}
 const observer=new host.MutationObserver(schedule);
 observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-bos-initialized','data-sucessos','data-rolls-royce-processado']});
 host.addEventListener('hashchange',schedule);doc.addEventListener('bonds-os-ready',schedule);doc.addEventListener('bonds-os-failed',()=>presentation?.restore());
 const controller={refresh:schedule,restore:()=>{failed=true;observer.disconnect();presentation?.restore();}};installations.set(host,controller);schedule();return controller;
}
