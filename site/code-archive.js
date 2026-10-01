import {parseProject} from './rules.js';
import {publicArchive} from './forms.js';
export function restorationCode(state){return btoa(Array.from(new TextEncoder().encode(JSON.stringify(publicArchive(state))),b=>String.fromCharCode(b)).join(''));}
export function restoreEmbeddedCode(raw){const markers=[...raw.matchAll(/data-bonds-project\s*=\s*["']([A-Za-z0-9+/=]+)["']/g)];if(!markers.length)return null;if(markers.length!==1)throw Error('Cole apenas uma ficha por vez.');try{return parseProject(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(markers[0][1]),c=>c.charCodeAt(0)))));}catch{throw Error('Dados da ficha incompletos. Cole o código original inteiro.');}}
