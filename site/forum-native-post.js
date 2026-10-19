import {FORUM_ORIGIN} from './forum-owner.js';
export function publicationSpec(input){
 const forumId=input?.kind==='registration'?7:input?.kind==='update'?6:null;
 const name=String(input?.characterName||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
 if(!forumId||!name||name.length>120)throw Error('Nome do personagem ou destino inválido.');
 const code=input.code;if(typeof code!=='string'||code.length>2000000||!code.includes('data-bonds-project=')||/<script\b|\son\w+\s*=/i.test(code))throw Error('Gere um código de ficha válido no Bonds App.');
 const frames=[...code.matchAll(/<iframe\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)];if(frames.length!==1)throw Error('Publique apenas uma ficha por vez.');
 const url=new URL(frames[0][1].replaceAll('&amp;','&'));if(url.origin!=='https://digimon-bonds.github.io'||url.pathname!=='/sheet.html'||!url.hash)throw Error('Imagem de ficha inválida. Gere novamente pelo App.');
 return {forumId,title:(forumId===7?'[F] ':'[Att] ')+name,code};
}
export function nativePostData(form,spec){
 const data=new URLSearchParams();
 for(const field of form.querySelectorAll('input,textarea,select')){
  if(!field.name||field.disabled||['button','submit','reset','image','file'].includes(field.type)||['radio','checkbox'].includes(field.type)&&!field.checked)continue;
  if(field.tagName==='SELECT')for(const option of field.selectedOptions)data.append(field.name,option.value);else data.append(field.name,field.value);
 }
 data.set('subject',spec.title);data.set('message',spec.code);data.set('mode','newtopic');data.set('f',String(spec.forumId));data.set('post','Enviar');data.delete('preview');data.set('topictype','0');return data;
}
export function publishedTopic(doc,responseURL){
 const safe=value=>{try{const u=new URL(value,FORUM_ORIGIN);return u.origin===FORUM_ORIGIN&&(/^\/t[1-9]\d*(?:-|$)/.test(u.pathname)||/^\/viewtopic(?:\.forum)?$/.test(u.pathname)&&/^[1-9]\d*$/.test(u.searchParams.get('t')||''))?u.href:null;}catch{return null;}};
 const redirected=safe(responseURL);if(redirected)return redirected;
 const message=doc.body?.textContent||'';if(!/(?:mensagem|tópico).{0,80}(?:publicad|enviad|registrad)|(?:publicad|enviad|registrad).{0,80}sucesso/i.test(message))return null;
 const refresh=doc.querySelector('meta[http-equiv="refresh" i]')?.getAttribute('content')?.match(/url\s*=\s*(.+)/i)?.[1]?.replace(/^['"]|['"]$/g,'');if(safe(refresh))return safe(refresh);
 for(const link of doc.querySelectorAll('a[href]')){const url=safe(link.getAttribute('href'));if(url)return url;}return null;
}
export function nativeFormUserId(doc){
 const text=[...doc.querySelectorAll('script')].map(node=>node.textContent).join('\n');
 const logged=text.match(/_userdata\[["']session_logged_in["']\]\s*=\s*["']?(\d+)/)?.[1];
 const id=text.match(/_userdata\[["']user_id["']\]\s*=\s*["']?([1-9]\d*)/)?.[1];
 return logged==='1'?id||null:null;
}
export async function publishNativeForum(host,input,actor){
 const spec=publicationSpec(input);if(!actor||actor.forumUserId!==input.forumUserId)throw Error('A conta conectada mudou. Reabra o App pelo fórum.');
 const digest=Array.from(new Uint8Array(await host.crypto.subtle.digest('SHA-256',new TextEncoder().encode(actor.forumUserId+'|'+spec.forumId+'|'+spec.title+'|'+spec.code))),b=>b.toString(16).padStart(2,'0')).join('');
 const receiptKey='bonds:publication:'+digest,prior=JSON.parse(host.sessionStorage.getItem(receiptKey)||'null');
 if(prior?.url)return {url:prior.url,title:spec.title};if(prior)throw Error('Este envio já foi iniciado. Confira seu tópico no fórum antes de tentar novamente.');
 const formURL=FORUM_ORIGIN+'/post?f='+spec.forumId+'&mode=newtopic';
 const response=await host.fetch(formURL,{credentials:'same-origin',signal:AbortSignal.timeout(20000)});if(!response.ok||new URL(response.url).origin!==FORUM_ORIGIN)throw Error('Não foi possível abrir o editor do fórum.');
 const doc=new host.DOMParser().parseFromString(await response.text(),'text/html'),message=doc.querySelector('textarea[name="message"]'),form=message?.closest('form');
 if(!form||doc.querySelector('[name="confirm_code"], [name*="captcha"], .g-recaptcha, iframe[src*="recaptcha"]'))throw Error('Entre no fórum ou conclua a verificação pelo editor do fórum. Seu código continua disponível para copiar.');
 if(nativeFormUserId(doc)!==actor.forumUserId)throw Error('A sessão do fórum mudou. Atualize a página do fórum e reabra o App antes de postar.');
 const action=new URL(form.getAttribute('action')||'/post',FORUM_ORIGIN);if(action.origin!==FORUM_ORIGIN||!['/post','/posting.forum'].includes(action.pathname))throw Error('Destino do formulário não reconhecido.');
 if(!host.confirm('Publicar como '+actor.forumUsername+'?\n\nTítulo: '+spec.title+'\nÁrea: '+(spec.forumId===7?'Poste sua Ficha':'Atualizações & Pedidos')+'\n\nO conteúdo gerado será publicado em um novo tópico.'))throw Error('Publicação cancelada. O código continua disponível.');
 const data=nativePostData(form,spec);host.sessionStorage.setItem(receiptKey,JSON.stringify({pending:true}));
 let saved;try{saved=await host.fetch(action.href,{method:'POST',credentials:'same-origin',body:data,signal:AbortSignal.timeout(45000)});}catch{throw Error('A conexão caiu durante o envio. Confira o fórum antes de reenviar para evitar duplicação.');}
 const result=new host.DOMParser().parseFromString(await saved.text(),'text/html'),url=publishedTopic(result,saved.url);
 if(!saved.ok||!url)throw Error('O fórum não confirmou a publicação. Confira a área de destino; se houver verificação ou limite de postagem, conclua pelo editor do fórum. O código continua disponível.');
 host.sessionStorage.setItem(receiptKey,JSON.stringify({url}));return {url,title:spec.title};
}
