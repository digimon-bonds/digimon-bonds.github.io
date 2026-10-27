const {test}=require('node:test'),assert=require('node:assert/strict');
require('./pet-config.js');require('./downtime-config.js');require('./exploration-rng.js');require('./pet-engine.js');require('./pet-downtime.js');
const E=DigiPetEngine,D=DigiDowntime,C=DigiPetConfig,T=Date.parse('2026-10-27T15:00:00Z'),MIN=60000;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('each short care takes 60 seconds, locks other actions and only counts when finished',()=>{
 for(const action of ['food','talk','play']){
  const initial=E.create(T),r=E.act(initial,action,T,{foodId:'digimeat'});assert.equal(r.ok,true);
  let s=r.state;assert.equal(s.activity.endsAt-T,MIN);assert.equal(s.downtime.ledger[s.downtime.currentCycleDate].care,false);
  assert.equal(E.act(s,'play',T+MIN-1).ok,false);assert.equal(E.act(s,'talk',T+MIN-1).ok,false);assert.equal(E.act(s,'sleep',T+MIN-1).ok,false);
  s=E.advance(E.restore(JSON.parse(JSON.stringify(s)),T+MIN-1),T+MIN-1);assert.equal(s.activity.kind,action);
  s=E.advance(s,T+MIN);assert.equal(s.activity,null);assert.equal(s.counts[action],1);assert.equal(s.downtime.ledger[s.downtime.currentCycleDate].care,true);
  assert.equal(E.advance(E.restore(s,T+MIN),T+MIN).counts[action],1);
 }
});
test('food is reserved once, effects wait for the minute, reload neither consumes nor awards twice',()=>{
 let s=D.debug(E.create(T),'credits',T);s=D.buy(s,'digicarrot',T).state;
 s=E.act(s,'food',T,{foodId:'digicarrot'}).state;assert.equal(s.downtime.inventory.food.digicarrot||0,0);assert.equal(s.stats.satiety,65);assert.deepEqual(s.discoveredFoods,{});
 s=E.advance(E.restore(JSON.parse(JSON.stringify(s)),T+MIN),T+MIN);near(s.stats.satiety,80-2/60);assert.equal(s.baseMood,72);assert.equal(s.downtime.inventory.food.digicarrot||0,0);
 const again=E.advance(E.restore(s,T+MIN),T+MIN);assert.equal(again.stats.satiety,s.stats.satiety);assert.equal(again.counts.food,1);
});
test('rest from empty takes 45 minutes, survives reloads and wakes automatically at full energy',()=>{
 let s=E.create(T);s.stats.energy=0;s=E.act(s,'sleep',T).state;assert.equal(s.activity.endsAt-T,45*MIN);
 for(let n=1;n<45;n++){s=E.advance(E.restore(JSON.parse(JSON.stringify(s)),T+n*MIN),T+n*MIN);near(s.stats.energy,n*100/45);assert.equal(s.activity.kind,'sleep');near(s.activity.endsAt,T+45*MIN);}
 s=E.advance(s,T+45*MIN);near(s.stats.energy,100);assert.equal(s.activity,null);assert.equal(s.counts.sleep,1);
});
test('half-full rest takes 22.5 minutes; waking early keeps partial recovery and allows care',()=>{
 let s=E.create(T);s.stats.energy=50;s=E.act(s,'sleep',T).state;assert.equal(s.activity.endsAt-T,22.5*MIN);
 s=E.act(s,'wake',T+9*MIN).state;near(s.stats.energy,70);assert.equal(s.activity,null);assert.equal(E.act(s,'talk',T+9*MIN).ok,true);
});
test('old short rest migrates to full recovery without starting over or losing energy',()=>{
 let s=E.create(T);s.stats.energy=40;s.activity={kind:'sleep',startedAt:T,endsAt:T+3*MIN};
 s=E.advance(E.restore(s,T+9*MIN),T+9*MIN);near(s.stats.energy,60);assert.equal(s.activity.kind,'sleep');
});
test('major activities cost 50 energy once and last 30 real minutes in both presets',()=>{
 for(const mode of ['test','production'])for(const action of ['train','explore']){
  C.PET_CONFIG.mode=mode;let s=D.debug(E.create(T),'ready',T);s=E.act(s,action,T,{attribute:'power'}).state;
  assert.equal(s.stats.energy,50);assert.equal(s.stats.satiety,85);assert.equal(s.activity.endsAt-T,30*MIN);
  s=E.advance(E.restore(JSON.parse(JSON.stringify(s)),T+29*MIN),T+29*MIN);assert.equal(s.activity.kind,action);
  s=E.advance(s,T+30*MIN);assert.equal(s.activity,null);near(s.stats.energy,49.25);near(s.stats.satiety,84);
  const repeat=E.advance(E.restore(s,T+30*MIN),T+30*MIN);near(repeat.stats.energy,49.25);
 }C.PET_CONFIG.mode='test';
});
test('closed-tab exploration is resolved once after 30 minutes with inventory intact',()=>{
 D.setRngForTests({d100:()=>95,integer:(min,max)=>min});let s=E.act(E.create(T),'explore',T).state;
 s=E.advance(E.restore(s,T+31*MIN),T+31*MIN);assert.equal(s.downtime.inventory.cards.length,1);assert.equal(s.downtime.results.length,1);
 s=E.advance(E.restore(s,T+35*MIN),T+35*MIN);assert.equal(s.downtime.inventory.cards.length,1);assert.equal(s.downtime.results.length,1);
});
