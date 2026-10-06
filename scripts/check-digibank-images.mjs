// Optional read-only network check; not part of offline builds or tests.
import {readFile} from 'node:fs/promises';
import {digimonDatabase} from '../site/digimon-database.js';
const entries=process.argv[2]?digimonDatabase.filter(d=>(process.argv[2]==='XBody'?d.isXBody:process.argv[2]==='Baby'?d.stage==='baby':d.official?.level===process.argv[2])):digimonDatabase;
if(!entries.length)throw Error('No images match the requested official level');
const failures=[];let cursor=0;
await Promise.all(Array.from({length:10},async()=>{
 while(cursor<entries.length){
  const entry=entries[cursor++];
  try{
   if(entry.image.startsWith('./assets/')){const bytes=await readFile('site/'+entry.image);if(bytes.length<1000)throw Error('Empty image');continue;}
   const response=await fetch(entry.image,{method:'HEAD',signal:AbortSignal.timeout(15000)});
   if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))failures.push({id:entry.id,status:response.status,image:entry.image});
  }catch(error){failures.push({id:entry.id,error:error.message,image:entry.image});}
 }
}));
console.log(JSON.stringify({checked:entries.length,failures},null,2));
process.exitCode=failures.length?1:0;
