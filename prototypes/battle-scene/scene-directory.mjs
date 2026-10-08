import {currentForm} from './scene-engine.mjs';
export const validSceneId=id=>/^[a-f0-9-]{36}$/.test(id||'');
export function sceneCard(id,data){const state=data.state;return {id,name:state.scene.name,round:state.round,background:state.scene.background||null,environment:state.scene.environment||'grid',enemies:state.actors.filter(a=>a.side==='enemy').map(a=>currentForm(a).name),updatedAt:data.updatedAt||Date.now()};}
export function nameScene(data,name){data.state.scene.name=String(name||'Nova cena').trim().slice(0,70)||'Nova cena';data.baseline=structuredClone(data.state);data.updatedAt=Date.now();return data;}
