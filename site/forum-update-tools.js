const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function approvedSheetCode(frame){
 const archive=frame?.getAttribute('data-bonds-project'),source=frame?.getAttribute('src');if(!archive||!source||!/^[A-Za-z0-9+/=]+$/.test(archive)||archive.length>2000000)return null;
 let url;try{url=new URL(source);}catch{return null;}if(url.origin!=='https://digimon-bonds.github.io'||url.pathname!=='/sheet.html'||!url.hash)return null;
 return '<iframe data-bonds-project="'+archive+'" src="'+escape(source)+'" title="Ficha de Personagem — Digimon Bonds" width="100%" height="1400" frameborder="0" scrolling="yes" loading="lazy" style="display:block;width:100%;max-width:860px;height:1400px;margin:0 auto;border:0;border-radius:16px;"></iframe>';
}
export function installUpdateSheetTools(host,user){
 if(user?.forumUserId!=='1')return;const doc=host.document;
 for(const summary of doc.querySelectorAll('.post .content [data-bonds-update-summary="1"]')){
  if(summary.dataset.bondsCopyReady)return;const content=summary.closest('.content'),code=approvedSheetCode(content?.querySelector('iframe[data-bonds-project]'));if(!code)continue;summary.dataset.bondsCopyReady='1';
  const button=doc.createElement('button');button.type='button';button.textContent='COPIAR SOMENTE A FICHA';button.style.cssText='margin-top:12px;padding:10px 14px;border:1px solid #72c8dd;border-radius:8px;background:#102430;color:#dcecf0;cursor:pointer;';summary.append(button);
  button.addEventListener('click',async()=>{const field=doc.createElement('textarea');field.value=code;field.readOnly=true;field.style.cssText='width:100%;min-height:110px;margin-top:12px;';summary.append(field);field.focus();field.select();field.setSelectionRange(0,code.length);let copied=false;try{copied=doc.execCommand('copy');}catch{}if(!copied)try{await host.navigator.clipboard.writeText(code);copied=true;}catch{}if(copied){field.remove();button.textContent='FICHA COPIADA';}else button.textContent='CÓDIGO SELECIONADO — USE CTRL+C';});
 }
}
