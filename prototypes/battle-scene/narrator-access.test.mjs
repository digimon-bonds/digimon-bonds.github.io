import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createNarratorGate} from './narrator-access.mjs';
test('narrator gate rejects wrong password, remembers an issued session cookie, and rejects foreign origins',async()=>{
 const gate=createNarratorGate(createHash('sha256').update('test-only-secret').digest('hex'));
 async function request(method,password,cookie='',origin='http://127.0.0.1:4194'){
  const req={method,headers:{host:'127.0.0.1:4194',cookie,origin},async *[Symbol.asyncIterator](){yield JSON.stringify({password});}};
  const result={headers:{}};const res={setHeader(k,v){result.headers[k]=v;},writeHead(code,headers){result.code=code;Object.assign(result.headers,headers);return this;},end(body){result.body=JSON.parse(body);}};await gate(req,res);return result;
 }
 assert.equal((await request('GET')).body.authorized,false);assert.equal((await request('POST','wrong')).code,401);
 assert.equal((await request('POST','test-only-secret','','https://elsewhere.test')).code,403);
 const login=await request('POST','test-only-secret');assert.equal(login.code,200);assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);
 assert.equal((await request('GET',null,login.headers['Set-Cookie'].split(';')[0])).body.authorized,true);
 assert.equal((await request('GET',null,'bonds_narrator='+'0'.repeat(64))).body.authorized,false);
});
