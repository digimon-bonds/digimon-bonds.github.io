import test from 'node:test';import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {digimonDatabase} from '../../site/digimon-database.js';
import {sheetArt,sheetSprite} from './sheet-art.mjs';
import {exampleBattle,addParticipant,roundStatus} from './scene-engine.mjs';
test('sheet artwork accepts known spelling variants, preserves unknown custom portraits, and exists locally',()=>{
 for(const [a,b] of [['Biyomon.','Piyomon'],['Veemon','V-mon'],['Salamon','Plotmon']])assert.equal(sheetSprite(a),sheetSprite(b));
 assert.equal(sheetSprite('Hyemon (Shenzi)','https://example.test/custom.png'),'https://example.test/custom.png');
 assert.equal(sheetSprite('BLACK STRABIMON.'),'assets/black-strabimon.png');
 for(const art of sheetArt)assert.ok(existsSync(new URL(art.image,import.meta.url)));
});
test('examples use distinct species and keep independent actor and human actions',()=>{
 let s=exampleBattle();s=addParticipant(s,'ally');s=addParticipant(s,'enemy');
 assert.equal(new Set(s.actors.map(a=>a.forms.rookie.name)).size,4);
 assert.equal(roundStatus(s).waiting.length,6);
});


test('battle artwork covers exactly the 30 occupied Rookie Digibank entries, using local transparent PNGs only',()=>{
 const partners=digimonDatabase.filter(d=>d.stage==='rookie'&&d.partner);
 assert.equal(partners.length,30);assert.equal(sheetArt.length,partners.length);
 for(const d of partners){const art=sheetArt.find(a=>a.digibankId===d.id);assert.ok(art,d.name);assert.equal(art.sourceImage,d.image);assert.equal(art.partner.length>0,true);assert.equal(art.stage,'rookie');assert.equal(art.transparent,true);assert.ok(art.transparentPixels>0&&art.visiblePixels>0);assert.equal(sheetSprite(d.name.toUpperCase()+'.'),art.image);const png=readFileSync(new URL(art.image,import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png[25],6,'PNG must contain real alpha');}
 assert.equal(sheetArt.some(a=>a.name==='Alphamon'),false);
});
