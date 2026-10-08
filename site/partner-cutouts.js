// Existing Digibank art with transparent backgrounds; Rookie partners only.
export const partnerCutouts=[
  {
    "name": "Kudamon",
    "id": "kudamon",
    "image": "kudamon.png"
  },
  {
    "name": "Coronamon",
    "id": "coronamon",
    "image": "coronamon.png"
  },
  {
    "name": "Hyokomon",
    "id": "hyokomon",
    "image": "hyokomon.png"
  },
  {
    "name": "Biyomon",
    "id": "biyomon",
    "image": "biyomon.png"
  },
  {
    "name": "Falcomon",
    "id": "falcomon",
    "image": "falcomon.png"
  },
  {
    "name": "Salamon",
    "id": "salamon",
    "image": "salamon.png"
  },
  {
    "name": "Ryudamon",
    "id": "ryudamon",
    "image": "ryudamon.png"
  },
  {
    "name": "Gaomon",
    "id": "gaomon",
    "image": "gaomon.png"
  },
  {
    "name": "Gabumon",
    "id": "gabumon",
    "image": "gabumon.png"
  },
  {
    "name": "Black Gabumon",
    "id": "black-gabumon",
    "image": "black-gabumon.png"
  },
  {
    "name": "Patamon",
    "id": "patamon",
    "image": "patamon.png"
  },
  {
    "name": "Huckmon",
    "id": "huckmon",
    "image": "huckmon.png"
  },
  {
    "name": "Lalamon",
    "id": "lalamon",
    "image": "lalamon.png"
  },
  {
    "name": "Lunamon",
    "id": "lunamon",
    "image": "lunamon.png"
  },
  {
    "name": "Renamon",
    "id": "renamon",
    "image": "renamon.png"
  },
  {
    "name": "Lopmon",
    "id": "lopmon",
    "image": "lopmon.png"
  },
  {
    "name": "Impmon",
    "id": "impmon",
    "image": "impmon.png"
  },
  {
    "name": "Otamamon",
    "id": "otamamon",
    "image": "otamamon.png"
  },
  {
    "name": "Gazimon",
    "id": "gazimon",
    "image": "gazimon.png"
  },
  {
    "name": "Goblimon",
    "id": "goblimon",
    "image": "goblimon.png"
  },
  {
    "name": "Syakomon",
    "id": "syakomon",
    "image": "syakomon.png"
  },
  {
    "name": "Dracmon",
    "id": "dracmon",
    "image": "dracmon.png"
  },
  {
    "name": "Veemon",
    "id": "veemon",
    "image": "veemon.png"
  },
  {
    "name": "Keramon",
    "id": "keramon",
    "image": "keramon.png"
  },
  {
    "name": "Tsukaimon",
    "id": "tsukaimon",
    "image": "tsukaimon.png"
  },
  {
    "name": "Loogamon",
    "id": "loogamon",
    "image": "loogamon.png"
  },
  {
    "name": "Morphomon",
    "id": "morphomon",
    "image": "morphomon.png"
  },
  {
    "name": "Flamemon",
    "id": "flamon",
    "image": "flamon.png"
  },
  {
    "name": "Hyemon",
    "id": "hyemon",
    "image": "hyemon.png"
  },
  {
    "name": "Black Strabimon",
    "id": "black-strabimon",
    "image": "black-strabimon.png"
  }
];

const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={piyomon:'biyomon',plotmon:'salamon',vmon:'veemon',flamon:'flamemon',dracumon:'dracmon',shakomon:'syakomon',gabumonblack:'blackgabumon'};
export function findPartnerCutout(name){const n=key(name);return partnerCutouts.find(art=>key(art.name)===(aliases[n]||n)||key(art.id)===(aliases[n]||n));}
export const validImageBackground=value=>/^#[0-9a-f]{6}$/i.test(String(value));
export function partnerVisual(form){
 const art=form.imageMode==='cutout'&&findPartnerCutout(form.name);
 return {image:art?new URL('./assets/partner-cutouts/'+art.image,import.meta.url).href:form.image,
 background:art&&validImageBackground(form.imageBackground)?form.imageBackground:''};
}
export function imageAppearanceControls(form,esc){
 const art=findPartnerCutout(form.name);if(!art)return '';
 const selected=form.imageMode==='cutout';
 return `<fieldset class="partner-image-options"><legend>Imagem do parceiro</legend><label class="field">VERSÃO DA IMAGEM<select data-form-field="imageMode"><option value="original" ${selected?'':'selected'}>Imagem original / personalizada</option><option value="cutout" ${selected?'selected':''}>Recorte com fundo transparente</option></select></label>${selected?`<label class="field">COR DE FUNDO<input aria-label="Cor de fundo do Digimon" data-form-field="imageBackground" type="color" value="${validImageBackground(form.imageBackground)?form.imageBackground:'#17313b'}"></label>`:''}<p class="hint">O recorte usa a arte do Digibank. A imagem original continua guardada e pode ser restaurada a qualquer momento.</p></fieldset>`;
}
