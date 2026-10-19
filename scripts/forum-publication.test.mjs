import test from 'node:test';import assert from 'node:assert/strict';
import {composeUpdatePost,extractUpdatedSheet,sheetStart,sheetEnd} from '../site/update-post.js';
import {fresh} from '../site/rules.js';import {initializeForms} from '../site/forms.js';import {withUpdate,progress} from '../site/progression.js';import {restorationCode,restoreEmbeddedCode} from '../site/code-archive.js';
import {publicationSpec,nativePostData,nativeFormUserId,publishedTopic,publishNativeForum} from '../site/forum-native-post.js';
const sheet=s=>'<iframe data-bonds-project="'+restorationCode(s)+'" src="https://digimon-bonds.github.io/sheet.html#YWJj" title="Ficha"></iframe>';
function state(){const s=initializeForms(fresh());s.name='Kai — 魁';return s;}
const input=()=>({kind:'update',characterName:'Kai — 魁',forumUserId:'36',code:composeUpdatePost(state(),sheet(state()))});
test('one update post contains only the current changes and preserves the complete editable sheet exactly',()=>{
 let s=withUpdate(state(),{type:'exp',reason:'Episódio anterior',amount:1});s.updateStart=1;s=withUpdate(s,{type:'exp',reason:'Episódio atual',amount:2});const iframe=sheet(s),code=composeUpdatePost(s,iframe);
 assert.ok(code.includes('data-bonds-update-summary="1"'));assert.ok(code.includes(progress(s).history[1]));assert.ok(!code.includes(progress(s).history[0]));assert.equal(extractUpdatedSheet(code),iframe);assert.equal(restoreEmbeddedCode(code).name,s.name);assert.equal((code.match(/data-bonds-project=/g)||[]).length,1);
 s.name='<script>alert(1)</script> [b]';assert.ok(!composeUpdatePost(s,iframe).includes('<script>'));assert.throws(()=>extractUpdatedSheet(sheetStart+sheetStart+sheetEnd));
});
test('native posting restricts destinations and generates character topic titles',()=>{
 const data=input();assert.equal(publicationSpec(data).title,'[Att] Kai — 魁');assert.equal(publicationSpec({...data,kind:'registration'}).forumId,7);assert.equal(publicationSpec({...data,kind:'registration'}).title,'[F] Kai — 魁');
 for(const change of [{kind:'admin'},{characterName:''},{code:data.code.replace('https://digimon-bonds.github.io','https://evil.test')},{code:data.code+'<script>alert(1)</script>'}])assert.throws(()=>publicationSpec({...data,...change}));
});
const form={getAttribute:()=>'/post',querySelectorAll:()=>[{tagName:'INPUT',name:'auth[]',type:'hidden',value:'test-token-a'},{tagName:'INPUT',name:'auth[]',type:'hidden',value:'test-token-b'},{tagName:'INPUT',name:'lt',type:'hidden',value:'test-time'},{tagName:'INPUT',name:'preview',type:'submit',value:'Preview'},{tagName:'INPUT',name:'topictype',type:'radio',value:'2',checked:true},{tagName:'INPUT',name:'notify',type:'checkbox',value:'1',checked:false}]};
test('native form submission preserves CSRF fields and uses a normal topic, with no preview or unchecked controls',()=>{
 const spec=publicationSpec(input()),data=nativePostData(form,spec);assert.deepEqual(data.getAll('auth[]'),['test-token-a','test-token-b']);assert.equal(data.get('lt'),'test-time');assert.equal(data.get('message'),spec.code);assert.equal(data.get('subject'),spec.title);assert.equal(data.get('post'),'Enviar');assert.equal(data.get('topictype'),'0');assert.equal(data.has('preview'),false);assert.equal(data.has('notify'),false);
});
function environment({cancel=false,formUser='36',captcha=false,networkError=false}={}){
 const storage=new Map(),calls=[],confirmations=[];const doc={querySelectorAll:selector=>selector==='script'?[{textContent:'_userdata["session_logged_in"] = 1; _userdata["user_id"] = '+formUser+';'}]:[],querySelector:selector=>selector==='textarea[name="message"]'?{closest:()=>form}:captcha?{}:null};
 const host={crypto:globalThis.crypto,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},DOMParser:class{parseFromString(){return doc;}},confirm:text=>{confirmations.push(text);return !cancel;},async fetch(url,options){calls.push({url,options});if(options.method==='POST'&&networkError)throw Error('connection lost');return {ok:true,url:options.method==='POST'?'https://digimonbonds.forumeiros.com/t123-att-kai#456':url,text:async()=>''};}};
 return {host,calls,confirmations,doc};
}
const actor={forumUserId:'36',forumUsername:'Player'};
test('posting uses the current forum session, asks confirmation and deduplicates successful submissions',async()=>{
 const e=environment(),data=input(),result=await publishNativeForum(e.host,data,actor);assert.match(result.url,/t123/);assert.equal(e.calls.length,2);assert.equal(e.calls[1].options.credentials,'same-origin');assert.ok(e.confirmations[0].includes('[Att] Kai'));assert.equal(e.calls[1].options.body.get('message'),data.code);assert.deepEqual(await publishNativeForum(e.host,data,actor),result);assert.equal(e.calls.length,2);assert.equal(e.confirmations.length,1);
});
test('cancelling, account mismatch and verification challenges never publish',async()=>{
 for(const options of [{cancel:true},{formUser:'1'},{captcha:true}]){const e=environment(options);await assert.rejects(publishNativeForum(e.host,input(),actor));assert.equal(e.calls.some(c=>c.options.method==='POST'),false);}
 const e=environment();await assert.rejects(publishNativeForum(e.host,{...input(),forumUserId:'1'},actor));assert.equal(e.calls.length,0);
});
test('an uncertain submission is not silently retried and cannot create a duplicate',async()=>{
 const e=environment({networkError:true});await assert.rejects(publishNativeForum(e.host,input(),actor),/conexão caiu/);await assert.rejects(publishNativeForum(e.host,input(),actor),/já foi iniciado/);assert.equal(e.calls.filter(c=>c.options.method==='POST').length,1);
});
test('native success detection accepts only forum topic URLs and refuses unrelated or foreign pages',()=>{
 const doc={body:{textContent:'A sua mensagem foi publicada com sucesso.'},querySelector:()=>null,querySelectorAll:()=>[{getAttribute:()=>'/t123-att-kai#456'}]};assert.match(publishedTopic(doc,'https://digimonbonds.forumeiros.com/post'),/t123/);assert.equal(publishedTopic({body:{textContent:'Erro'},querySelector:()=>null,querySelectorAll:()=>[]},'https://evil.test/t123'),null);assert.equal(nativeFormUserId(environment({formUser:'36'}).doc),'36');
});

test('moderator copies only the portable sheet code, with restoration data and no update summary',async()=>{
 const {approvedSheetCode}=await import('../site/forum-update-tools.js');const s=state(),archive=restorationCode(s),attrs={'data-bonds-project':archive,src:'https://digimon-bonds.github.io/sheet.html#YWJj'};
 const code=approvedSheetCode({getAttribute:key=>attrs[key]});assert.equal(restoreEmbeddedCode(code).name,s.name);assert.ok(!code.includes('data-bonds-update-summary'));assert.equal(approvedSheetCode({getAttribute:key=>key==='src'?'https://evil.test/sheet.html#YWJj':archive}),null);
});
test('foreign or unrelated frames cannot ask the forum bridge to publish',async()=>{
 const {installForumAppBridge}=await import('../site/forum-skin/forum-app-bridge.js');let receive,fetches=0;const frame={contentWindow:{postMessage(){}},addEventListener(){}};
 const host={location:{origin:'https://digimonbonds.forumeiros.com'},_userdata:{session_logged_in:1,user_id:36,username:'Player'},document:{readyState:'complete',documentElement:{},getElementById:()=>frame,addEventListener(){}},addEventListener(type,fn){receive=fn;},MutationObserver:class{observe(){}},fetch(){fetches++;throw Error('must not fetch');}};
 installForumAppBridge(host);const event={origin:'https://evil.test',source:frame.contentWindow,data:{type:'bonds:publish:request',version:1,requestId:'12345678-1234-1234-1234-123456789012',...input()}};
 await receive(event);await receive({...event,origin:'https://digimon-bonds.github.io',source:{}});assert.equal(fetches,0);
});
