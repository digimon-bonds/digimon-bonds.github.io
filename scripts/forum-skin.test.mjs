import {readFile,readdir,stat} from 'node:fs/promises';
import {Script,runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const base=new URL('../site/forum-skin/',import.meta.url),js=await readFile(new URL('bonds-os.js',base),'utf8'),css=await readFile(new URL('bonds-os.css',base),'utf8');
test('beta entrypoints parse and contain no local-preview dependencies',async()=>{
 for(const file of ['bonds-os.js','forumeiros-loader.js'])new Script(await readFile(new URL(file,base),'utf8'));
 for(const file of ['bonds-os.js','bonds-os.css','forumeiros-loader.js','README.md']){
 const s=await readFile(new URL(file,base),'utf8');assert.doesNotMatch(s,/localhost|127\.0\.0\.1|file:\/\/|C:[\\/]|20261012-[1-9](?!\d)|\bv[1-9]\b|revisÃ£o [1-9]\b/i,file);}
 assert.doesNotMatch(js,/preventDefault|stopPropagation|MutationObserver|\.onsubmit|\.onclick|setInterval/);
});
test('every decorative asset exists; all CSS selectors are opt-in scoped',async()=>{
 const assets=await readdir(new URL('assets/',base));const expected=['hero.jpg','bonds-logo.svg','card-circuit.svg','agumon.webp','gabumon.webp','gatomon.webp','jijimon-cutout.webp','human-world.svg','digital-world.svg','bond-core.svg','arquetipo-estrela-v10.webp','community-poster.webp'];
 assert.deepEqual(assets.filter(n=>!n.endsWith('.md')).sort(),expected.sort());
 for(const [,ref] of css.matchAll(/url\(['"]?(\.\/assets\/[^)'" ]+)/g))await stat(new URL(ref,base));
 for(const selector of css.replace(/\/\*[\s\S]*?\*\//g,'').split('}').map(r=>r.slice(r.lastIndexOf('{',r.lastIndexOf('{')-1)+1)).filter(Boolean)){
 // Individual rules begin after any media prelude; keyframes are not used by this skin.
 const head=selector.slice(0,selector.indexOf('{')).trim();if(!head||head.startsWith('@'))continue;
 assert(head.includes('html.bonds-os-preview'),head);
 }
});
test('native route families and Systems restyling stay separate',()=>{const c={URL,location:{origin:'https://digimonbonds.forumeiros.com'},api:{}};runInNewContext(js.slice(js.indexOf('  function pageKind('),js.indexOf('  function enhanceInteriors('))+'api.pageKind=pageKind;api.systems=isSystemsPage;',c);for(const [p,k]of [['/t58p25-x','topic'],['/posting','editor'],['/post?t=54&mode=reply','editor'],['/post?p=144&mode=editpost','editor'],['/privmsg','messages'],['/profile','account'],['/u1','profile'],['/login','login'],['/register','register'],['/search','search']])assert.equal(c.api.pageKind('https://digimonbonds.forumeiros.com'+p,false),k);assert(c.api.systems(['/f4-sistemas']));for(const p of ['/f2-mundo-humano','/f3-mundo-digital','/f41-other'])assert(!c.api.systems([p]));});
test('group IDs only choose visual presentation, explicit override wins',()=>{const c={api:{}};runInNewContext(js.slice(js.indexOf('  function profileKind('),js.indexOf('  function pageKind('))+'api.role=profileKind;',c);const profile=(group,explicit='')=>({getAttribute:()=>explicit,querySelector:s=>group&&s.includes('.group-'+group)?{}:null});assert.equal(c.api.role(profile(2)),'narrator');assert.equal(c.api.role(profile(3)),'player');assert.equal(c.api.role(profile(null)),'guest');assert.equal(c.api.role(profile(2,'player')),'player');assert.match(js,/presentation heuristics, NOT authority/);});
