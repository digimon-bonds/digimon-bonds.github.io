import {progress,progressionSource} from './progression.js';
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('[','&#91;').replaceAll(']','&#93;');
export const summaryStart='<!-- BONDS:RESUMO:INICIO -->',summaryEnd='<!-- BONDS:RESUMO:FIM -->';
export const sheetStart='<!-- BONDS:FICHA:INICIO -->',sheetEnd='<!-- BONDS:FICHA:FIM -->';
export function composeUpdatePost(s,sheet){
 if(!sheet)return '';
 const p=progress(s),history=p.history.slice(s.updateStart||0);
 const summary='<div data-bonds-update-summary="1" style="max-width:860px;margin:16px auto;padding:20px;border:1px solid #38505c;border-left:4px solid #f6ad52;border-radius:12px;background:#101b23;color:#e5edf0;line-height:1.6;"><strong style="color:#f6ad52;">ATUALIZAÇÃO DE FICHA</strong><h3>'+escape(s.name)+'</h3>'+(history.length?'<ol>'+history.map(item=>'<li>'+escape(item)+'</li>').join('')+'</ol>':'<p>Dados da ficha atualizados.</p>')+'<p><strong>Nível de Laço:</strong> '+p.level+' · <strong>XP:</strong> '+p.exp+'/10<br><strong>Energia:</strong> '+p.energy+'/'+(9+p.level)+' · <strong>Pontos de Laço:</strong> '+p.bond+'/'+(5+p.level)+'</p><p>'+ (p.pending.length?'Há escolhas pendentes.':'Melhorias concluídas. Aguarde a aprovação do Narrador.')+'</p><a href="'+progressionSource+'" style="color:#7cd8ed;">Experiência e Progressão</a></div>';
 return summaryStart+'\n'+summary+'\n'+summaryEnd+'\n\n'+sheetStart+'\n'+sheet+'\n'+sheetEnd;
}
export function extractUpdatedSheet(code){const start=code.indexOf(sheetStart),end=code.indexOf(sheetEnd,start);if(start<0||end<0||code.indexOf(sheetStart,start+1)>=0)throw Error('Código de atualização inválido.');return code.slice(start+sheetStart.length,end).replace(/^\n/,'').replace(/\n$/,'');}
