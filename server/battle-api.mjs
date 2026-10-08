import {createSceneRepository,newSceneData} from '../prototypes/battle-scene/scene-repository.mjs';
import {sceneCard,nameScene,validSceneId} from '../prototypes/battle-scene/scene-directory.mjs';
import {listApproved,readApproved} from '../prototypes/battle-scene/forum-service.mjs';
const passwordHash='b495fa6faea84d41afbdfd509659becbb8751936c5ac74fe715c830c4621e6a0';
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
function cookie(request,key){return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(key+'='))?.slice(key.length+1)||'';}
async function body(request,max=1024){const text=await request.text();if(text.length>max)throw Error('Solicitação muito grande.');return JSON.parse(text);}
function trusted(request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function battleAPI(request,bucket){
 const url=new URL(request.url),route=url.pathname;
 if(!['/api/narrator','/api/scenes','/api/scene','/api/forum/sheets','/api/forum/sheet'].includes(route))return null;
 const narratorToken=cookie(request,'bonds_narrator');
 const session=/^[a-f0-9]{64}$/.test(narratorToken)?await bucket.get('battle/sessions/'+narratorToken):null;
 const authorized=!!session&&(await session.json()).expires>Date.now();
 if(request.method==='POST'&&!trusted(request))return json({error:'Origem inválida.'},403);
 if(route==='/api/narrator'){
  if(request.method==='GET')return json({authorized});
  if(request.method!=='POST')return json({error:'Método indisponível.'},405);
  const remote=request.headers.get('CF-Connecting-IP')||'local',rateKey='battle/attempts/'+remote;
  const attempts=await bucket.get(rateKey);const rate=attempts?await attempts.json():{count:0,until:Date.now()+60000};
  if(rate.until>Date.now()&&rate.count>=10)return json({error:'Muitas tentativas. Aguarde um minuto.'},429);
  const input=await body(request),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.password||''))),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==passwordHash){await bucket.put(rateKey,JSON.stringify({count:rate.until>Date.now()?rate.count+1:1,until:rate.until>Date.now()?rate.until:Date.now()+60000}));return json({error:'Senha incorreta. Tente novamente.'},401);}
  const id=token();await bucket.put('battle/sessions/'+id,JSON.stringify({expires:Date.now()+12*60*60*1000}));
  return json({authorized:true},200,{'Set-Cookie':'bonds_narrator='+id+'; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=43200'});
 }
 if(route.startsWith('/api/forum/')){
  if(!authorized)return json({error:'Entre como narrador.'},403);
  if(request.method!=='GET')return json({error:'Método indisponível.'},405);
  try{return json(route.endsWith('/sheets')?{sheets:await listApproved()}:await readApproved(url.searchParams.get('path')));}catch(error){return json({error:error.message},502);}
 }
 if(route==='/api/scenes'){
  if(!authorized)return json({error:'Entre com a senha do narrador.'},403);
  if(request.method==='GET'){const scenes=[];let cursor;do{const page=await bucket.list({prefix:'battle/cards/',cursor});for(const object of page.objects){const card=await bucket.get(object.key);if(card)scenes.push(await card.json());}cursor=page.truncated?page.cursor:undefined;}while(cursor);return json({scenes:scenes.sort((a,b)=>b.updatedAt-a.updatedAt)});}
  if(request.method!=='POST')return json({error:'Método indisponível.'},405);
  const input=await body(request),id=crypto.randomUUID(),data=nameScene(newSceneData(),input.name);
  await bucket.put('battle/scenes/'+id,JSON.stringify(data));await bucket.put('battle/cards/'+id,JSON.stringify(sceneCard(id,data)));return json({id},201);
 }
 const id=url.searchParams.get('id');if(!validSceneId(id))return json({error:'Selecione uma cena de batalha.'},400);
 const key='battle/scenes/'+id,object=await bucket.get(key);if(!object)return json({error:'Cena não encontrada.'},404);
 let clientToken=cookie(request,'bonds_scene'),headers={};
 if(!/^[a-f0-9]{64}$/.test(clientToken)){clientToken=token();headers['Set-Cookie']='bonds_scene='+clientToken+'; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=31536000';}
 const repository=createSceneRepository(await object.json(),async data=>{
  data.updatedAt=Date.now();const saved=await bucket.put(key,JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});
  if(!saved){const error=Error('A cena foi atualizada. Confira o estado salvo antes de agir.');error.status=409;throw error;}
  await bucket.put('battle/cards/'+id,JSON.stringify(sceneCard(id,data)));
 });
 if(request.method==='GET')return json(await repository.read(clientToken),200,headers);
 if(request.method!=='POST')return json({error:'Método indisponível.'},405);
 try{const input=await body(request,25*1024*1024);if(input.mode==='narrator'&&!authorized)throw Error('Entre novamente como narrador.');return json(await repository.execute(clientToken,input,input.mode==='narrator'&&authorized),200,headers);}
 catch(error){const latest=await bucket.get(key);const data=latest?createSceneRepository(await latest.json(),async()=>{}):repository;return json({error:error.message,...await data.read(clientToken)},error.status||403,headers);}
}
