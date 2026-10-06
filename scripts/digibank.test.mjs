import test from 'node:test';
import assert from 'node:assert/strict';
import {digimonDatabase,digimonStages,searchDigimon,findDigimon,toCreatorSpecies,getCreatorSpecies,getStageSpecies,evolutionCategories,elementalCycles} from '../site/digimon-database.js';
import {elements,species} from '../site/catalog.js';
import {translateClassification} from '../site/digimon-localization.js';
test('database includes migrated rookies and curated Champions, Ultimates and Megas',()=>{
 assert.equal(digimonDatabase.length,1085);
 assert.equal(new Set(digimonDatabase.map(d=>d.id)).size,1085);
 assert.equal(getStageSpecies('champion').length,244);
 assert.equal(getStageSpecies('ultimate').length,238);
 assert.equal(getStageSpecies('mega').length,264);
 assert.equal(getStageSpecies('special').length,19);
 assert.equal(getCreatorSpecies().length,79);
 assert.equal(getStageSpecies('xbody').length,121);
 for(const d of digimonDatabase){
  for(const key of ['id','name','digitalAttribute','classification','description','image','sourceUrl','element'])assert.ok(d[key],d.id+' '+key);
  assert.ok(elements.includes(d.element),d.id);
  assert.ok(digimonStages.some(s=>s.id===d.stage));
  assert.equal(typeof d.availableAsPartner,'boolean');
  assert.match(d.image,/^(https:\/\/|\.\/assets\/)/);assert.match(d.sourceUrl,/^https:\/\//);
  assert.ok(Object.isFrozen(d));
  if(d.provenance==='official'){
   assert.ok(['Rookie','Champion','Ultimate','Mega','Hybrid','In-Training'].some(level=>d.official.level.startsWith(level)));
   assert.ok((d.official.attribute||d.progressionStage==='baby'||d.stage==='baby')&&d.official.type);
   assert.equal(d.classification,translateClassification(d.official.type));
   assert.match(d.sourceUrl,/^https:\/\/digimon\.net\/reference_en\/detail\.php\?directory_name=/);
   assert.equal(d.availableAsPartner,d.stage==='rookie'&&d.initialEligible&&!d.partner);
  }
 }
});
test('combined filters support case, diacritics, spaces, variants and empty stages',()=>{
 assert.equal(searchDigimon({stage:'rookie'}).length,151);
 assert.equal(searchDigimon({stage:'champion'}).length,244);
 assert.equal(searchDigimon({stage:'ultimate'}).length,238);
 assert.equal(searchDigimon({query:'  aGuMoN ',stage:'rookie'}).length,9);
 assert.equal(searchDigimon({query:'greymon blue',stage:'champion'}).length,1);
 assert.equal(searchDigimon({query:'Imaginarymon'}).length,0);
 assert.equal(searchDigimon({stage:'mega'}).length,264);
 assert.equal(searchDigimon({query:'wargreymon',stage:'mega'}).length,2);
 assert.equal(searchDigimon({stage:'baby'}).length,48);
 assert.equal(searchDigimon({stage:'special'}).length,19);
 assert.equal(searchDigimon({query:'Yoxtu!'}).length,1);
});
test('curation excludes X variants, Aegio species and very specific modes',()=>{
 for(const d of digimonDatabase.filter(d=>d.stage!=='xbody'))assert.doesNotMatch(d.name,/Antibody|X[- ]?Body|Aegio|\b2010\b|\bMode\b|Awakened|\bVersion\b/i,d.id);
 assert.equal(findDigimon('champion-aegiomon'),undefined);
 assert.equal(findDigimon('champion-greymon'),undefined);
 assert.equal(findDigimon('champion-greymon-x'),undefined);
 assert.equal(findDigimon('ultimate-aegiochusmon'),undefined);
 assert.equal(findDigimon('ultimate-luminamon-nene'),undefined);
 assert.equal(findDigimon('ultimate-metalgreymon-cyberlauncher'),undefined);
 assert.ok(findDigimon('champion-greymon-first'));
 assert.ok(findDigimon('ultimate-metalgreymon-v'));
 assert.ok(findDigimon('rookie-dorumon'));
 assert.ok(findDigimon('ultimate-doruguremon'));
 assert.equal(findDigimon('ultimate-angewomon').element,'Luz');
 assert.equal(findDigimon('ultimate-zudomon').element,'Elétrico');
 assert.equal(findDigimon('mega-wargreymon').element,'Fogo');
 assert.equal(findDigimon('mega-seraphimon').element,'Luz');
 assert.equal(findDigimon('mega-metalgarurumon').element,'Gelo');
 assert.equal(findDigimon('mega-beelzebumon').element,'Escuridão');
 assert.equal(findDigimon('mega-alphamon').official.type,'Holy Knight');
 assert.equal(findDigimon('mega-wargreymon-x'),undefined);
 assert.equal(findDigimon('mega-alphamon-ouryuken'),undefined);
 assert.equal(findDigimon('mega-death-x-mon'),undefined);
});
test('element review prioritizes Bonds nature over equipment, color and classification',()=>{
 for(const [id,element] of [
  ['champion-garurumon','Gelo'],['champion-garurumon-black','Gelo'],
  ['ultimate-weregarrumon','Gelo'],['mega-metalgarurumon-black','Gelo'],
  ['champion-stingmon','Madeira'],['champion-kuwagamon','Madeira'],
  ['ultimate-jewelbeemon','Madeira'],['mega-banchostingmon','Madeira'],
  ['ultimate-machgaogamon','Vento'],['mega-blitzgreymon','Elétrico'],
  ['mega-metatromon','Elétrico'],['mega-shinegreymon','Luz']
 ])assert.equal(findDigimon(id).element,element,id);
 assert.equal(findDigimon('champion-stingmon').classification,'Inseto');
 assert.equal(findDigimon('mega-metatromon').classification,'Máquina');
 assert.match(findDigimon('mega-metatromon').elementReason,/ausente no perfil oficial/);
 assert.equal(findDigimon('mega-dinomon').element,'Fogo');
 assert.equal(findDigimon('mega-lampmon').element,'Neutro');
});
test('Creator adapter preserves species fields without modifying the existing catalog',()=>{
 for(const old of species){
  const entry=digimonDatabase.find(d=>d.stage==='rookie'&&d.legacyName===old.name);
  assert.ok(entry,old.name);
  const adapted=toCreatorSpecies(entry);
  const normalizedOld={...old,digital:old.digital==='Virus'?'Vírus':old.digital};
  assert.deepEqual(adapted,normalizedOld);
 }
 const kudamon=findDigimon('rookie-kudamon');assert.equal(kudamon.partner,'KAILEN DUR');assert.equal(kudamon.availableAsPartner,false);
 assert.ok(getCreatorSpecies({availableOnly:true}).every(d=>!d.occupied));
 assert.equal(findDigimon('absent'),undefined);
});
test('Bonds cycles share water/ice and retain neutral outside advantages',()=>{
 assert.deepEqual(elementalCycles.map(c=>c.map(group=>group.join('/'))),[['Fogo','Madeira','Água/Gelo'],['Elétrico','Vento','Terra'],['Luz','Escuridão','Metal']]);
 assert.ok(digimonDatabase.some(d=>d.element==='Neutro'));
 assert.ok(!elementalCycles.flat(2).includes('Neutro'));
 assert.equal(findDigimon('champion-icemon').element,'Gelo');
 assert.equal(findDigimon('champion-angemon').element,'Luz');
 assert.equal(findDigimon('champion-devimon').element,'Escuridão');
 assert.equal(findDigimon('champion-birdramon').element,'Fogo');
});
test('Hybrid stages follow Bonds rules while preserving official Hybrid metadata',()=>{
 for(const [id,stage,category] of [
  ['rookie-flamon','rookie','spirit-base'],['rookie-storabimon','rookie','spirit-base'],
  ['champion-agnimon','champion','spirit-human'],['champion-wolfmon','champion','spirit-human'],
  ['ultimate-garummon','ultimate','spirit-beast'],['ultimate-vritramon','ultimate','spirit-beast'],
  ['ultimate-blizzarmon','ultimate','spirit-beast'],['mega-aldamon','mega','spirit-combined'],
  ['mega-kaisergreymon','mega','spirit-transcendent'],['mega-magnagarurumon','mega','spirit-transcendent']
 ]){
  const d=findDigimon(id);assert.equal(d.stage,stage);assert.equal(d.evolutionCategory,category);
  assert.equal(d.official.level,'Hybrid');assert.equal(d.official.attribute,'Variable');
 }
 assert.equal(digimonDatabase.filter(d=>d.official?.level==='Hybrid').length,32);
 assert.equal(searchDigimon({stage:'champion',evolutionCategory:'spirit-beast'}).length,0);
 assert.equal(searchDigimon({stage:'ultimate',evolutionCategory:'spirit-beast'}).length,11);
 assert.equal(searchDigimon({stage:'champion',evolutionCategory:'spirit-human'}).length,11);
});
test('special evolutions retain components and stay out of ordinary stage selection',()=>{
 for(const id of ['mega-susanoomon','mega-omegamon','mega-omegamon-zwart','mega-gracenovamon','ultimate-paildramon']){
  const d=findDigimon(id);assert.equal(d.stage,'special');assert.equal(d.requiresSpecialEvolution,true);assert.ok(d.evolutionRequirement);
  assert.ok(!getStageSpecies(d.progressionStage).some(r=>r.id===id));
  assert.ok(getStageSpecies(d.progressionStage,{includeSpecial:true}).some(r=>r.id===id));
 }
 assert.deepEqual(findDigimon('mega-gracenovamon').evolutionComponents.map(c=>c.name),['Apollomon','Dianamon']);
 for(const d of digimonDatabase){
  assert.ok(evolutionCategories.some(c=>c.id===d.evolutionCategory));
  for(const c of d.evolutionComponents||[]){assert.ok(findDigimon(c.digimonId));assert.ok(Object.isFrozen(c));}
 }
 assert.match(findDigimon('mega-mastemon').evolutionRequirement,/não restringe um único par/);
});
test('rookie display names are normalized while legacy identities remain compatible',()=>{
 assert.equal(findDigimon('rookie-agumon').name,'Agumon');
 assert.equal(findDigimon('rookie-black-agumon').name,'Black Agumon');
 for(const d of getStageSpecies('rookie'))assert.notEqual(d.name,d.name.toUpperCase());
 assert.equal(toCreatorSpecies(findDigimon('rookie-agumon')).name,'AGUMON');
});
test('official classifications are localized while source metadata stays intact',()=>{
 const preservedTerms=new Set(['LCD','Avatar','Mineral','Larva','Tathāgata']);
 for(const d of digimonDatabase.filter(d=>d.official)){
  if(!preservedTerms.has(d.official.type))assert.notEqual(d.classification,d.official.type,d.id+' untranslated '+d.official.type);
 }
 assert.equal(findDigimon('mega-gracenovamon').classification,'Galáxia');
 assert.equal(findDigimon('mega-gracenovamon').official.type,'Galaxy');
 assert.equal(findDigimon('mega-alphamon').classification,'Cavaleiro Sagrado');
 assert.equal(findDigimon('champion-agnimon').classification,'Feiticeiro');
});
test('new partner assignments and unavailable rookies obey independent eligibility',()=>{
 for(const [id,partner] of [['rookie-hyemon','KOWAGAKURE USAJIRŌ'],['rookie-black-strabimon','KUROGANE KŌGA'],['rookie-flamon','UZUKI AKAMINE']]){
  const d=findDigimon(id);assert.equal(d.partner,partner);assert.equal(d.initialEligible,true);assert.equal(d.availableAsPartner,false);
 }
 const rookies=searchDigimon({stage:'rookie'}),initial=rookies.filter(d=>d.initialEligible),other=rookies.filter(d=>!d.initialEligible);
 assert.equal(initial.length,79);assert.equal(other.length,72);
 assert.deepEqual(rookies,[...initial,...other]);
 for(const group of [initial,other])assert.deepEqual(group.map(d=>d.name),group.map(d=>d.name).sort((a,b)=>a.localeCompare(b,'pt-BR')));
 for(const d of other){assert.equal(d.availableAsPartner,false);assert.ok(!getCreatorSpecies().some(c=>c.name===toCreatorSpecies(d).name));}
 for(const d of digimonDatabase.filter(d=>d.partner))assert.equal(d.partner,d.partner.toLocaleUpperCase('pt-BR'));
 assert.equal(findDigimon('rookie-black-strabimon').element,'Escuridão');
 assert.equal(findDigimon('rookie-hyemon').digitalAttribute,'Data');
});
test('X variants are isolated from stages and never offered as initial partners',()=>{
 const x=searchDigimon({stage:'xbody'});assert.equal(x.length,121);
 for(const d of x){assert.equal(d.isXBody,true);assert.equal(d.initialEligible,false);assert.equal(d.availableAsPartner,false);assert.ok(d.progressionStage);}
 assert.ok(x.some(d=>d.id==='xbody-agumon-x'));
 assert.ok(x.some(d=>d.progressionStage==='mega'));
 assert.ok(!getStageSpecies('rookie').some(d=>d.isXBody));
 assert.ok(!getStageSpecies('mega').some(d=>d.isXBody));
 assert.ok(!getCreatorSpecies().some(d=>/Antibody|X[- ]?Body/i.test(d.name)));
 assert.equal(findDigimon('xbody-tokomon-x').digitalAttribute,'Não definido');
 assert.equal(findDigimon('xbody-tokomon-x').official.attribute,null);
});
