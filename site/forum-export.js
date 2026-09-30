// Only BBCode tags and inline table styles supported by the forum's own sheet.
// Keep the restoration payload byte-for-byte intact and outside the visual layout.
export function formatForumPost(source){
 const marker='\n\n[spoiler=Dados de restauração';const cut=source.indexOf(marker);
 let body=cut<0?source:source.slice(0,cut);const restore=cut<0?'':source.slice(cut);
 body=body.replace('[table][tr][td]','[table style="width:100%; max-width:860px; margin:20px auto; background:#18262E; color:#E5EDF0; border:1px solid #38505C; border-radius:16px; border-collapse:separate; overflow:hidden;"][tr][td style="padding:22px; line-height:1.6; font-size:14px; color:#E5EDF0;"]');
 body=body.replace(/\[b\]\[color=#F6AD52\]([^\n]*?)\[\/color\]\[\/b\]/g,(_,title)=>'[table style="width:100%; margin:18px 0 12px; background:#101B23; border-left:4px solid #F6AD52; border-radius:8px;"][tr][td style="padding:10px 12px; color:#F6AD52;"][b][color=#F6AD52]'+title+'[/color][/b][/td][/tr][/table]');
 body=body.replaceAll('[table style="width:100%;table-layout:fixed;"]','[table style="width:100%; table-layout:fixed; border-collapse:separate; border-spacing:10px; background:#142129; border-radius:12px;"]');
 body=body.replace(/\[table border="1"\]\[tr\]\[td\]\[b\]Opção \d+ \/\/ DIGIMON PARCEIRO\[\/b\]\[\/td\]\[\/tr\]\[tr\]\[td\]/g,'[table style="width:100%; background:#101B23; border:1px solid #38505C; border-radius:12px;"][tr][td style="padding:16px; text-align:center;"]');
 body=body.replace('DIGIVICE (REGISTRO E MELHORIAS)','Digivice (Registro e Melhorias)');
 // Explicit dimensions prevent original portraits from overflowing their column.
 body=body.replaceAll('[img]','[img(160px,auto)]');
 // Forum themes can give nested cells their own tiny font and dark text.
 body=body.replace(/\[td(?: style="([^"]*)")?\]/g,(_,style='')=>'[td style="'+style+'; font-size:14px; line-height:1.6; color:#E5EDF0; vertical-align:top;"]');
 // Only collapse whitespace between structural tags, never inside player text.
 body=body.replace(/(\[\/?(?:table|tr|td)(?: [^\]]*)?\])\n+(?=\[\/?(?:table|tr|td)(?: |\]))/g,'$1');
 return body+restore;
}
