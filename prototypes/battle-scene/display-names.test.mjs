import test from 'node:test';import assert from 'node:assert/strict';
import {displayName} from './display-names.mjs';import {adaptSheet} from './sheet-adapter.mjs';
test('imported uppercase labels become readable, while canonical Digimon spelling and mixed casing survive',()=>{
 assert.equal(displayName('KUDAMON'),'Kudamon');assert.equal(displayName(' AGUMON. ',['Agumon']),'Agumon');
 assert.equal(displayName('METALGREYMON',['MetalGreymon']),'MetalGreymon');assert.equal(displayName('V-MON',['V-mon']),'V-mon');
 assert.equal(displayName('MEI SHUYAN'),'Mei Shuyan');assert.equal(displayName('BALA DE AR'),'Bala de Ar');
 assert.equal(displayName('Kōga'),'Kōga');assert.equal(displayName('Black Strabimon'),'Black Strabimon');
});
test('adapter normalizes names throughout the imported partnership without altering source or stats',()=>{
 const sheet={name:'MEI SHUYAN',player:'PLAYER',human:{corpo:3,mente:3,presenca:3},digimonForms:{rookie:{unlocked:true,name:'KUDAMON',image:'https://example.test/kudamon.png',element:'Luz',digital:'Vacina',attributes:{poder:3,coracao:3,inteligencia:3,agilidade:3},qualities:[{name:'REFLEXOS RÁPIDOS',rank:1}],signatureAttacks:[{name:'BALA DE AR',rank:1,element:'Vento',effects:[]}]}}};
 const p={talents:[{name:'ARTES MARCIAIS',rank:1}],level:1,bond:6,pv:14,energy:10};
 const result=adaptSheet(sheet,p,{pv:0,damage:0,dodge:0},{url:'https://example.test/sheet'});
 assert.equal(result.forms.rookie.name,'Kudamon');assert.equal(result.human.name,'Mei Shuyan');assert.equal(result.forms.rookie.qualities[0].name,'Reflexos Rápidos');assert.equal(result.forms.rookie.attacks[0].name,'Bala de Ar');assert.equal(result.human.talents[0].name,'Artes Marciais');assert.equal(sheet.digimonForms.rookie.name,'KUDAMON');assert.equal(result.forms.rookie.attributes.power,3);
});
