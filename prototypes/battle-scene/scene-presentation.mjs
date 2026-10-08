export function applyBackdrop(arena,background){
 let image=arena.querySelector('.arena-background');
 if(!image){image=document.createElement('img');image.className='arena-background';image.alt='';image.setAttribute('aria-hidden','true');arena.prepend(image);}
 arena.style.removeProperty('--custom-background');
 arena.classList.toggle('custom-background',!!background);
 image.hidden=!background;
 if(background)image.src=background;else image.removeAttribute('src');
}
