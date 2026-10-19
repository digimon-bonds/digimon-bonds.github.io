import {FORUM_ORIGIN,normalizeForumUser,ownerFields,sheetURL} from './forum-owner.js';
let currentUser=null,connection='pending',capabilities={};
const listeners=new Set(),owners=new Map(),inflight=new Map();
let host=null,identityRequest=null;
export const getForumUser=()=>currentUser;
export const getForumConnection=()=>connection;
export const getForumCapabilities=()=>capabilities;
export const getForumOwners=()=>owners;
export function subscribeForumIdentity(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
const notify=()=>listeners.forEach(listener=>listener(currentUser));
export function initForumIdentity(target=window){
 if(host)return;host=target;
 if(host.parent===host){connection='standalone';return;}
 const requestIdentity=()=>{identityRequest=host.crypto.randomUUID();host.parent.postMessage({type:'bonds:identity:request',version:1,requestId:identityRequest},FORUM_ORIGIN);};
 host.addEventListener('message',event=>{
  if(event.origin!==FORUM_ORIGIN||event.source!==host.parent||!event.data||event.data.version!==1)return;
  const data=event.data;
  if(data.type==='bonds:identity:available'){requestIdentity();return;}
  if(data.type==='bonds:identity'&&data.requestId===identityRequest){currentUser=normalizeForumUser(data.currentUser);capabilities={publishing:!!data.capabilities?.publishing};connection=currentUser?'verified':'guest';notify();return;}
  if(data.type==='bonds:sheet-owners'&&inflight.has(data.requestId)){
   const job=inflight.get(data.requestId);inflight.delete(data.requestId);host.clearTimeout(job.timer);
   for(const item of Array.isArray(data.owners)?data.owners:[]){const url=sheetURL(item.url),owner=ownerFields(item);if(job.urls.includes(url)&&owner.ownerForumUserId)owners.set(url,owner);}
   job.resolve(owners);notify();
  }
 });
 requestIdentity();host.setTimeout(()=>{if(connection==='pending'){connection='unavailable';notify();}},8000);
}
export function requestForumOwners(urls){
 const wanted=[...new Set(urls.map(sheetURL).filter(url=>url&&!owners.has(url)))].slice(0,10);
 if(!host||host.parent===host||!wanted.length)return Promise.resolve(owners);
 if([...inflight.values()].some(job=>wanted.every(url=>job.urls.includes(url))))return Promise.resolve(owners);
 const requestId=host.crypto.randomUUID();
 return new Promise(resolve=>{const timer=host.setTimeout(()=>{inflight.delete(requestId);resolve(owners);},15000);inflight.set(requestId,{urls:wanted,resolve,timer});host.parent.postMessage({type:'bonds:sheet-owners:request',version:1,requestId,urls:wanted},FORUM_ORIGIN);});
}
