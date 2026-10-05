import {historicalBase} from './progression.js';
import {fresh} from './rules.js';
import {initializeForms,blankForm} from './forms.js';
import {archetypes} from './archetypes.js';
import {effects,species} from './catalog.js';

const text=value=>value.replace(/\[(?:\/?(?:table|tr|td|b|i|u|size|color|center|justify|spoiler|img|url))\b[^\]]*\]/gi,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
const norm=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[●:]/g,'').trim();
// Work on leaf cells only: nested layout tables must never merge unrelated fields.
const cells=raw=>[...raw.matchAll(/\[td\b[^\]]*\]((?:(?!\[td\b)[\s\S])*?)\[\/td\]/gi)].map(m=>m[1]);
function fields(raw){const out={};for(const cell of cells(raw)){
 const labels=[...cell.matchAll(/\[b\]([\s\S]*?)\[\/b\]/gi)].filter(m=>!/^\d/.test(norm(m[1])));
 for(let i=0;i<labels.length;i++){const m=labels[i],key=norm(m[1]);if(!key||/^\d/.test(key))continue;const value=text(cell.slice(m.index+m[0].length,labels[i+1]?.index??cell.length));if(value&&!out[key])out[key]=value;}
 }return out;}
const image=raw=>(raw.match(/\[img(?:\([^)]*\)|=[^\]]*)?\]([^[]+)\[\/img\]/i)?.[1]?.trim()||'').replace(/^https?:\/\/(?:www\.)?imgur.com\/([\w]+\.(?:png|jpg|jpeg|gif|webp))$/i,'https://i.imgur.com/$1');
export function recoverTableCharacter(raw){
 if(!/\[spoiler=NOVATO\s*\/\s*ROOKIE\]/i.test(raw)||!raw.includes('REGISTRO VISUAL'))return null;
 const s=fresh(),human=raw.split('DIGIMON PARCEIRO')[0],h=fields(human);
 for(const [key,label] of Object.entries({player:'JOGADOR',name:'NOME',age:'IDADE',personality:'PERSONALIDADE',flaw:'FALHA',wish:'DESEJO',item:'ITEM ESPECIAL',things:'COISAS'}))s[key]=h[label]||'';
 s.age=s.age.match(/^\d+/)?.[0]||s.age;
 // Personality can contain bold prose; it ends at the cell, not at the next emphasis.
 const personality=cells(human).find(c=>/\[b\]Personalidade:\[\/b\]/i.test(c));
 if(personality)s.personality=text(personality.split(/\[b\]Personalidade:\[\/b\]/i)[1]);
 s.humanImage=image(human);s.humanImageLayout='portrait';
 s.archetype=archetypes.find(a=>norm(a.name)===norm(h.ARQUETIPO||''))?.id||'';
 for(const [key,label] of Object.entries({corpo:'CORPO',mente:'MENTE',presenca:'PRESENCA'}))s.human[key]=Number(h[label])||0;
 s.talent=(h.TALENTO||'').replace(/\s*\|\s*Rank\s*\d+/i,'');
 for(const key of Object.keys(s.custom))s.custom[key]=true;
 const history=raw.slice(raw.indexOf('[b]HISTÓRIA[/b]'));
 s.history=cells(history).map(text).find(t=>t&&!['HISTÓRIA','◆ DIGIMON BONDS // CHARACTER DATA ARCHIVE ◆'].includes(t))||'';
 initializeForms(s);
 for(const match of raw.matchAll(/\[spoiler=([^\]]+)\]([\s\S]*?)\[\/spoiler\]/gi)){
  const stage=({BEBE:'baby',NOVATO:'rookie',CAMPEAO:'champion',PERFEITO:'ultimate',MEGA:'mega'})[norm(match[1].split('/')[0])];if(!stage)continue;
  const f=blankForm(stage),v=fields(match[2]);if(!v.NOME)continue;f.unlocked=true;f.name=species.find(x=>norm(x.name)===norm(v.NOME))?.name||v.NOME;f.image=image(match[2]);
  for(const [key,label] of Object.entries({digital:'ATRIBUTO DIGITAL',element:'ELEMENTO',classification:'CLASSIFICACAO',personality:'PERSONALIDADE & CARACTERISTICAS'}))f[key]=v[label]||'';
  const pc=cells(match[2]).find(c=>/\[b\]Personalidade & Características:\[\/b\]/i.test(c));if(pc)f.personality=text(pc.split(/\[b\]Personalidade & Características:\[\/b\]/i)[1]);
  for(const key of Object.keys(f.attributes))f.attributes[key]=Number(v[norm(key)])||1;
  f.qualities=[...match[2].matchAll(/\[b\]● Qualidade:\[\/b\]([^\r\n]*)/gi)].map(m=>text(m[1])).filter(Boolean).map(t=>({name:t.split('|')[0].trim(),rank:Number(t.match(/Rank\s*(\d+)/i)?.[1])||1}));
  const attackArea=match[2].slice(match[2].indexOf('ATAQUES DE ASSINATURA'));
  f.signatureAttacks=[...attackArea.matchAll(/\[tr\]([\s\S]*?)\[\/tr\]/gi)].map(m=>cells(m[1]).map(text)).filter(c=>c.length===4&&/^\d+$/.test(c[1])&&c[0]).map(c=>({name:c[0],rank:Number(c[1]),element:c[2],effects:c[3].split(';').map(e=>({name:effects.find(x=>norm(x.name)===norm(e))?.name||e.trim(),element:''}))}));
  s.digimonForms[stage]=f;
  if(stage==='rookie'){Object.assign(s,{digiName:f.name,digiImage:f.image,digital:f.digital,element:f.element,classification:f.classification,digiPersonality:f.personality,digi:f.attributes,quality:f.qualities[0]?.name||'',attack:f.signatureAttacks[0]?.name||'',attackElement:f.signatureAttacks[0]?.element||'',effect:f.signatureAttacks[0]?.effects[0]?.name||''});}
 }
 if(!s.name||!s.digiName)throw Error('Ficha clássica incompleta: cole todo o código, incluindo Humano e Novato.');
 const previous=fields(raw),rookie=s.digimonForms.rookie,level=Number(previous['NIVEL DE LACO']?.match(/\d+/)?.[0]||1),exp=Number(previous.EXP?.match(/\d+/)?.[0]||0);
 const talentRank=Number((h.TALENTO||'').match(/Rank\s*(\d+)/i)?.[1]||1);
 const resources={};for(const [key,label] of Object.entries({energy:'ENERGIA ATUAL / MAXIMA',bond:'PONTOS DE LACO',pv:'PV'})){const found=previous[label]?.match(/-?\d+/);if(found)resources[key]=Number(found[0]);}
 const imported=historicalBase(s,level,exp,{...resources,talents:[{name:s.talent,rank:talentRank}],qualities:rookie.qualities.map(q=>({...q,stage:'Novato'})),attackRank:rookie.signatureAttacks[0]?.rank||1,effects:rookie.signatureAttacks[0]?.effects||[{name:s.effect,element:''}]});
 return initializeForms(imported);
}
