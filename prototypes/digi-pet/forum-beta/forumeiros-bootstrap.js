/* Digi-Pet: TESTE SOMENTE OMEGAMON u1. Administradores apenas no Forumeiros. */
(function(){
 function start(){
  var u=window._userdata;
  if(location.origin!=='https://digimonbonds.forumeiros.com'||!u||String(u.session_logged_in)!=='1'||String(u.user_id)!=='1'||String(u.username).toLowerCase()!=='omegamon'||document.getElementById('db-pet-bootstrap'))return;
  var s=document.createElement('script');s.id='db-pet-bootstrap';s.src="https://cdn.jsdelivr.net/gh/digimon-bonds/digimon-bonds.github.io@01a3e28/prototypes/digi-pet/forum-beta/digipet-omegamon.js";s.integrity="sha384-M2FhJk4e9/a9y6B7RPjFCp7flyni1XyzuWIIZ66zIez65x1Z0QYYckL0VUluV/C3";s.crossOrigin='anonymous';s.onerror=function(){console.warn('Digi-Pet de teste indisponível. O fórum continua funcionando normalmente.');};document.head.appendChild(s);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
