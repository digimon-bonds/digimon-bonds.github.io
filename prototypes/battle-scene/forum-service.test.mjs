import test from 'node:test';
import assert from 'node:assert/strict';
test('public forum reads use a redirect mode supported by the production worker',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.redirect,'manual');
  return new Response(String(url).includes('/f9-')?'<a class="topictitle" href="/t123-personagem">Personagem aprovado</a>':'<article>Ficha pública</article>');
 };
 try{const {listApproved,readApproved}=await import('./forum-service.mjs?worker-redirect-test');const list=await listApproved();assert.equal(list[0].title,'Personagem aprovado');assert.equal((await readApproved(list[0].path)).html,'<article>Ficha pública</article>');}finally{globalThis.fetch=original;}
});

test('all approved pages and each reimport read current data, without cached sheet snapshots',async()=>{
 const original=globalThis.fetch;let version=1;const requests=[];
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.cache,'no-store');assert.equal(options.cf.cacheTtl,0);requests.push(String(url));
  const path=new URL(url).pathname;
  if(path==='/f9-fichas-aprovadas')return new Response('<a class="topictitle" href="/t1-kai">Kai</a><a href="/f9p30-fichas-aprovadas">2</a><a href="https://evil.example/f9p60-fichas-aprovadas">Não</a>');
  if(path==='/f9p30-fichas-aprovadas')return new Response('<a class="topictitle" href="/t2-umi">Umi</a><a href="/f9-fichas-aprovadas">1</a>');
  return new Response('Ficha atual '+version);
 };
 try{
  const {listApproved,readApproved}=await import('./forum-service.mjs?freshness');
  assert.deepEqual((await listApproved()).map(s=>s.title),['Kai','Umi']);
  assert.equal((await readApproved('/t1-kai')).html,'Ficha atual 1');version=2;
  const current=await readApproved('/t1-kai');assert.equal(current.html,'Ficha atual 2');assert.ok(current.fetchedAt);
  assert.equal(requests.some(url=>url.includes('evil.example')),false);
  await assert.rejects(readApproved('/t999-not-approved'),/lista pública/);
 }finally{globalThis.fetch=original;}
});
