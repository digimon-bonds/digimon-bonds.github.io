import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
// Local prototype gate only. Real account permissions require a future backend.
const defaultHash='e83c75981aef00afbc27b9419341458822f85fb8faee74d84474a90ad02f4809';
export function createNarratorGate(hash=defaultHash){
 const sessions=new Set();
 const authorized=req=>[...(req.headers.cookie||'').matchAll(/(?:^|;\s*)bonds_narrator=([a-f0-9]{64})(?=;|$)/g)].some(match=>sessions.has(match[1]));
 const handler=async(req,res)=>{
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));};
  if(req.method==='GET'){send(200,{authorized:authorized(req)});return;}
  if(req.method!=='POST'){send(405,{error:'Método indisponível'});return;}
  if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){send(403,{error:'Origem inválida'});return;}
  let body='';for await(const chunk of req){body+=chunk;if(body.length>512){send(413,{error:'Solicitação inválida'});return;}}
  let password;try{password=JSON.parse(body).password;}catch{send(400,{error:'Solicitação inválida'});return;}
  const got=createHash('sha256').update(typeof password==='string'?password:'').digest(),expected=Buffer.from(hash,'hex');
  if(!timingSafeEqual(got,expected)){send(401,{error:'Senha incorreta. Tente novamente.'});return;}
  const token=randomBytes(32).toString('hex');sessions.add(token);
  res.setHeader('Set-Cookie','bonds_narrator='+token+'; HttpOnly; SameSite=Strict; Path=/api');send(200,{authorized:true});
 };
 handler.isAuthorized=authorized;return handler;
}
