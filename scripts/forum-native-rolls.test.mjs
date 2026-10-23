import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRollPlan,nativeRollMetadata,nativeRollOfficialView,nativeRollLastAuthor,readNativeRollTopic} from '../site/forum-native-rolls.js';
const player=(id='p485',name='Mikazuchi Yuki',authorId='21')=>({id,authorName:name,authorId,narrative:true,actor:null});
const roll=(id='p486',actor='Mikazuchi Yuki',authorId='1')=>({id,authorName:'Omegamon',authorId,narrative:false,actor});

test('ordinary roll permalinks never opt into a second visible official result',()=>{
 for(const hash of ['', '#486', '#p486'])assert.equal(nativeRollOfficialView({search:'',hash},'p486'),false);
 assert.equal(nativeRollOfficialView({search:'?bos_roll_post=486',hash:'#486'},'p486'),true);
 assert.equal(nativeRollOfficialView({search:'?bos_roll_post=486',hash:'#487'},'p487'),false);
 assert.equal(nativeRollOfficialView({search:'?bos_roll_post=p486'},'p486'),false);
});

test('a verified automatic roll attaches only to the immediately preceding matching member',()=>{
 const plan=nativeRollPlan([player(),roll()]);assert.equal(plan.length,1);assert.equal(plan[0].source.id,'p485');assert.equal(plan[0].roll.id,'p486');assert.equal(plan[0].previousId,'p485');
 for(const records of [[roll()],[player(),roll('p486','Outra pessoa')],[player(),roll('p486','Mikazuchi Yuki','40')],[player(),player('p490','Outro','40'),roll('p491')],[player('p485','Mikazuchi Yuki',null),roll()]])assert.deepEqual(nativeRollPlan(records),[]);
});
test('consecutive rolls for the same member group under one source without crossing another post',()=>{
 const plan=nativeRollPlan([player(),roll(),roll('p487'),roll('p488','Outro'),roll('p489')]);assert.deepEqual(plan.map(item=>[item.roll.id,item.source.id]),[['p486','p485'],['p487','p485']]);
});
test('normal Omegamon narration is not a roll and may itself request an official roll',()=>{
 const narration=player('p428','Omegamon','1');assert.deepEqual(nativeRollPlan([narration]),[]);assert.equal(nativeRollPlan([narration,roll('p429','Omegamon')])[0].source.id,'p428');
 assert.deepEqual(nativeRollPlan([player(),narration,roll()]),[]);
});
test('ambiguous duplicate IDs, deleted predecessors, page-boundary or mismatched actors fail closed',()=>{
 assert.deepEqual(nativeRollPlan([player(),roll(),roll()]),[]);
 assert.deepEqual(nativeRollPlan([{...player(),narrative:false},roll()]),[]);
 assert.deepEqual(nativeRollPlan([roll(),roll('p487')]),[]);
 assert.deepEqual(nativeRollPlan([player('p485','Mikazuchi Yuki 2'),roll()]),[]);
});

function envelope({name='Mikazuchi Yuki',bot='1',marker=true,flat=true,authored=false}={}){
 const profile={querySelector:s=>s==='[data-bos-roll-origin]'?null:{textContent:'Omegamon'},querySelectorAll:()=>[{getAttribute:()=>'/u'+bot}]};
 const content={textContent:`O membro '${name}' realizou a seguinte ação: ${marker?'!@DIGIMON#$BONDS%&':'história'} 'Padrão' :`,children:[{}],querySelector:s=>s.includes('table,')?(authored?{}:null):(flat?{}:null),querySelectorAll:()=>[{getAttribute:()=> 'https://2img.net/i.imgur.com/DWjfM8j.png'}]};
 const post={id:'p486',querySelector:s=>s.startsWith('.postprofile')?profile:content};return {querySelectorAll:()=>[post]};
}
test('official recognition requires account ID 1 plus generated marker, preamble and flat dice payload',()=>{
 const result=nativeRollMetadata(envelope())[0];assert.equal(result.actor,'Mikazuchi Yuki');assert.equal(result.authorId,'1');assert.equal(result.images[0],'https://2img.net/i.imgur.com/DWjfM8j.png');
 for(const options of [{bot:'40'},{marker:false},{flat:false},{authored:true}])assert.equal(nativeRollMetadata(envelope(options))[0].actor,null);
});

test('post-shaped HTML nested inside another message is never treated as an official post',()=>{
 const doc=envelope(),post=doc.querySelectorAll()[0];post.parentElement={closest:()=>({id:'p485'})};assert.deepEqual(nativeRollMetadata(doc),[]);
});

test('last-author cards use only a verified immediate source, never a normal bot post',()=>{
 const rollDoc=envelope(),automatic=rollDoc.querySelectorAll()[0];
 const profile={querySelectorAll:()=>[{getAttribute:()=>'/u21'}],querySelector:s=>s==='[data-bos-roll-origin]'?null:s==='dt img[src]'?{getAttribute:()=> 'https://example.org/avatar.png'}:{textContent:'Mikazuchi Yuki'}};
 const source={id:'p485',querySelector:s=>s.startsWith('.postprofile')?profile:{textContent:'História do jogador',children:[],querySelector:()=>null}};
 const doc={querySelectorAll:()=>[source,automatic],getElementById:id=>id==='p485'?source:automatic};
 assert.deepEqual(nativeRollLastAuthor(doc,'/t58p25-topic#486'),{forumUserId:'21',username:'Mikazuchi Yuki',href:'/t58p25-topic#485',avatar:'https://example.org/avatar.png'});
 assert.equal(nativeRollLastAuthor(doc,'/t58p25-topic#485'),null);
 assert.equal(nativeRollLastAuthor(doc,'https://evil.example/t58p25-topic#486'),null);
 doc.querySelectorAll=()=>[automatic];assert.equal(nativeRollLastAuthor(doc,'/t58p25-topic#486'),null);
 const normal=envelope({marker:false});assert.equal(nativeRollLastAuthor(normal,'/t58p25-topic#486'),null);
});

test('topic reads coalesce concurrent callers and permalink variants, and reject foreign redirects',async()=>{
 let reads=0;const parsed={},host={location:{href:'https://digimonbonds.forumeiros.com/'},DOMParser:class{parseFromString(){return parsed;}},fetch:async url=>{reads++;return {url,ok:true,text:async()=>'<html></html>'};}};
 const results=await Promise.all([readNativeRollTopic(host,'/t79p25-topic#557'),readNativeRollTopic(host,'/t79p25-topic?bos_roll_post=557#557')]);
 assert.equal(reads,1);assert.equal(results[0],parsed);assert.equal(results[1],parsed);
 await assert.rejects(readNativeRollTopic(host,'https://evil.example/t79-topic'));
 await assert.rejects(readNativeRollTopic(host,'/post?mode=delete'));
 host.fetch=async()=>({ok:true,url:'https://evil.example/t79-topic',text:async()=>''});await assert.rejects(readNativeRollTopic(host,'/t79-topic'));
});

test('a failed topic read can retry without caching an outage',async()=>{
 let calls=0;const host={location:{href:'https://digimonbonds.forumeiros.com/'},DOMParser:class{parseFromString(){return {}; }},fetch:async url=>{if(++calls===1)throw Error('offline');return {url,ok:true,text:async()=>''};}};
 await assert.rejects(readNativeRollTopic(host,'/t79-topic'));await readNativeRollTopic(host,'/t79-topic');assert.equal(calls,2);
});
