import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {fresh,parseProject} from '../site/rules.js';
import {stageOrder,initializeForms,unlockStage,lockStage} from '../site/forms.js';
const root=path.resolve(import.meta.dirname,'..');

test('imported attack elements normalize independently of the partner element',async()=>{
 const {validate}=await import('../site/rules.js');
 for(const value of ['Metal','METAL',' metal\u00a0','[b]Metal[/b]','Me\u200btal']){
  const s=fresh();s.element='Fogo';s.attackElement=value;initializeForms(s);
  assert.equal(s.attackElement,'Metal');assert.equal(s.element,'Fogo');
  assert(!validate(s).some(e=>e.field==='attackElement'));
  assert.equal(parseProject(s).attackElement,'Metal');
 }
});

test('classic table import separates cells, portraits, prose and attack columns',async()=>{
 const {recoverTableCharacter}=await import('../site/table-import.js');
 const cell=t=>'[td]'+t+'[/td]';
 const raw='REGISTRO VISUAL'+cell('[img]https://imgur.com/portrait.png[/img]')+cell('[b]Nome:[/b] Teste\n[b]Idade:[/b] 14 anos\n[b]Personalidade:[/b] Uma frase [b]importante[/b].')+cell('[b]CORPO[/b][size=20][b]2[/b][/size]')+cell('[b]MENTE[/b][b]4[/b]')+cell('[b]PRESENÇA[/b][b]3[/b]')+cell('[b][color=gold]FALHA[/color][/b]Receio')+'DIGIMON PARCEIRO[spoiler=NOVATO / ROOKIE]'+cell('[img]https://example.com/digimon.png[/img]')+cell('[b]Nome:[/b] Keramon\n[b]Elemento:[/b] Escuridão')+'ATAQUES DE ASSINATURA[tr]'+['Riso','1','Escuridão','Poderoso'].map(cell).join('')+'[/tr][/spoiler][b]HISTÓRIA[/b]'+cell('[justify]História completa.[/justify]');
 const s=recoverTableCharacter(raw);assert.equal(s.age,'14');assert.deepEqual(s.human,{mente:4,corpo:2,presenca:3});assert.equal(s.personality,'Uma frase importante.');assert.equal(s.flaw,'Receio');assert.equal(s.humanImage,'https://i.imgur.com/portrait.png');assert.equal(s.attack,'Riso');assert.equal(s.effect,'Poderoso');assert.equal(s.history,'História completa.');assert.equal(s.deviceImage,'');assert.equal(parseProject(s).digiImage,'https://example.com/digimon.png');
});
test('all local module imports and assets resolve with exact case',async()=>{
 const files=await readdir(path.join(root,'site'),{recursive:true});
 for(const file of files.filter(f=>/\.(js|css|html)$/.test(f))){
  const source=await readFile(path.join(root,'site',file),'utf8');
  const refs=[...source.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)].map(m=>m[1]);
  for(const ref of refs){const resolved=path.normalize(path.join(path.dirname(file),ref));assert(files.includes(resolved),`${file}: ${ref}`);}
 }
 const html=await readFile(path.join(root,'site/index.html'),'utf8');
 for(const [,ref] of html.matchAll(/(?:src|href)="([^"?#]+)"/g)){if(!/^(https?:|data:|#)/.test(ref))await access(path.join(root,'site',ref));}
});
test('all five forms retain independent data and locks through JSON',()=>{
 const s=initializeForms(fresh());const rookie=structuredClone(s.digimonForms.rookie);
 for(const stage of stageOrder.filter(x=>x!=='rookie')){unlockStage(s,stage);s.digimonForms[stage].name=`Test ${stage}`;s.activeDigimonStage=stage;const restored=parseProject(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.digimonForms,s.digimonForms);lockStage(s,stage);assert.equal(s.digimonForms[stage].name,`Test ${stage}`);}
 assert.deepEqual(s.digimonForms.rookie,rookie);
});
test('backend permits Pages CORS and rejects untrusted origins',async()=>{
 let source=await readFile(path.join(root,'server/worker.js'),'utf8');
 source=source.replace("import {env} from 'cloudflare:workers';","const env={};").replace("'./battle-api.mjs'",JSON.stringify(pathToFileURL(path.join(root,'server/battle-api.mjs')).href)).replace("'./sheet-document.js'",JSON.stringify(pathToFileURL(path.join(root,'server/sheet-document.js')).href));
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const [origin,status] of [['https://digimon-bonds.github.io',204],['https://evil.example',403]]){const res=await worker.fetch(new Request('https://bonds-character-app.mateuzim-alves.chatgpt.site/api/forum-sheets',{method:'OPTIONS',headers:{origin}}));assert.equal(res.status,status);assert.equal(res.headers.get('access-control-allow-origin'),status===204?origin:null);}
 const res=await worker.fetch(new Request('https://bonds-character-app.mateuzim-alves.chatgpt.site/api/digivice-images',{method:'POST',headers:{origin:'https://digimon-bonds.github.io','content-type':'image/png'},body:'invalid'}));assert.equal(res.status,400);assert.equal(res.headers.get('access-control-allow-origin'),'https://digimon-bonds.github.io');
});

import {addSignatureAttack,removeSignatureAttack,activeForm,availableAttacks} from '../site/forms.js';
import {embedCode} from '../site/forum-snapshot.js';
test('additional rookie attacks survive initialization, stage edits and JSON',()=>{
 const s=initializeForms(fresh());s.attack='Original';addSignatureAttack(s);s.digimonForms.rookie.signatureAttacks[1].name='Extra rookie';
 for(const stage of ['champion','ultimate','mega']){unlockStage(s,stage);s.activeDigimonStage=stage;assert.equal(activeForm(s).name,'');addSignatureAttack(s);s.digimonForms[stage].signatureAttacks[1].name='Extra '+stage;}
 const restored=parseProject(JSON.parse(JSON.stringify(s)));assert.equal(restored.digimonForms.rookie.signatureAttacks[1].name,'Extra rookie');assert.equal(restored.attack,'Original');assert.equal(availableAttacks(restored).length,8);restored.activeDigimonStage='rookie';assert.equal(removeSignatureAttack(restored,0),false);assert.equal(removeSignatureAttack(restored,1),true);assert.equal(activeForm(restored).signatureAttacks.length,1);
});
test('forum embed has bounded height and restores scrolling',()=>{const code=embedCode('https://example.com/sheets/abc');assert.match(code,/height="1400"/);assert.match(code,/scrolling="yes"/);assert(!code.includes('embed=full'));});
test('published project restores exact editable state and immutable versions',async()=>{
 let source=await readFile(path.join(root,'server/worker.js'),'utf8');
 source=source.replace("import {env} from 'cloudflare:workers';",`const objects=new Map();const env={BUCKET:{async put(key,value){objects.set(key,value)},async get(key){return objects.has(key)?{text:async()=>objects.get(key),body:objects.get(key)}:null}}};`).replace("'./battle-api.mjs'",JSON.stringify(pathToFileURL(path.join(root,'server/battle-api.mjs')).href)).replace("'./sheet-document.js'",JSON.stringify(pathToFileURL(path.join(root,'server/sheet-document.js')).href));
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const state=initializeForms(fresh());state.name='João';state.deviceColor='#123456';unlockStage(state,'champion');state.activeDigimonStage='champion';state.digimonForms.champion.name='Campeão';addSignatureAttack(state);state.digimonForms.champion.signatureAttacks[1].name='Ataque extra';
 const tree={tag:'article',attrs:{id:'preview'},children:['Teste']};
 const publish=async project=>(await worker.fetch(new Request('https://bonds-character-app.mateuzim-alves.chatgpt.site/api/forum-sheets',{method:'POST',headers:{origin:'https://digimon-bonds.github.io','content-type':'application/json'},body:JSON.stringify(project?{tree,project}:tree)}))).json();
 const result=await publish(state);const response=await worker.fetch(new Request('https://bonds-character-app.mateuzim-alves.chatgpt.site/api/forum-sheets/'+result.path.split('/').pop(),{headers:{origin:'https://digimon-bonds.github.io'}}));assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),'https://digimon-bonds.github.io');assert.deepEqual(parseProject((await response.json()).project),parseProject(state));
 state.name='Alterado';const changed=await publish(state);assert.notEqual(changed.path,result.path);
 const legacy=await publish();const legacyResponse=await worker.fetch(new Request('https://bonds-character-app.mateuzim-alves.chatgpt.site/api/forum-sheets/'+legacy.path.split('/').pop()));assert.equal((await legacyResponse.json()).legacy,true);
 const missing=await worker.fetch(new Request('https://bonds-character-app.mateuzim-alves.chatgpt.site/api/forum-sheets/'+'0'.repeat(64)));assert.equal(missing.status,404);
});
import {restorationCode,restoreEmbeddedCode} from '../site/code-archive.js';
test('forum code restores unicode, customizations and extra attacks without network',()=>{
 const state=initializeForms(fresh());state.name='João & Lívia';state.history='História com acentuação';state.deviceColor='#123456';addSignatureAttack(state);state.digimonForms.rookie.signatureAttacks[1].name='Golpe extra';
 const code='<iframe data-bonds-project="'+restorationCode(state)+'" src="https://example.com"></iframe>';
 const restored=restoreEmbeddedCode(code);assert.equal(restored.name,state.name);assert.equal(restored.history,state.history);assert.equal(restored.deviceColor,state.deviceColor);assert.equal(restored.digimonForms.rookie.signatureAttacks[1].name,'Golpe extra');assert.equal(restoreEmbeddedCode('<iframe></iframe>'),null);assert.throws(()=>restoreEmbeddedCode(code+code));assert.throws(()=>restoreEmbeddedCode('<iframe data-bonds-project="invalid"></iframe>'));
});
import {progress,progressionPlan,historicalBase,withUpdate,projectedForm} from '../site/progression.js';
import {rookieForm,blankForm} from '../site/forms.js';

test('XP milestones cross 5 and each level once, with exact automatic benefits',()=>{
 let s=initializeForms(fresh());s.talent='Observador';s.quality='Corajoso';s.attack='Golpe';s.element=s.attackElement='Metal';s.effect='PESADO';initializeForms(s);
 s=historicalBase(s,1,4);
 const plan=progressionPlan(s,2,5);assert.equal(plan.amount,11);assert.deepEqual(plan.after.pending,['minor','major','attribute','device','minor']);assert.equal(plan.after.level,2);assert.equal(plan.after.exp,5);assert.equal(plan.after.bond,7);assert.equal(plan.after.energy,10);assert.equal(9+plan.after.level,11);assert.equal(plan.next.digimonForms.champion.unlocked,false);
 assert.equal(plan.milestones.filter(x=>x.kind==='minor').length,2);assert.equal(plan.milestones.filter(x=>x.kind==='evolution').length,1);
 assert.throws(()=>progressionPlan(s,1,3));assert.throws(()=>progressionPlan(s,2,10));assert.throws(()=>progressionPlan(plan.next,3,0),/pendentes/);
 s=withUpdate(plan.next,{type:'upgrade',target:'talent',index:0});s=withUpdate(s,{type:'upgrade',choice:'talent',name:'Novo'});s=withUpdate(s,{type:'upgrade',choice:'Resistência'});s=withUpdate(s,{type:'upgrade',name:'Scanner'});s=withUpdate(s,{type:'upgrade',target:'talent',index:1});
 assert.equal(progress(s).pending.length,0);assert.equal(progress(s).talents[0].rank,2);assert.equal(progress(s).talents[1].rank,2);assert.equal(progress(s).devices[0].rank,1);assert.deepEqual(progress(parseProject(s)),progress(s));
 const second=progressionPlan(s,3,0).next;assert.throws(()=>withUpdate(second,{type:'upgrade',choice:'talent',name:'Repetido'}),/consecutivas/);assert.throws(()=>historicalBase(s,1,0),/histórico/);
});

test('independent form qualities and additional attacks upgrade without replay or undo drift',()=>{
 let s=initializeForms(fresh());s.element=s.attackElement='Metal';s.attack='Inicial';s.effect='PESADO';s.quality='Inicial';s.talent='Talento';initializeForms(s);
 s.digimonForms.champion={...blankForm('champion'),unlocked:true,qualities:[{name:'Defensor',rank:1}],signatureAttacks:[{name:'Metal',rank:2,element:'Metal',effects:[{name:'PESADO',element:''}]}]};
 s.digimonForms.rookie.signatureAttacks.push({name:'Extra',rank:1,element:'Metal',effects:[{name:'PESADO',element:''}]});
 s=historicalBase(s,2,4);s=progressionPlan(s,3,0).next;
 s=withUpdate(s,{type:'form-upgrade',stage:'champion',index:0,target:'quality',base:{name:'Defensor',rank:1}});
 s=withUpdate(s,{type:'form-upgrade',stage:'rookie',index:1,target:'attack',choice:'effect',base:projectedForm(s,'rookie').signatureAttacks[1],name:'EFICIENTE',element:''});
 s=withUpdate(s,{type:'upgrade',name:'Mapa'});
 for(let i=0;i<4;i++){initializeForms(s);s=parseProject(s);assert.equal(projectedForm(s,'champion').qualities[0].rank,2);assert.equal(rookieForm(s).signatureAttacks[1].effects.length,2);}
 s.updates.pop();s.updates.pop();initializeForms(s);assert.equal(rookieForm(s).signatureAttacks[1].effects.length,1);assert.equal(projectedForm(s,'champion').qualities[0].rank,2);
 s.updates.pop();assert.equal(projectedForm(s,'champion').qualities[0].rank,1);
});

test('multi-level progression respects level 10 and grants nine device upgrades',()=>{
 const s=initializeForms(fresh()),plan=progressionPlan(s,10,0);
 assert.equal(plan.after.pending.filter(x=>x==='device').length,9);assert.equal(plan.after.pending.filter(x=>x==='minor').length,9);assert.equal(plan.after.pending.filter(x=>x==='attribute').length,4);assert.equal(plan.after.pending.filter(x=>x==='major').length,9);assert.equal(plan.after.bond,15);
 assert.throws(()=>progressionPlan(s,10,1));assert.throws(()=>historicalBase(s,11,0));assert.throws(()=>historicalBase(s,2,0,{devices:[{name:'Mapa'},{name:'Mapa'}]}));
});
test('updated export restores progress and locked evolution history cannot leak',async()=>{
 const {restorationCode,restoreEmbeddedCode}=await import('../site/code-archive.js');
 let s=initializeForms(fresh());s.talent='T';s.quality='Q';s.attack='A';s.effect='PESADO';s.element=s.attackElement='Metal';initializeForms(s);
 s=progressionPlan(s,1,5).next;s=withUpdate(s,{type:'upgrade',target:'quality',index:0});initializeForms(s);
 const code='<iframe data-bonds-project="'+restorationCode(s)+'"></iframe>',restored=restoreEmbeddedCode(code);assert.deepEqual(progress(restored),progress(s));assert.equal(rookieForm(restored).qualities[0].rank,2);
 s.digimonForms.champion={...blankForm('champion'),unlocked:true,qualities:[{name:'Segredo',rank:1}]};s=progressionPlan(s,2,5).next;s=withUpdate(s,{type:'upgrade',choice:'talent',name:'Novo'});s=withUpdate(s,{type:'upgrade',choice:'Defesa'});s=withUpdate(s,{type:'upgrade',name:'Mapa'});s=withUpdate(s,{type:'form-upgrade',stage:'champion',target:'quality',index:0,base:{name:'Segredo',rank:1}});lockStage(s,'champion');assert.equal(restorationCode(s),'');assert.doesNotThrow(()=>parseProject(s));
});
