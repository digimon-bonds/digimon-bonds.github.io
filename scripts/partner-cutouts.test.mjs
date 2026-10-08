import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fresh,parseProject} from '../site/rules.js';
import {initializeForms,activeForm} from '../site/forms.js';
import {applySpecies} from '../site/species-selection.js';
import {partnerCutouts,partnerVisual,imageAppearanceControls} from '../site/partner-cutouts.js';
import {renderDigivice} from '../site/digivices.js';

test('all 30 cutouts are bundled with the creator and tolerate imported names',()=>{
 assert.equal(partnerCutouts.length,30);
 for(const art of partnerCutouts){
  const visual=partnerVisual({name:art.name.toUpperCase()+'.',imageMode:'cutout',imageBackground:'#aabbcc'});
  assert.ok(existsSync(new URL(visual.image)));
  assert.equal(visual.background,'#aabbcc');
 }
});
test('species selection automatically uses a cutout, saves its background and preserves the original',()=>{
 const s=fresh();initializeForms(s);
 s.imageMode='original';applySpecies(s,'rookie','rookie-black-strabimon');
 assert.equal(s.imageMode,'cutout');s.imageBackground='#abcdef';
 const loaded=parseProject(JSON.parse(JSON.stringify(s))),f=activeForm(loaded);
 assert.equal(f.imageBackground,'#abcdef');
 assert.match(partnerVisual(f).image,/partner-cutouts\/black-strabimon.png$/);
 const rendered=renderDigivice({...loaded,digiName:f.name,digiImage:f.image},x=>x,()=>true);
 assert.match(rendered,/background:#abcdef;/);
 assert.match(rendered,/partner-cutouts\/black-strabimon.png/);
 loaded.imageMode='original';assert.equal(partnerVisual(activeForm(loaded)).image,s.digiImage);
});
test('older projects load, unavailable custom species keep their image, and unsafe colors are rejected',()=>{
 const legacy=fresh();delete legacy.imageMode;delete legacy.imageBackground;
 assert.doesNotThrow(()=>parseProject(legacy));
 const custom={name:'Meu Digimon',image:'https://example.com/custom.png',imageMode:'cutout',imageBackground:'#ffffff'};
 assert.deepEqual(partnerVisual(custom),{image:custom.image,background:''});
 assert.equal(imageAppearanceControls(custom,x=>x),'');
 const invalid=fresh();invalid.imageBackground='red;display:none';
 assert.throws(()=>parseProject(invalid),/Aparência/);
});
