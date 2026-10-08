import {apiOrigin} from './hosting.js';
document.querySelector('[data-battle-entry]')?.addEventListener('click',()=>{
 const localPrototype=location.pathname.startsWith('/creator/');
 location.href=localPrototype?'/scenes.html':new URL('/battle/scenes.html',apiOrigin).href;
});
