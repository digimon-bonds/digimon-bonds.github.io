export function spendBond(pair,amount){if(!Number.isInteger(amount)||amount<0||!pair||amount>Math.max(0,pair.bond))throw Error('Pontos de Laço insuficientes');pair.bond-=amount;}
export function loseBond(pair,amount){if(!pair||!Number.isInteger(amount)||amount<0)throw Error('Perda de Laço inválida');pair.bond-=amount;}
export function spendEnergy(human,amount){if(!Number.isInteger(amount)||amount<0||amount>human.energy)throw Error('Energia insuficiente');human.energy-=amount;}
export function rescue(pair,value,enabled){if(value>0||!enabled||!pair||pair.bond<3)return {value:Math.max(0,value),cost:0};spendBond(pair,3);return {value:1,cost:3};}
