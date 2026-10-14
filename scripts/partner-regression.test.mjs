import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeElement} from '../site/catalog.js';
import {fresh,parseProject,validate,generateBBCode} from '../site/rules.js';
import {initializeForms} from '../site/forms.js';
import {applySpecies,creatorSpecies} from '../site/species-selection.js';
import {resolvePartnerImage,loadPartnerImage} from '../site/partner-image.js';

test('Black Strabimon selects a public PNG and keeps a valid dark signature through save/load/export',()=>{
 const s=fresh();initializeForms(s);assert.ok(applySpecies(s,'rookie','rookie-black-strabimon'));
 assert.equal(s.digiImage,'https://digimon-bonds.github.io/assets/digibank/black-strabimon.png');
 assert.equal(creatorSpecies.find(d=>d.name==='BLACK STRABIMON').image,s.digiImage);
 s.attack='Garra';s.attackElement='Trevas / Escuridão';s.effect='PESADO';
 s.digiImage='./assets/digibank/black-strabimon.png';
 const loaded=parseProject(JSON.parse(JSON.stringify(s)));
 assert.equal(loaded.attackElement,'Escuridão');assert.equal(loaded.digiImage,resolvePartnerImage(s.digiImage));
 assert.ok(!validate(loaded).some(e=>['attackElement','digiImage','digiName'].includes(e.field)));
 assert.match(generateBBCode(loaded),/Escuridão/);
 for(const label of ['Trevas','TREVAS/ESCURIDÃO','Escuridao / Trevas','[b]Trevas[/b]'])assert.equal(normalizeElement(label),'Escuridão');
 assert.equal(normalizeElement('Elemento inventado'),'Elemento inventado');
});
test('public custom PNG bypasses the remote proxy, while other URLs retain fallback',async()=>{
 const requests=[];const img={set src(url){requests.push(url);},decode:async()=>{}};
 await loadPartnerImage(img,'./assets/digibank/black-strabimon.png',url=>'https://proxy.test/?url='+encodeURIComponent(url));
 assert.equal(requests.length,1);assert.equal(requests[0],resolvePartnerImage('./assets/digibank/black-strabimon.png'));
 const failed=[];const fallback={set src(url){failed.push(url);},decode:async()=>{if(failed.length===1)throw Error('Proxy failed');}};
 await loadPartnerImage(fallback,'https://images.test/custom.png',()=> 'https://proxy.test/image');
 assert.deepEqual(failed,['https://proxy.test/image','https://images.test/custom.png']);
 await assert.rejects(loadPartnerImage({decode:async()=>{throw Error('Missing');}},'https://images.test/missing.png',()=> 'https://proxy.test/image'));
});


test('raster exports retain the partner proxy query in the bundled resource cache', async()=>{
 const {readFile}=await import('node:fs/promises');
 const vendor=await readFile(new URL('../site/html-to-image.js',import.meta.url),'utf8');
 const keyFunction=vendor.match(/function\(t,e,n\)\{var r=t\.replace\([\s\S]*?:r\}/)?.[0];
 assert.ok(keyFunction,'Locate the actual bundled resource cache key');
 const cacheKey=Function('return ('+keyFunction+')')();
 const urls=['Renamon','Kyubimon','Taomon','Sakuyamon'].map(name=>'https://images.test/api/partner-image?url='+encodeURIComponent('https://art.test/'+name+'.png'));
 assert.equal(new Set(urls.map(url=>cacheKey(url,'image/png',false))).size,1,'Reproduce the previous collision');
 assert.equal(new Set(urls.map(url=>cacheKey(url,'image/png',true))).size,urls.length);
 const publisher=await readFile(new URL('../site/forum-publish.js',import.meta.url),'utf8');
 assert.match(publisher,/toBlob\([\s\S]*?includeQueryParams:true/);
});

test('custom artwork remains independent through save, update import and BBCode export for every stage',()=>{
 const s=fresh();initializeForms(s);s.digiName='RENAMON';s.digiImage='https://art.test/renamon.png';s.imageMode='original';
 for(const [stage,f] of Object.entries(s.digimonForms)){f.unlocked=true;if(stage!=='rookie'){f.name=stage;f.image='https://art.test/'+stage+'.png';f.imageMode='original';}}
 const restored=parseProject(JSON.parse(JSON.stringify(s)));
 for(const [stage,f] of Object.entries(restored.digimonForms)){
  assert.equal(f.image,stage==='rookie'?s.digiImage:'https://art.test/'+stage+'.png');
  assert.equal(f.imageMode,'original');assert.ok(generateBBCode(restored).includes(f.image));
 }
});
