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
