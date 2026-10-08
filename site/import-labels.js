// Compare controlled labels only; never apply this to prose or image URLs.
export function labelKey(value){
 return String(value??'')
  .replace(/\[\/?(?:b|i|u|color|size)(?:=[^\]]*)?\]/gi,'')
  .replace(/&nbsp;|&#160;|&#xA0;/gi,' ')
  .replace(/[\u200B-\u200D\uFEFF]/g,'')
  .normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .trim().replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu,'')
  .replace(/\p{Pd}/gu,' ').replace(/\s+/g,' ').trim().toLocaleUpperCase('pt-BR');
}
export function speciesKey(value){return labelKey(value).replace(/[\s-]/g,'');}
export function uniqueLabelMatch(list,value,key=labelKey,getLabel=x=>x.name){const matches=list.filter(x=>key(getLabel(x))===key(value));return matches.length===1?matches[0]:undefined;}
