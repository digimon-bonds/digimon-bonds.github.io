import test from 'node:test';
import assert from 'node:assert/strict';
import {battleAPI} from '../server/battle-api.mjs';
function memoryBucket(){const objects=new Map();let revision=0;return {objects,async get(key){const value=objects.get(key);return value?{etag:value.etag,json:async()=>JSON.parse(value.text)}:null;},async put(key,text,options={}){if(options.onlyIf&&objects.get(key)?.etag!==options.onlyIf.etagMatches)return null;const value={text,etag:String(++revision)};objects.set(key,value);return value;},async list({prefix}){return {objects:[...objects.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key})),truncated:false};}};}
const origin='https://battle.example';
function request(path,{cookie='',body,originHeader=origin}={}){return new Request(origin+path,{method:body?'POST':'GET',headers:{cookie,origin:originHeader,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
test('published battle API gates the directory and creates independent persistent scenes',async()=>{
 const bucket=memoryBucket();
 assert.equal((await battleAPI(request('/api/scenes'),bucket)).status,403);
 assert.equal((await battleAPI(request('/api/narrator',{body:{password:'wrong'}}),bucket)).status,401);
 const login=await battleAPI(request('/api/narrator',{body:{password:'mateus26262622'}}),bucket);
 assert.equal(login.status,200);assert.match(login.headers.get('Set-Cookie'),/HttpOnly; Secure/);
 const cookie=login.headers.get('Set-Cookie').split(';')[0];
 const create=async name=>(await (await battleAPI(request('/api/scenes',{cookie,body:{name}}),bucket)).json()).id;
 const a=await create('Cena A'),b=await create('Cena B');assert.notEqual(a,b);
 const list=await (await battleAPI(request('/api/scenes',{cookie}),bucket)).json();assert.equal(list.scenes.length,2);assert.ok(list.scenes.every(s=>s.enemies.includes('Morphomon')));
 const loaded=await battleAPI(request('/api/scene?id='+a),bucket),snapshot=await loaded.json(),client=loaded.headers.get('Set-Cookie').split(';')[0];
 const change={command:'presentation',args:[{name:'Cena A atualizada',background:'https://example.com/bg.png'}],revision:snapshot.revision,requestId:'name-1',mode:'narrator'};
 assert.equal((await battleAPI(request('/api/scene?id='+a,{cookie:client,body:change}),bucket)).status,403);
 assert.equal((await battleAPI(request('/api/scene?id='+a,{cookie:cookie+'; '+client,body:change}),bucket)).status,200);
 const reloaded=await (await battleAPI(request('/api/scene?id='+a,{cookie:client}),bucket)).json();assert.equal(reloaded.state.scene.name,'Cena A atualizada');assert.equal(reloaded.revision,1);
 const other=await (await battleAPI(request('/api/scene?id='+b),bucket)).json();assert.equal(other.state.scene.name,'Cena B');assert.equal(other.revision,0);
 const updated=await (await battleAPI(request('/api/scenes',{cookie}),bucket)).json();assert.equal(updated.scenes.find(s=>s.id===a).background,'https://example.com/bg.png');
 const forged=await battleAPI(request('/api/scenes',{cookie,body:{name:'CSRF'},originHeader:'https://foreign.example'}),bucket);assert.equal(forged.status,403);
});
test('competing published commands cannot overwrite a saved roll or revision',async()=>{
 const bucket=memoryBucket();const login=await battleAPI(request('/api/narrator',{body:{password:'mateus26262622'}}),bucket),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const {id}=await (await battleAPI(request('/api/scenes',{cookie,body:{name:'Concorrência'}}),bucket)).json();
 const body={command:'presentation',args:[{name:'Primeira alteração'}],revision:0,requestId:'same',mode:'narrator'};
 const results=await Promise.all(['one','two'].map(requestId=>battleAPI(request('/api/scene?id='+id,{cookie,body:{...body,requestId}}),bucket)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const saved=await (await battleAPI(request('/api/scene?id='+id,{cookie}),bucket)).json();assert.equal(saved.revision,1);
});
