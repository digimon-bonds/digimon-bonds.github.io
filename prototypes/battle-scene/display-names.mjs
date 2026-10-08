import {sheetArt} from './sheet-art.mjs';
const key=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
// Prefer the catalog spelling (MetalGreymon, V-mon, etc.). Only repair casing
// of unknown names when the entire imported label was uppercase.
export function displayName(value,catalog=[]){
 const text=String(value??'').trim().replace(/\s+/g,' ');
 const canonical=[...catalog,...sheetArt.map(a=>a.name)].find(name=>key(name)===key(text));
 if(canonical)return canonical;
 if(text===text.toLocaleLowerCase('pt-BR')||text!==text.toLocaleUpperCase('pt-BR'))return text;
 return text.toLocaleLowerCase('pt-BR').replace(/\p{L}[\p{L}\p{M}]*/gu,(word,offset)=>offset>0&&['de','da','do','das','dos','e'].includes(word)?word:word[0].toLocaleUpperCase('pt-BR')+word.slice(1));
}
