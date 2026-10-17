// Prepare the existing Worker checkout without changing its project or R2 binding.
import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),destination=process.argv[2];
if(!destination||!path.isAbsolute(destination))throw Error('Provide the existing hosting checkout as an absolute path.');
const manifest=JSON.parse(await readFile(path.join(destination,'.openai/hosting.json'),'utf8'));
if(manifest.project_id!=='appgprj_6abbd1f752dc81918ce0d7b6c7c7cd2b'||manifest.r2!=='BUCKET')throw Error('Unexpected hosting project or bucket.');
// Keep a single full-quality copy of each PNG in the Worker artifact.
// GitHub Pages and source galleries retain their original files and URLs.
const duplicateSource=path.join(root,'dist/battle/assets/partners');
const duplicateOutput=path.resolve(destination,'dist/client/battle/assets/partners');
const outputRoot=path.resolve(destination,'dist/client');
if(!duplicateOutput.startsWith(outputRoot+path.sep))throw Error('Unexpected duplicate output directory.');
await rm(duplicateOutput,{recursive:true,force:true});
await cp(path.join(root,'dist'),outputRoot,{recursive:true,filter:entry=>entry!==duplicateSource});
for(const name of ['worker.js','sheet-document.js'])await cp(path.join(root,'server',name),path.join(destination,name));
const api=(await readFile(path.join(root,'server/battle-api.mjs'),'utf8')).replaceAll('../prototypes/','./prototypes/');
await writeFile(path.join(destination,'battle-api.mjs'),api);
await cp(path.join(root,'prototypes/battle-scene'),path.join(destination,'prototypes/battle-scene'),{recursive:true,filter:entry=>{const name=path.basename(entry);return !name.startsWith('.')&&(path.extname(name)===''||name.endsWith('.mjs')&&!name.endsWith('.test.mjs')&&!['serve.mjs','scene-store.mjs','narrator-access.mjs'].includes(name));}});
await mkdir(path.join(destination,'dist/server'),{recursive:true});
await cp(path.join(destination,'worker.js'),path.join(destination,'dist/server/index.js'));
await cp(path.join(destination,'sheet-document.js'),path.join(destination,'dist/server/sheet-document.js'));
await cp(path.join(destination,'battle-api.mjs'),path.join(destination,'dist/server/battle-api.mjs'));
await cp(path.join(destination,'prototypes'),path.join(destination,'dist/server/prototypes'),{recursive:true});
await mkdir(path.join(destination,'dist/.openai'),{recursive:true});
await cp(path.join(destination,'.openai/hosting.json'),path.join(destination,'dist/.openai/hosting.json'));
console.log('Prepared existing Worker, battle modules and static UI; storage bindings preserved.');
