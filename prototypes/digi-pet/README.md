# Digi-Pet — aparelho e cuidados, iteração 03

## Abrir localmente

Com Node.js 22 ou superior, execute nesta pasta `node serve.mjs` e abra http://127.0.0.1:4231. Ctrl+C encerra o servidor. Na raiz da branch: `node prototypes/digi-pet/serve.mjs`.

Para persistência previsível, use o mesmo endereço e navegador. A prévia também abre diretamente pelo HTML; o armazenamento de `file://` depende do navegador e é separado do HTTP.

## Aparelho e skins

Carcaça com microtextura, parafusos, trilhos superior/inferior, trava lateral, rebaixo e vidro. Interior, Exterior e o PNG estático de Agumon foram preservados.

O seletor **CARCAÇA** alterna entre:

- **Bonds**: acabamento navy limpo, metal acetinado, luzes suaves e teclas azul-petróleo.
- **Street Link**: adesivos/grafismos vetoriais originais, carcaça customizada e teclas douradas. Inspirada nas referências fornecidas, sem reproduzi-las.

`device-skins.css` concentra tokens de carcaça, trilhos, teclas e indicadores. A skin urbana usa `assets/urban-wrap.svg`, arte vetorial local editável. Cada skin sobrescreve os tokens em `.room-shell[data-skin=...]`; a lista permitida fica em `CONFIG.skins` e as opções no HTML. A skin é cosmética, sem modificar estados.

Sem animações do Digimon. As únicas animações novas são três pequenas moscas sobre a sujeira; respeitam `prefers-reduced-motion`.

## Estados, 0–100

| Estado | Inicial | Leitura |
| --- | ---: | --- |
| Saciedade | 65 | Quanto está alimentado; quanto maior, melhor. |
| Humor | 60 | Cai com sujeira e necessidades ruins acumuladas; melhora com cuidados. |
| Energia | 70 | Diminui acordado, recupera durante o sono. |
| Companhia | 65 | Atenção e presença cotidiana; cai lentamente sem cuidados. |

Quatro barrinhas discretas, com valores numéricos e semântica acessível de medidor. Necessidades baixas ficam em âmbar. Companhia substitui o antigo nome Vínculo e não representa o Laço oficial do RPG.

Condições derivadas, por prioridade: Dormindo; Tristinho (Humor ≤35); Com fome (Saciedade ≤30); Cansado (Energia ≤25); Solitário (Companhia ≤30); Incomodado (sujeira); Feliz (Humor ≥75); Tranquilo. O espaço de fala/status acompanha o estado com textos fixos acolhedores, sem IA. A sujeira tem prioridade na mensagem de necessidade, mesmo que haja outras condições.

## Ações configuradas

| Ação | Efeitos |
| --- | --- |
| Comida | +20 Saciedade, +2 Companhia; agenda digestão. |
| Brincar | +15 Humor, −12 Energia, +4 Companhia. |
| Treinar | −20 Energia, −8 Saciedade; apenas histórico/contador, sem XP. |
| Conversar | +12 Companhia, +8 Humor. |
| Dormir | +8 Energia e −1 Saciedade por minuto; pausa a queda de Companhia enquanto dorme. |
| Acordar | Encerra o sono, sem ganho instantâneo. |
| Limpar | Remove a sujeira, +22 Humor e +3 Companhia. |

As quatro ações principais têm intervalo de 5 segundos por ação. Brincar exige Energia ≥12; Treinar exige Energia ≥20 e Saciedade ≥10. Comida é recusada em Saciedade 100. O sono impede as quatro ações principais, mas não limpeza ou troca de ambiente. Ao completar 100 Energia, acorda automaticamente.

Cada cuidado válido reinicia a contagem de tempo sem atenção. Ação recusada apenas explica o motivo: não concede benefício nem registra sucesso. Limpar um ambiente já limpo também não concede ganho.

## Tempo, necessidades e ausência

Toda a lógica ajustável fica em `CONFIG` de `pet-engine.js`.

- Um passo de 60 segundos; interface verifica o relógio a cada segundo e ao voltar à aba.
- Acordado: −1 Saciedade e −1 Energia por minuto.
- Dormindo: −1 Saciedade e +8 Energia por minuto.
- Após 10 minutos acordado sem cuidado válido, Companhia cai 1 a cada 5 minutos adicionais (primeira queda no minuto 15). Sono pausa essa contagem.
- Se pelo menos duas necessidades estiverem ruins (Saciedade ≤30, Energia ≤25, Companhia ≤30 ou sujeira), Humor cai 1 por minuto.
- Sujeira causa ainda −1 Humor por minuto, além da perda inicial abaixo. Pode somar com a perda por necessidades acumuladas.
- Após ausência, calcula no máximo 60 minutos. Descarta o excesso sem dívida futura.
- Pisos de desgaste passivo: Saciedade 20, Humor 20, Energia 15 e Companhia 20. Se uma ação já levou um valor abaixo disso, o relógio não o reduz mais nem oferece aumento artificial. Ações sempre respeitam 0–100.
- Sem doença, morte, evolução, XP, PL ou penalidades oficiais. Conversa, brincadeira, alimentação e limpeza permitem recuperar os estados.

Minutos incompletos são preservados. Iniciar ou encerrar sono começa um novo minuto para evitar ganho de descanso por frações de tempo anteriores.

## Sujeira e limpeza direta

Uma refeição agenda digestão para 2 minutos depois, se não houver sujeira nem digestão pendente. Outras refeições não empilham cocôs nem adiam a digestão. No máximo um cocô aparece, compartilhado entre Interior e Exterior.

Ao surgir, a sujeira reduz Humor em **18**, uma única vez, respeitando o piso de desgaste. As moscas e a mensagem “Ops, acho que fiz sujeira. Uma limpeza cairia bem.” indicam a necessidade. Limpe **clicando diretamente no cocô** (também acessível por teclado) ou pelo botão Limpar. Os dois caminhos executam a mesma regra e concedem o mesmo ganho; cliques repetidos não duplicam o benefício.

## Persistência e migração

`localStorage`, chave atual: `digimon-bonds:digi-pet:prototype:v2`.

Salva estados, ambiente, skin, sono, digestão, sujeira, tempo sem atenção, relógio, contadores e últimas 12 ações. Se não houver um save v2, lê o protótipo v1 e migra o valor antigo de `bond` para `companionship`, preservando os demais dados válidos. A chave anterior fica intacta; abas antigas não sobrescrevem o save novo.

Dados inválidos são normalizados e JSON inválido inicia um pet novo. Sem acesso ao armazenamento, funciona temporariamente em memória e avisa no rodapé. Abas desta versão acompanham o save local mais recente.

**Resetar protótipo → Resetar dados** restaura somente o save v2, incluindo skin Bonds, Interior, estados e histórico. Cancelar não altera dados. Nenhuma outra chave do app é removida.

**Histórico / teste → Simular +5 minutos** permite conferir desgaste, sono, digestão e recuperação sem esperar; avança apenas o relógio do pet, sem alterar o computador.

## Arquivos desta iteração

Alterados: `index.html`, `digi-pet.js`, `pet-engine.js`, `pet-engine.test.cjs`, `README.md`.

Criados: `device-skins.css`, `assets/urban-wrap.svg`.

Preservados: CSS base `digi-pet.css`, `assets/room.svg`, `assets/garden.svg`, `assets/agumon.png` e `serve.mjs`.

O estado é exclusivo do experimento; `mockPartner` continua apenas como apresentação temporária. Não há modelo definitivo de personagem nem contrato de ficha real.

## Verificação

`node pet-engine.test.cjs`: 13 testes determinísticos, incluindo efeitos, limites, cooldown, tempo fracionado, desgaste e pisos, sujeira/limpeza, sono, migração de saves e validação de skins.

No Edge: ambas as skins em 1440×900, 1366×768, 1024×650, 390×844 e 360×740, sem scroll e com controles visíveis. Verificados medidores acessíveis, skin persistida, alternância de ambientes, ações, limpeza pelo cocô, sono, simulação, histórico, reset, ausência longa, sincronização entre abas e armazenamento inválido/bloqueado. Sem erros JavaScript ou requisições externas. Telas menores podem rolar para preservar os controles.

## Escopo local

Nada publicado, enviado ao GitHub ou mesclado. Sem deploy, backend, ficha real, IA, autenticação, Forumeiros ou regras do RPG. Somente `prototypes/digi-pet`, fora do build atual. Nenhuma alteração em GitHub Pages, workflows ou módulos existentes.
