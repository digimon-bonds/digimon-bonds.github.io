// Read-only source collection. No publishing or runtime dependency on the forum.
import {writeFile,mkdir} from 'node:fs/promises';
const root='https://digimon.net/reference_en/';
const level=process.argv[2]||'Champion';
if(!['Rookie','Champion','Ultimate','Mega','Hybrid','XBody','In-TrainingⅠ'].includes(level))throw Error('Unsupported level');
const headers={'X-Requested-With':'XMLHttpRequest',Referer:root};
const rows=[];
let next=0;
do {
 const params=new URLSearchParams({digimon_name:'',name:'',digimon_level:level==='XBody'?'':level,attribute:'',type:'',next:String(next),view_more:'1'});
 const response=await fetch(root+'request.php?'+params,{headers});
 if(!response.ok)throw Error(response.status);
 const data=await response.json();
 if(!data)break;
 rows.push(...data.rows);next=data.next;
}while(next!==-1);
if(level==='XBody')for(let i=rows.length-1;i>=0;i--)if(!/Antibody|X[- ]?Body/i.test(rows[i].name)&&!/_x$/i.test(rows[i].directory_name))rows.splice(i,1);
const clean=s=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#039;|&apos;/g,"'").replace(/&quot;/g,'"').trim();
const results=new Array(rows.length);
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{
 while(cursor<rows.length){
  const index=cursor++,row=rows[index];
  const sourceUrl=root+'detail.php?directory_name='+row.directory_name;
  const response=await fetch(sourceUrl);if(!response.ok)throw Error(sourceUrl);
  const html=await response.text();
  const field=key=>clean(html.match(new RegExp('<dt[^>]*>'+key+'</dt><dd>([\\s\\S]*?)</dd>'))?.[1]||'');
  results[index]={...row,sourceUrl,officialLevel:field('Level'),officialAttribute:field('Attribute'),officialType:field('Type'),profile:clean(html.match(/<p class="p-ref__txt -txtProfile">([\s\S]*?)<\/p>/)?.[1]||''),image:'https://digimon.net/cimages/digimon/'+row.directory_name+'.jpg'};
 }
}));
await mkdir('.digibank-research',{recursive:true});
await writeFile('.digibank-research/'+level.toLowerCase()+'-research.json',JSON.stringify(results,null,2));
console.log('Official '+level+' collected:',results.length);
