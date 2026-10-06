# Digibank local

## Fonte de dados

`site/data/digimon-data.js` é o snapshot central de espécies. `site/digimon-database.js` oferece consultas, filtros, estágios, ciclos e o adaptador para o Creator. A interface `site/digibank.js` não consulta o fórum nem a enciclopédia em tempo de execução; só as imagens de referência são carregadas externamente. Links de origem acompanham cada registro.

O Creator continua importando `species` de `catalog.js`. A futura troca por `getCreatorSpecies()` é explícita e deve acontecer após aprovação. Os testes comparam as 75 espécies, incluindo disponibilidade e campos fixos. A diferença de grafia `Virus`/`Vírus` é normalizada no novo banco. A entrada de companheiros migrou do fórum, sem tornar Campeões parceiros iniciais.

Os códigos de estágio seguem o modelo de formas existente: `baby`, `rookie`, `champion`, `ultimate`, `mega`, `special` e `xbody`. Após os Hybrid e a separação das fusões, o banco possui 151 Novatos, 244 Campeões, 238 Perfeitos, 264 Megas, 19 Especiais e 121 X-Body (1037 registros). Bebês continua como arquivo em expansão.

Os 32 Hybrid preservam `official.level: Hybrid`, Attribute e Type oficiais. Sua equivalência Bonds segue `scripts/digibank-hybrid-editorial.tsv`: bases Flamemon/Strabimon em Novato; espíritos humanos em Campeão; Fera em Perfeito; combinados e transcendentes em Mega. Susanomon reúne os vinte espíritos e fica em Especiais. KendoGarurumon utiliza Luz, afinidade de seu Digiespírito; não recebe Gelo apenas pela semelhança nominal com Garurumon.

`evolutionCategory` distingue as rotas, e permanece disponível na API para a futura integração; a interface oferece somente busca por nome e filtro por estágio. `scripts/digibank-special-curation.mjs` registra condições e componentes conhecidos das fusões. IDs existentes permanecem estáveis ao mover uma forma para Especiais. `progressionStage` conserva a equivalência anterior e `requiresSpecialEvolution` impede tratá-la como progressão comum. `getStageSpecies(stage)` prepara a seleção futura pelo Digivice e exclui Especiais por padrão; `includeSpecial: true` exige uma decisão explícita do consumidor. Não libera estágios nem muda regras do Creator.

Nomes visíveis dos 75 Novatos foram normalizados. `legacyName` preserva a identidade anterior para compatibilidade com o adaptador e os dados existentes. Flamemon e Strabimon são novos registros Novato disponíveis no banco; o Creator permanece com o catálogo atual até a migração aprovada.

## Elementos e revisão

A revisão posterior usa `scripts/digibank-element-review.tsv` como quinto arquivo editorial, com justificativas independentes da descrição curta. O comparativo de distribuição está em `docs/digibank-elements.md`. As fontes continuam armazenadas para auditoria, mas não aparecem como links nos cards. O rodapé dos cards mostra somente parceiro inicial disponível (verde) ou companheiro registrado (dourado); registros evolutivos não têm rótulo adicional.

- Fogo → Madeira → Água/Gelo → Fogo.
- Elétrico → Vento → Terra → Elétrico.
- Luz → Escuridão → Metal → Luz.
- Neutro permitido, fora dos ciclos, conforme confirmado pelo autor.

Elementos de Novatos preservam o fórum. Elementos dos Campeões, Perfeitos e Megas são adaptações editoriais, não fatos oficiais, e aguardam aprovação. `docs/digibank-review.md` lista todas as propostas e suas fontes. O banco mantém `reviewStatus: pending` até essa validação. Classificação é traduzida por site/digimon-localization.js; official.type preserva o Type em inglês, separado do Elemento do Bonds. A seleção em `scripts/digibank-curation.mjs` separa as variantes de Anticorpo X em X-Body e exclui Aegiomon/Aegiochusmon, versões de anime, modos especiais e formas marcadas Enhancement. Espécies-base portadoras naturais de Anticorpo X, como Dorumon e Ryudamon, permanecem; isso não acrescenta versões X alternativas. Os cards compartilham a mesma cor de destaque dourada, independentemente do Elemento.

O filtro oficial Mega forneceu 375 registros em todas as páginas. Foram selecionados 270 inicialmente; as fusões e manifestações específicas selecionadas agora migram para Especiais sem serem excluídas. As variantes X anteriormente retiradas agora ficam na aba própria; modos e versões específicas permanecem fora das categorias comuns. A lista nominal está no documento de revisão. Justimon mantém somente seu registro principal (Accel Arm); armas alternativas, variantes Kizuna, Alphamon Ouryuken e formas Dex não entram nesta seleção.

O tópico do fórum parece repetir uma descrição de leão negro em Labramon; a nova descrição evita essa afirmação, sem modificar seus campos de regras.

## Manutenção e validação

O coletor `scripts/research-digibank.mjs` realiza apenas leituras do catálogo oficial, percorrendo a paginação real. Use `node scripts/research-digibank.mjs Champion`, `node scripts/research-digibank.mjs Ultimate` ou `node scripts/research-digibank.mjs Mega` para coletar os respectivos estágios. Os arquivos temporários em `.digibank-research/` ficam ignorados no Git. O snapshot do fórum foi extraído das tabelas visíveis dos posts 66 e 67. A montagem editorial usa `scripts/assemble-digibank.mjs` com esse material local e os quatro arquivos TSV de textos próprios; a aplicação publicada dependerá apenas do snapshot final, não dos coletores.

Execute `node --test --test-isolation=none scripts/deployment.test.mjs scripts/digibank.test.mjs` e `node scripts/build.mjs`. A validação visual foi feita na interface local, com busca, filtros, etapas vazias, navegação de módulos e larguras de desktop, tablet e celular.

Esta etapa é exclusivamente local. Não houve mudança de workflow, push ou deploy.

## Novatos e X-Body

Há 79 registros no grupo inicial e 72 Novatos complementares, ordenados separadamente. `initialEligible` identifica o grupo inicial; os complementares são indisponíveis e nunca entram em `getCreatorSpecies()`. Hyemon, Black Strabimon e Flamemon possuem os companheiros solicitados. Todos os nomes de companheiros estão em maiúsculas. O Creator continua usando seu catálogo atual: esta etapa prepara a base sem ativar a migração.

As 121 variantes alternativas X usam `stage: xbody`, `isXBody: true` e preservam o nível oficial em `progressionStage`. Não entram nas categorias comuns nem na seleção de parceiro inicial. Tokomon X não tem Attribute oficial informado; o campo original permanece nulo e a classificação de disponibilidade não inventa um atributo.

## Bebês e imagens X

A consulta In-Training I acrescenta 48 Bebês (49 na fonte, excluindo Bommon 2010). Atributo oficial ausente permanece nulo; a interface informa Não definido. Elementos e descrições curtas são editoriais. As imagens das 121 variantes X estão em assets/digibank/xbody, servidas pelo próprio projeto; WarGrowlmon X usa o PNG fornecido pelo usuário. O cabeçalho mantém o texto de apresentação e omite contadores duplicados. Total atual: 1085 registros.

## Auditoria de cobertura — 06/10/2026

O índice oficial possui 1321 entradas: 1151 representadas, 66 Armor excluídos por pedido do autor e 104 exclusões de curadoria (família Aegio, versões de anime, modos muito específicos, Enhancement e formas Dex). Não restam entradas sem classificação nesta consulta. O relatório nominal está em digibank-coverage.json e é verificado pelos testes. Isso cobre esta referência e esta data; não afirma cobrir fan Digimon ou todas as mídias existentes.

Os 48 Bebê I existentes foram preservados após a instrução de não substituir; acrescentados 58 Bebê II comuns. Tokomon X permanece em X-Body. Imperialdramon Dragon/Fighter e suas variantes Black foram adicionados; Paladin está em Especiais com requisitos. Gururumon usa Fogo e Black Garurumon usa Escuridão, sem alterar Garurumon (Gelo). Foram acrescentados Calumon, Burpmon e NEO em Especiais com nível oficial Unknown. Migração do Creator para a base central está ativa desde o deploy anterior. Estas correções ainda são locais.
