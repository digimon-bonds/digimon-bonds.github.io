import test from 'node:test';import assert from 'node:assert/strict';import {gzipSync} from 'node:zlib';
import {deviceFromSheetURL,deviceImageURL,readProfileDevice,matchesDeviceOwner,createProfileDeviceDirectory} from '../site/forum-profile-devices.js';
const origin='https://digimonbonds.forumeiros.com',sheet=origin+'/t90-arisa-a-megalomaniaca';
const image=n=>'https://bonds-character-app.mateuzim-alves.chatgpt.site/media/digivices/'+n.repeat(64)+'.png';
const form=(stage,src,locked=false,hidden=false)=>({tag:'div',attrs:{'data-forum-form':stage,'data-locked':String(locked),...(hidden?{hidden:''}:{})},children:[{tag:'img',attrs:{class:'forum-device-image',src},children:[]}]});
const visual=(forms)=>'https://digimon-bonds.github.io/sheet.html#'+gzipSync(JSON.stringify({tag:'article',attrs:{id:'preview'},children:forms})).toString('base64url');
function sheetDocument(src=visual([form('rookie',image('a'))]),approved=true,owner='40'){
 const profile=null,content={querySelector:()=>({getAttribute:()=>src})},post={querySelector:q=>q==='.postprofile'?profile:content};
 return {querySelector:q=>q==='.post'?post:null,querySelectorAll:q=>q==='.diretorio a[href]'?(approved?[{getAttribute:()=>'/f9-fichas-aprovadas'}]:[]):q==='script[type="application/ld+json"]'?[{textContent:JSON.stringify({'@type':'DiscussionForumPosting',author:{name:'your_lily',url:origin+'/u'+owner}})}]:[]};
}
function indexDocument(){const author={querySelector:()=>({textContent:'your_lily'}),querySelectorAll:()=>[]},row={querySelector:q=>q==='a.topictitle[href]'?{getAttribute:()=>sheet}:author};return {querySelectorAll:q=>q==='.forumbg li.row'?[row]:[]};}
test('the exact published device image is reused for the selected unlocked form',async()=>{
 assert.deepEqual(await deviceFromSheetURL(visual([form('baby',image('c'),true,true),form('rookie',image('a'),false,true),form('champion',image('b'))])),{image:image('b'),stage:'champion'});
 assert.deepEqual(await deviceFromSheetURL(visual([form('rookie',image('a'),false,true),form('mega',image('b'),true)])),{image:image('a'),stage:'rookie'});
 assert.equal(await deviceFromSheetURL(visual([form('rookie',image('a'),true)])),null);
});
test('only the existing exported device storage and repaired sheet images are accepted',()=>{
 assert.equal(deviceImageURL(image('a')),image('a'));assert.ok(deviceImageURL('https://digimon-bonds.github.io/assets/sheet-repairs/shirogane-kai-8e9ce18b4b8e67b3.png'));
 for(const u of ['https://evil.test/device.png','javascript:alert(1)',image('a')+'?tracking=1','https://user:secret@bonds-character-app.mateuzim-alves.chatgpt.site/media/digivices/'+ 'a'.repeat(64)+'.png'])assert.equal(deviceImageURL(u),null);
});
test('malformed, foreign and oversized compressed sheets cannot supply a profile image',async()=>{
 await assert.rejects(deviceFromSheetURL(visual([]).replace('https://digimon-bonds.github.io','https://evil.test')));
 await assert.rejects(deviceFromSheetURL('https://digimon-bonds.github.io/sheet.html#bad'));
 const bomb='https://digimon-bonds.github.io/sheet.html#'+gzipSync('x'.repeat(1500001)).toString('base64url');await assert.rejects(deviceFromSheetURL(bomb),/grande/);
});
test('a known user ID takes precedence over display names, including renamed accounts',()=>{
 const r={ownerForumUserId:'40',ownerForumUsername:'your_lily'};
 assert.ok(matchesDeviceOwner({id:'40',username:'Novo nome'},r));assert.equal(matchesDeviceOwner({id:'22',username:'your_lily'},r),false);
 assert.ok(matchesDeviceOwner({username:'YOUR_LILY'},r));assert.equal(matchesDeviceOwner({username:'Arisa'},r),false);
});
test('ownership comes from the approved topic author rather than the editable sheet contents',async()=>{
 const record=await readProfileDevice(sheetDocument(),sheet);assert.equal(record.ownerForumUserId,'40');assert.equal(record.ownerForumUsername,'your_lily');assert.equal(record.sheetURL,sheet);
 assert.equal(await readProfileDevice(sheetDocument(undefined,false),sheet),null);
 assert.equal(await readProfileDevice(sheetDocument(), 'https://evil.test/t90-arisa'),null);
});
test('visible duplicate authors share the index and sheet request; refreshing picks up later edits',async()=>{
 let current=image('a');const requests=[],saved=new Map();
 const host={localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},DOMParser:class{parseFromString(t){return t==='INDEX'?indexDocument():sheetDocument(visual([form('rookie',current)]));}},async fetch(url){requests.push(url);return {ok:true,url,text:async()=>url.includes('/f9-')?'INDEX':'SHEET'};}};
 const directory=createProfileDeviceDirectory(host),identity={id:'40',username:'your_lily'};
 const [one,two]=await Promise.all([directory.lookup(identity),directory.lookup(identity)]);assert.deepEqual(one,two);assert.equal(requests.length,2);
 current=image('b');directory.refresh();const cached=[];const edited=await directory.lookup(identity,r=>cached.push(r.image));assert.equal(edited.image,image('b'));assert.deepEqual(cached,[image('a')]);assert.equal(requests.length,4);
 assert.equal(await directory.lookup({id:'22',username:'your_lily'}),null);
});
test('unapproved topics and legacy sheets leave the author card without a fabricated device',async()=>{
 assert.equal(await readProfileDevice(sheetDocument(visual([])),sheet),null);
 const host={localStorage:{getItem:()=>null},DOMParser:class{parseFromString(){return {querySelectorAll:()=>[]};}},async fetch(url){return {ok:true,url,text:async()=>''};}};
 assert.equal(await createProfileDeviceDirectory(host).lookup({id:'40',username:'your_lily'}),null);
});
test('another legacy character sheet does not hide an account’s updated Bonds sheet',async()=>{
 const legacy=origin+'/t80-f-legacy',row=indexDocument().querySelectorAll('.forumbg li.row')[0];
 const old={querySelector:q=>q==='a.topictitle[href]'?{getAttribute:()=>legacy}:row.querySelector(q)};
 const host={localStorage:{getItem:()=>null,setItem(){}},DOMParser:class{parseFromString(t){return t==='INDEX'?{querySelectorAll:q=>q==='.forumbg li.row'?[old,row]:[]}:sheetDocument(t==='OLD'?visual([]):visual([form('rookie',image('a'))]));}},async fetch(url){return {ok:true,url,text:async()=>url.includes('/f9-')?'INDEX':url===legacy?'OLD':'NEW'};}};
 const record=await createProfileDeviceDirectory(host).lookup({id:'40',username:'your_lily'});assert.equal(record.sheetURL,sheet);
});
