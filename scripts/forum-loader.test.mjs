import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const source=await readFile(new URL('../site/forum-skin/forumeiros-loader.js',import.meta.url),'utf8');
function environment(search='',stored=null,blocked=false) {
 const nodes=[],classes=new Set(),bodyClasses=new Set(),timers=new Map(),events=new Map();let sequence=0;
 const classList=set=>({add:x=>set.add(x),remove:x=>set.delete(x)});
 const state={stored,replaced:null};
 const context={URL,URLSearchParams,encodeURIComponent,location:{search,href:'https://digimonbonds.forumeiros.com/t1-topic'+search,replace(url){state.replaced=url}},console:{warn(){}},
 setTimeout(fn,ms){const id=++sequence;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},
 sessionStorage:{getItem(){if(blocked)throw Error();return state.stored},setItem(k,v){if(blocked)throw Error();state.stored=v},removeItem(){if(blocked)throw Error();state.stored=null}},
 document:{readyState:'complete',documentElement:{classList:classList(classes),dataset:{}},body:{classList:classList(bodyClasses)},
 getElementById:id=>nodes.find(n=>n.id===id),createElement:tag=>({tag,remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1)}}),
 head:{appendChild:n=>nodes.push(n)},addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn)},removeEventListener(name,fn){events.get(name)?.delete(fn)}}};
 return {context,nodes,classes,bodyClasses,state,timers,events,get css(){return nodes.find(n=>n.id==='bonds-os-css')},get js(){return nodes.find(n=>n.id==='bonds-os-js')},emit(name){for(const fn of [...events.get(name)||[]])fn()},run(){runInNewContext(source,context)}};
}
test('normal forum loads no skin nodes, classes, timers or listeners',()=>{const e=environment();e.run();assert.equal(e.nodes.length,0);assert.equal(e.classes.size,0);assert.equal(e.timers.size,0);assert.equal(e.events.size,0)});
test('URL enables session; CSS precedes JS',()=>{const e=environment('?bondsos=1');e.run();assert.equal(e.state.stored,'1');assert.equal(e.nodes.length,2);assert.deepEqual([...e.classes],['bonds-os-loading']);e.css.onload();assert.equal(e.js.tag,'script');assert(e.classes.has('bonds-os-preview'));assert(e.bodyClasses.has('bonds-os-preview'));assert.match(e.js.src,/20261013-10-beta2/)});
test('ordinary navigation and login/logout navigation keep tab session preference',()=>{for(const path of ['', '?mode=logout','?mode=login']){const e=environment(path,'1');e.run();assert.equal(e.nodes.length,2)}});
test('explicit opt-out wins over stored preference',()=>{const e=environment('?bondsos=0','1');e.run();assert.equal(e.state.stored,null);assert.equal(e.nodes.length,0)});
test('blocked storage accepts explicit opt-in and off only',()=>{for(const [q,n]of [['?bondsos=1',2],['?bondsos=0',0],['',0]]){const e=environment(q,'1',true);e.run();assert.equal(e.nodes.length,n)}});
test('duplicate execution and duplicate CSS event never duplicate JS or classes',()=>{const e=environment('?bondsos=1');e.run();e.run();assert.equal(e.nodes.length,2);e.css.onload();e.css.onload();e.run();assert.equal(e.nodes.length,3);assert.equal(e.classes.size,2)});
for(const stage of ['CSS','JS'])test(stage+' network error rolls back and disables the session',()=>{const e=environment('?bondsos=1');e.run();if(stage==='CSS')e.css.onerror();else{e.css.onload();e.js.onerror()}assert.equal(e.nodes.length,0);assert.equal(e.classes.size,0);assert.equal(e.bodyClasses.size,0);assert.equal(e.state.stored,null);assert.equal(e.timers.size,0);assert.equal(e.state.replaced,null)});
for(const stage of ['CSS','JS'])test(stage+' hanging request times out safely',()=>{const e=environment('?bondsos=1');e.run();if(stage==='JS')e.css.onload();const [{fn,ms}]=e.timers.values();assert.equal(ms,20000);fn();assert.equal(e.nodes.length,0);assert.equal(e.classes.size,0)});
test('body is awaited and an early failure cancels pending start',()=>{const e=environment('?bondsos=1');e.context.document.readyState='loading';e.run();const css=e.css;css.onload();assert.equal(e.nodes.length,2);css.onerror();e.emit('DOMContentLoaded');assert.equal(e.nodes.length,0)});
test('ready handshake clears timeout and loader listeners',()=>{const e=environment('?bondsos=1');e.run();e.css.onload();e.context.document.documentElement.dataset.bosInitialized='ready';e.emit('bonds-os-ready');e.js.onload();assert.equal(e.nodes.length,2);assert.equal(e.timers.size,0);assert.equal(e.events.get('bonds-os-failed').size,0)});
test('syntax/missing initialization failure cannot leave the skin active',()=>{const e=environment('?bondsos=1');e.run();e.css.onload();e.js.onload();assert.equal(e.nodes.length,0);assert.equal(e.classes.size,0)});
test('partial initialization reloads native document once with explicit opt-out',()=>{const e=environment('?bondsos=1');e.run();e.css.onload();e.context.document.documentElement.dataset.bosInitialized='loading';e.emit('bonds-os-failed');assert.equal(e.nodes.length,0);assert.equal(new URL(e.state.replaced).searchParams.get('bondsos'),'0');assert.equal(e.state.stored,null)});
