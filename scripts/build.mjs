import {cp,mkdir,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'site'),out=path.join(root,'dist');
if(out!==path.join(root,'dist'))throw Error('Unexpected output');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(source,out,{recursive:true});await writeFile(path.join(out,'.nojekyll'),'');
const battleSource=path.join(root,'prototypes/battle-scene');
await cp(battleSource,path.join(out,'battle'),{recursive:true,filter:entry=>{const name=path.basename(entry);return !name.startsWith('.')&&!name.endsWith('.test.mjs')&&!['serve.mjs','scene-store.mjs','scene-repository.mjs','scene-directory.mjs','narrator-access.mjs','forum-service.mjs','forum-check.html','responsive-check.html','INTEGRATION.md','RULES.md','README.md'].includes(name);}});

const html=await readFile(path.join(out,'index.html'),'utf8');if(/<base\s/i.test(html))throw Error('The organization site must use the domain root.');
const files=await readdir(out,{recursive:true});
// A shared content revision refreshes the whole module graph, including the database.
const versioned=files.filter(file=>/\.(?:mjs|js|css|svg|html)$/.test(file)).sort();
const hash=createHash('sha256');
for(const file of versioned){hash.update(file);hash.update(await readFile(path.join(out,file)));}
const revision=hash.digest('hex').slice(0,12);
for(const file of versioned){
 if(!/\.(?:mjs|js|html)$/.test(file))continue;
 let content=await readFile(path.join(out,file),'utf8');
 if(/\.m?js$/.test(file))content=content.replace(/(['"])(\.{1,2}\/[^'"]+\.m?js)(?:\?[^'"]*)?\1/g,(_,quote,ref)=>`${quote}${ref}?v=${revision}${quote}`);
 else content=content.replace(/(src|href)="((?!https?:|data:|#)[^"?]+\.(?:js|css|svg))(?:\?[^"]*)?"/g,(_,attr,ref)=>`${attr}="${ref}?v=${revision}"`);
 await writeFile(path.join(out,file),content);
}
console.log(`Production build: ${files.length} entries in dist/ (domain root), revision ${revision}.`);
