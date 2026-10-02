// Fractures use screen-local coordinates. Casing wear follows the art's alpha edge.
export function crackedGlass(){
 const lines='M81 18 70 27 66 42 52 50 43 69 23 80 10 100 M81 18 93 29 100 31 M81 18 78 0 M81 18 95 5 M81 18 100 15 M81 18 86 39 96 58 91 80 100 98 M81 18 59 13 42 21 16 12 0 15 M81 18 68 34 73 53 63 75 68 100 M66 42 40 37 28 45 0 40 M52 50 58 62 46 83 45 100 M43 69 30 63 13 69 0 62 M86 39 73 53 52 50 M93 29 86 39 100 43 M70 27 59 13 M40 37 42 21 M96 58 84 66 91 80 M23 80 28 91 21 100 M63 75 84 66 M10 100 6 87 0 83';
 return `<svg class="glass-fractures" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M81 18 70 27 66 42 86 39Z M43 69 23 80 10 100 45 100Z" fill="#edfbff" opacity=".12"/><path d="${lines}" fill="none" stroke="#16282e" stroke-width=".65" opacity=".6"/><path d="${lines}" transform="translate(.3 -.25)" fill="none" stroke="#efffff" stroke-width=".35"/><path d="M76 14 84 21 78 22 84 15 M79 12 83 25 M74 18 88 18" fill="none" stroke="#fff" stroke-width=".55"/></svg>`;
}
export function wornCasing(s,m,id){
 if(s.deviceSkin!=='worn')return '';
 const strength={soft:.42,normal:.72,strong:1}[s.skinIntensity]||.72;
 let marks='';let seed=71;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 // Small non-repeating abrasions, clustered around handling areas, not a sheet of texture.
 for(const [cx,cy] of [[.25,.7],[.72,.24],[.72,.78],[.28,.3]])for(let i=0;i<30;i++){
 const x=(cx+(rand()-.5)*.21)*m.width,y=(cy+(rand()-.5)*.19)*m.height,l=2+rand()*15;
 marks+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${l.toFixed(1)} ${(-l*.65).toFixed(1)}" stroke="${i%3?'#d4cdb7':'#354044'}" stroke-width="${(1+rand()*2).toFixed(1)}" opacity="${(.2+rand()*.4).toFixed(2)}"/>`;
 }
 return `<svg class="casing-wear" viewBox="0 0 ${m.width} ${m.height}" aria-hidden="true" style="opacity:${strength}"><defs><filter id="${id}-wear"><feMorphology in="SourceAlpha" operator="erode" radius="14" result="inner"/><feMorphology in="SourceAlpha" operator="erode" radius="3" result="outer"/><feComposite in="outer" in2="inner" operator="out" result="rim"/><feTurbulence type="fractalNoise" baseFrequency=".075" numOctaves="3" seed="8" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.78 0 0 0 0 0.74 0 0 0 0 0.62 0 0 0 7 -3.8"/><feComposite in2="rim" operator="in"/></filter><mask id="${id}-wearmask"><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" style="filter:brightness(0) invert(1)"/></mask></defs><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" filter="url(#${id}-wear)"/><g mask="url(#${id}-wearmask)">${marks}</g></svg>`;
}
