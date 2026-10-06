// Curated Bonds exclusions. Base species and established color variants remain.
const specificForms=new Set([
 'donshoutmon','shonitamon','shootingstarmon','shoutmon_king',
 'shoutmonx2','shoutmonx3','shoutmonx4','cyberdramon-xwars','deckergreymon',
 'death-x-dorugamon','death-x-doruguremon','death-x-dorugoramon','death-x-mon',
 'abbadomoncore','agumon_kizuna','gabumon_kizuna','alphamon:ouryuken',
 'apollomon_whispered','chaosmonvaldurarm','darknessbagramon',
 'fenriloogamon_takemikazuchi','jesmongx','justimon_blitzarm','justimon_criticalarm',
 'yggdrasill7d6','lucemonlarva','omegamon_alter-b','omegamon-alter-s',
 'omegamonzwart_d','shoutmondx','shoutmon_ex6','ultimatechaosmon'
]);
export function exclusionReason(row){
 if(['imperialdramondragonmode','imperialdramon_dragon_black','imperialdramonfightermode','imperialdramonfightermode_vi','imperialdramonpaladinmode'].includes(row.directory_name))return null;
 if(/Antibody|X[- ]?Body/i.test(row.name)||/_x$/i.test(row.directory_name))return 'Variante de Anticorpo X';
 if(/^aegio/i.test(row.directory_name)||/^aegio/i.test(row.name))return 'Família Aegiomon/Aegiochusmon';
 if(/\bVersion\b|\b2010\b|\bMode\b|Awakened|Awake|Uver\.|\bX[2-9][A-Za-z]*\b|\+/i.test(row.name)||row.officialType==='Enhancement'||specificForms.has(row.directory_name))return 'Modo, fusão ou versão muito específica';
 return null;
}
