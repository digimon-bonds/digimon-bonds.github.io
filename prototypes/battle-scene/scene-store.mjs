import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSceneRepository,newSceneData} from './scene-repository.mjs';
export {applySceneCommand} from './scene-repository.mjs';
export async function createSceneStore(file){
 if(file instanceof URL)file=fileURLToPath(file);
 let data;try{data=JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;data=newSceneData();}
 return createSceneRepository(data,async next=>{await mkdir(path.dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(next),'utf8');await rename(file+'.tmp',file);});
}
