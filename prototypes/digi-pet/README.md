# Digi-Pet — downtime local, iteração 10

Protótipo independente do Digimon Bonds. **Não publicado. Sem backend, autenticação, ficha, Battle Link ou recompensas oficiais.**

## Abrir e jogar

Prévia atual: http://127.0.0.1:4231/?downtime=10. Recarregue a página para carregar os arquivos desta etapa. Se precisar iniciar o servidor, execute `node serve.mjs` nesta pasta (Node 22+); encerre com Ctrl+C. Na branch local: `node prototypes/digi-pet/serve.mjs`.

1. Cuide do Agumon com Comida, Conversar, Brincar ou clicando no cocô para limpar.
2. Escolha **Treinar** ou **Explorar**, uma atividade principal por dia.
3. Espere o relógio do visor. Atividades continuam por timestamps mesmo com a aba fechada.
4. Explore para obter créditos, alimentos, itens, fragmentos e cards. Abra **Inventário** para comprar comidas, consultar itens e ver a coleção.
5. O botão **Digi-Cycle** mostra os requisitos do dia, progresso dos treinos, PREPARADO e memória de convivência.

A carcaça Street Link de 480px, ambientes Interior/Exterior, Agumon, sprites NORMAL/BLINK, respiração, toque, halo do visor e controles de borracha foram preservados. Durante exploração Agumon fica ausente do habitat; o relógio permanece no visor. Painéis são diálogos sobrepostos, sem aumentar o aparelho.

## Digi-Cycle e memória

Um ciclo exige **um cuidado + uma atividade principal concluída**, no máximo uma conclusão por dia, no fuso **America/Sao_Paulo**. A escolha é registrada na partida e não pode ser trocada após começar. Cuidados seguem disponíveis após a conclusão; atividades com relógio bloqueiam outras atividades.

O registro por data impede repetir o ciclo ao recarregar ou voltar para um dia já concluído. Uma atividade que atravessa a meia-noite pertence ao dia de partida; o dia seguinte fica disponível após seu retorno. Se não houve cuidado no dia de origem, uma atividade concluída no dia seguinte não completa retroativamente o ciclo anterior. Brincar conta como cuidado ao concluir; Comida, Conversar e Limpar contam ao serem aceitos.

Cada 10 ciclos completos registra **+1 XP de convivência pendente** e o indicador volta a 0/10. Não há envio à ficha nem uso desse XP. O progresso de treino também depende do ciclo completo: terminar um treino sem cuidar não concede progresso até cumprir o cuidado no mesmo dia.

## Treinar

Escolha Poder, Coração, Inteligência ou Agilidade. Cada atributo tem progresso independente. Após **3 ciclos completos de treino no mesmo atributo**, registra **PREPARADO // atributo — +1d6 em UM teste apropriado**, um uso futuro. Só existe um PREPARADO; enquanto ativo, novo treino é bloqueado para impedir acumulação. A exploração continua disponível nos dias seguintes. Não há botão de consumo oficial nesta etapa.

Requisitos: Energia ≥20, Saciedade ≥15. Custo ao concluir: **−15 Energia e −8 Saciedade**; +3 Humor-base se Humor visível ≥50 no fim. Duração de teste: **2 min**; configuração futura: 15 min.

## Explorar e rolagem

Zona inicial configurável: **ÁREA DE DADOS // SETOR 01**. Requisitos: **Energia ≥25, Saciedade ≥20**. As recusas são falas do parceiro, sem notificação do sistema. Custo na partida: **−20 Energia, −10 Saciedade**.

Duração local: **90 segundos**. Preset de produção: **30 minutos**, sem ativar publicação. Tempos centralizados em `ACTIVITY_CONFIG.durations`.

A Disposição é calculada **antes dos custos** e guardada na atividade:

| Estado de saída | Modificador |
| --- | --- |
| Saciedade, Humor visível e Energia ≥70, Companhia ≥60, sem sujeira | +5 |
| Todos os quatro acima de 90, sem sujeira | +5, identificado como Excelente Disposição |
| Qualquer um dos quatro abaixo de 35, ou sujeira | −5 |
| Demais condições | 0 |

Bônus não se acumulam. D100 natural + modificador, limitado a 1–100. Exemplo: 92 +5 =97 → Card Comum. **Resultado final 100 → exatamente um Card Raro**. Com baixa disposição, um 100 natural pode terminar em 95; a UI mostra separadamente natural, modificador e final.

`exploration-rng.js` usa `crypto.getRandomValues` com rejection sampling (sem viés de módulo). O domínio recebe esse adaptador; não há Math.random para loot. O resultado e a recompensa são resolvidos e salvos uma vez ao concluir. A apresentação de 750ms/1550ms revela primeiro o número e depois o achado; ela nunca sorteia ou concede itens. Fechar/reabrir ou recarregar não duplica o prêmio. Achados ainda não vistos reaparecem ao abrir o pet.

| D100 final | Chance base | Categoria |
| --- | --- | --- |
| 01–40 | 40% | 8–20 Créditos |
| 41–62 | 22% | 1 comida especial |
| 63–76 | 14% | 1 Recovery Disk, Energy Patch ou Care Pack |
| 77–87 | 11% | Cache de Dados |
| 88–94 | 7% | 1 Fragmento de Card |
| 95–97 | 3% | 1 Card Comum |
| 98–99 | 2% | Achado Raro |
| 100 | 1% | 1 Card Raro |

Percentuais acima são da tabela sem modificador. O modificador desloca os resultados, alterando as chances efetivas. Com +5, a faixa de raro inclui 95–100 naturais; com −5 nenhum resultado final chega a 100.

Cache sorteia créditos extras (+25), 1–2 alimentos, 1 fragmento ou Recurso de Dados. Achado Raro sorteia +40 créditos, +2 fragmentos ou +2 Care Pack: **não é um card automático**. Configuração extensível em `downtime-config.js`.

## Comidas, preferências e loja

DIGIMEAT é **gratuito, infinito, +20 Saciedade**, sem bônus de Humor ou Companhia, mesmo sendo favorito no perfil atual. A preferência continua descoberta/registrada; os bônus emocionais ficam para as comidas especiais. Saciedade ≥95 recusa alimento sem gastar estoque.

| Comida | Preço | Efeitos básicos |
| --- | --- | --- |
| DIGIMEAT | grátis / infinito | +20 Saciedade |
| DIGIFISH | 8 CR | +25 Saciedade |
| DIGIAPPLE | 6 CR | +15 Saciedade, +3 Humor |
| DIGICARROT | 6 CR | +15 Saciedade |
| DIGIBANANA | 7 CR | +20 Saciedade, +5 Energia |
| DIGIPROTEIN | 12 CR | +10 Saciedade, +15 Energia |

Comidas pagas precisam ser compradas antes de oferecer. Preferências preservadas do perfil mock Fogo/Vacina: favorito DIGIMEAT; gosta de DIGIPROTEIN/DIGICARROT; neutro DIGIAPPLE/DIGIBANANA; não gosta de DIGIFISH. Em comidas especiais, favorito +5 Humor/+3 Companhia, gosta +2/+1; neutro sem bônus; não gosta alimenta sem ganhos emocionais. O estoque é descontado só quando a comida é aceita.

## Inventário e cards

Categorias locais: FOOD, CARE ITEMS, CARDS, CARD FRAGMENTS, DATA ITEMS; sem limite, equipamentos, crafting ou uso oficial de itens. Itens de recuperação são apenas achados guardados, sem recuperar PV/Energia da ficha.

Com **3 fragmentos**, RESTAURAR CARD fica disponível. Consome 3 e sorteia um Card Comum. Não restaura automaticamente sem clicar. A coleção aceita cópias independentes com instanceId; cada card possui id, nome, raridade, imagem, descrição, efeito e origem.

Pool comum: Power Drive (Poder), Logic Boost (Inteligência), Attack Chip (Ataque), Heart Signal (Coração), Quick Step (Agilidade). Raros: Nova Strike (Ataque), Quantum Mind (Inteligência). Todos registram **+1d6 em UM teste indicado, um uso futuro**. Os efeitos não são executados, acumulados em atributos ou consumidos no RPG. A imagem enviada foi copiada intacta para `assets/card-placeholder.png` e usada em todas as revelações; a arte pode ser substituída por card depois.

## Necessidades e cuidado preservados

Saciedade, Humor visível, Energia e Companhia: 0–100. Estado inicial 65/70/70/65. Humor deriva de Humor-base e penalidades temporárias: sujeira −20; fome, exaustão e solidão −12 cada; necessidades negativas acumuladas adicionam −5 após a primeira. Limpar o cocô clicando nele remove a penalidade; moscas decorativas permanecem.

Passagem de tempo: Saciedade −2/h; Energia acordado −1,5/h; Companhia −2/h após 12h sem cuidado, perda máxima 35 por recuperação offline. Desgaste limitado a 24h por catch-up; pisos 15 Saciedade/Energia e 20 Companhia, sem forçar subida se já estiver abaixo. Digestão pode gerar uma sujeira depois de 2 min. Não existe doença, morte, perda de XP ou dívida de ausência.

Brincar: 1 min teste /10 min futuro; ao concluir +15 Humor-base, +8 Companhia, −10 Energia, −5 Saciedade. Conversar: +10 Companhia, +4 Humor-base, ganhos limitados a uma vez por minuto. Dormir: 3 min teste/30 min futuro; recupera até +60 Energia proporcionalmente, com queda natural de Saciedade. Acordar cedo mantém apenas o recuperado. Relógio no visor, botões críticos bloqueados durante a contagem.

Falas somem após 4,5s. Necessidades persistentes têm silêncio mínimo de 60s e repetição por contexto só após 3min. Sem monólogo casual constante. Piscada e respiração pausam em atividades, diálogos, aba oculta e movimento reduzido; toque continua sem recompensa mecânica.

## Dados locais e arquitetura

Save: **localStorage**, chave `digimon-bonds:digi-pet:prototype:v4`. Migra necessidades dos saves v3/v2/v1; não inventa recompensas retroativas. A chave nova impede abas antigas (v3) de sobrescrever o downtime. O objeto de cuidados permanece schema v3 e contém `downtime.version:1`; versões do armazenamento e do domínio são independentes. Saves antigos não são apagados; dados inválidos são copiados para `:backup:<timestamp>`.

- `pet-config.js`: necessidades, comidas, preferências, atividades e falas.
- `downtime-config.js`: presets desta etapa, preços, regiões, tabela, cards, treino/ciclos e chave nova.
- `pet-engine.js`: cuidado e avanço analítico por timestamps; hook de conclusão desacoplado.
- `pet-downtime.js`: regras de ciclos, treino, exploração, recompensas e inventário; sem DOM.
- `exploration-rng.js`: porta de RNG substituível.
- `pet-storage.js`: porta de leitura/escrita local substituível.
- `digi-pet.js`: UI principal e cuidado.
- `downtime-ui.js`, `downtime.css`: painéis compactos, revelação e controles.
- `pet-sprites.js`, `pet-motion.js`, `pet-speech.js`: apresentação independente.

**NÃO CONFIAR EM LOCALSTORAGE para XP, Créditos, Cards, itens, Digi-Cycles, PREPARADO ou resultados de exploração.** Relógio e dados locais são editáveis. O ledger evita repetição acidental, não é proteção contra fraude. Integração futura precisa mover validação, relógio, RNG, concessão e consumo para transações de um backend seguro; substituir apenas o salvamento não basta. Nenhuma chamada de backend foi adicionada.

Reset: **Resetar protótipo** no rodapé → confirmar. Limpa estados e todo o progresso do save atual, sem tocar em dados de outros módulos. A chave v4 reiniciada prevalece sobre saves antigos.

## Debug e validação

**Ctrl+Shift+D** abre ferramentas escondidas da experiência normal. Permite: completar ciclo, simular próximo dia, completar treino/exploração, forçar próximo D100 (1–100), forçar Card Comum/Raro, adicionar 50 Créditos, fragmentos e preparar todos os estados em 100. Ferramentas anteriores de necessidades, sujeira e tempo foram mantidas.

O próximo dia de teste usa um deslocamento de datas persistido, explicitamente marcado como TESTE no aparelho e DIA SIMULADO no ciclo. Não altera o relógio do computador. Use Resetar ao voltar a testar dias reais. Completar ciclo é um atalho de debug e não gera progresso de atributo sem treino válido. Forçar card adiciona um exemplar de teste e abre a mesma revelação ao fechar o painel. Forçar D100 ainda aplica a Disposição.

Testes (executar separadamente; isolation=none dispensa processos filhos no sandbox):

```powershell
node --test --test-isolation=none pet-engine.test.cjs
node --test --test-isolation=none pet-downtime.test.cjs
node --test --test-isolation=none pet-presentation.test.cjs
```

24 testes do cuidado anterior, 23 testes de downtime e 16 testes de apresentação/integração DOM. Cobrem dias/catch-up, treinamento, loot, restauração, compras/estoque, reset, fallback de sprites, falas e o fluxo UI treino → explorar → D100 → card → coleção. Testes do cuidado isolado verificam a base anterior; os de downtime verificam overrides desta etapa (inclusive DIGIMEAT).

A checagem automatizada de navegador com Edge foi bloqueada anteriormente pelo revisor automático por limite de uso da conta. Nesta etapa a validação de UI foi feita com DOM/relógio simulados; não há nova captura visual validada em navegador. Não foram executados build de publicação, deploy ou alterações nos módulos atuais do Bonds.
