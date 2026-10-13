import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const source=await readFile(new URL('../site/forum-skin/bonds-os.js',import.meta.url),'utf8');
const context={URL,Set,Number,Array,LIMIT:10,location:{origin:'https://digimonbonds.forumeiros.com'},api:{},Map,Promise,AbortController,setTimeout,clearTimeout};
runInNewContext(source.slice(source.indexOf('  function topicURL('),source.indexOf('  function addActivity('))+'\nObject.assign(api,{topicURL,newest,parsePosts,pageOffset,topicKey,collectTopic,readPage,rollActor});',context);
const {topicURL,newest,parsePosts,pageOffset,topicKey}=context.api;
test('two authors in the same topic keep separate messages; only duplicate IDs collapse',()=>{
  const posts=newest([{id:455,author:'Mikazuchi Yuki',href:'/t58#455'},{id:456,author:'Omegamon',href:'/t58#456'},{id:455,author:'Mikazuchi Yuki',href:'/t58#455'}]);
  assert.deepEqual(Array.from(posts,p=>p.id),[456,455]);assert.equal(posts[1].author,'Mikazuchi Yuki');
});
test('messages are newest-first and bounded to ten',()=>{assert.deepEqual(Array.from(newest(Array.from({length:20},(_,id)=>({id}))),x=>x.id),[19,18,17,16,15,14,13,12,11,10]);});
test('topic requests stay on the current forum origin',()=>{
  assert.equal(topicURL('https://other.example/t58-title'),null);assert.equal(topicURL('javascript:alert(1)'),null);
  assert.equal(topicURL('/login'),null);assert.equal(topicURL('/t58p25-title#456').pathname,'/t58p25-title');
});
test('pagination treats first page as zero and retains topic identity',()=>{
  assert.equal(pageOffset(topicURL('/t58-title')),0);assert.equal(pageOffset(topicURL('/t58p25-title')),25);
  assert.equal(topicKey(topicURL('/t58p25-title')),'58');
});
test('sponsored p0 blocks and missing profiles are excluded',()=>{
  const makePost=(id,name='Author')=>({id:'p'+id,querySelector(s){
    if(s.startsWith('.postprofile'))return name?{querySelector:inner=>inner==='.author'?{textContent:'Hoje',closest:()=>({getAttribute:()=>'/t58-title#'+id})}:{textContent:name}}:null;
  }});
  const doc={querySelectorAll:()=>[makePost(0),makePost(456,'Omegamon'),makePost(455,'Mikazuchi Yuki'),makePost(454,null)]};
  const posts=parsePosts(doc,topicURL('/t58-title'),'Topic');
  assert.deepEqual(Array.from(posts,p=>p.id),[456,455]);assert.equal(posts[1].href,'/t58-title#455');
});
function postDocument(ids,previous=null) {
  return {querySelectorAll(selector){
    if(selector==='.pagination a[href]')return previous?[{getAttribute:()=>previous}]:[];
    return ids.map(id=>({id:'p'+id,querySelector:()=>({querySelector:inner=>inner==='.author'?
      {textContent:'Hoje',closest:()=>({getAttribute:()=>'/t58-title#'+id})}:{textContent:'Author'}})}));
  }};
}
test('reads previous page when a last page has just begun',async()=>{
  const calls=[];
  context.readPage=async url=>{calls.push(url.pathname);return url.pathname.includes('p25')?postDocument([500],'/t58-title'):postDocument([499,498]);};
  const posts=await context.api.collectTopic({url:topicURL('/t58p25-title'),title:'Topic'});
  assert.deepEqual(Array.from(posts,p=>p.id),[500,499,498]);assert.equal(calls.length,2);
});
test('previous-page failure keeps available current messages and marks partial',async()=>{
  context.readPage=async url=>{if(!url.pathname.includes('p25'))throw Error('Unavailable');return postDocument([500],'/t58-title');};
  const posts=await context.api.collectTopic({url:topicURL('/t58p25-title'),title:'Topic'});
  assert.equal(posts[0].id,500);assert.equal(posts.partial,true);
});

test('one update caches in-flight page requests across hash variants',async()=>{
 const requests=[];context.fetch=async (url,opts)=>{requests.push({url,opts});return {ok:true,text:async()=>'<html></html>'}};
 context.DOMParser=class{parseFromString(){return {page:true}}};
 // Earlier pagination tests replace the function in this VM; restore the implementation.
 runInNewContext(source.slice(source.indexOf('  function readPage('),source.indexOf('  function topicsFrom('))+'api.readPage=readPage;',context);
 const cache=new Map(),a=context.api.readPage(topicURL('/t58-title#1'),cache),b=context.api.readPage(topicURL('/t58-title#2'),cache);
 assert.equal(a,b);await a;assert.equal(requests.length,1);assert.equal(requests[0].opts.credentials,'same-origin');assert.equal(requests[0].opts.mode,'same-origin');
 await context.api.readPage(topicURL('/t58-title'),new Map());assert.equal(requests.length,2);
 await assert.rejects(context.api.readPage(new URL('https://external.example/t58-x'),cache),/Origem/);
});
test('per-request timeout aborts and always clears its timer',async()=>{
 let timeout,cleared=0;context.setTimeout=(fn,ms)=>{assert.equal(ms,12000);timeout=fn;return 1};context.clearTimeout=()=>cleared++;
 context.fetch=(url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('aborted'))));
 const pending=context.api.readPage(topicURL('/t1-timeout'),new Map());timeout();await assert.rejects(pending,/aborted/);assert.equal(cleared,1);
});

function activityEnvironment(idle=true){
 const made=[],timers=new Map(),events={},idleTasks=new Map();let id=0;
 function node(tag,cls='',text=''){const n={tag,className:cls,textContent:text,children:[],handlers:{},attrs:{},append(...nodes){this.children.push(...nodes)},appendChild(n){this.append(n)},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},replaceChildren(...n){this.children=n},addEventListener(k,fn){this.handlers[k]=fn}};made.push(n);return n;}
 let resolveRead,reads=0;const pending=new Promise(resolve=>resolveRead=resolve);
 const c={make:node,newest:x=>x,document:{readyState:'loading',querySelector:()=>null},window:{addEventListener(k,fn){events[k]=fn}},setTimeout(fn){const n=++id;timers.set(n,fn);return n},clearTimeout(n){timers.delete(n)},Map,Promise,URL,location:{origin:'https://digimonbonds.forumeiros.com'},readPage:()=>{reads++;return pending},topicsFrom:()=>[],api:{}};
 if(idle){c.requestIdleCallback=(fn,opts)=>{assert.equal(opts.timeout,2000);const n=++id;idleTasks.set(n,fn);return n};c.cancelIdleCallback=n=>idleTasks.delete(n)}
 runInNewContext(source.slice(source.indexOf('  function addActivity('),source.indexOf('  function profileKind('))+'api.addActivity=addActivity;',c);
 c.api.addActivity(node('aside'));return {made,timers,events,idleTasks,get reads(){return reads},resolveRead};
}
test('activity waits for load then idle; refresh cancels pending task and is single-flight',async()=>{
 const e=activityEnvironment();assert.equal(e.reads,0);assert.equal(e.idleTasks.size,0);e.events.load();assert.equal(e.idleTasks.size,1);assert.equal(e.reads,0);
 const refresh=e.made.find(n=>n.className==='bos-refresh');const first=refresh.handlers.click(),second=refresh.handlers.click();assert.equal(e.reads,1);assert.equal(e.idleTasks.size,0);e.resolveRead({});await Promise.all([first,second]);assert.equal(refresh.disabled,false);assert.match(e.made.find(n=>n.className==='bos-feed-status').textContent,/Não foi possível/);
});
test('idle callback fallback schedules one timer after load',()=>{const e=activityEnvironment(false);assert.equal(e.timers.size,0);e.events.load();assert.equal(e.timers.size,1);assert.equal(e.reads,0)});

test('roll identity comes from the native preamble, never from the bot author',()=>{
 const content=(text,template=false,images=true)=>({textContent:text,querySelector:s=>s==='table,style,article,section'?(template?{}:null):images?{}:null});
 assert.equal(context.api.rollActor(content("O membro ' Hollow ' realizou a seguinte ação: dados")), 'Hollow');
 assert.equal(context.api.rollActor(content("O membro 'João D'Ávila' realizou a seguinte ação: dados")), "João D'Ávila");
 assert.equal(context.api.rollActor(content("O membro 'Hollow' realizou a seguinte ação: dados",true)),null);
 assert.equal(context.api.rollActor(content("O membro 'Hollow' realizou a seguinte ação: dados",false,false)),null);
 assert.equal(context.api.rollActor(content("Hollow rolou dados numa história")),null);
 const profile={querySelector:s=>s==='.author'?{textContent:'Hoje',closest:()=>({getAttribute:()=>'/t58-title#317'})}:{textContent:'Omegamon'}};
 const roll=content("O membro 'Hollow' realizou a seguinte ação: dados");
 const post={id:'p317',querySelector:s=>s.startsWith('.postprofile')?profile:roll};
 const result=context.api.parsePosts({querySelectorAll:()=>[post]},topicURL('/t58-title'),'Tópico');
 assert.equal(result[0].author,'Hollow');assert.equal(result[0].id,317);
});
