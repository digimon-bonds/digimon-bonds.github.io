document.querySelector('[data-battle-entry]')?.addEventListener('click',()=>{
 const localPrototype=location.pathname.startsWith('/creator/');
 location.href=localPrototype?'/scenes.html':'/battle/scenes.html';
});
