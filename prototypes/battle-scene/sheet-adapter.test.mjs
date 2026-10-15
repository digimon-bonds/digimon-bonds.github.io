import test from 'node:test';import assert from 'node:assert/strict';import {adaptSheet} from './sheet-adapter.mjs';import * as e from './scene-engine.mjs';
const source={title:'Ficha pública',url:'https://digimonbonds.forumeiros.com/t43-f-kurogane-koga'};
const fixture=()=>({name:'Kōga',player:'Chwan',humanImage:'https://example.com/portrait.png',human:{corpo:3,mente:4,presenca:2},digimonForms:{rookie:{unlocked:true,name:'Black Strabimon.',image:'https://example.com/strabimon.png',digital:'Vírus.',element:'Escuridão.',attributes:{poder:3,coracao:2,inteligencia:3,agilidade:4},qualities:[{name:'Instinto',rank:1}],signatureAttacks:[{name:'Garra',rank:1,element:'Escuridão',effects:[{name:'Desorientador.'}]}]}}});
const resources={talents:[{name:'Boken',rank:2}],level:1,bond:6,pv:11,energy:10},bonus={pv:5,damage:2,dodge:1};
test('public sheet adapter preserves portraits, real stats, bonuses, and supported signature effects',()=>{const data=adaptSheet(fixture(),resources,bonus,source);assert.equal(data.human.image,'https://example.com/portrait.png');assert.equal(data.forms.rookie.image,'assets/black-strabimon.png');assert.equal(data.forms.rookie.attacks[0].effect,'desorientador');assert.deepEqual(e.markers(data.forms.rookie),{hp:16,damage:8,dodge:6});let s=e.importParticipant(e.initialBattle(),data);assert.equal(s.actors.at(-1).hp,11);assert.equal(s.humans.at(-1).talents[0].rank,2);assert.equal(e.importParticipant(s,data).actors.length,s.actors.length);assert.equal(s.actors[0].forms.rookie.attributes.heart,3);});
test('placeholder signatures are reported instead of making an otherwise usable sheet fail',()=>{const s=fixture();s.digimonForms.rookie.signatureAttacks=[{name:'Nome',rank:1,element:'Elemento',effects:[{name:'Efeito(s)'}]}];const data=adaptSheet(s,resources,bonus,source);assert.equal(data.forms.rookie.attacks.length,0);assert.ok(data.warnings.some(w=>w.includes('sem preenchimento')));});
test('unsupported effects and absent signature elements require explicit narrator review',()=>{const s=fixture();s.digimonForms.rookie.signatureAttacks[0]={name:'Dreno',rank:1,element:'—.',effects:[{name:'Vampirismo'}]};const data=adaptSheet(s,resources,bonus,source);assert.equal(data.forms.rookie.attacks[0].effect,null);assert.equal(data.forms.rookie.attacks[0].element,'Escuridão');assert.equal(data.warnings.length,2);});

test('reimport adds unlocked evolutions without duplicating or resetting the battle',()=>{
 const data=adaptSheet(fixture(),resources,bonus,source),s=e.importParticipant(e.emptyBattle(),data),a=s.actors[0],h=s.humans[0],p=s.pairs[0];
 Object.assign(a,{hp:3,remaining:0,conditions:{poisoned:{power:2}},uses:{rookie:0},usedAttacks:['rookie-attack-0']});Object.assign(h,{energy:2,remaining:0,digiviceUses:{booster:1}});Object.assign(p,{bond:1,turnFinalized:true});
 const updated=structuredClone(data);updated.level=2;updated.forms.champion={...structuredClone(updated.forms.rookie),stage:'champion',name:'Kyubimon'};updated.human.name='Nome atualizado';
 const n=e.importParticipant(s,updated);
 assert.equal(n.actors.length,1);assert.equal(n.actors[0].id,a.id);assert.equal(n.actors[0].forms.champion.name,'Kyubimon');
 for(const key of ['hp','remaining','conditions','uses','usedAttacks','formId'])assert.deepEqual(n.actors[0][key],a[key]);
 for(const key of ['id','energy','remaining','digiviceUses'])assert.deepEqual(n.humans[0][key],h[key]);
 assert.equal(n.humans[0].name,'Nome atualizado');assert.equal(n.pairs[0].bond,1);assert.equal(n.pairs[0].turnFinalized,true);assert.equal(n.pairs[0].level,2);assert.equal(s.actors[0].forms.champion,undefined);
 n.actors[0].highestReached=true;assert.equal(e.importParticipant(n,updated).actors[0].highestReached,true);
 n.actors[0].formId='champion';assert.throws(()=>e.importParticipant(n,data),/forma em uso/);
 assert.throws(()=>e.importParticipant({...s,pending:{kind:'test'}},updated),/pendentes/);
});

test('persistent reimport preserves round, claims and original restart resources; players cannot refresh sheets',async()=>{
 const {newSceneData,createSceneRepository}=await import('./scene-repository.mjs');
 const data=adaptSheet(fixture(),resources,bonus,source),s=e.importParticipant(e.emptyBattle(),data),initial=newSceneData(structuredClone(s));
 initial.state.actors[0].hp=2;initial.state.actors[0].remaining=0;initial.state.humans[0].energy=1;initial.state.humans[0].remaining=0;initial.state.pairs[0].bond=1;initial.state.pairs[0].turnFinalized=true;initial.clients.player={actorId:s.actors[0].id};
 const repo=createSceneRepository(initial,async()=>{}),updated=structuredClone(data);updated.level=2;updated.forms.champion={...structuredClone(updated.forms.rookie),stage:'champion',name:'Kyubimon'};
 await assert.rejects(repo.execute('player',{command:'importParticipant',args:[updated],revision:0,requestId:'denied'},false),/Narrador/);
 let snap=await repo.execute('narrator',{command:'importParticipant',args:[updated],revision:0,requestId:'refresh'},true);
 assert.equal(snap.state.round,s.round);assert.equal(snap.state.actors[0].hp,2);assert.equal(snap.state.humans[0].energy,1);assert.equal(snap.state.pairs[0].bond,1);assert.equal((await repo.read('player')).actorId,s.actors[0].id);
 snap=await repo.execute('narrator',{command:'restart',revision:snap.revision,requestId:'restart'},true);
 assert.equal(snap.state.actors[0].hp,s.actors[0].hp);assert.equal(snap.state.humans[0].energy,s.humans[0].energy);assert.equal(snap.state.actors[0].forms.champion.name,'Kyubimon');
});
