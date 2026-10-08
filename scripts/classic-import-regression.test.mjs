import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recoverTableCharacter} from '../site/table-import.js';
import {recoverCharacter} from '../site/recovery.js';
import {validate,parseProject,generateBBCode} from '../site/rules.js';
import {archetypes} from '../site/archetypes.js';
import {creatorSpecies} from '../site/species-selection.js';
import {initializeForms,setSignatureElement,unlockStage} from '../site/forms.js';
import {withUpdate} from '../site/progression.js';
import {uniqueLabelMatch,speciesKey} from '../site/import-labels.js';
const code=readFileSync(new URL('./fixtures/koga-classic.bbcode',import.meta.url),'utf8');

test('classic imports tolerate decorative punctuation and equivalent Unicode characters',()=>{
 for(const [archetype,name,element,digital] of [
  ['“Lobo Solitário.”','«Black Strabimon.»','“Escuridão.”','«Vírus.»'],
  ['• LOBO–SOLITARIO...','BLACK—STRABIMON!','TREVAS。','VIRUS!'],
  ['Ｌｏｂｏ　Ｓｏｌｉｔáｒｉｏ．','Ｂｌａｃｋ　Ｓｔｒａｂｉｍｏｎ．','Ｔｒｅｖａｓ．','Ｖíｒｕｓ．'],
  ['  Lobo\u00a0  Solitário…  ','Black\u200BStrabimon.','Trevas / Escuridão.','  Vírus.  ']
 ]){
  const s=recoverTableCharacter(code.replace('Lobo Solitário.',archetype).replace('Black Strabimon.',name).replace('Vírus.',digital).replace('Elemento:[/b] Trevas.','Elemento:[/b] '+element).replace(']Trevas[/td]',']'+element+'[/td]'));
  assert.deepEqual(validate(s),[],name);assert.equal(s.digiName,'BLACK STRABIMON');assert.equal(s.attackElement,'Escuridão');
 }
 assert.equal(uniqueLabelMatch(creatorSpecies,'“Agumon.”',speciesKey)?.name,'AGUMON');
 assert.equal(uniqueLabelMatch(creatorSpecies,'Agumon inventado.',speciesKey),undefined);
 assert.equal(uniqueLabelMatch([{name:'Agumon'},{name:'AGUMON.'}],'Agumon.',speciesKey),undefined);
});

test('changing the first signature element persists through preview, save/load and upgraded attack replay',()=>{
 let s=recoverTableCharacter(code);
 s=withUpdate(s,{type:'exp',reason:'Teste de progressão',amount:10,extra:0});
 s=withUpdate(s,{type:'upgrade',target:'talent',index:0});
 s=withUpdate(s,{type:'form-upgrade',stage:'rookie',index:0,target:'attack',choice:'attack',base:structuredClone(s.digimonForms.rookie.signatureAttacks[0])});
 initializeForms(s);assert.equal(s.digimonForms.rookie.signatureAttacks[0].rank,2);
 unlockStage(s,'champion');s.digimonForms.champion.signatureAttacks[0].element='Gelo';
 for(const element of ['Fogo','Escuridão']){
  assert.equal(setSignatureElement(s,'rookie',0,element),true);initializeForms(s);
  s=parseProject(JSON.parse(JSON.stringify(s)));
  assert.equal(s.attackElement,element);assert.equal(s.digimonForms.rookie.signatureAttacks[0].element,element);
  assert.equal(s.digimonForms.rookie.signatureAttacks[0].rank,2);
  assert.equal(s.digimonForms.champion.signatureAttacks[0].element,'Gelo');
  assert.ok(!validate(s).some(e=>e.field==='attackElement'));
 }
});

test('the exact Kōga sheet imports, validates, saves and exports without losing combat data',async()=>{
 const {state:s}=await recoverCharacter(code);
 assert.deepEqual(validate(s),[]);
 assert.equal(s.archetype,archetypes.find(a=>a.name==='LOBO SOLITÁRIO').id);
 assert.equal(s.digiName,'BLACK STRABIMON');assert.equal(s.digital,'Vírus');
 assert.equal(s.element,'Escuridão');assert.equal(s.attackElement,'Escuridão');
 assert.equal(s.digiImage,'https://digimon-bonds.github.io/assets/digibank/black-strabimon.png');
 assert.deepEqual(s.digi,{poder:4,coracao:2,inteligencia:2,agilidade:4});
 assert.equal(s.attack,'Yamigoe');assert.equal(s.effect,'DESORIENTADOR');
 assert.equal(s.digimonForms.rookie.qualities.length,1);
 assert.match(s.digiPersonality,/sem hesitar\.$/);assert.match(s.history,/\S/);
 const loaded=parseProject(JSON.parse(JSON.stringify(s)));assert.deepEqual(validate(loaded),[]);
 assert.match(generateBBCode(loaded),/black-strabimon\.png/);
});

test('every initial species recognizes harmless name punctuation, spacing and accent variations',()=>{
 for(const d of creatorSpecies){
  const variant=d.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s/g,'');
  const input=code.replace('Black Strabimon.',variant+'.').replace('Vírus.',d.digital+'.').replace('Homem-Besta / Ninja das Trevas.',d.classification+'.');
  const s=recoverTableCharacter(input);
  assert.equal(s.digiName,d.name,d.name);assert.equal(s.digital,d.digital,d.name);
  assert.equal(s.classification,d.classification,d.name);
  assert.ok(!validate(s).some(e=>['digiName','digital','classification'].includes(e.field)),d.name);
 }
});

test('every archetype accepts case, accents, trailing punctuation and BBCode emphasis',()=>{
 for(const a of archetypes){const s=recoverTableCharacter(code.replace('Lobo Solitário.','[i]'+a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')+'![/i]'));assert.equal(s.archetype,a.id);}
 for(const element of ['Trevas.','Trevas / Escuridão.','Escuridão!']){
  const s=recoverTableCharacter(code.replace('Elemento:[/b] Trevas.','Elemento:[/b] '+element).replace(']Trevas[/td]',']'+element+'[/td]'));assert.equal(s.attackElement,'Escuridão');assert.deepEqual(validate(s),[]);
 }
 const unknown=recoverTableCharacter(code.replace('Black Strabimon.','Strabimon inventado.').replace('Lobo Solitário.','Arquétipo inventado.'));
 assert.ok(validate(unknown).some(e=>e.field==='digiName'));assert.ok(validate(unknown).some(e=>e.field==='archetype'));
});
