import {FORUM_ORIGIN,forumProfileId,forumUserId,sheetURL,extractSheetOwner} from './forum-owner.js';

const STORE='bonds:profile-devices:v1',INDEX_TTL=120000;
const accountName=value=>String(value||'').trim().normalize('NFC').toLocaleLowerCase('pt-BR');
export function deviceImageURL(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)return null;
  if(u.origin==='https://bonds-character-app.mateuzim-alves.chatgpt.site'&&/^\/media\/digivices\/[a-f0-9]{64}\.png$/.test(u.pathname))return u.href;
  if(u.origin==='https://digimon-bonds.github.io'&&/^\/assets\/sheet-repairs\/[a-z0-9-]+\.png$/.test(u.pathname))return u.href;
 }catch{}return null;
}
export async function deviceFromSheetURL(value){
 const url=new URL(value);if(url.origin!=='https://digimon-bonds.github.io'||url.pathname!=='/sheet.html'||url.username||url.password)throw Error('Ficha visual inválida');
 const encoded=url.hash.slice(1);if(!/^[A-Za-z0-9_-]+$/.test(encoded)||encoded.length>1000000)throw Error('Ficha visual inválida');
 const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();throw Error('Ficha muito grande');}chunks.push(value);}
 const tree=JSON.parse(await new Blob(chunks).text());if(tree?.tag!=='article'||tree.attrs?.id!=='preview')throw Error('Ficha inválida');
 let count=0;const forms=[];
 function walk(node,depth=0,form=null){
  if(++count>12000||depth>45)throw Error('Ficha muito grande');if(typeof node==='string')return;
  if(!node||typeof node!=='object'||!Array.isArray(node.children))throw Error('Ficha inválida');
  const a=node.attrs||{};
  if(a['data-forum-form']){form={stage:a['data-forum-form'],unlocked:a['data-locked']==='false',active:!('hidden' in a),image:null};forms.push(form);}
  if(form&&node.tag==='img'&&String(a.class||'').split(/\s+/).includes('forum-device-image'))form.image=deviceImageURL(a.src);
  for(const child of node.children)walk(child,depth+1,form);
 }
 walk(tree);const usable=forms.filter(f=>f.unlocked&&f.image&&f.stage!=='baby');
 const selected=usable.find(f=>f.active)||usable.find(f=>f.stage==='rookie')||usable[0];
 return selected?{image:selected.image,stage:selected.stage}:null;
}
export function approvedDeviceTopics(doc){
 const found=new Map();
 for(const row of doc.querySelectorAll('.forumbg li.row')){
  const url=sheetURL(row.querySelector('a.topictitle[href]')?.getAttribute('href'));if(!url)continue;
  const author=row.querySelector('.span-tab'),links=author?.querySelectorAll('a[href]')||[];
  const id=[...links].map(a=>forumProfileId(a.getAttribute('href'))).find(Boolean)||null;
  const name=author?.querySelector('strong')?.textContent?.trim()||'';
  found.set(url,{url,ownerForumUserId:id,ownerForumUsername:name.slice(0,80)});
 }return [...found.values()];
}
export function matchesDeviceOwner(identity,record){
 if(!record?.ownerForumUserId)return false;
 if(identity.id)return forumUserId(identity.id)===record.ownerForumUserId;
 // Guests cannot see native profile links. Resolve their native account label against
 // the account metadata verified on the approved sheet; never use character/player fields.
 return !!identity.username&&accountName(identity.username)===accountName(record.ownerForumUsername);
}
export async function readProfileDevice(doc,url){
 const source=sheetURL(url);if(!source)return null;
 const approved=[...doc.querySelectorAll('.diretorio a[href]')].some(a=>{const u=new URL(a.getAttribute('href'),FORUM_ORIGIN);return u.origin===FORUM_ORIGIN&&/^\/f9(?:-|$)/.test(u.pathname);});
 if(!approved)return null;
 const owner=extractSheetOwner(doc);if(!owner.ownerForumUserId)return null;
 const frame=doc.querySelector('.post')?.querySelector('.postbody > .content')?.querySelector('iframe[src]');
 if(!frame)return null;const device=await deviceFromSheetURL(frame.getAttribute('src'));
 return device?{...owner,sheetURL:source,...device}:null;
}
export function createProfileDeviceDirectory(host){
 let indexJob=null,indexTime=0;const sheetJobs=new Map(),records=new Map();
 try{const saved=JSON.parse(host.localStorage.getItem(STORE)||'[]');if(Array.isArray(saved))for(const r of saved.slice(0,200))if(forumUserId(r.ownerForumUserId)&&sheetURL(r.sheetURL)&&deviceImageURL(r.image))records.set(r.ownerForumUserId,r);}catch{}
 function save(){try{host.localStorage.setItem(STORE,JSON.stringify([...records.values()].slice(-200)));}catch{}}
 async function publicDocument(url){
  const response=await host.fetch(url,{credentials:'same-origin',signal:AbortSignal.timeout(12000)});
  if(!response.ok||new URL(response.url).origin!==FORUM_ORIGIN)throw Error('Ficha indisponível');
  const html=await response.text();if(html.length>2500000)throw Error('Página muito grande');return new host.DOMParser().parseFromString(html,'text/html');
 }
 async function index(){
  if(!indexJob||Date.now()-indexTime>INDEX_TTL){indexTime=Date.now();indexJob=(async()=>{
   const queue=[FORUM_ORIGIN+'/f9-fichas-aprovadas'],seen=new Set(),topics=new Map();
   while(queue.length&&seen.size<10){const url=queue.shift();if(seen.has(url))continue;seen.add(url);const page=await publicDocument(url);
    for(const topic of approvedDeviceTopics(page))topics.set(topic.url,topic);
    for(const a of page.querySelectorAll('.pagination a[href]')){const u=new URL(a.getAttribute('href'),FORUM_ORIGIN);if(u.origin===FORUM_ORIGIN&&/^\/f9(?:p\d+)?-/.test(u.pathname)&&!seen.has(u.href))queue.push(u.href);}
   }return [...topics.values()];
  })().catch(error=>{indexJob=null;throw error;});}return indexJob;
 }
 async function lookup(identity,onCached=()=>{}){
  const cached=[...records.values()].find(r=>matchesDeviceOwner(identity,r));
  try{
   const topics=await index();
   const candidates=topics.filter(t=>identity.id&&t.ownerForumUserId===identity.id||cached&&t.url===cached.sheetURL||identity.username&&accountName(t.ownerForumUsername)===accountName(identity.username));
   if(cached)candidates.sort((a,b)=>Number(b.url===cached.sheetURL)-Number(a.url===cached.sheetURL));
   for(const candidate of candidates){
    if(cached&&cached.sheetURL===candidate.url)onCached(cached);
    if(!sheetJobs.has(candidate.url))sheetJobs.set(candidate.url,(async()=>{
     const r=await readProfileDevice(await publicDocument(candidate.url),candidate.url);
     if(r){if(candidate.ownerForumUserId&&candidate.ownerForumUserId!==r.ownerForumUserId)return null;records.set(r.ownerForumUserId,r);save();}
     else if(cached?.sheetURL===candidate.url){records.delete(cached.ownerForumUserId);save();}return r;
    })());
    const record=await sheetJobs.get(candidate.url);if(matchesDeviceOwner(identity,record))return record;
   }return null;
  }catch{return cached||null;}
 }
 return {lookup,refresh(){indexJob=null;sheetJobs.clear();}};
}
export function installForumProfileDevices(host=window){
 const doc=host.document;if(host.location.origin!==FORUM_ORIGIN||!doc.documentElement?.classList)return;
 if(host.__bondsProfileDevices){host.__bondsProfileDevices.scan();return;}
 const directory=createProfileDeviceDirectory(host);let queued=false,lastRefresh=Date.now();
 function identity(profile){
  const link=[...profile.querySelectorAll('dt a[href]')].map(a=>forumProfileId(a.getAttribute('href'))).find(Boolean);
  const name=profile.querySelector('.bos-author-card > strong,dt > strong,dt > a:not(:has(img))')?.textContent?.trim()||'';
  const post=profile.closest('.post'),first=post===doc.querySelector('.post')?extractSheetOwner(doc):null;
  return {id:link||first?.ownerForumUserId||null,username:name};
 }
 function mount(profile,record){
  if(!profile.isConnected)return;const previous=profile.querySelector('.bos-profile-device');
  if(!record){previous?.remove();const shell=profile.querySelector('.bos-player-link-card');if(shell){shell.replaceWith(...shell.childNodes);}delete profile.dataset.bosDeviceOwner;return;}
  if(previous?.dataset.sheet===record.sheetURL&&previous.querySelector('img')?.src===record.image)return;
  const card=doc.createElement('div');card.className='bos-profile-device';card.dataset.sheet=record.sheetURL;card.dataset.ownerForumUserId=record.ownerForumUserId;
  const label=doc.createElement('span');label.className='bos-profile-device-label';label.textContent='DIGIVICE // LINK ATIVO';
  const link=doc.createElement('a');link.href=record.sheetURL;link.title='Ir para a ficha';
  const image=doc.createElement('img');image.src=record.image;image.alt='Digivice personalizado de '+record.ownerForumUsername;image.loading='lazy';image.decoding='async';image.width=180;image.height=180;
  link.setAttribute('aria-label',link.title);link.append(image);card.append(label,link);
  let shell=profile.querySelector('.bos-player-link-card');
  if(!shell){const identity=profile.querySelector(':scope > dl');if(!identity)return;shell=doc.createElement('div');shell.className='bos-player-link-card';identity.before(shell);shell.append(identity);}
  profile.dataset.bosDeviceOwner=record.ownerForumUserId;if(previous)previous.replaceWith(card);else shell.append(card);
 }
 function scan(){
  if(queued||!doc.documentElement.classList.contains('bonds-os-preview'))return;queued=true;
  queueMicrotask(()=>{queued=false;for(const profile of doc.querySelectorAll('[data-bos-post] .postprofile')){
   if(profile.dataset.bosRollAuthor)continue;const who=identity(profile);if(!who.id&&!who.username)continue;
   directory.lookup(who,r=>mount(profile,r)).then(r=>mount(profile,r));
  }});
 }
 function refresh(){if(doc.visibilityState==='hidden'||Date.now()-lastRefresh<60000)return;lastRefresh=Date.now();directory.refresh();scan();}
 host.__bondsProfileDevices={scan};doc.addEventListener('bonds-os-ready',scan);host.addEventListener('focus',refresh);host.setInterval?.(refresh,180000);scan();
}
