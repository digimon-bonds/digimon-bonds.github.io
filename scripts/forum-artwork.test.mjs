import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=await readFile(new URL('../site/forum-skin/bonds-os.js',import.meta.url),'utf8');
const context={URL,Array,Set,location:{origin:'https://digimonbonds.forumeiros.com'},rollActor:c=>c.roll?'Actor':null,api:{}};
runInNewContext(source.slice(source.indexOf('  function topicURL('),source.indexOf('  function rollActor('))+source.slice(source.indexOf('  function topicKey('),source.indexOf('  function parsePosts('))+source.slice(source.indexOf('  function safeArtURL('),source.indexOf('  function enhanceTopicArtwork('))+'Object.assign(api,{safeArtURL,topicBanner,readTopicBanner,worldArtwork});',context);
const {safeArtURL,topicBanner}=context.api;
function image(src,width=640,height=240,quoted=false){return {tagName:'IMG',style:{},getAttribute:k=>({src,width,height}[k]??null),closest:()=>quoted?{}:null};}
function post(id,author,nodes=[],declared=null){const content={querySelector:s=>s==='[data-topic-banner]'?declared:null,querySelectorAll:()=>nodes};return {id:'p'+id,content,querySelector:s=>s==='.postprofile dt strong'?{textContent:author}:content};}
const doc=posts=>({querySelectorAll:()=>posts});

test('only world forums and their descendants receive topic artwork',()=>{
 for(const id of [2,15,16])assert.equal(context.api.worldArtwork(['/f'+id+'-place']),'human-world-v10.webp');
 for(const id of [3,10,11,12,14])assert.equal(context.api.worldArtwork(['/f'+id+'-place']),'digital-world-v10.webp');
 for(const path of ['/f4-sistemas','/f41-world','/f5-fichas','/search','/f8-off-topic'])assert.equal(context.api.worldArtwork([path]),null);
 assert.equal(context.api.worldArtwork(['/f3-mundo-digital','/f99-new-region']),'digital-world-v10.webp');
});

test('Systems returns before scheduling artwork observers or making requests',()=>{
 const c={Array,location:context.location,worldArtwork:context.api.worldArtwork,document:{body:{getAttribute:()=>'/f4-sistemas'}},api:{}};
 runInNewContext(source.slice(source.indexOf('  function enhanceTopicArtwork('),source.indexOf('  function enhanceCatalog('))+'api.run=enhanceTopicArtwork;',c);
 // No observer, window, asset helpers or request APIs exist: any attempted work fails this test.
 c.api.run({querySelectorAll:selector=>selector==='[data-bos-topic-row]'?[{}]:[]});
});
test('cover URLs allow HTTP images but reject empty, local, data and executable schemes',()=>{
 for(const value of [null,undefined,'','javascript:alert(1)','data:image/png;base64,a','file:///private'])assert.equal(safeArtURL(value),null);
 assert.equal(safeArtURL('https://images.example/cover.jpg'),'https://images.example/cover.jpg');
});
test('cover belongs to the latest Omegamon narrative, not players or automatic dice',()=>{
 assert.equal(topicBanner(doc([post(0,'Advert',[image('https://images.example/ad.jpg')]),post(1,'Omegamon',[image('https://images.example/banner.jpg')]),post(2,'Player',[image('https://images.example/reply.jpg')])])),'https://images.example/banner.jpg');
 const latest=post(4,'Omegamon',[image('https://images.example/dice.jpg')]);latest.content.roll=true;
 assert.equal(topicBanner(doc([post(1,'Omegamon',[image('https://images.example/old.jpg')]),post(2,'Omegamon',[image('https://images.example/new.jpg')]),post(3,'Player',[image('https://images.example/player.jpg')]),latest])),'https://images.example/new.jpg');
});

test('the supplied template header takes priority over its enemy portrait and project metadata',()=>{
 const item=post(1,'Omegamon',[image('https://images.example/enemy.jpg')]);
 item.content.querySelector=s=>s==='.db-terminal-v2-header img'?image('https://images.example/header.jpg','100%',215):s==='[data-db-project]'?{getAttribute:()=>JSON.stringify({image:'https://images.example/project.jpg',enemyImage:'https://images.example/enemy.jpg'})}:null;
 assert.equal(topicBanner(doc([item])),'https://images.example/header.jpg');
 item.content.querySelector=s=>s==='[data-db-project]'?{getAttribute:()=>JSON.stringify({image:'https://images.example/project.jpg',enemyImage:'https://images.example/enemy.jpg'})}:null;
 assert.equal(topicBanner(doc([item])),'https://images.example/project.jpg');
});

test('pagination finds the latest narrator page and ignores external or unrelated topic links',async()=>{
 const page=(posts,links)=>({querySelectorAll:s=>s==='.pagination a[href]'?links.map(href=>({getAttribute:()=>href})):posts});
 const first=page([post(1,'Omegamon',[image('https://images.example/old.jpg')])],['/t58p25-x','https://external.example/t58p999-x','/t99p100-x']);
 const last=page([post(30,'Player')],['/t58-x']);
 const calls=[];context.readPage=async url=>{calls.push(url.pathname);return url.pathname.includes('p25')?last:first};
 assert.equal(await context.api.readTopicBanner(new URL('/t58-x',context.location.origin),new Map()),'https://images.example/old.jpg');
 assert.deepEqual(calls,['/t58-x','/t58p25-x','/t58-x']);
});

test('a newer narrator post without art does not reuse an outdated cover',()=>{
 assert.equal(topicBanner(doc([post(1,'Omegamon',[image('https://images.example/old.jpg')]),post(2,'Omegamon')])),null);
});
test('banner extraction skips avatars, portraits, quotes and rejects an invalid declaration',()=>{
 const first=post(1,'Omegamon',[image('https://images.example/avatars/1.png'),image('https://images.example/portrait.jpg',250,380),image('https://images.example/quote.jpg',640,240,true),image('https://images.example/banner.jpg')],{getAttribute:k=>k==='data-topic-banner'?'javascript:bad()':null});
 assert.equal(topicBanner(doc([first])),'https://images.example/banner.jpg');
 const background={tagName:'DIV',style:{backgroundImage:'url("https://images.example/css-banner.jpg")'},closest:()=>null};
 assert.equal(topicBanner(doc([post(1,'Omegamon',[background])])),'https://images.example/css-banner.jpg');
});


test('topic art cache reuses the exact latest-post stamp and expires or invalidates on new posts',()=>{
 let now=1000,stored='{}';const c={api:{},Date:{now:()=>now},safeArtURL,sessionStorage:{getItem:()=>stored,setItem:(key,value)=>{stored=value;}}};
 runInNewContext(source.slice(source.indexOf('  var topicArtStorageKey='),source.indexOf('  function enhanceTopicArtwork('))+'Object.assign(api,{cachedTopicArt,saveTopicArt});',c);
 c.api.saveTopicArt('58','post-486','https://images.example/banner.jpg');
 assert.equal(c.api.cachedTopicArt('58','post-486').art,'https://images.example/banner.jpg');
 assert.equal(c.api.cachedTopicArt('58','post-487'),null);
 now+=900001;assert.equal(c.api.cachedTopicArt('58','post-486'),null);
 c.api.saveTopicArt('89','no-art',null);assert.equal(c.api.cachedTopicArt('89','no-art').art,null);
 for(let i=0;i<105;i++){now++;c.api.saveTopicArt(String(i),'post','https://images.example/banner.jpg');}
 assert.equal(Object.keys(JSON.parse(stored)).length,100);
 c.sessionStorage.getItem=()=>{throw Error('Storage disabled');};assert.equal(c.api.cachedTopicArt('58','post-486'),null);assert.doesNotThrow(()=>c.api.saveTopicArt('58','post','https://images.example/banner.jpg'));
});

test('cards start without a generic world image and do not wait for page load',async()=>{
 const fn=source.slice(source.indexOf('  function enhanceTopicArtwork('),source.indexOf('  function enhanceCatalog('));
 assert.doesNotMatch(fn,/apply\(row,ASSETS\+fallback\)/);
 assert.doesNotMatch(fn,/requestIdleCallback|addEventListener\('load'/);
 assert.match(fn,/begin\(\);/);assert.match(fn,/cachedTopicArt\(key,stamp\)/);
 const css=await readFile(new URL('../site/forum-skin/bonds-os.css',import.meta.url),'utf8');
 const rule=css.split('[data-bos-topic-row][data-bos-topic-art]::before')[1].split('}')[0];
 assert.match(rule,/right:0;bottom:0;width:64%;height:64%/);assert.doesNotMatch(rule,/inset:0/);
});
