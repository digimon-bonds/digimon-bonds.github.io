import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,parseProject,validate,generateBBCode,parseCharacterCode} from '../site/rules.js';
import {initializeForms,activeForm,unlockStage} from '../site/forms.js';
import {applySpecies,selectedSpecies,selectableSpecies} from '../site/species-selection.js';
import {partnerVisual,imageAppearanceControls} from '../site/partner-cutouts.js';
import {renderDigivice} from '../site/digivices.js';
import {formEditor} from '../site/forms-ui.js';

const renamed=()=>{const s=fresh();initializeForms(s);applySpecies(s,'rookie','rookie-black-strabimon');s.digiName='Yamato';s.imageBackground='#aabbcc';return s;};
test('a nickname retains the selected species, cutout, color, selector and export through save/load',()=>{
 const s=renamed(),before=validate(s).filter(e=>e.field!=='digiName');
 const loaded=parseProject(JSON.parse(JSON.stringify(s))),f=activeForm(loaded);
 assert.equal(loaded.digiName,'Yamato');assert.equal(selectedSpecies(loaded).id,'rookie-black-strabimon');
 assert.deepEqual(validate(loaded).filter(e=>e.field!=='digiName'),before);assert.ok(!validate(loaded).some(e=>e.field==='digiName'));
 assert.match(partnerVisual(f).image,/black-strabimon.png$/);assert.equal(partnerVisual(f).background,'#aabbcc');
 assert.match(imageAppearanceControls(f,x=>x),/COR DE FUNDO/);
 assert.match(formEditor(loaded,x=>x),/value="rookie-black-strabimon" selected/);
 assert.match(renderDigivice({...loaded,speciesName:f.speciesName},x=>x,()=>true),/partner-cutouts\/black-strabimon.png/);
 const code=generateBBCode(loaded);assert.match(code,/Yamato/);
 const restored=parseCharacterCode(code,loaded);assert.equal(restored.digiName,'Yamato');assert.equal(restored.digiSpeciesId,loaded.digiSpeciesId);
});
test('old renamed drafts recover the species from their exact database image without overwriting custom art',()=>{
 const s=renamed();delete s.digiSpeciesId;delete s.digimonForms.rookie.speciesId;
 const loaded=parseProject(s);assert.equal(loaded.digiName,'Yamato');assert.equal(selectedSpecies(loaded).id,'rookie-black-strabimon');
 const custom=renamed();custom.imageMode='original';custom.digiImage='https://art.test/custom.png';
 const restored=parseProject(custom);assert.equal(partnerVisual(activeForm(restored)).image,custom.digiImage);
 delete custom.digiSpeciesId;delete custom.digimonForms.rookie.speciesId;
 assert.ok(validate(parseProject(custom)).some(e=>e.field==='digiName'),'unknown species is never guessed from nickname/custom artwork');
});
test('evolved forms keep separate species identities when renamed and reloaded',()=>{
 const s=renamed();unlockStage(s,'champion');const d=selectableSpecies('champion')[0];applySpecies(s,'champion',d.id);s.digimonForms.champion.name='Forma heroica';s.activeDigimonStage='champion';
 const loaded=parseProject(s);assert.equal(activeForm(loaded).name,'Forma heroica');assert.equal(selectedSpecies(loaded,'champion').id,d.id);assert.equal(selectedSpecies(loaded).id,'rookie-black-strabimon');
 applySpecies(loaded,'rookie','rookie-agumon');assert.equal(selectedSpecies(loaded).id,'rookie-agumon');assert.equal(selectedSpecies(loaded,'champion').id,d.id);
});
test('a nickname matching another species never changes the chosen identity or imported facts',()=>{
 const s=renamed();s.digiName='Agumon';const loaded=parseProject(s);assert.equal(loaded.digiName,'Agumon');assert.equal(selectedSpecies(loaded).id,'rookie-black-strabimon');
 const bad=renamed();bad.digiSpeciesId='not-a-species';assert.ok(validate(bad).some(e=>e.field==='digiName'));
});
