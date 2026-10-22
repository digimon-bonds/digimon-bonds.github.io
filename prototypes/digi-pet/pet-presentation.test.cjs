const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function environment(){
 let time=0,sequence=0;const timers=new Map();
 const clock={get now(){return time},set(fn,delay){const id=++sequence;timers.set(id,{at:time+delay,fn});return id},clear(id){timers.delete(id)},tick(ms){const end=time+ms;let guard=0;while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;if(++guard>10000)throw Error('Timer loop');time=next[1].at;timers.delete(next[0]);next[1].fn();}time=end},get pending(){return timers.size}};
 function target(){return {listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(x=>x!==fn)},emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event)}}}
 function element(){return Object.assign(target(),{dataset:{},attributes:{},hidden:false,textContent:'',children:[],style:{setProperty(){}},classList:{toggle(){},add(){}},insertBefore(child){this.children.push(child)},get lastChild(){return this.children.at(-1)},setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]??null},set src(v){this.attributes.src=v},get src(){return this.attributes.src},append(...children){this.children.push(...children)},replaceChildren(...children){this.children=children},closest(){return this.card||(this.card=element())},showModal(){this.open=true},close(){this.open=false;this.emit('close')}})}
 const nodes=new Map(),get=id=>{if(!nodes.has(id))throw Error('Missing DOM id: '+id);return nodes.get(id)};
 const doc=Object.assign(target(),{hidden:false,getElementById:get,createElement:()=>{const node=element();Object.defineProperty(node,'id',{get(){return this._id},set(value){this._id=value;nodes.set(value,this)}});return node},createElementNS:element});
 const media=Object.assign(target(),{matches:false});const win=Object.assign(target(),{matchMedia:()=>media});
 const imageLoads=[];class Image{set src(value){imageLoads.push(value);queueMicrotask(()=>{if(value.includes('missing'))this.onerror?.();else{this.naturalWidth=1280;this.onload?.()}})}decode(){return Promise.resolve()}}
 const storage=new Map();
 const context=vm.createContext({window:win,document:doc,Image,crypto:require('node:crypto').webcrypto,queueMicrotask,structuredClone,console,Date,Math,setTimeout:(fn,ms)=>clock.set(fn,ms),clearTimeout:id=>clock.clear(id),setInterval:(fn,ms)=>{const repeat=()=>{fn();clock.set(repeat,ms)};return clock.set(repeat,ms)},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 const load=file=>vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
 return {clock,element,context,load,doc,win,media,imageLoads,nodes,storage};
}
function sprites(options={}){const env=environment();env.load('pet-sprites.js');const image=env.element();const controller=env.context.PetSprites.create({element:image,variants:{normal:'normal.png',blink:'blink.png'},random:()=>0,...options});return {...env,image,controller}}
test('sprite starts NORMAL, blinks after 3 seconds for 120ms, then returns without drift',async()=>{const e=sprites();assert.equal(await e.controller.ready,true);assert.equal(e.image.dataset.spriteVariant,'normal');e.clock.tick(2999);assert.equal(e.image.dataset.spriteVariant,'normal');e.clock.tick(1);assert.equal(e.image.dataset.spriteVariant,'blink');e.clock.tick(119);assert.equal(e.image.dataset.spriteVariant,'blink');e.clock.tick(1);assert.equal(e.image.dataset.spriteVariant,'normal');e.clock.tick(2880);assert.equal(e.image.dataset.spriteVariant,'blink');});
test('random upper bounds are 8 seconds and 180ms',async()=>{const e=sprites({random:()=>.999999});await e.controller.ready;e.clock.tick(7999);assert.equal(e.image.dataset.spriteVariant,'normal');e.clock.tick(1);assert.equal(e.image.dataset.spriteVariant,'blink');e.clock.tick(179);assert.equal(e.image.dataset.spriteVariant,'blink');e.clock.tick(1);assert.equal(e.image.dataset.spriteVariant,'normal');});
test('missing or omitted BLINK stays NORMAL without retries or broken visible source',async()=>{for(const blink of ['missing.png',undefined]){const e=sprites({variants:{normal:'normal.png',blink}});assert.equal(await e.controller.ready,false);e.clock.tick(60000);assert.equal(e.image.src,'normal.png');assert.equal(e.clock.pending,0);assert.ok(e.imageLoads.filter(x=>x==='missing.png').length<=1)}});
test('critical interaction cancels an active blink and resumes with a fresh interval',async()=>{let allowed=true;const e=sprites({canBlink:()=>allowed});await e.controller.ready;e.clock.tick(3000);allowed=false;e.controller.refresh();assert.equal(e.image.dataset.spriteVariant,'normal');e.clock.tick(20000);assert.equal(e.clock.pending,0);allowed=true;e.controller.refresh();e.clock.tick(2999);assert.equal(e.image.dataset.spriteVariant,'normal');e.clock.tick(1);assert.equal(e.image.dataset.spriteVariant,'blink');});
test('hidden tabs and reduced-motion preference pause sprite timers',async()=>{const e=sprites();await e.controller.ready;e.doc.hidden=true;e.doc.emit('visibilitychange');e.clock.tick(20000);assert.equal(e.image.dataset.spriteVariant,'normal');assert.equal(e.clock.pending,0);e.doc.hidden=false;e.doc.emit('visibilitychange');e.clock.tick(3000);assert.equal(e.image.dataset.spriteVariant,'blink');e.media.matches=true;e.media.emit('change');assert.equal(e.image.dataset.spriteVariant,'normal');assert.equal(e.clock.pending,0);});
test('page suspension, image failure and controller disposal restore NORMAL',async()=>{const e=sprites();await e.controller.ready;e.clock.tick(3000);e.win.emit('pagehide');assert.equal(e.image.dataset.spriteVariant,'normal');assert.equal(e.clock.pending,0);e.win.emit('pageshow');e.clock.tick(3000);e.image.emit('error');assert.equal(e.controller.blinkAvailable,false);assert.equal(e.image.src,'normal.png');e.controller.destroy();e.clock.tick(10000);assert.equal(e.clock.pending,0);});
test('normal and user-provided blink assets have identical canvas dimensions',()=>{const a=fs.readFileSync(path.join(__dirname,'assets/agumon-normal.png')),b=fs.readFileSync(path.join(__dirname,'assets/agumon-blink.png'));assert.deepEqual([a.readUInt32BE(16),a.readUInt32BE(20)],[b.readUInt32BE(16),b.readUInt32BE(20)]);assert.deepEqual(a,fs.readFileSync(path.join(__dirname,'assets/agumon.png')));});
function speech(){const e=environment();e.load('pet-speech.js');const bubble=e.element(),text=e.element();let allowed=true;const controller=e.context.PetSpeech.create({element:bubble,textElement:text,library:{greeting:['Oi!'],casual:['Casual'],happy:['Feliz'],dirty:['Uma limpeza cairia bem.'],hungry:['Tô com fome.'],talk:['Oi de novo.']},now:()=>e.clock.now,canSpeak:()=>allowed});return {...e,bubble,text,controller,allow:v=>{allowed=v}}}
test('speech disappears after 4.5 seconds; casual and happy do not re-open it',()=>{const e=speech();e.controller.speak('greeting');e.controller.observe('casual');assert.equal(e.bubble.hidden,false);e.clock.tick(4499);assert.equal(e.bubble.hidden,false);e.clock.tick(1);assert.equal(e.bubble.hidden,true);assert.equal(e.text.textContent,'');for(let i=0;i<300;i++){e.clock.tick(1000);e.controller.observe(i%2?'happy':'casual')}assert.equal(e.bubble.hidden,true);});
test('a persistent need is limited to one reminder per 3 minutes',()=>{const e=speech();e.controller.observe('dirty');assert.equal(e.bubble.hidden,false);e.clock.tick(4500);for(let i=0;i<120;i++){e.clock.tick(1000);e.controller.observe('dirty');assert.equal(e.bubble.hidden,true)}e.clock.tick(55500);e.controller.observe('dirty');assert.equal(e.bubble.hidden,false);});
test('resolved complaints vanish immediately and stale reactions are never queued',()=>{const e=speech();e.controller.observe('dirty');e.controller.observe('casual');assert.equal(e.bubble.hidden,true);e.clock.tick(60000);e.controller.observe('casual');assert.equal(e.bubble.hidden,true);e.controller.speak('talk',true);assert.equal(e.controller.speak('hungry',true),false);e.clock.tick(4500);assert.equal(e.bubble.hidden,true);e.clock.tick(60000);assert.equal(e.bubble.hidden,true);});
test('action speech is throttled and visibility/reset clears the bubble',()=>{const e=speech();assert.equal(e.controller.speak('talk',true),true);assert.equal(e.controller.speak('talk',true),false);e.clock.tick(2000);assert.equal(e.controller.speak('talk',true),true);e.allow(false);e.controller.observe('dirty');assert.equal(e.bubble.hidden,true);e.allow(true);e.controller.reset();assert.equal(e.controller.speak('greeting'),true);e.controller.destroy();assert.equal(e.bubble.hidden,true);});
test('complete application initializes against current HTML without removed-control references',async()=>{
 const e=environment(),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 for(const match of html.matchAll(/\bid="([^"]+)"/g)){const node=e.element();const tag=html.match(new RegExp('<[^>]*id="'+match[1]+'"[^>]*>'))?.[0]||'';node.hidden=/\bhidden\b/.test(tag);e.nodes.set(match[1],node)}
 const thought=e.element();thought.hidden=true;const shell=e.element(),inside=e.element(),outside=e.element();
 const actions=['food','play','train','talk','explore'].map(action=>{const n=e.element();n.dataset.action=action;return n});const habitats=['interior','exterior'].map(habitat=>{const n=e.element();n.dataset.habitat=habitat;return n});
 e.doc.querySelector=selector=>({'.pet-thought':thought,'.room-shell':shell,'.interaction-deck':shell,'[data-action="food"]':actions[0],'.scenery-interior':inside,'.scenery-exterior':outside,'dialog[open]':[...e.nodes.values()].find(n=>n.open),'.pet-experience':e.element()}[selector]??null);
 e.doc.querySelectorAll=selector=>({'[data-action]':actions,'.habitat-switch button':habitats,'[data-simulate]':[],'[data-debug]':[]}[selector]||[]);
 for(const file of ['pet-config.js','downtime-config.js','exploration-rng.js','pet-storage.js','pet-engine.js','pet-downtime.js','pet-sprites.js','pet-speech.js','pet-motion.js','rpg-reward-rules.js','digi-pet.js','downtime-ui.js'])e.load(file);
 await vm.runInContext('petSprites.ready',e.context);assert.equal(shell.dataset.skin,'street');assert.equal(thought.hidden,false);e.clock.tick(4500);assert.equal(thought.hidden,true);assert.equal(e.nodes.get('pet-thought-text').textContent,'');
 assert.ok(!html.includes('id="open-history"'));assert.ok(!html.includes('id="last-action"'));assert.ok(!html.includes('deck-caption'));assert.ok(!fs.readFileSync(path.join(__dirname,'digi-pet.js'),'utf8').includes('A atividade termina em'));
 assert.equal(e.nodes.get('system-feedback').hidden,true);assert.ok(e.storage.has('digimon-bonds:digi-pet:prototype:v6'));
 const beforeTouch=e.storage.get('digimon-bonds:digi-pet:prototype:v6');
 e.nodes.get('pet-touch').emit('click');assert.equal(e.nodes.get('partner-image').dataset.spriteVariant,'blink');assert.equal(e.storage.get('digimon-bonds:digi-pet:prototype:v6'),beforeTouch);
 e.clock.tick(180);assert.equal(e.nodes.get('partner-image').dataset.spriteVariant,'normal');
 actions.find(x=>x.dataset.action==='play').emit('click');assert.equal(e.nodes.get('pet-touch').disabled,true);
 const whileBusy=e.storage.get('digimon-bonds:digi-pet:prototype:v6');e.nodes.get('pet-touch').emit('click');assert.equal(e.storage.get('digimon-bonds:digi-pet:prototype:v6'),whileBusy);
 e.doc.emit('keydown',{ctrlKey:true,shiftKey:true,code:'KeyD',preventDefault(){}});assert.equal(e.nodes.get('history-dialog').open,true);
 e.nodes.get('history-dialog').close();
 vm.runInContext("state=DigiDowntime.debug(state,'finish');state=DigiDowntime.debug(state,'ready');save();render();",e.context);
 actions.find(x=>x.dataset.action==='train').emit('click');assert.equal(e.nodes.get('downtime-dialog').open,true);assert.equal(e.nodes.get('downtime-title').textContent,'O que vamos treinar?');
 const descendants=node=>[node,...node.children.flatMap(descendants)];
 descendants(e.nodes.get('downtime-dialog')).find(x=>x.textContent==='Poder · 0/2').emit('click');
 assert.equal(vm.runInContext('state.activity.attribute',e.context),'power');
 vm.runInContext("state=DigiDowntime.debug(state,'finishTrain');state=DigiDowntime.debug(state,'nextDay');state=DigiDowntime.debug(state,'ready');save();render();",e.context);
 actions.find(x=>x.dataset.action==='explore').emit('click');assert.equal(e.nodes.get('downtime-title').textContent,'ÁREA DE DADOS // SETOR 01');
 descendants(e.nodes.get('downtime-dialog')).find(x=>x.textContent==='INICIAR EXPLORAÇÃO').emit('click');assert.equal(vm.runInContext('state.activity.kind',e.context),'explore');
 vm.runInContext("state=DigiDowntime.debug(state,'roll',Date.now(),95);state=DigiDowntime.debug(state,'finishExplore');save();render();",e.context);
 assert.equal(e.nodes.get('downtime-title').textContent,'CARD RARO');
 assert.ok(!descendants(e.nodes.get('downtime-dialog')).some(x=>/D100|ROLANDO|Disposição/.test(x.textContent)));
 // A delayed native close event from the previous chooser must not cancel the
 // newly opened reveal or acknowledge its pending reward before dismissal.
 e.nodes.get('downtime-dialog').emit('close');assert.equal(vm.runInContext('state.downtime.results[0].seen',e.context),false);
 e.clock.tick(1550);assert.equal(e.nodes.get('downtime-title').textContent,'CARD RARO');
 assert.equal(vm.runInContext('state.downtime.inventory.cards.length',e.context),1);e.nodes.get('downtime-dialog').close();
 assert.equal(vm.runInContext('state.downtime.results[0].seen',e.context),true);
 e.nodes.get('open-inventory').emit('click');assert.ok(e.nodes.get('downtime-title').textContent.startsWith('Inventário'));
 descendants(e.nodes.get('downtime-dialog')).find(x=>x.textContent==='Cards').emit('click');assert.ok(descendants(e.nodes.get('downtime-dialog')).some(x=>x.textContent.includes('Permanente na ficha')));
 e.nodes.get('downtime-dialog').close();e.nodes.get('open-cycle').emit('click');assert.equal(e.nodes.get('downtime-title').textContent,'Digi-Cycle');e.nodes.get('downtime-dialog').close();
 e.nodes.get('open-reset').emit('click');e.nodes.get('confirm-reset').emit('click');assert.equal(vm.runInContext('state.downtime.inventory.cards.length',e.context),0);
});

function motion(){
 const e=environment();e.load('pet-motion.js');const breath=e.element(),touch=e.element(),records=[];let allowed=true;
 for(const [name,element]of [['breath',breath],['touch',touch]])element.animate=(frames,options)=>{
  let resolve,reject;const finished=new Promise((yes,no)=>{resolve=yes;reject=no});
  const timer=e.clock.set(()=>resolve(),options.duration);
  const animation={finished,cancel(){e.clock.clear(timer);reject(new Error('cancelled'))}};
  records.push({name,frames,options,animation});return animation;
 };
 const values=[0,.999999,0];let index=0;
 const controller=e.context.PetMotion.create({breathElement:breath,touchElement:touch,canAnimate:()=>allowed,random:()=>values[index++%values.length]});
 return {...e,controller,records,allow:value=>{allowed=value}};
}
test('idle breathing draws a fresh 2.4–3.4 second duration per completed cycle',async()=>{
 const e=motion();assert.equal(e.records[0].options.duration,2400);assert.equal(e.records[0].frames[1].transform,'translateY(-1px) scale(1.006, 1.012)');
 e.clock.tick(2400);await Promise.resolve();assert.equal(e.records[1].options.duration,3400);
 assert.equal(e.records[0].frames[0].transform,e.records[0].frames[2].transform);e.controller.destroy();await Promise.resolve();
});
test('idle motion pauses for critical actions, hidden tabs and reduced motion',async()=>{
 const e=motion();e.allow(false);e.controller.refresh();assert.equal(e.clock.pending,0);assert.equal(e.controller.react(),false);
 e.allow(true);e.controller.refresh();assert.equal(e.clock.pending,1);e.media.matches=true;e.media.emit('change');assert.equal(e.clock.pending,0);
 e.media.matches=false;e.media.emit('change');e.doc.hidden=true;e.doc.emit('visibilitychange');assert.equal(e.clock.pending,0);e.controller.destroy();await Promise.resolve();
});
test('touch reaction is a small 320ms tilt on a separate wrapper',async()=>{
 const e=motion();assert.equal(e.controller.react(),true);const reaction=e.records.find(x=>x.name==='touch');assert.equal(reaction.options.duration,320);assert.equal(reaction.frames[1].transform,'rotate(-1deg) translateY(-1px)');
 e.clock.tick(320);await Promise.resolve();assert.equal(e.controller.touchAnimation,null);assert.ok(e.controller.breathAnimation);e.controller.destroy();await Promise.resolve();
});
test('manual happy blink reuses the normal/blink lifecycle without overlapping timers',async()=>{
 const e=sprites();await e.controller.ready;assert.equal(e.controller.blinkOnce(),true);assert.equal(e.image.dataset.spriteVariant,'blink');assert.equal(e.controller.blinkOnce(),false);e.clock.tick(120);assert.equal(e.image.dataset.spriteVariant,'normal');e.controller.destroy();assert.equal(e.clock.pending,0);
});
test('dirty event speech can interrupt a recent action but still expires without a queue',()=>{const e=speech();e.controller.speak('talk',true);assert.equal(e.controller.speak('dirty',true,true),true);assert.equal(e.text.textContent,'Uma limpeza cairia bem.');e.clock.tick(4500);assert.equal(e.bubble.hidden,true);e.clock.tick(60000);e.controller.observe('casual');assert.equal(e.bubble.hidden,true);});
