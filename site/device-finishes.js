// Fractures use screen-local coordinates. Casing wear follows the art's alpha edge.
export function crackedGlass(){
 const lines='M81 18 70 27 66 42 52 50 43 69 23 80 10 100 M81 18 93 29 100 31 M81 18 78 0 M81 18 95 5 M81 18 100 15 M81 18 86 39 96 58 91 80 100 98 M81 18 59 13 42 21 16 12 0 15 M81 18 68 34 73 53 63 75 68 100 M66 42 40 37 28 45 0 40 M52 50 58 62 46 83 45 100 M43 69 30 63 13 69 0 62 M86 39 73 53 52 50 M93 29 86 39 100 43 M70 27 59 13 M40 37 42 21 M96 58 84 66 91 80 M23 80 28 91 21 100 M63 75 84 66 M10 100 6 87 0 83';
 return `<svg class="glass-fractures" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M81 18 70 27 66 42 86 39Z M43 69 23 80 10 100 45 100Z" fill="#edfbff" opacity=".12"/><path d="${lines}" fill="none" stroke="#16282e" stroke-width=".65" opacity=".6"/><path d="${lines}" transform="translate(.3 -.25)" fill="none" stroke="#efffff" stroke-width=".35"/><path d="M76 14 84 21 78 22 84 15 M79 12 83 25 M74 18 88 18" fill="none" stroke="#fff" stroke-width=".55"/></svg>`;
}
// Corrosion grows around each model's seams and exposed corners.
const rustSites={
 adventure:[[29,31,9,3],[49,23,10,2],[73,31,6,4],[13,66,4,7],[31,82,9,3],[72,78,8,5],[85,60,3,5]],
 d3:[[44,20,6,3],[71,31,4,6],[25,48,3,9],[44,80,8,4],[66,82,4,7],[29,70,4,6]],
 'd-ark':[[30,33,6,4],[55,23,7,3],[76,44,4,8],[28,64,3,5],[46,86,7,4],[68,76,5,5]],
 'd-scanner':[[45,17,7,2],[72,24,4,5],[27,46,4,7],[38,72,6,5],[54,87,6,4],[72,66,4,7]],
 ic:[[39,13,5,3],[68,27,4,6],[31,50,3,7],[47,80,7,3],[67,60,3,7],[57,89,5,3]],
 adventure2020:[[34,30,7,4],[60,23,8,3],[77,62,4,6],[23,61,4,7],[38,79,8,4],[66,77,7,3]]
};
export function wornCasing(s,m,id,hotspots={}){
 if(s.deviceSkin!=='worn')return '';
 const strength={soft:.48,normal:.8,strong:1}[s.skinIntensity]||.8;
 let seed=71;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const sites=rustSites[m.id]||rustSites.adventure;let stains='',chips='';
 for(const [cx,cy,rx,ry] of sites){
  const x=cx*m.width/100,y=cy*m.height/100,w=rx*m.width/100,h=ry*m.height/100;
  // A translucent stain surrounds chipped paint; the exposed core is darker and granular.
  stains+=`<ellipse cx="${x}" cy="${y}" rx="${w*1.35}" ry="${h*1.5}" fill="url(#${id}-oxidation)" filter="url(#${id}-rough)"/>`;
  for(let i=0;i<46;i++){
   const a=rand()*Math.PI*2,r=Math.sqrt(rand()),px=x+Math.cos(a)*w*r,py=y+Math.sin(a)*h*r,size=1.4+rand()*6;
   const color=['#502c20','#805039','#a25d32','#b97a45','#d1b88e'][i%5];
   chips+=`<path d="M${px.toFixed(1)} ${py.toFixed(1)} l${size.toFixed(1)} ${(-size*.4).toFixed(1)} l${(size*.5).toFixed(1)} ${(size*.75).toFixed(1)} l${(-size*1.2).toFixed(1)} ${(size*.4).toFixed(1)}Z" fill="${color}" opacity="${(.4+rand()*.5).toFixed(2)}"/>`;
  }
 }
 const [sx,sy,sw,sh]=m.screen;
 const protect=Object.values(hotspots).map(([x,y,w,h])=>`<ellipse cx="${(x+w/2)*m.width/100}" cy="${(y+h/2)*m.height/100}" rx="${w*m.width*.0045}" ry="${h*m.height*.0045}" fill="black"/>`).join('');
 return `<svg class="casing-wear" viewBox="0 0 ${m.width} ${m.height}" aria-hidden="true" style="opacity:${strength}"><defs><radialGradient id="${id}-oxidation"><stop stop-color="#6b3824" stop-opacity=".72"/><stop offset=".34" stop-color="#9c572d" stop-opacity=".62"/><stop offset=".7" stop-color="#b07b43" stop-opacity=".34"/><stop offset="1" stop-color="#836b42" stop-opacity="0"/></radialGradient><filter id="${id}-rough" x="-25%" y="-30%" width="150%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".038" numOctaves="3" seed="12" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="${id}-wear"><feMorphology in="SourceAlpha" operator="erode" radius="12" result="inner"/><feMorphology in="SourceAlpha" operator="erode" radius="4" result="outer"/><feComposite in="outer" in2="inner" operator="out" result="rim"/><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="3" seed="8" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.46 0 0 0 0 0.25 0 0 0 0 0.13 0 0 0 7 -4"/><feComposite in2="rim" operator="in"/></filter><mask id="${id}-wearmask" maskUnits="userSpaceOnUse" x="0" y="0" width="${m.width}" height="${m.height}"><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" style="filter:brightness(0) invert(1)"/><rect x="${sx-12}" y="${sy-12}" width="${sw+24}" height="${sh+24}" rx="20" fill="black"/>${protect}</mask></defs><g mask="url(#${id}-wearmask)"><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" filter="url(#${id}-wear)"/>${stains}${chips}</g></svg>`;
}
