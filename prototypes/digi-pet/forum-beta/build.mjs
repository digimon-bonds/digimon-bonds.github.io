/* Produces an independent immutable test bundle. Does not build/deploy the App. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {installDigiPetBeta} from './launcher.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(out);
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const mime={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const assets=new Map();
function embed(text){return text.replace(/assets\/[\w/.-]+\.(?:svg|png|webp)/g,name=>{if(!assets.has(name))assets.set(name,`data:${mime[path.extname(name)]};base64,${fs.readFileSync(path.join(root,name)).toString('base64')}`);return assets.get(name);});}
let html=read('index.html');
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
const scripts=[...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(m=>m[1]).filter(name=>name!=='prototype-lab.js');
html=html.replace(/<link rel="stylesheet" href="[^"]+">/g,'').replace(/<script src="[^"]+" defer><\/script>/g,'');
html=html.replace('</head>',`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; font-src data:;"><style>${embed(styles.map(read).join('\n'))}</style></head>`);
const port=`/*DIGIPET_FORUM_SEED*/
let forumValue=forumSeed.initial,forumStorageAvailable=forumSeed.available;
globalThis.DigiPetStoragePort={getItem(){if(!forumStorageAvailable)throw Error('Local storage unavailable');return forumValue;},setItem(key,value){if(!forumStorageAvailable)throw Error('Local storage unavailable');if(key.includes(':backup:'))return;forumValue=value;parent.postMessage({type:'digipet:save',channel:forumSeed.channel,value},forumSeed.parentOrigin);}};
addEventListener('message',event=>{if(event.source===parent&&event.origin===forumSeed.parentOrigin&&event.data?.channel===forumSeed.channel&&event.data.type==='digipet:storage-error')forumStorageAvailable=false;});
addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')&&document.getElementById('food-dialog')?.hidden)parent.postMessage({type:'digipet:close',channel:forumSeed.channel},forumSeed.parentOrigin);});
`;
const code=port+scripts.map(file=>embed(read(file).replaceAll('localStorage.',file==='pet-storage.js'?'globalThis.DigiPetStoragePort.':'localStorage.'))).join('\n;\n');
html=embed(html).replace('</body>',`<script>${code.replace(/<\/script/gi,'<\\/script')}</script></body>`);
// Avoid embedding the NORMAL image several times in HTML/config/fallback maps.
// Preserve exact image bytes; this is transport serialization, not image editing.
const payload={document:html,button:`data:image/png;base64,${fs.readFileSync(path.join(out,'button-original.png')).toString('base64')}`};
const bundle=`/* Digi-Pet: Omegamon u1 trial. Sandbox + local-only save. */\n(${installDigiPetBeta.toString()})(window,${JSON.stringify(payload)});\n`;
fs.writeFileSync(path.join(out,'digipet-omegamon.js'),bundle);
const manifest={bytes:Buffer.byteLength(bundle),integrity:'sha384-'+createHash('sha384').update(bundle).digest('base64'),buttonSHA256:createHash('sha256').update(fs.readFileSync(path.join(out,'button-original.png'))).digest('hex')};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
