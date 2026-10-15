import test from 'node:test';
import assert from 'node:assert/strict';
import {forumUserId,forumProfileId,canControlForumParticipant,hydrateParticipantOwners} from '../site/forum-owner.js';
import {canChoose,canOperate} from '../prototypes/battle-scene/interface-policy.mjs';
test('forum ownership uses canonical IDs, never display names',()=>{
 const participant={id:'a',ownerForumUserId:'36',ownerForumUsername:'Old name'};
 assert.equal(forumUserId('-1'),null);assert.equal(forumProfileId('https://evil.test/u1'),null);
 assert.equal(canControlForumParticipant(participant,{forumUserId:'36',forumUsername:'Renamed'}),true);
 assert.equal(canControlForumParticipant(participant,{forumUserId:'37',forumUsername:'Omegamon'}),false);
 assert.equal(canControlForumParticipant(participant,{forumUserId:'1',forumUsername:'Omegamon'}),true);
 assert.equal(canControlForumParticipant(participant,null),false);
});
test('legacy source ownership hydrates pair without touching combat state',()=>{
 const state={actors:[{id:'a',pairId:'p',hp:7,remaining:0,source:{ownerForumUserId:'36',ownerForumUsername:'Player'}}],humans:[{pairId:'p',energy:4}]};
 hydrateParticipantOwners(state);assert.equal(state.actors[0].ownerForumUserId,'36');assert.equal(state.humans[0].ownerForumUserId,'36');assert.equal(state.actors[0].hp,7);assert.equal(state.actors[0].remaining,0);assert.equal(state.humans[0].energy,4);
});
test('narrator mode does not bypass explicit UI ownership predicate',()=>{
 const state={actors:[{id:'a',pairId:'p',side:'ally',controller:'player'}],humans:[{id:'h',pairId:'p'}],pairs:[],log:[],round:1};
 assert.equal(canChoose(state,'narrator',null,'a',false,()=>false),false);
 assert.equal(canOperate(state,'narrator','a','h',()=>false),false);
 assert.equal(canOperate(state,'player','a','h',()=>true),true);
});
test('identity receiver rejects other origins, windows and request IDs; logout revokes',async()=>{
 const module=await import('../site/forum-identity.js?test=identity');let handler;let request;
 const parent={postMessage(data){request=data;}};
 const host={parent,crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789012'},addEventListener(type,fn){handler=fn;},setTimeout(){return 1;},clearTimeout(){}};
 module.initForumIdentity(host);
 const event={origin:'https://digimonbonds.forumeiros.com',source:parent,data:{type:'bonds:identity',version:1,requestId:request.requestId,currentUser:{forumUserId:'36',forumUsername:'Player'}}};
 handler({...event,origin:'https://evil.test'});assert.equal(module.getForumUser(),null);
 handler({...event,source:{}});assert.equal(module.getForumUser(),null);
 handler({...event,data:{...event.data,requestId:'wrong'}});assert.equal(module.getForumUser(),null);
 handler(event);assert.equal(module.getForumUser().forumUserId,'36');
 handler({...event,data:{...event.data,currentUser:null}});assert.equal(module.getForumUser(),null);
});

test('guest topic metadata preserves author ID; later replies cannot inherit topic owner',async()=>{
 const {extractSheetOwner}=await import('../site/forum-owner.js');
 const first={closest:()=>null},reply={closest:()=>null};
 const doc={querySelector:selector=>selector==='.postbody'?first:null,querySelectorAll:()=>[{textContent:JSON.stringify({'@type':'DiscussionForumPosting',author:{name:'Player',url:'https://digimonbonds.forumeiros.com/u36'}})}]};
 assert.equal(extractSheetOwner(doc,first).ownerForumUserId,'36');
 assert.equal(extractSheetOwner(doc,reply).ownerForumUserId,null);
});
test('forum bridge reuses only the existing App iframe and native session',async()=>{
 const {installForumAppBridge}=await import('../site/forum-skin/forum-app-bridge.js');
 let receive;const sent=[];const frame={contentWindow:{postMessage:(data,origin)=>sent.push({data,origin})},addEventListener(){}};
 const host={location:{origin:'https://digimonbonds.forumeiros.com'},_userdata:{session_logged_in:1,user_id:36,username:'Player'},document:{readyState:'complete',documentElement:{},getElementById:()=>frame,addEventListener(){}},addEventListener(type,fn){receive=fn;},MutationObserver:class{observe(){}}};
 installForumAppBridge(host);sent.length=0;
 const event={origin:'https://digimon-bonds.github.io',source:frame.contentWindow,data:{type:'bonds:identity:request',version:1,requestId:'12345678-1234-1234-1234-123456789012'}};
 await receive({...event,origin:'https://evil.test'});await receive({...event,source:{}});assert.equal(sent.length,0);
 await receive(event);assert.equal(sent[0].data.currentUser.forumUserId,'36');assert.equal(sent[0].origin,'https://digimon-bonds.github.io');
 host._userdata.session_logged_in=0;await receive(event);assert.equal(sent[1].data.currentUser,null);
});
