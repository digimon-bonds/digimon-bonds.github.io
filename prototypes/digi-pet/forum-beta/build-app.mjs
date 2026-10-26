import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {installDigiPetApp} from './app-runtime.mjs';
const source=fs.readFileSync(new URL('./digipet-omegamon.js',import.meta.url),'utf8');
const serialized=source.match(/\)\(window,(\{[\s\S]*\})\);\s*$/)?.[1];
if(!serialized)throw Error('Missing standalone prototype document');
const {document}=JSON.parse(serialized),target=new URL('../../../work/digipet-app-entry/site/digi-pet-trial.js',import.meta.url);
fs.writeFileSync(target,`/* Digi-Pet trial player. Source: codex/digipet-visual; no backend or RPG sheet integration. */\n(${installDigiPetApp.toString()})(window,${JSON.stringify({document})});\n`);
console.log('Built '+fileURLToPath(target));
