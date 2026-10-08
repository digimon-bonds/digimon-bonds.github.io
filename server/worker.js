import {battleAPI} from './battle-api.mjs';
import {env} from 'cloudflare:workers';
import {sheetDocument} from './sheet-document.js';
const json=(value,status=200)=>Response.json(value,{status});
const max=3*1024*1024;
const handler={async fetch(request){try{
 const u=new URL(request.url);
 const battle=await battleAPI(request,env.BUCKET);if(battle)return battle;
 if(/^\/api\/forum-sheets\/[a-f0-9]{64}$/.test(u.pathname)){
  if(request.method!=='GET')return new Response(null,{status:405});
  const id=u.pathname.split('/').pop();const project=await env.BUCKET.get('projects/'+id+'.json');
  if(project)return new Response(await project.text(),{headers:{'Content-Type':'application/json','X-Content-Type-Options':'nosniff'}});
  const sheet=await env.BUCKET.get('sheets/'+id+'.html');if(!sheet)return json({error:'Ficha não encontrada'},404);
  return json({html:await sheet.text(),legacy:true});
 }
 if(u.pathname==='/api/forum-sheets'){
  if(request.method!=='POST')return new Response(null,{status:405});
  if(!allowedOrigin(request)||request.headers.get('content-type')!=='application/json')return new Response(null,{status:403});
  const bytes=await limited(request);if(!bytes||bytes.byteLength>1500000)return json({error:'Ficha muito grande'},413);
  let html,project=null;try{const payload=JSON.parse(new TextDecoder().decode(bytes));html=sheetDocument(payload.tree||payload);if(payload.project){if(payload.project.schemaVersion!==1)throw Error('Projeto inválido');project=payload.project;}}catch{return json({error:'Ficha inválida'},400);}
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(html+(project?JSON.stringify(project):'')));
  const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  await env.BUCKET.put('sheets/'+hash+'.html',html,{httpMetadata:{contentType:'text/html; charset=utf-8'}});
  if(project)await env.BUCKET.put('projects/'+hash+'.json',JSON.stringify({project}),{httpMetadata:{contentType:'application/json'}});
  return json({path:'/sheets/'+hash});
 }
 if(/^\/sheets\/[a-f0-9]{64}$/.test(u.pathname)){
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  const object=await env.BUCKET.get(u.pathname.slice(1)+'.html');if(!object)return new Response('Ficha não encontrada',{status:404});
  return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=3600','Content-Security-Policy':"default-src 'none'; img-src https:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'; connect-src 'none'"}});
 }
 if(u.pathname==='/api/partner-image'){
  if(request.method!=='GET')return new Response(null,{status:405});
  let source;try{source=new URL(u.searchParams.get('url'));}catch{return json({error:'URL inválida'},400);}
  const allowed=['digimon.net','www.digimon.net','i.imgur.com','i.servimg.com','i.postimg.cc','wikimon.net','www.wikimon.net','static.wikia.nocookie.net'];
  if(source.protocol!=='https:'||!allowed.includes(source.hostname)||source.port||source.username||source.password)return json({error:'Hospede a imagem em Digimon.net, Imgur, Servimg, Postimages ou Wikimon.'},400);
  const remote=await fetch(source.href,{redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(!remote.ok||!/^image\/(png|jpeg|webp|gif)/i.test(remote.headers.get('content-type')||''))return json({error:'Imagem indisponível'},422);
  const bytes=await limited(remote);if(!bytes)return json({error:'Imagem muito grande'},413);
  return new Response(bytes,{headers:{'Content-Type':remote.headers.get('content-type'),'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}});
 }
 if(u.pathname==='/api/digivice-images'){
  if(request.method!=='POST')return new Response(null,{status:405});
  if(!allowedOrigin(request)||request.headers.get('content-type')!=='image/png')return new Response(null,{status:403});
  const bytes=await limited(request);if(!bytes)return json({error:'Imagem muito grande'},413);
  const b=new Uint8Array(bytes),v=new DataView(bytes);
  if(b.length<24||[137,80,78,71,13,10,26,10].some((x,i)=>b[i]!==x)||v.getUint32(16)!==640||v.getUint32(20)!==640)return json({error:'PNG inválido'},400);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  const key='digivices/'+hash+'.png';if(!await env.BUCKET.head(key))await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'image/png'}});
  return json({path:'/media/'+key});
 }
 if(/^\/media\/digivices\/[a-f0-9]{64}\.png$/.test(u.pathname)){
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  const object=await env.BUCKET.get(u.pathname.slice(7));if(!object)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=31536000,immutable','ETag':object.httpEtag,'X-Content-Type-Options':'nosniff'}});
 }
 return env.ASSETS.fetch(request);
 }catch(error){console.error('Forum export',error.message);return json({error:'Serviço temporariamente indisponível'},503);}}};
async function limited(message){if(Number(message.headers.get('content-length'))>max)return null;const reader=message.body?.getReader();if(!reader)return null;const chunks=[];let total=0;while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();return null;}chunks.push(value);}const result=new Uint8Array(total);let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result.buffer;}

function allowedOrigin(request){const origin=request.headers.get('origin');return origin===new URL(request.url).origin||origin==='https://digimon-bonds.github.io';}
export default {async fetch(request){
 const isAPI=new URL(request.url).pathname.startsWith('/api/');
 if(isAPI&&request.method==='OPTIONS'){if(!allowedOrigin(request))return new Response(null,{status:403});return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':request.headers.get('origin'),'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'}});}
 const response=await handler.fetch(request);if(!isAPI||!allowedOrigin(request))return response;
 const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',request.headers.get('origin'));headers.append('Vary','Origin');return new Response(response.body,{status:response.status,headers});
}};
