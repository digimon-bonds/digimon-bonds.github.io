import {cp,mkdir,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'site'),out=path.join(root,'dist');
if(out!==path.join(root,'dist'))throw Error('Unexpected output');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(source,out,{recursive:true});await writeFile(path.join(out,'.nojekyll'),'');
const html=await readFile(path.join(out,'index.html'),'utf8');if(/<base\s/i.test(html))throw Error('The organization site must use the domain root.');
const files=await readdir(out,{recursive:true});console.log(`Production build: ${files.length} entries in dist/ (domain root).`);
