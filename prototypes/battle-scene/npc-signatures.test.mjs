import test from 'node:test';
import assert from 'node:assert/strict';
import {npcSignature,automaticEffects} from './npc-signatures.mjs';
import {effects} from '../../site/catalog.js';
import {createNpc} from './npc.mjs';
import {emptyBattle,currentForm} from './scene-engine.mjs';
test('every effect in character creation can be selected without preventing NPC creation',()=>{
 for(const effect of effects){const attack=npcSignature('Yamigoe | 1 | Escuridão | '+effect.name);const s=createNpc(emptyBattle(),{name:'NPC',stage:'rookie',attributes:{power:3,heart:3,intelligence:3,agility:3},element:'Escuridão',digitalAttribute:'Vírus',attacks:[attack],position:{x:0,y:0,scale:1},qualities:[]});assert.equal(currentForm(s.actors[0]).attacks[0].name,'Yamigoe');assert.equal(attack.sourceEffects.length,1);if(attack.effect)assert.ok(automaticEffects.includes(attack.effect));}
});
test('punctuation, accents and case in typed effects do not produce invalid signatures',()=>{
 assert.equal(npcSignature('Impacto | 1 | Luz | Pesado.').effect,'pesado');assert.equal(npcSignature('Impacto | 1 | Luz | QUEBRA BLOQUEIO').effect,'quebra-bloqueio');assert.throws(()=>npcSignature('A | 1 | Luz | xyz'),/desconhecido/);
});
