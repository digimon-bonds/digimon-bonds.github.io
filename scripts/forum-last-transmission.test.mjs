import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=await readFile(new URL('../site/forum-skin/bonds-os.js',import.meta.url),'utf8');
const context={URL,Array,location:{origin:'https://digimonbonds.forumeiros.com'},api:{}};
runInNewContext(source.slice(source.indexOf('  function topicURL('),source.indexOf('  function rollActor('))+source.slice(source.indexOf('  function topicKey('),source.indexOf('  function parsePosts('))+'api.latestTransmissionURL=latestTransmissionURL;',context);
const anchor=href=>({getAttribute:()=>href});
const row=(title,links)=>({querySelector:()=>anchor(title),querySelectorAll:()=>links.map(anchor)});
test('home latest transmission preserves the native last page and exact post anchor',()=>{
 const url=context.api.latestTransmissionURL(row('/t56-shinjuku-noite-das-cem-lanternas',['/t56-shinjuku-noite-das-cem-lanternas','/u12','/t56p50-shinjuku-noite-das-cem-lanternas#508']));
 assert.equal(url.pathname,'/t56p50-shinjuku-noite-das-cem-lanternas');assert.equal(url.hash,'#508');
});
test('first-page posts retain their anchor and unrelated or external URLs are excluded',()=>{
 const url=context.api.latestTransmissionURL(row('/t56-shinjuku',['https://evil.example/t56p50-shinjuku#508','/t57p50-other#509','/t56-shinjuku#123']));
 assert.equal(url.pathname,'/t56-shinjuku');assert.equal(url.hash,'#123');
 assert.equal(context.api.latestTransmissionURL(row('/t56-shinjuku',['/t56-shinjuku','/u12'])),null);
});
