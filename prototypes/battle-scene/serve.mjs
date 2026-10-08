import {sceneCard,nameScene,validSceneId} from './scene-directory.mjs';
import {newSceneData} from './scene-repository.mjs';
import {randomBytes} from 'node:crypto';
import {createSceneStore} from './scene-store.mjs';
import {createNarratorGate} from './narrator-access.mjs';
import http from 'node:http';import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';import path from 'node:path';
import {listApproved,readApproved} from './forum-service.mjs';
const root=import.meta.dirname,port=Number(process.env.BATTLE_PORT||4194);
const narratorGate=createNarratorGate();
const defaultStore=await createSceneStore(path.join(root,'.battle-state','scene.json'));
const stores=new Map();const sceneFolder=path.join(root,'.battle-state','scenes');
async function storeFor(id){if(!id)return defaultStore;if(!validSceneId(id))throw Error('Cena inválida');if(!stores.has(id)){const file=path.join(sceneFolder,id+'.json');await readFile(file);stores.set(id,await createSceneStore(file));}return stores.get(id);}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);if(pathname==='/api/narrator'){await narratorGate(req,res);return;}if(pathname==='/api/scenes'){
 const send=(code,data)=>res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));
 if(!narratorGate.isAuthorized(req)){send(403,{error:'Entre com a senha do narrador.'});return;}
 if(req.method==='GET'){await mkdir(sceneFolder,{recursive:true});const scenes=[];for(const file of await readdir(sceneFolder)){if(!file.endsWith('.json'))continue;const id=file.slice(0,-5);if(validSceneId(id))scenes.push(sceneCard(id,JSON.parse(await readFile(path.join(sceneFolder,file),'utf8'))));}send(200,{scenes});return;}
 if(req.method==='POST'&&req.headers.origin==='http://'+req.headers.host){let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)throw Error('Solicitação muito grande');}const id=crypto.randomUUID(),data=nameScene(newSceneData(),JSON.parse(body).name);await mkdir(sceneFolder,{recursive:true});await writeFile(path.join(sceneFolder,id+'.json'),JSON.stringify(data));send(201,{id});return;}send(403,{error:'Solicitação inválida.'});return;
 }if(pathname==='/api/scene'){
 const sceneStore=await storeFor(url.searchParams.get('id'));
 const send=(code,data)=>res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));
 let token=/(?:^|;\s*)bonds_scene=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
 if(!token){token=randomBytes(32).toString('hex');res.setHeader('Set-Cookie','bonds_scene='+token+'; HttpOnly; SameSite=Strict; Path=/api');}
 if(req.method==='GET'){send(200,await sceneStore.read(token));return;}
 if(req.method!=='POST'){send(405,{error:'Método indisponível'});return;}
 if(req.headers.origin!=='http://'+req.headers.host){send(403,{error:'Origem inválida'});return;}
 try{let body='';for await(const chunk of req){body+=chunk;if(body.length>25*1024*1024)throw Error('Solicitação muito grande.');}
 const request=JSON.parse(body),narrator=request.mode==='narrator'&&narratorGate.isAuthorized(req);
 if(request.mode==='narrator'&&!narrator)throw Error('Entre novamente como Narrador.');
 send(200,await sceneStore.execute(token,request,narrator));
 }catch(error){send(error.status||403,{error:error.message,...await sceneStore.read(token)});}return;
 }if(pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403).end();return;}if(req.method!=='GET'){res.writeHead(405).end();return;}if(pathname.startsWith('/api/forum/')){try{const data=pathname==='/api/forum/sheets'?{sheets:await listApproved()}:pathname==='/api/forum/sheet'?await readApproved(url.searchParams.get('path')):null;if(!data){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(data));}catch(e){res.writeHead(502,{'Content-Type':'application/json'}).end(JSON.stringify({error:e.message}));}return;}const creator=pathname.startsWith('/creator/'),base=creator?path.resolve(root,'../../site'):root,relative=creator?pathname.slice('/creator'.length):pathname==='/'?'/index.html':pathname;const file=path.resolve(base,'.'+relative);if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Battle Scene Prototype: http://127.0.0.1:${port}/`));
