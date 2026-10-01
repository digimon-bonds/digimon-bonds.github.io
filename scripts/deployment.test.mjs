import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {fresh,parseProject} from '../site/rules.js';
import {stageOrder,initializeForms,unlockStage,lockStage} from '../site/forms.js';
const root=path.resolve(import.meta.dirname,'..');
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
 source=source.replace("import {env} from 'cloudflare:workers';","const env={};").replace("'./sheet-document.js'",JSON.stringify(pathToFileURL(path.join(root,'server/sheet-document.js')).href));
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
test('forum embed has bounded height and restores scrolling',()=>{const code=embedCode('https://example.com/sheets/abc');assert.match(code,/height="900"/);assert.match(code,/scrolling="yes"/);assert(!code.includes('embed=full'));});
test('published project restores exact editable state and immutable versions',async()=>{
 let source=await readFile(path.join(root,'server/worker.js'),'utf8');
 source=source.replace("import {env} from 'cloudflare:workers';",`const objects=new Map();const env={BUCKET:{async put(key,value){objects.set(key,value)},async get(key){return objects.has(key)?{text:async()=>objects.get(key),body:objects.get(key)}:null}}};`).replace("'./sheet-document.js'",JSON.stringify(pathToFileURL(path.join(root,'server/sheet-document.js')).href));
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
