import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../site/forum-skin/bonds-os.js',import.meta.url),'utf8');
const declaration=source.match(/  const BONDS_PIX_CODE = '[^']+';/)[0];
const helper=source.slice(source.indexOf('  async function copyPixCode('),source.indexOf('  function addSupport('));
const expected='dcd67a9081d9709a9d656e0185accdefde9b3f6fe3da100b92c7fd1d66f699d8';
function verify(value){assert.equal(value.length,203);assert.equal(createHash('sha256').update(value).digest('hex'),expected);}
function environment(clipboard,command=true){
 const appended=[],removed=[];let focused=false;
 const c={navigator:{clipboard},document:{activeElement:{focus(){focused=true}},execCommand(name){assert.equal(name,'copy');verify(appended[0].value);return command;}},make:()=>({setAttribute(){},select(){},remove(){removed.push(this)}}),api:{}};
 runInNewContext(declaration+helper+'api.copy=copyPixCode;',c);
 return {run:()=>c.api.copy({appendChild:n=>appended.push(n)}),appended,removed,get focused(){return focused}};
}
test('clipboard receives all 203 exact supplied characters, never only the Pix key',async()=>{
 let calls=0;const e=environment({async writeText(value){verify(value);calls++;}});
 assert.equal(await e.run(),true);assert.equal(calls,1);assert.equal(e.appended.length,0);
});
test('clipboard denial uses the same complete payload and restores focus',async()=>{
 const e=environment({async writeText(){throw Error('denied')}});
 assert.equal(await e.run(),true);assert.equal(e.appended[0],e.removed[0]);assert(e.focused);
});
test('copy failure does not claim success and still removes its temporary field',async()=>{
 const e=environment(undefined,false);assert.equal(await e.run(),false);assert.equal(e.removed.length,1);assert(e.focused);
});
test('support UI has no payment submission, external service or fixed contribution',()=>{
 const feature=source.slice(source.indexOf('  async function copyPixCode('),source.indexOf('  function topicURL('));
 assert.doesNotMatch(feature,/fetch\(|readPage\(|sendBeacon|WebSocket|https?:|type\s*=\s*['"]submit|amount\s*=/);
 assert.match(feature,/Código Pix copiado!/);assert.match(feature,/dialog\.showModal\(\)/);
});
test('banner and official payment QR are byte-for-byte preserved originals',async()=>{
 for(const [name,sha] of [['apoie-bonds-banner.png','645431b96c49d2dce28a0b6405cd90b10b92e466d115f059e80b5e28b3160f84'],['apoie-bonds-pix-qr.png','78874e16d481db3903aa76482234a1c1414371459e08c2b4b36979213568ae99']]){
  const bytes=await readFile(new URL('../site/forum-skin/assets/'+name,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
 }
});
