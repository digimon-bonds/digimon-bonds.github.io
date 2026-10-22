/* Fit the physical shell to the available window; dialogs keep readable sizing. */
(() => {
 const shell=document.querySelector('.room-shell'),experience=document.querySelector('.pet-experience');
 function fit(){
  const width=document.documentElement.clientWidth,height=window.innerHeight;
  const baseWidth=Math.min(480,width-24);
  shell.style.width=`${baseWidth}px`;
  const scale=Math.floor(Math.min(.9,(height-40)/(shell.offsetHeight+18))*100)/100;
  shell.style.zoom=String(Math.max(.1,scale));
  experience.style.width=document.fullscreenElement===experience?'100%':`${baseWidth*Math.max(.1,scale)}px`;
 }
 window.addEventListener('resize',fit);
 document.addEventListener('fullscreenchange',fit);
 if(document.fonts?.ready)document.fonts.ready.then(fit);
 fit();
})();
