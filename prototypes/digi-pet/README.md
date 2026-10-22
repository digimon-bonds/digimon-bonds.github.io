# Digi-Pet — gameplay e clareza, etapa 13

Protótipo **local**, sem publicação, deploy, backend, autenticação, ficha ou Battle Link. Créditos, XP, cards e PREPARADO são dados de teste, sem validade oficial no RPG.

## Acesso

Abra http://127.0.0.1:4231/?gameplay=13 e recarregue a página. Para iniciar a prévia: `node serve.mjs` nesta pasta, usando Node 22+; Ctrl+C encerra. Na branch local: `node prototypes/digi-pet/serve.mjs`.

O aparelho Street Link continua com largura máxima de 480px, visor próprio, Interior/Exterior, Agumon NORMAL/BLINK, respiração sutil e reação ao toque. A faixa PARTNER LINK permanece removida; cinco saídas de som ficam sobre a carcaça e o LED de ligado aparece ao lado de LOCAL. Sem novos assets ou animações nesta etapa.

## Como jogar

1. **Cuide:** Alimentar, Brincar, Conversar, Descansar ou limpar clicando no cocô.
2. **Escolha uma atividade principal:** Treinar ou Explorar. Os dois botões dourados ficam abaixo dos quatro cuidados básicos.
3. **Espere:** o relógio fica no visor. Atividades incompatíveis ficam desabilitadas.
4. **Receba:** treino avança em um atributo; exploração faz D100 e revela um resultado.
5. **Prepare o próximo dia:** use créditos para comprar alimentos e consumíveis locais.

**Digi-Cycle** abre um painel com progresso de 0–10, ciclos restantes para o próximo XP, total concluído, XP pendente, checklist do dia, última ação, resultado recente e treino/PREPARADO. A contagem e o resultado em andamento atualizam com o painel aberto. Logs do sistema ficam nesse painel e em notificações temporárias; não são inseridos no balão do personagem.

**Inventário** abre um painel com saldo e quatro categorias: **Comida, Itens, Cards e Especiais**. As entradas mostram nome, quantidade, uso/descrição e se são consumíveis. Cards iguais são agrupados visualmente, mantendo cada exemplar no save. Especiais reúne fragmentos, recursos e PREPARADO.

## Digi-Cycle e XP

Um ciclo completo exige **um cuidado + uma atividade principal concluída**, no máximo uma vez por dia no fuso America/Sao_Paulo. Alimentar, Conversar, Limpar e usar um consumível aceito registram cuidado imediatamente; Brincar e Descansar contam quando terminam. Acordar antes do fim preserva a energia já recuperada, mas não conta sozinho como cuidado completo.

Treinar e Explorar são escolhas exclusivas no dia. Cuidados podem continuar após completar o ciclo. A atividade pertence à data da partida; se atravessar a meia-noite, conclui o ciclo de origem quando ele já tinha cuidado. Um cuidado no dia seguinte não completa retroativamente o dia anterior. O dia novo fica disponível após o retorno.

**10 Digi-Cycles completos = 1 XP de convivência pendente.** O indicador volta a 0/10; os totais e o XP pendente continuam salvos. Repetir ações no mesmo dia não acelera o ganho. O ledger por data evita repetição acidental em reloads; não é um mecanismo seguro contra adulteração de dados locais.

## Treinar

Escolha **Poder, Coração, Inteligência ou Agilidade**. O painel mostra progresso, ciclos restantes e recompensa de cada atributo.

**3 Digi-Cycles completos no mesmo atributo → PREPARADO // atributo**, +1d6 em UM teste apropriado, um uso futuro. O progresso só é registrado quando o ciclo tiver cuidado e treino concluído. Só um PREPARADO pode existir; com ele ativo, novos treinos ficam bloqueados para impedir acumulação. Explorar continua disponível nos dias seguintes. Não há consumo ou aplicação oficial do benefício nesta etapa.

Requisitos: Energia ≥20 e Saciedade ≥15. Ao concluir: −15 Energia, −8 Saciedade; +3 Humor-base se Humor visível ≥50. Duração local: **2 minutos**; preset futuro: 15 minutos.

## Explorar

Zona mock extensível: **ÁREA DE DADOS // SETOR 01**. Requisitos: Energia ≥25, Saciedade ≥20. Recusas usam PET SPEECH. Na partida: −20 Energia e −10 Saciedade. Agumon fica ausente do habitat até voltar.

Duração local: **90 segundos**; preset futuro: 30 minutos. A atividade continua por timestamps mesmo com a aba fechada. Ao concluir, resolve uma única vez o D100 e a recompensa. O resultado é persistido antes da revelação. A interface mostra diretamente o prêmio, sem animação de dados, número natural, modificador ou cálculo; a rolagem continua interna ao domínio. Reloads não rerrolam ou duplicam itens. Resultados não vistos ficam pendentes até apresentação/fechamento.

### Disposição de saída

O snapshot é calculado antes dos custos e não muda durante a expedição:

| Condição | Modificador |
| --- | --- |
| Saciedade, Humor visível e Energia ≥70; Companhia ≥60; sem sujeira | +5 |
| Todos os quatro acima de 90 e sem sujeira | +5, Excelente Disposição |
| Qualquer necessidade abaixo de 35, ou sujeira | −5 |
| Demais condições | 0 |

Não acumula bônus. Resultado final = D100 + modificador, limitado a 1–100. A tabela abaixo mostra chances **base**, antes desse deslocamento. Resultado final 100 concede exatamente um Card Raro; um 100 natural com −5 termina em 95 e segue a faixa final. Com +5, a chance de nada cai de 10% para 5% e o final 100 ocupa seis faces naturais. Com −5, nada sobe a 15% e final 100 não é alcançado.

| D100 final | Chance base | Resultado |
| --- | --- | --- |
| 01–10 | 10% | Nada encontrado |
| 11–45 | 35% | 8–20 Créditos |
| 46–65 | 20% | 1 comida especial |
| 66–80 | 15% | 1 item de cuidado |
| 81–90 | 10% | Fragmento / material |
| 91–97 | 7% | 1 Card Comum |
| 98–99 | 2% | Evento raro |
| 100 | 1% | 1 Card Raro |

Cards somam **8%** na tabela base. Na categoria fragmento/material, 75% concedem um fragmento e 25% um Recurso de Dados. Eventos raros sorteiam: reserva digital (+40 CR), dados preservados (+2 fragmentos), caravana de dados (+2 Care Pack) ou sinal antigo (+3 Recursos de Dados). Um evento raro não é automaticamente um card.

**Nada encontrado** não concede itens nem créditos e não penaliza o pet; a atividade continua válida para completar o ciclo. A estrutura de caches antigos foi preservada para carregar resultados dos saves anteriores, mas não ocupa faixa na nova tabela.

## Comida e consumíveis

ALIMENTAR abre um balão junto ao botão, sem backdrop ou redimensionamento. Fecha por ×, Escape, clique fora, segundo clique no botão ou oferta de alimento. O menu mostra estoque, efeitos e preferências descobertas.

| Alimento | Preço | Efeito básico |
| --- | --- | --- |
| DIGIMEAT | grátis / infinito | +20 Saciedade |
| DIGIFISH | 8 CR | +25 Saciedade |
| DIGIAPPLE | 6 CR | +15 Saciedade, +3 Humor |
| DIGICARROT | 6 CR | +15 Saciedade |
| DIGIBANANA | 7 CR | +20 Saciedade, +5 Energia |
| DIGIPROTEIN | 12 CR | +10 Saciedade, +15 Energia |

Alimentos pagos precisam ser comprados primeiro. Estoque é gasto só quando a oferta é aceita; Saciedade ≥95 recusa comida sem gasto. DIGIMEAT não concede bônus emocional, mesmo favorito. Perfil mock Fogo/Vacina: gosta de Protein/Carrot; neutro Apple/Banana; não gosta de Fish. Especiais favoritos: +5 Humor/+3 Companhia; gostados: +2/+1; neutros sem bônus; não gostados alimentam sem ganhos emocionais.

Ícones já existentes de Digimon Story: Time Stranger são servidos localmente; URLs e origem em `assets/food/SOURCES.md`. Nenhum asset novo nesta etapa.

### Itens de cuidado

Agora podem ser comprados e usados **somente nas necessidades do pet local**, consumindo uma unidade. Não recuperam PV, Energia ou qualquer atributo da ficha do RPG. Uso bloqueado durante atividades; a compra continua disponível.

| Consumível | Preço | Efeito local |
| --- | --- | --- |
| RECOVERY DISK | 10 CR | +12 Humor-base, +5 Companhia |
| ENERGY PATCH | 12 CR | +20 Energia |
| CARE PACK | 8 CR | +10 Saciedade, +8 Humor-base |

Efeitos respeitam o limite de 100. Usar sem estoque não produz ganho. Se houver sujeira, ganhos de Humor-base ficam preservados, mas o Humor visível continua limitado até limpar. Compra e uso entram no histórico do sistema.

## Cards e Especiais

Cards comuns: Power Drive (Poder), Logic Boost (Inteligência), Attack Chip (Ataque), Heart Signal (Coração), Quick Step (Agilidade). Raros: Nova Strike (Ataque), Quantum Mind (Inteligência).

Cada exemplar registra **+1d6 em UM teste indicado, um uso futuro**, arte, descrição, raridade e origem. A imagem provisória enviada pelo usuário continua em `assets/card-placeholder.png`. Revelação de card tem apresentação própria, com destaque dourado para raro. Sem aplicação/consumo na ficha, scanner, equipamentos ou troca.

Em Especiais: **3 fragmentos → RESTAURAR CARD**, consumindo 3 para sortear um Card Comum. Recursos de Dados ficam guardados, sem crafting ou uso nesta etapa. PREPARADO é mostrado como benefício pronto para uma cena futura. Inventário não tem limite de capacidade.

## Necessidades, sujeira e falas

Quatro necessidades de 0–100: Saciedade, Humor, Energia, Companhia. Iniciais: 65, 70, 70, 65. Cores compartilhadas: **0–20 vermelho, 21–60 amarelo, 61–100 verde**, usando o valor mostrado.

Humor visível parte do Humor-base e aplica penalidades temporárias de fome, exaustão e solidão (−12 cada), com −5 por necessidade negativa depois da primeira. **Sujeira limita o Humor visível a no máximo 20**, sem apagar o Humor-base e sem elevar valores que já estavam abaixo de 20. Limpar pelo cocô remove o limite e restaura o valor correspondente às necessidades atuais; não adiciona um ganho arbitrário. O cocô permanece junto aos pés do parceiro, com moscas leves.

A digestão pode gerar sujeira 2 minutos após comer. Ao aparecer, dispara uma única fala prioritária: “Ops, acho que fiz sujeira.”. Some após 4,5s, não repete só porque segue sujo, e limpar a remove imediatamente se ainda estiver visível. Outras reações continuam breves. A interface não inicia monólogos automáticos de necessidade.

Mensagens de sistema são toasts de 3,2s, histórico e painel Digi-Cycle. Falas em primeira pessoa pertencem ao balão do pet. Esses canais são separados. O fluxo de fechamento dos painéis também protege a revelação contra eventos nativos atrasados, inclusive ao completar atividades rapidamente no debug.

Desgaste: Saciedade −2/h, Energia acordado −1,5/h, Companhia −2/h após 12h sem interação. Catch-up limita desgaste a 24h e perda de Companhia a 35; pisos 15 Saciedade/Energia e 20 Companhia, sem subir valores que já estejam menores. Sem doença, morte, XP perdido ou dívida de ausência.

Brincar: 1 min local/10 min futuro; ao concluir +15 Humor-base, +8 Companhia, −10 Energia, −5 Saciedade. Conversar: +10 Companhia/+4 Humor-base, ganhos uma vez por minuto. Descansar: 3 min local/30 min futuro, +60 Energia proporcional ao tempo; queda natural de Saciedade continua. Acordar cedo mantém apenas o recuperado.

## Persistência e futura integração

Save atual: `localStorage`, chave **digimon-bonds:digi-pet:prototype:v5**. Migra v4 e anteriores, preservando necessidades, ciclos, XP pendente, treino, PREPARADO, créditos, estoque, cards e resultados antigos. Abas antigas em v4 não sobrescrevem o save novo. Saves anteriores não são apagados; inválidos ficam em backup local.

Cuidados mantêm schema v3; o subobjeto de downtime usa schema v1. O número da chave de armazenamento é independente dessas versões. Resetar protótipo no rodapé e confirmar cria um save novo, zerando todo o progresso local; não altera outros módulos.

**NÃO CONFIAR EM LOCALSTORAGE** para XP, Créditos, Cards, itens, Digi-Cycles, PREPARADO ou D100. Tudo é editável pelo usuário. Integração futura precisa mover relógio, validação, RNG, concessão e consumo para transações de backend seguro; trocar apenas a persistência não basta. Nenhum backend foi implementado.

Arquivos centrais:

- `pet-config.js`: necessidades, tempos, falas, preferências e limite de Humor sujo.
- `downtime-config.js`: preços/consumíveis, tabela D100, cards, regiões, ciclos/treino e save.
- `pet-engine.js`: cuidado, passagem de tempo e conclusão por timestamps.
- `pet-downtime.js`: regras de ciclos, recompensas, compras e uso local de itens; sem DOM.
- `exploration-rng.js`: RNG local substituível, crypto.getRandomValues com rejection sampling.
- `pet-storage.js`: porta de persistência local substituível.
- `digi-pet.js`: cuidados e visor; `downtime-ui.js`: painéis, coleção, revelação e debug.
- `gameplay-clarity.css`: hierarquia dos controles e novos painéis; demais CSS preservam o aparelho.
- `pet-sprites.js`, `pet-motion.js`, `pet-speech.js`: apresentação independente.

## Debug e testes

**Ctrl+Shift+D** abre ferramentas escondidas da experiência normal: completar ciclo, próximo dia, concluir atividade/treino/exploração, forçar próximo D100, forçar card comum/raro, adicionar créditos/fragmentos, estados em 100, sujeira e simulação de tempo. Próximo dia usa deslocamento local persistido, marcado como TESTE/DIA SIMULADO, sem alterar relógio do computador. Resetar remove o deslocamento.

```powershell
node --test --test-isolation=none pet-engine.test.cjs
node --test --test-isolation=none pet-downtime.test.cjs
node --test --test-isolation=none pet-presentation.test.cjs
```

26 testes de cuidado, 28 de downtime e 17 de apresentação/DOM: **71 testes**. Cobrem intervalos/ausência, dia e meia-noite, uso único de recompensas, necessidade de cuidado para treino, compras/estoque/uso de consumíveis, nada encontrado, materiais/eventos raros, migração, limite de Humor e restauração, sprites, falas e fechamento atrasado de painéis.

Validação adicional no Edge desktop e mobile: quatro cuidados básicos, duas atividades especiais, painel de ciclo, três treinos em dias distintos → PREPARADO, exploração → card e nada encontrado, dez ciclos → XP pendente, quatro categorias de inventário, compra/uso de consumível, reload, limpeza e ausência de overflow horizontal/erros JavaScript. Capturas atuais: `outputs/digi-pet-gameplay13-*.png`.

Nenhum build de publicação, deploy, push, merge, workflow, GitHub Pages ou módulo existente do Bonds foi alterado.

## Encaixe na janela — etapa 14

O aparelho agora tem escala padrão de 90% e reduz proporcionalmente conforme a altura disponível. A largura natural de até 480px é preservada no cálculo; o visor e controles diminuem juntos. Painéis de inventário e Digi-Cycle mantêm tamanho legível e rolagem interna quando necessário. O ajuste roda ao abrir, carregar fontes, redimensionar e alternar tela cheia, sem esconder conteúdo com overflow.

Validado sem rolagem da página em 1440×900, 1366×768, 1280×720, 360×800 e 390×660, mantendo o inventário clicável. Arquivo: device-fit.js. Prévia: http://127.0.0.1:4231/?fit=14. Nada publicado.


## Prêmios visuais — etapa 15

Prévia: http://127.0.0.1:4231/?rewards=15. A exploração pode terminar com a aba aberta, oculta ou fechada; ao voltar, o prêmio pendente aparece diretamente. Comidas exibem o próprio ícone, quantidade e efeito por porção; créditos, cuidados e recursos têm emblemas próprios. Cards mostram a nova imagem enviada, preservada sem edição no arquivo card-placeholder.png. Fragmentos usam a mesma arte com recorte CSS de metade da carta e borda serrilhada, também na categoria Especiais do inventário. Nenhuma recompensa é concedida pela tela: ela já está salva antes de aparecer. Os botões permitem voltar ao parceiro ou abrir a categoria correspondente no inventário.

A tabela e o RNG permanecem internos, sem novos sorteios ao recarregar. Resultados antigos mantêm seu prêmio registrado, mesmo que o número original pertença hoje a outra faixa da tabela. Validado no Edge: exemplo legado +1 DIGICARROT com imagem correta, card/fragmento, fechamento da aba antes da conclusão, retorno, recarga sem duplicação, conclusão com aba aberta, inventário e mobile. Testes de apresentação atualizados; nada publicado.
