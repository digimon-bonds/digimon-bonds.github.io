import test from 'node:test';import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {digimonDatabase} from '../../site/digimon-database.js';
import {sheetArt,sheetSprite,findSheetArt,sceneSprite} from './sheet-art.mjs';
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

test('artwork distinguishes same-name Digimon across evolution stages',()=>{
 const rookie=findSheetArt('ARGOMON.','rookie'),champion=findSheetArt('Argomon','champion');
 assert.ok(rookie);assert.ok(champion);assert.notEqual(rookie.image,champion.image);
 assert.equal(sheetSprite('Argomon','fallback','ultimate'),'fallback');
});

test('battle replaces catalog source images with cutouts while preserving custom portraits',()=>{
 const art=findSheetArt('Greymon','champion');assert.ok(art);
 assert.equal(sceneSprite({name:'GREYMON.',stage:'champion',image:art.sourceImage}),art.image);
 assert.equal(sceneSprite({name:'Greymon',stage:'champion',image:'https://example.test/my-npc.png'}),'https://example.test/my-npc.png');
 assert.equal(sceneSprite({name:'My custom Digimon',stage:'champion',image:'https://example.test/custom.png'}),'https://example.test/custom.png');
});


test('Digibank cutouts use local alpha PNGs and account for every requested species',()=>{
 const record=JSON.parse(readFileSync(new URL('./assets/partners/cutout-generation.json',import.meta.url),'utf8'));
 const rookies=digimonDatabase.filter(d=>d.stage==='rookie');assert.equal(rookies.length,151);
 assert.equal(record.stages.rookie.attempted,151);assert.equal(record.stages.champion.total,244);assert.ok(record.stages.champion.attempted<=244);
 assert.equal(new Set(sheetArt.map(a=>a.digibankId)).size,sheetArt.length);
 for(const d of digimonDatabase.filter(d=>['rookie','champion'].includes(d.stage))){const completed=sheetArt.some(a=>a.digibankId===d.id),pending=record.pending.some(a=>a.digibankId===d.id);assert.notEqual(completed,pending,d.name+' must have one recorded outcome');}
 for(const art of sheetArt){const d=digimonDatabase.find(d=>d.id===art.digibankId);assert.ok(d,art.name);assert.equal(art.sourceImage,d.image);assert.equal(String(art.partner||'').toLocaleLowerCase(),String(d.partner||'').toLocaleLowerCase());assert.equal(art.stage,d.stage);assert.equal(art.transparent,true);assert.ok(art.transparentPixels>0&&art.visiblePixels>0);assert.equal(sheetSprite(d.name.toUpperCase()+'.','',d.stage),art.image);const png=readFileSync(new URL(art.image,import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png[25],6,'PNG must contain real alpha');}
 for(const stage of ['rookie','champion']){assert.equal(record.stages[stage].completed,sheetArt.filter(a=>a.stage===stage).length);assert.equal(record.stages[stage].attempted,record.stages[stage].completed+record.pending.filter(a=>a.stage===stage&&a.attempted!==false).length);assert.equal(record.stages[stage].total,record.stages[stage].completed+record.pending.filter(a=>a.stage===stage).length);}
 for(const item of record.pending){assert.ok(digimonDatabase.some(d=>d.id===item.digibankId&&d.name===item.name&&d.stage===item.stage));assert.equal(sheetArt.some(a=>a.digibankId===item.digibankId),false);assert.ok(item.reason);}
 assert.equal(sheetArt.some(a=>a.name==='Alphamon'),false);
});
