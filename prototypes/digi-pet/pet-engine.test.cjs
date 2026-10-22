const {test} = require('node:test');
const assert = require('node:assert/strict');
require('./pet-engine.js');
const e = globalThis.DigiPetEngine;
const now = 1_800_000_000_000;
const minute = e.CONFIG.tickMs;
test('all four care actions apply and record the configured effects without mutating input', () => {
 for(const action of ['food','play','train','talk']) {
  const initial=e.create(now), result=e.act(initial,action,now);
  assert.equal(result.ok,true); assert.equal(result.state.counts[action],1);
  assert.equal(result.state.history[0].action,action);
  for(const [key,value] of Object.entries(e.CONFIG.initial)) assert.equal(result.state.stats[key], value+(e.CONFIG.actions[action].effects[key]||0));
  assert.deepEqual(initial,e.create(now));
 }
});
test('cooldown rejects repeats without effects or extra history; other actions remain available',()=>{
 const first=e.act(e.create(now),'talk',now).state;
 const repeated=e.act(first,'talk',now+1000);
 assert.equal(repeated.ok,false);assert.deepEqual(repeated.state.stats,first.stats);assert.equal(repeated.state.history.length,1);
 assert.equal(e.act(first,'play',now+1000).ok,true);
 assert.equal(e.act(first,'talk',now+5000).ok,true);
});
test('resource boundaries, full meals and insufficient energy are enforced',()=>{
 let s=e.create(now);s.stats={satiety:100,mood:99,energy:0,companionship:99};
 assert.equal(e.act(s,'food',now).ok,false);assert.equal(e.act(s,'play',now).ok,false);assert.equal(e.act(s,'train',now).ok,false);
 s=e.act(s,'talk',now).state;assert.equal(s.stats.companionship,100);assert.equal(s.stats.mood,100);
 s.stats.energy=100;s.stats.satiety=9;assert.equal(e.act(s,'train',now).ok,false);
});
test('one-minute ticks preserve partial time and do not apply twice',()=>{
 let s=e.advance(e.create(now),now+59000);assert.equal(s.stats.satiety,65);
 s=e.advance(s,now+60000);assert.equal(s.stats.satiety,64);assert.equal(s.stats.energy,69);
 s=e.advance(s,now+61000);assert.equal(s.stats.satiety,64);
});
test('long absences are capped, discarded and reduce company and mood with safe floors',()=>{
 let s=e.create(now);s.stats.energy=0;
 s=e.advance(s,now+10*24*60*minute);
 assert.equal(s.stats.satiety,20);assert.equal(s.stats.energy,0);assert.equal(s.stats.mood,34);assert.equal(s.stats.companionship,55);
 assert.deepEqual(e.advance(s,now+10*24*60*minute).stats,s.stats);
 s.stats.satiety=5;assert.equal(e.advance(s,s.lastTick+minute).stats.satiety,5);
});
test('sleep regenerates gradually, blocks interactions, wakes at full energy and cannot grant instant energy',()=>{
 let s=e.act(e.create(now),'sleep',now+59000).state;
 assert.equal(e.act(s,'play',now+59001).ok,false);
 assert.equal(e.advance(s,now+60000).stats.energy,70);
 s=e.advance(s,now+119000);assert.equal(s.stats.energy,78);assert.equal(s.stats.satiety,64);
 const awake=e.act(s,'wake',now+119000).state;assert.equal(awake.stats.energy,78);
 s=e.advance(s,now+5*minute+59000);assert.equal(s.sleeping,false);assert.equal(s.stats.energy,99);assert.equal(s.history[0].action,'wake');
});
test('dirt lowers mood once on arrival, remains unpleasant and cleaning improves mood only once',()=>{
 let s=e.act(e.create(now),'food',now).state;
 assert.equal(e.advance(s,now+119999).waste,false);
 s=e.advance(s,now+120000);assert.equal(s.waste,true);assert.equal(s.digestionDue,null);assert.equal(s.stats.mood,41);
 assert.deepEqual(e.advance(s,now+120000).stats,s.stats);
 const clean=e.act(s,'clean',now+120000);assert.equal(clean.ok,true);assert.equal(clean.state.waste,false);assert.equal(clean.state.stats.mood,63);assert.equal(clean.state.stats.companionship,70);
 assert.equal(e.act(clean.state,'clean',now+120001).ok,false);
 s=e.act(s,'food',now+125000).state;assert.equal(s.digestionDue,null);
});
test('restore validates version, numeric states, unknown fields and clock changes',()=>{
 assert.deepEqual(e.restore({version:9},now),e.create(now));
 assert.deepEqual(e.restore({version:1,stats:{satiety:'x'}},now),e.create(now));
 let s=e.create(now);s.stats.companionship=999;s.lastTick=now+minute;s.history=[{action:'unknown',at:now}];
 s=e.restore(s,now);assert.equal(s.stats.companionship,100);assert.equal(s.lastTick,now);assert.equal(s.history.length,0);
 assert.equal(e.advance(s,now-minute).lastTick,now-minute);
});
test('simulation advances digestion and sleep, rebases timestamps and history stays bounded',()=>{
 let s=e.act(e.create(now),'food',now).state;
 s=e.act(s,'sleep',now).state;s=e.simulate(s,5,now);
 assert.equal(s.waste,true);assert.equal(s.sleeping,false);assert.equal(s.lastTick,now);
 assert.ok(s.history.every(item=>item.at<=now));
 for(let i=0;i<25;i++)s=e.act(s,'talk',now+i*5000).state;
 assert.equal(s.history.length,e.CONFIG.historyLimit);
 assert.equal(s.counts.talk,25);
});
test('conditions prioritize sleep, hunger and tiredness before happiness',()=>{
 let s=e.create(now);assert.equal(e.condition(s),'Tranquilo');s.stats.mood=80;assert.equal(e.condition(s),'Feliz');
 s.stats.energy=20;assert.equal(e.condition(s),'Cansado');s.stats.satiety=20;assert.equal(e.condition(s),'Com fome');
 s.sleeping=true;assert.equal(e.condition(s),'Dormindo');
});
test('old saves migrate bond to companionship and skins validate without losing care data',()=>{
 const raw={...e.create(now),version:1,stats:{satiety:55,mood:40,energy:30,bond:42},skin:'unknown'};
 const s=e.restore(raw,now);assert.equal(s.version,2);assert.equal(s.stats.companionship,42);assert.equal(s.stats.bond,undefined);assert.equal(s.skin,'bonds');
 s.skin='street';s.habitat='exterior';assert.deepEqual(e.restore(s,now),s);
});
test('attention resets solitude clock, sleep pauses companionship decay, company can be restored',()=>{
 let s=e.advance(e.create(now),now+15*minute);assert.equal(s.stats.companionship,64);
 s=e.act(s,'talk',now+15*minute).state;assert.equal(s.stats.companionship,76);assert.equal(s.attentionTicks,0);
 s=e.advance(s,now+25*minute);assert.equal(s.stats.companionship,76);
 s.stats.energy=0;s=e.act(s,'sleep',now+25*minute).state;
 assert.equal(e.advance(s,now+35*minute).stats.companionship,76);
});
test('passive needs never cross safety floors and sadness/solitude have helpful status text',()=>{
 let s=e.create(now);s.stats={satiety:21,energy:16,mood:21,companionship:21};s.waste=true;
 s=e.advance(s,now+60*minute);assert.deepEqual(s.stats,{satiety:20,energy:15,mood:20,companionship:20});assert.equal(e.condition(s),'Tristinho');assert.match(e.status(s),/sujeira/);
 s.waste=false;s.stats.satiety=80;s.stats.energy=80;s.stats.mood=60;assert.equal(e.condition(s),'Solitário');assert.match(e.status(s),/falta/);
});
