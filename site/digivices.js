import {skins,material} from './visual-style.js';
export {skins} from './visual-style.js';
import {stageOrder,stageNames} from './forms.js';
// Front-view illustrations; geometry describes each illustration's LCD opening.
export const digiviceModels=[
 {id:'adventure',name:'Digivice',series:'Adventure · geração 1',asset:'adventure.png',width:1254,height:1254,screen:[420,400,414,407]},
 {id:'d3',name:'D-3',series:'Adventure 02 · geração 2',asset:'d3.png',width:1254,height:1254,screen:[446,322,362,342]},
 {id:'d-ark',name:'D-Ark',series:'Tamers',asset:'d-ark.png',width:1254,height:1254,screen:[434,365,385,351]},
 {id:'d-scanner',name:'D-Scanner',series:'Frontier',asset:'d-scanner.png',width:1254,height:1254,screen:[464,230,327,278]},
 {id:'ic',name:'Digivice iC',series:'Savers',asset:'ic.png',width:1254,height:1254,screen:[445,182,364,381]},
 {id:'adventure2020',name:'Digivice:',series:'Adventure 2020',asset:'adventure2020.png',width:1254,height:1254,screen:[465,466,326,300]}
];
digiviceModels.forEach((m,i)=>m.label='Opção '+(i+1));
export const deviceDefaults={deviceModel:'adventure',deviceColor:'#9BDEE0',buttonColor:'#5557C7',borderColor:'#605AB5',trimColor:'#384951',deviceSkin:'clean',selectedPalette:'digital-classic',skinIntensity:'normal'};
export const validHex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
export function modelFor(id){return digiviceModels.find(m=>m.id===id)||digiviceModels[0]}
let renderId=0;
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function renderDigivice(s,escape,validURL){
 const m=modelFor(s.deviceModel),[sx,sy,sw,sh]=m.screen,scale=m.id==='d-ark'?.94:1.12,w=sw*scale,h=sh*scale,x=sx-(w-sw)/2,y=sy-(h-sh)/2,id='digivice-'+(++renderId),body=rgb(validHex(s.deviceColor)?s.deviceColor:deviceDefaults.deviceColor),buttons=rgb(validHex(s.buttonColor)?s.buttonColor:deviceDefaults.buttonColor);
 // Neutral shell and magenta button material are recolored independently at display time.
 const bodyMatrix=body.map(c=>`${c} 0 0 0 0`).join(' ')+' 0 0 0 1 0';
 const buttonMatrix=buttons.map(c=>`${c} 0 0 0 0`).join(' ')+' 4 -8 4 0 0';
 const border=rgb(validHex(s.borderColor)?s.borderColor:s.buttonColor),borderMatrix=border.map(c=>`${c} 0 0 0 0`).join(' ')+' 4 -8 4 0 0';
 const trim=rgb(validHex(s.trimColor)?s.trimColor:deviceDefaults.trimColor),trimMatrix=trim.map(c=>`${c} 0 0 0 0`).join(" ")+" 0 0 0 1 0";
 return `<figure data-model="${m.id}" class="partner-device skin-${skins.some(x=>x[0]===s.deviceSkin)?s.deviceSkin:"clean"}" aria-label="${escape(m.label)}" style="--crack-strength:${({soft:.4,normal:.65,strong:.9})[s.skinIntensity]||.65}"><div class="digivice-display" style="aspect-ratio:${m.width}/${m.height}"><svg viewBox="0 0 ${m.width} ${m.height}" aria-hidden="true" focusable="false"><defs><filter id="${id}-shell" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${bodyMatrix}"/></filter><filter id="${id}-buttons" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${buttonMatrix}"/><feComposite in2="SourceAlpha" operator="in"/></filter><filter id="${id}-trim" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${trimMatrix}"/></filter><clipPath id="${id}-panel"><path d="${trimPanels[m.id]||''}"/></clipPath><filter id="${id}-border" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${borderMatrix}"/><feComposite in2="SourceAlpha" operator="in"/></filter><clipPath id="${id}-bezel"><path clip-rule="evenodd" d="${borderPanels[m.id]||''}"/></clipPath><filter id="${id}-edge" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="erode" radius="1.1"/><feGaussianBlur stdDeviation="0.45"/><feComposite in="SourceGraphic" operator="in"/></filter></defs><g filter="url(#${id}-edge)"><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" filter="url(#${id}-shell)"/><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" filter="url(#${id}-buttons)"/><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" clip-path="url(#${id}-panel)" filter="url(#${id}-trim)"/><image href="assets/digivices/${m.asset}" width="${m.width}" height="${m.height}" clip-path="url(#${id}-bezel)" filter="url(#${id}-border)"/></g>${m.id==='d-scanner'?lowerScannerButtons(m,id):''}</svg><div class="digivice-lcd" style="left:${100*x/m.width}%;top:${100*y/m.height}%;width:${100*w/m.width}%;height:${100*h/m.height}%">${s.formLocked?'<span class="lcd-locked">▣<br>ACCESS LOCKED<br>██████</span>':validURL(s.digiImage)?`<img src="${escape(s.digiImage)}" alt="${escape(s.digiName||'Digimon parceiro')} na tela do ${escape(m.label)}" style="object-position:${s.imagePosition};transform:scale(${s.zoom})" referrerpolicy="no-referrer">`:'<span>AGUARDANDO<br>PARCEIRO</span>'}</div>${renderHotspots(s,m)}${material(s,m)}<div class="device-weather" aria-hidden="true"></div></div><figcaption class="form-indicator">FORM // ${String(stageOrder.indexOf(s.activeDigimonStage||'rookie')+1).padStart(2,'0')} <strong>${stageNames[s.activeDigimonStage||'rookie']}</strong></figcaption></figure>`;
}


// Clip only existing illustrated casing panels; no replacement drawing.
export const trimPanels={
 'd-scanner':'M 876 605 C 918 601 950 621 956 657 C 961 731 935 784 899 830 C 854 886 843 932 840 982 C 841 1057 795 1092 745 1136 C 691 1178 634 1199 591 1202 C 574 1200 571 1164 561 1134 C 547 1087 545 1058 518 1034 L 479 1011 Q 466 1000 479 990 L 662 887 Q 702 865 716 824 L 758 716 Q 777 690 823 649 Q 858 613 876 605 Z',
 'd3':'M 292 456 Q 273 550 295 593 L 327 621 L 351 716 L 330 758 L 366 880 L 348 909 L 397 992 L 369 1079 L 150 1100 L 150 420 Z M 812 232 Q 828 216 853 238 L 1100 420 L 1100 1120 L 863 1095 L 832 1015 L 893 913 L 886 887 L 930 772 Q 933 753 905 719 L 920 657 L 955 616 Q 995 520 958 442 L 939 413 L 906 393 Q 865 324 817 294 Z',
 'ic':'M 334 680 Q 340 657 356 646 L 418 694 L 422 829 Q 388 860 361 878 Q 337 889 334 862 Z M 833 694 L 892 646 Q 917 655 920 680 L 920 858 Q 919 889 896 880 L 835 833 Z'
};


// Screen-bezel masks isolate the existing colored material from its buttons.
export const borderPanels={
 adventure:'M 0 0 H 1254 V 1254 H 0 Z M 88 616 a 105 105 0 1 0 210 0 a 105 105 0 1 0 -210 0 M 962 510 a 95 95 0 1 0 190 0 a 95 95 0 1 0 -190 0 M 962 737 a 95 95 0 1 0 190 0 a 95 95 0 1 0 -190 0',
 'd-ark':'M 0 0 H 1254 V 1254 H 0 Z M 150 0 H 560 V 115 L 480 175 L 320 265 L 245 315 H 150 Z M 347 852 a 68 68 0 1 0 136 0 a 68 68 0 1 0 -136 0 M 771 852 a 68 68 0 1 0 136 0 a 68 68 0 1 0 -136 0 M 501 964 a 127 62 0 1 0 254 0 a 127 62 0 1 0 -254 0',
 'd-scanner':'M 390 170 H 862 V 518 H 390 Z',
 adventure2020:'M 0 0 H 1254 V 1254 H 0 Z M 204 524 a 84 84 0 1 0 168 0 a 84 84 0 1 0 -168 0 M 878 524 a 84 84 0 1 0 168 0 a 84 84 0 1 0 -168 0 M 204 730 a 84 84 0 1 0 168 0 a 84 84 0 1 0 -168 0 M 878 730 a 84 84 0 1 0 168 0 a 84 84 0 1 0 -168 0'
};


// Coordinates measured against the six existing front-view illustrations (percent).
export const buttonHotspots={
 adventure:{previous:[8,43,14,14],next:[78,35,13,13]},
 d3:{previous:[37.8,67.5,5.3,5.8],next:[56.5,67.5,5.3,5.8]},
 'd-ark':{previous:[28,63,9.5,10],next:[62,63,9.5,10]},
 'd-scanner':{previous:[28.3,44.55,6.3,6.5],next:[35.3,49.95,8.5,8.5]},
 ic:{previous:[26.5,52,7,18],next:[66.5,52,7,18]},
 adventure2020:{previous:[17.4,36.5,11.8,11.8],next:[71,36.5,11.8,11.8]}
};
function renderHotspots(s,m){const i=stageOrder.indexOf(s.activeDigimonStage||'rookie');return Object.entries(buttonHotspots[m.id]).map(([action,[left,top,width,height]])=>`<button type="button" class="device-hotspot" data-form-nav="${action}" aria-label="${action==='previous'?'Forma anterior':'Próxima forma'}" title="${action==='previous'?'Forma anterior':'Próxima forma'}" ${action==='previous'&&i===0||action==='next'&&i===4?'disabled':''} style="left:${left}%;top:${top}%;width:${width}%;height:${height}%"></button>`).join('');}

// Move the two original illustrated buttons down 32 artwork units, preserving their texture.
function lowerScannerButtons(m,id){return `<defs><clipPath id="${id}-button-crops"><circle cx="394" cy="566" r="59"/><circle cx="496" cy="646" r="73"/></clipPath><linearGradient id="${id}-repair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4e6eb"/><stop offset="1" stop-color="#c9cdd7"/></linearGradient></defs><g filter="url(#${id}-shell)"><circle cx="394" cy="566" r="60" fill="url(#${id}-repair)"/><circle cx="496" cy="646" r="74" fill="url(#${id}-repair)"/></g><g transform="translate(0 32)"><g clip-path="url(#${id}-button-crops)"><image href="assets/digivices/${m.asset}" width="1254" height="1254" filter="url(#${id}-shell)"/><image href="assets/digivices/${m.asset}" width="1254" height="1254" filter="url(#${id}-buttons)"/></g></g>`; }
