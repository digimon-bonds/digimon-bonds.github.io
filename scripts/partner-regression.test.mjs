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
