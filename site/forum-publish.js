import {restorationCode} from './code-archive.js';
import {apiURL,apiOrigin} from './hosting.js';
import './html-to-image.js';
import {renderDigivice} from './digivices.js';
import {initializeForms,stageOrder,activeForm,publicArchive} from './forms.js';
import {generateForumPost} from './forum-post.js';
import {captureSheet,snapshotTree,embedCode,measureForumHeight} from './forum-snapshot.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const valid=u=>/^https?:\/\//.test(u);
let cached=null;
export const readyPost=s=>cached?.key===JSON.stringify(s)?cached.code:'';
export async function prepareForumPost(input,status=()=>{},snapshots){
 const key=JSON.stringify(input);if(cached?.key===key)return cached.code;
 const snapshot=captureSheet();
 const s=initializeForms(structuredClone(input)),images={};
 for(const stage of stageOrder){const f=activeForm({...s,activeDigimonStage:stage});
  status('Preparando Digivice // '+(f.unlocked?f.name:'ACCESS LOCKED'));
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:640px;pointer-events:none;';document.body.append(host);
  try{
   host.innerHTML=renderDigivice({...s,activeDigimonStage:stage,formLocked:!f.unlocked,digiName:f.unlocked?f.name:'',digiImage:f.unlocked?f.image:'',zoom:f.zoom,imagePosition:f.imagePosition},esc,valid);
   const figure=host.querySelector('figure');figure.style.cssText='width:640px;max-width:none;margin:0;container-type:inline-size;';
   host.querySelectorAll('button,figcaption').forEach(el=>el.remove());
   const img=host.querySelector('.digivice-lcd img');
   if(img){img.crossOrigin='anonymous';img.src=apiURL('/api/partner-image?url='+encodeURIComponent(f.image));await img.decode().catch(()=>{throw Error('Não foi possível carregar a imagem de '+f.name+'. Confira a URL da imagem.');});}
   const blob=await globalThis.htmlToImage.toBlob(host.querySelector('.digivice-display'),{width:640,height:640,pixelRatio:1,skipFonts:true,backgroundColor:'transparent'});
   if(!blob)throw Error('Não foi possível gerar a imagem do Digivice.');
   status('Publicando imagem // '+(f.unlocked?f.name:'ACCESS LOCKED'));
   const res=await fetch(apiURL('/api/digivice-images'),{method:'POST',headers:{'Content-Type':'image/png'},body:blob});
   if(!res.ok)throw Error('Não foi possível publicar a imagem. Tente novamente.');
   const saved=await res.json();images[stage]=new URL(saved.path,apiOrigin).href;
  }finally{host.remove();}
 }
 status('Publicando ficha com abas Humano e Digimon…');
 const tree=snapshotTree(snapshot,images,snapshots,s);
 const height=await measureForumHeight(tree);
 const response=await fetch(apiURL('/api/forum-sheets'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(tree)});
 if(!response.ok)throw Error('Não foi possível publicar a ficha com abas. Tente novamente.');
 const saved=await response.json();
 const code=embedCode(new URL(saved.path,apiOrigin).href,height).replace('<iframe ', '<iframe data-bonds-project="'+restorationCode(s)+'" ');cached={key,code};return code;
}
