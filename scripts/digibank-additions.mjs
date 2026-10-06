import {readFile} from 'node:fs/promises';
import {exclusionReason} from './digibank-curation.mjs';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const key=name=>name.toLowerCase().replace(/^black\s+(.+)$/,'$1black').replace(/[^a-z0-9]/g,'');
const ownEditorial=async()=>new Map((await readFile('scripts/digibank-extra-rookies.tsv','utf8')).trim().split(/\r?\n/).map(line=>{const [id,...rest]=line.split('|');return [id,rest];}));
export async function addDigibankSpecies(records,officialEntry){
 for(const entry of records)entry.initialEligible=entry.stage==='rookie';
 const editorial=await ownEditorial(),source=await read('.digibank-research/rookie-research.json');
 const hyemon=source.find(row=>row.directory_name==='hyemon');
 records.push({...officialEntry(hyemon,'rookie','Rookie',editorial),initialEligible:true,partner:'Kowagakure Usajirō',partnerSourceUrl:'https://digimonbonds.forumeiros.com/t60-f-kowagakure-usajiro'});
 records.push({id:'rookie-black-strabimon',name:'Black Strabimon',stage:'rookie',digitalAttribute:'Vírus',element:'Escuridão',classification:'Homem-Besta / Ninja das Trevas',description:'Guerreiro lupino furtivo que combina agilidade e disciplina, observando o adversário antes de atacar a partir das sombras.',image:'https://2img.net/i.imgur.com/StQlcvy.png',availableAsPartner:false,initialEligible:true,partner:'Kurogane Kōga',sourceUrl:'https://digimonbonds.forumeiros.com/t43-f-kurogane-koga',elementReason:'Adaptação de Trevas para Escuridão, mantendo os dados da ficha do Bonds.',provenance:'bonds',reviewStatus:'pending'});
 const flamemon=records.find(r=>r.id==='rookie-flamon');
 flamemon.partner='Uzuki Akamine';flamemon.partnerSourceUrl='https://digimonbonds.forumeiros.com/t55-f-uzuki-akamine';
 const existing=new Set(records.filter(r=>r.stage==='rookie').map(r=>key(r.name)));
 for(const row of source){
  if(exclusionReason(row)||existing.has(key(row.name)))continue;
  records.push({...officialEntry(row,'rookie','Rookie',editorial),initialEligible:false,availableAsPartner:false});existing.add(key(row.name));
 }
 const xRows=await read('.digibank-research/xbody-research.json');
 for(const row of xRows){
  const baseName=row.name.replace(/\s*\(?X[ -]?(?:Antibody|Body)\)?/gi,'').trim();
  const directory=row.directory_name.replace(/_x$/i,'');
  const base=records.find(d=>d.sourceUrl?.endsWith('directory_name='+directory))||records.find(d=>key(d.name)===key(baseName));
  const element=base?.element||(/Angel|Holy|Seraph|Cherub/i.test(row.officialType)?'Luz':/Vegetation|Insectoid/i.test(row.officialType)?'Madeira':/Aquatic|Sea|Fish/i.test(row.officialType)?'Água':/Machine|Cyborg|Weapon/i.test(row.officialType)?'Metal':/Dark|Evil|Undead/i.test(row.officialType)?'Escuridão':'Neutro');
  const description=base?`${base.description} Nesta variante, o Anticorpo X altera seu corpo e amplia suas capacidades.`:`Variante de ${baseName} modificada pelo Anticorpo X, com corpo e habilidades adaptados à transformação de seus dados.`;
  const entry=officialEntry({...row,officialAttribute:row.officialAttribute||'Não definido'},'xbody',row.officialLevel,new Map([[row.directory_name,[element,description]]]));
  if(!row.officialAttribute)entry.official.attribute=null;
  records.push({...entry,progressionStage:({'Rookie':'rookie','Champion':'champion','Ultimate':'ultimate','Mega':'mega','In-Training Ⅱ':'baby'})[row.officialLevel]||'special',isXBody:true,initialEligible:false,evolutionCategory:'xbody',elementReason:base?'Afinidade adaptada a partir de '+base.name+'.':'Adaptação provisória pela natureza predominante do Type oficial; requer revisão.'});
 }
 for(const entry of records){
  if(entry.stage==='rookie'&&entry.name===entry.name.toUpperCase())entry.name=entry.name[0]+entry.name.slice(1).toLowerCase();
  if(entry.partner){entry.partner=entry.partner.toLocaleUpperCase('pt-BR');entry.availableAsPartner=false;}
  entry.isXBody??=false;
 }
}
