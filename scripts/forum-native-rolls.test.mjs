import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRollPlan,nativeRollMetadata,nativeRollOfficialView} from '../site/forum-native-rolls.js';
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
