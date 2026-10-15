import test from 'node:test';
import assert from 'node:assert/strict';
import {battleAPI as handleBattleAPI} from '../server/battle-api.mjs';
const testPassword='test-only-secret';
const testHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(testPassword))),b=>b.toString(16).padStart(2,'0')).join('');
const battleAPI=(request,bucket)=>handleBattleAPI(request,bucket,{narratorPasswordHash:testHash});
function memoryBucket(){const objects=new Map();let revision=0;return {objects,async get(key){const value=objects.get(key);return value?{etag:value.etag,json:async()=>JSON.parse(value.text)}:null;},async put(key,text,options={}){if(options.onlyIf&&objects.get(key)?.etag!==options.onlyIf.etagMatches)return null;const value={text,etag:String(++revision)};objects.set(key,value);return value;},async delete(keys){for(const key of Array.isArray(keys)?keys:[keys])objects.delete(key);},async list({prefix}){return {objects:[...objects.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key})),truncated:false};}};}
const origin='https://battle.example';
function request(path,{cookie='',body,originHeader=origin}={}){return new Request(origin+path,{method:body?'POST':'GET',headers:{cookie,origin:originHeader,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
test('published battle API gates the directory and creates independent persistent scenes',async()=>{
 const bucket=memoryBucket();
 assert.equal((await battleAPI(request('/api/scenes'),bucket)).status,200);
 assert.equal((await battleAPI(request('/api/narrator',{body:{password:'wrong'}}),bucket)).status,401);
 const login=await battleAPI(request('/api/narrator',{body:{password:testPassword}}),bucket);
 assert.equal(login.status,200);assert.match(login.headers.get('Set-Cookie'),/HttpOnly; Secure/);
 const cookie=login.headers.get('Set-Cookie').split(';')[0];
 const create=async name=>(await (await battleAPI(request('/api/scenes',{cookie,body:{name}}),bucket)).json()).id;
 const a=await create('Cena A'),b=await create('Cena B');assert.notEqual(a,b);
 const list=await (await battleAPI(request('/api/scenes',{cookie}),bucket)).json();assert.equal(list.scenes.length,2);assert.ok(list.scenes.every(s=>s.enemies.length===0));
 const loaded=await battleAPI(request('/api/scene?id='+a),bucket),snapshot=await loaded.json(),client=loaded.headers.get('Set-Cookie').split(';')[0];
 const change={command:'presentation',args:[{name:'Cena A atualizada',background:'https://example.com/bg.png'}],revision:snapshot.revision,requestId:'name-1',mode:'narrator'};
 assert.equal((await battleAPI(request('/api/scene?id='+a,{cookie:client,body:change}),bucket)).status,403);
 assert.equal((await battleAPI(request('/api/scene?id='+a,{cookie:cookie+'; '+client,body:change}),bucket)).status,200);
 const reloaded=await (await battleAPI(request('/api/scene?id='+a,{cookie:client}),bucket)).json();assert.equal(reloaded.state.scene.name,'Cena A atualizada');assert.equal(reloaded.revision,1);
 const other=await (await battleAPI(request('/api/scene?id='+b),bucket)).json();assert.equal(other.state.scene.name,'Cena B');assert.equal(other.revision,0);assert.deepEqual(other.state.actors,[]);assert.deepEqual(other.state.humans,[]);assert.deepEqual(other.state.pairs,[]);assert.equal(other.state.round,1);
 const updated=await (await battleAPI(request('/api/scenes',{cookie}),bucket)).json();assert.equal(updated.scenes.find(s=>s.id===a).background,'https://example.com/bg.png');
 const forged=await battleAPI(request('/api/scenes',{cookie,body:{name:'CSRF'},originHeader:'https://foreign.example'}),bucket);assert.equal(forged.status,403);
});
test('competing published commands cannot overwrite a saved roll or revision',async()=>{
 const bucket=memoryBucket();const login=await battleAPI(request('/api/narrator',{body:{password:testPassword}}),bucket),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const {id}=await (await battleAPI(request('/api/scenes',{cookie,body:{name:'Concorrência'}}),bucket)).json();
 const body={command:'presentation',args:[{name:'Primeira alteração'}],revision:0,requestId:'same',mode:'narrator'};
 const results=await Promise.all(['one','two'].map(requestId=>battleAPI(request('/api/scene?id='+id,{cookie,body:{...body,requestId}}),bucket)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const saved=await (await battleAPI(request('/api/scene?id='+id,{cookie}),bucket)).json();assert.equal(saved.revision,1);
});

test('GitHub Pages sessions and saved scenes work without third-party cookies',async()=>{
 const bucket=memoryBucket(),github='https://digimon-bonds.github.io',client='a'.repeat(64);
 const req=(path,{session='',body,source=github,identity=client}={})=>new Request(origin+path,{method:body?'POST':'GET',headers:{origin:source,'Content-Type':'application/json','Authorization':'Bearer '+session,'X-Bonds-Client':identity},...(body?{body:JSON.stringify(body)}:{})});
 const login=await battleAPI(req('/api/narrator',{body:{password:testPassword}}),bucket);
 assert.equal(login.status,200);const {sessionToken}=await login.json();assert.match(sessionToken,/^[a-f0-9]{64}$/);
 assert.equal((await (await battleAPI(req('/api/narrator',{session:sessionToken}),bucket)).json()).authorized,true);
 assert.equal((await (await battleAPI(req('/api/narrator',{session:sessionToken,source:'https://evil.example'}),bucket)).json()).authorized,false);
 const created=await battleAPI(req('/api/scenes',{session:sessionToken,body:{name:'GitHub'}}),bucket);assert.equal(created.status,201);const {id}=await created.json();
 assert.equal((await battleAPI(req('/api/scene?id='+id,{identity:''}),bucket)).status,400);
 const loaded=await battleAPI(req('/api/scene?id='+id),bucket);assert.equal(loaded.status,200);assert.equal(loaded.headers.get('Set-Cookie'),null);const saved=await loaded.json();
 const change={command:'presentation',args:[{name:'Estado persistido'}],revision:saved.revision,requestId:'github-save',mode:'narrator'};
 assert.equal((await battleAPI(req('/api/scene?id='+id,{body:change}),bucket)).status,403);
 assert.equal((await battleAPI(req('/api/scene?id='+id,{session:sessionToken,body:change}),bucket)).status,200);
 const afterReload=await (await battleAPI(req('/api/scene?id='+id),bucket)).json();assert.equal(afterReload.state.scene.name,'Estado persistido');assert.equal(afterReload.revision,1);
 assert.equal((await battleAPI(req('/api/scenes',{session:sessionToken,body:{name:'Foreign'},source:'https://evil.example'}),bucket)).status,403);
});

import {emptyBattle,removeParticipant} from '../prototypes/battle-scene/scene-engine.mjs';
import {createNpc} from '../prototypes/battle-scene/npc.mjs';
import {newSceneData,createSceneRepository} from '../prototypes/battle-scene/scene-repository.mjs';
test('empty scenes preserve setup and accept/remove their first NPC without phantom rounds',async()=>{
 const repository=createSceneRepository(newSceneData(emptyBattle()),async()=>{});
 let saved=await repository.execute('setup',{command:'presentation',args:[{background:'data:image/png;base64,'+'a'.repeat(3200000)}],revision:0,requestId:'bg',mode:'narrator'},true);
 assert.equal(saved.state.round,1);assert.equal(saved.state.actors.length,0);assert.equal(saved.state.scene.background.length,3200022);
 const withNpc=createNpc(saved.state,{name:'Teste NPC',image:'https://example.com/npc.png',attributes:{power:3,heart:3,intelligence:3,agility:3},hp:8,element:'Fogo',digitalAttribute:'Data',stage:'rookie',qualities:[],attacks:[]});
 assert.equal(withNpc.actors.length,1);assert.equal(withNpc.humans.length,0);assert.equal(withNpc.actors[0].forms.rookie.name,'Teste NPC');
 const empty=removeParticipant(withNpc,withNpc.actors[0].id);assert.deepEqual(empty.actors,[]);assert.equal(empty.scene.background,saved.state.scene.background);
});

import {canManageScenes,canDeleteScene,deleteSceneCard,deletePersistentScene} from '../prototypes/battle-scene/scene-management.mjs';
test('scene deletion requires existing narrator session and removes both persistent objects',async()=>{
 const bucket=memoryBucket();const login=await battleAPI(request('/api/narrator',{body:{password:testPassword}}),bucket),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const {id}=await (await battleAPI(request('/api/scenes',{cookie,body:{name:'Apagar definitivamente'}}),bucket)).json();
 const del=(sceneId,auth=cookie,source=origin)=>battleAPI(new Request(origin+'/api/scenes?id='+encodeURIComponent(sceneId),{method:'DELETE',headers:{cookie:auth,origin:source}}),bucket);
 assert.equal((await del(id,'')).status,403);assert(bucket.objects.has('battle/scenes/'+id));
 assert.equal((await del(id,cookie,'https://foreign.example')).status,403);
 assert.equal((await del('../scenes/other')).status,400);
 assert.equal((await del('12345678-1234-1234-1234-123456789012')).status,404);
 assert.equal((await del(id)).status,200);
 assert.equal(bucket.objects.has('battle/scenes/'+id),false);assert.equal(bucket.objects.has('battle/cards/'+id),false);
 assert.equal((await del(id)).status,404);
 const listed=await (await battleAPI(request('/api/scenes'),bucket)).json();assert.equal(listed.scenes.length,0);assert.equal(listed.capabilities.sceneDeletion,false);
 const access=await (await battleAPI(request('/api/narrator',{cookie}),bucket)).json();assert.equal(access.capabilities.sceneDeletion,true);
});
test('expired and fabricated narrator sessions cannot delete scenes',async()=>{
 const bucket=memoryBucket(),session='b'.repeat(64);await bucket.put('battle/sessions/'+session,JSON.stringify({expires:Date.now()-1}));
 for(const cookie of ['bonds_narrator='+session,'bonds_narrator='+'a'.repeat(64)])assert.equal((await battleAPI(new Request(origin+'/api/scenes?id=12345678-1234-1234-1234-123456789012',{method:'DELETE',headers:{origin,cookie}}),bucket)).status,403);
});
test('only Omegamon with narrator authorization sees management controls',()=>{
 assert.equal(canManageScenes({forumUserId:'1'},true),true);
 assert.equal(canManageScenes({forumUserId:'1'},false),false);
 assert.equal(canManageScenes({forumUserId:'36',forumUsername:'Omegamon'},true),false);
 assert.equal(canManageScenes(null,true),false);
});
test('client deletion targets persistent directory endpoint and propagates failures',async()=>{
 let called;await deletePersistentScene('scene-id',async(path,options)=>{called={path,options};return new Response(null,{status:204});});
 assert.equal(called.path,'/api/scenes?id=scene-id');assert.equal(called.options.method,'DELETE');
 await assert.rejects(deletePersistentScene('scene-id',async()=>Response.json({error:'Negado'},{status:403})),/Negado/);
});

test('delete button belongs exclusively to authorized Omegamon narrator tab',()=>{
 assert.equal(canDeleteScene({forumUserId:'1'},true,'narrator'),true);
 assert.equal(canDeleteScene({forumUserId:'1'},true,'player'),false);
 assert.equal(canDeleteScene({forumUserId:'1'},false,'narrator'),false);
 assert.equal(canDeleteScene({forumUserId:'2'},true,'narrator'),false);
});
test('card is removed only after persistent deletion succeeds, without reload',async()=>{
 let removed=false,finish;const card={remove(){removed=true;}};
 const action=deleteSceneCard({id:'id'},card,()=>new Promise(resolve=>finish=resolve));
 assert.equal(removed,false);finish(new Response(null,{status:204}));await action;assert.equal(removed,true);
 removed=false;await assert.rejects(deleteSceneCard({id:'id'},card,async()=>Response.json({error:'Falha'},{status:500})),/Falha/);assert.equal(removed,false);
});
test('worker preflight permits DELETE and rejects foreign origins',async()=>{
 const {readFile}=await import('node:fs/promises');
 let source=await readFile(new URL('../server/worker.js',import.meta.url),'utf8');
 source=source.replace("import {env} from 'cloudflare:workers';",'const env={};').replace("'./battle-api.mjs'",JSON.stringify(new URL('../server/battle-api.mjs',import.meta.url).href)).replace("'./sheet-document.js'",JSON.stringify(new URL('../server/sheet-document.js',import.meta.url).href));
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const response=await worker.fetch(new Request(origin+'/api/scenes',{method:'OPTIONS',headers:{origin:'https://digimon-bonds.github.io','Access-Control-Request-Method':'DELETE'}}));
 assert.equal(response.status,204);assert.equal(response.headers.get('Access-Control-Allow-Methods'),'GET, POST, DELETE, OPTIONS');
 assert.equal((await worker.fetch(new Request(origin+'/api/scenes',{method:'OPTIONS',headers:{origin:'https://foreign.example'}}))).status,403);
});
