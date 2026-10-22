# Digi-Pet — loop de cuidado local

## Acesso

Execute `node serve.mjs` nesta pasta (Node.js 22+) e abra http://127.0.0.1:4231. Na raiz da branch: `node prototypes/digi-pet/serve.mjs`. Ctrl+C encerra o servidor. O HTML também abre diretamente, mas o endereço HTTP é recomendado para persistência consistente.

## Visor e cards

O aparelho tem largura máxima de **480px** no desktop e se adapta ao mobile. Fica centralizado horizontal e verticalmente sobre o fundo escuro. Cabeçalho, necessidades, visor, controles, salvamento e reset fazem parte da mesma carcaça. O visor usa altura própria, sem crescer para ocupar a janela. Diálogos continuam sobrepostos; telas muito baixas podem rolar para preservar a usabilidade.

A carcaça agora usa somente Street Link. A faixa superior com textos e seletor de skin foi removida, deixando a estampa exposta. Saves com outra skin são normalizados para Street Link sem perder o progresso. Textura é apenas da carcaça; visor, controles, cards e menus têm fundo próprio opaco. Descansar não escurece a tela inteira. Ações indisponíveis ficam escurecidas e realmente desabilitadas.

Quatro cards separados, com ícones vetoriais originais: carne (Saciedade), rosto (Humor), raio (Energia) e coração (Companhia). Barras mantêm escala 0–100, valores e semântica de medidor acessível. O card de Humor fica vermelho enquanto houver sujeira.

Interior e Exterior compartilham as mesmas dimensões do parceiro. Seu Parceiro e controles mantêm bordas físicas semelhantes ao visor; Descansar/Acordar é maior e dourado. A limpeza ocorre pelo próprio cocô. Agumon alterna NORMAL/BLINK e respira de forma sutil durante idle. O visor emite um halo cyan discreto. A base dos controles usa uma textura CSS de borracha com círculos em relevo, inspirada em tapete arcade. Não há frases fixas, legenda promocional, histórico ou indicação da última ação nessa área: somente botões.

## Respiração e toque

`pet-motion.js` aplica respiração em um wrapper, sem interferir na troca de sprites: deslocamento máximo de 1px e escala de 1,006/1,012. Cada ciclo concluído sorteia nova duração entre **2,4 e 3,4 segundos**; não muda a duração no meio do movimento. Pausa durante atividades, diálogos, aba oculta e preferência de movimento reduzido. Navegadores sem Web Animations mantêm a imagem estática, sem erro.

Clicar/tocar no parceiro ou focá-lo e usar Enter/Espaço aciona `blinkOnce()` da camada já existente de sprites. Uma inclinação de até 1 grau, por 320ms, acompanha a reação. Cliques repetidos têm intervalo mínimo de 800ms, sem sobrepor animações. O toque não concede atributos nem muda necessidades, histórico ou save.

A fala de cócegas é opcional: chance de 20% por toque aceito, no máximo uma tentativa de fala aceita a cada 30 segundos, ainda respeitando o fluxo de falas curtas. Exemplos mock: “Isso faz cócegas!” e “Hehe!”. Reações e respiração não executam durante atividades críticas/descanso. A preferência de movimento reduzido também impede a reação visual.

## Sprites NORMAL e BLINK

`pet-sprites.js` é uma camada de apresentação independente do jogo. O perfil visual atual usa:

```js
sprites: {
  normal: 'assets/agumon-normal.png',
  blink: 'assets/agumon-blink.png'
}
```

NORMAL é uma cópia intacta do PNG atual; BLINK é a imagem enviada pelo usuário, sem edição. Ambas possuem o mesmo tamanho de canvas. Os dois arquivos são pré-carregados/decodificados antes de iniciar as trocas, e a dimensão do elemento de imagem não muda.

Intervalos aleatórios entre inícios de piscada: 3–8 segundos. Duração aleatória da piscada: 120–180 ms. Retorna automaticamente a NORMAL. Se BLINK estiver ausente ou falhar, permanece NORMAL sem tentativas contínuas nem imagem quebrada na tela. O estado do jogo e o localStorage não armazenam a piscada.

Durante atividades (inclusive descanso), diálogos, aba oculta ou preferência de movimento reduzido, as piscadas são suspensas e a imagem volta para NORMAL. Ao retomar, começa um novo intervalo completo, sem acumular piscadas. `destroy()` cancela timers e listeners. O mapa de variantes permite acrescentar nomes no futuro, mas não foram implementados happy, sad, tired ou sleeping.

## Dois canais de texto

- **PET SPEECH**: exclusivamente o balão de Agumon. Biblioteca temporária em `PET_SPEECH`, por contexto, independente da espécie. Frases curtas de fome, sono, solidão, tristeza, sujeira, comida e atividades.
- **SYSTEM FEEDBACK**: notificações discretas e temporárias, fora da área dos botões. Conclusões, recusas e avisos de migração desaparecem após 3,2 segundos. O início da atividade e sua contagem não são repetidos em frases; o relógio do visor basta.

A UI implementa `showPetSpeech` e `showSystemFeedback` separadamente. `pet-speech.js` controla o ciclo do balão: aparece por 4,5 segundos e é escondido de verdade, com o texto limpo. Não há fila de falas antigas, repetição automática de frases casuais/felizes ou balão permanente durante atividades. Reações a ações são breves, com intervalo mínimo de 2 segundos entre elas.

Lembretes de necessidade mantêm a prioridade do estado (sujeira, fome, cansaço, tristeza, solidão), mas há pelo menos 60 segundos de silêncio desde a última fala e 3 minutos antes de repetir o mesmo contexto. Resolver a causa remove uma reclamação automática ainda visível. A saudação aparece uma vez por abertura e desaparece. Os tempos ficam em `PET_CONFIG.speech`; aba oculta limpa o balão.

## Configuração central

`pet-config.js` concentra:

- `PET_CONFIG`: estado inicial, thresholds, recusa de comida, modo de teste, conversa e persistência.
- `FOOD_CONFIG`: seis comidas, efeitos e categorias.
- `ACTIVITY_CONFIG`: durações de teste/futuras, requisitos e efeitos de conclusão.
- `NEED_DECAY_CONFIG`: desgaste, graça de ausência, pisos e digestão.
- `MOOD_CONFIG`: causas temporárias de desconforto.
- `PARTNER_PROFILE`, `PREFERENCE_CONFIG`, `PET_SPEECH`: perfil e personalidade mock, separados do rótulo de espécie.

## Quatro necessidades e Humor composto

Iniciais: Saciedade 65, Energia 70, Companhia 65 e Humor-base 70.

O save guarda três necessidades em `stats` e `baseMood` separado. `engine.mood(state)` deriva a quarta necessidade visível:

```text
visibleMood = clamp(baseMood − soma dos modificadores, 0, 100)
```

| Modificador temporário | Condição | Penalidade |
| --- | --- | ---: |
| Sujeira | Existe um cocô | 20 |
| Fome | Saciedade ≤25 | 12 |
| Exaustão | Energia ≤25 | 12 |
| Solidão | Companhia ≤30 | 12 |
| Acúmulo | Duas ou três necessidades ruins entre fome/exaustão/solidão | +5 por necessidade além da primeira |

Corrigir a necessidade remove sua penalidade naturalmente. O tempo e a sujeira não destroem `baseMood`. Brincar, alimentos e conversa podem melhorar esse valor-base.

Exemplo obrigatório: baseMood 85, necessidades boas, sujeira → Humor visível 65; limpar → Humor 85, sem bônus adicional.

Estados gerais: Brincando/Treinando/Dormindo enquanto ocupado; Triste (Humor ≤35 ou três necessidades ruins); Com fome; Cansado; Solitário; Incomodado; Animado (Humor ≥85 e Energia ≥75); Feliz (Humor ≥75); Tranquilo. Todos os thresholds estão centralizados.

## Comida e descoberta

COMIDA abre um seletor; clicar no botão principal não alimenta automaticamente. Ícones são vetores originais locais, sem assets dos jogos.

| Alimento | Efeito básico |
| --- | --- |
| DIGIMEAT | +25 Saciedade |
| DIGIFISH | +25 Saciedade |
| DIGIAPPLE | +15 Saciedade, +3 Humor-base |
| DIGICARROT | +15 Saciedade |
| DIGIBANANA | +20 Saciedade, +5 Energia |
| DIGIPROTEIN | +10 Saciedade, +15 Energia |

Perfil mock individual: Fogo / Vacina, independente do nome Agumon. Apenas esse perfil foi definido nesta etapa:

- Favorito: DIGIMEAT. Bônus +5 Humor-base e +3 Companhia.
- Gostou: DIGIPROTEIN e DIGICARROT. Bônus +2 Humor-base e +1 Companhia.
- Neutro: DIGIAPPLE e DIGIBANANA. Apenas efeitos básicos.
- Não gosta: DIGIFISH. Alimenta, sem bônus emocional.

A primeira oferta aceita descobre a preferência pela fala e grava `discoveredFoods`; ofertas seguintes mostram o resultado discretamente no menu. Não há IA ou regra universal de espécie. Preferências são dados de teste para o perfil Elemento/Atributo, não regras oficiais de Digimon.

Em Saciedade ≥95, recusa com fala “Não cabe mais nada.” e feedback mecânico separado. Não aplica benefícios, descoberta ou consumo. Sem peso, obesidade ou doença. Efeitos são limitados a 0–100.

## Atividades com tempo real

O modo atual é **test**. Durações futuras são apenas configuração, sem publicação.

| Atividade | Teste | Preset futuro |
| --- | --- | --- |
| Brincar | 1 minuto | 10 minutos |
| Treinar | 2 minutos | 15 minutos |
| Descansar | 3 minutos | 30 minutos |

`activity = {kind, startedAt, endsAt}` é persistido. Timestamps são a fonte da verdade; o intervalo de 1 segundo só atualiza a tela. Ao reabrir, `advance` resolve o tempo transcorrido e a conclusão uma única vez.

- **Brincar**: ao concluir, +15 Humor-base, +8 Companhia, −10 Energia, −5 Saciedade. Exige inicialmente Energia ≥12 e Saciedade ≥10.
- **Treinar**: ao concluir, −15 Energia, −8 Saciedade; +3 Humor-base se o Humor visível na conclusão era ≥50. Incrementa `activityStats.trainingSessions`, sem XP, PL ou bônus do RPG. Exige inicialmente Energia ≥20 e Saciedade ≥15.
- **Descansar**: recupera até +60 Energia proporcionalmente ao tempo previsto, limitado a 100. Pode acordar antes, mantendo apenas a fração já recuperada. Sem punição por acordar.
- **Conversar**: imediato, +10 Companhia e +4 Humor-base. Novos ganhos apenas após 60 segundos da última conversa recompensada. Repetições ainda registram a conversa e podem receber fala, sem ganho mecânico.

Enquanto há uma atividade, ações principais incompatíveis e troca de ambiente ficam desabilitadas e escurecidas. A limpeza pelo cocô continua disponível; Acordar fica disponível durante descanso. O relógio maior aparece dentro do visor, como sobreposição, sem ocupar espaço no layout ou alterar o tamanho da cena. O mesmo relógio atende brincar, treinar e descansar. Inícios/conclusões são distintos no histórico. Histórico/Teste continua acessível para desenvolvimento.

## Tempo e ausência leve

- Saciedade: −2 por hora.
- Energia: −1,5 por hora acordado; durante descanso, aplica a recuperação proporcional.
- Companhia: sem perda nas primeiras 12 horas após interação válida. Depois, −2 por hora elegível. Descanso pausa a perda enquanto está ocorrendo.
- Um retorno muito longo processa no máximo 24 horas de desgaste de Saciedade/Energia e no máximo 35 pontos de perda de Companhia. O restante é descartado, sem dívida futura.
- Pisos de desgaste: Saciedade 15, Energia 15, Companhia 20. Valores que uma ação já levou abaixo do piso não são reduzidos novamente pelo relógio nem recebem aumento artificial.
- Ausência pode causar solidão e tristeza temporárias, sem perda oficial de atributos, evolução, XP ou Laço. Sem doença ou morte.

Estado interno usa valores fracionários para não depender da frequência de atualização; cards exibem valores arredondados. Conclusões de atividades usam seus próprios timestamps mesmo ao processar uma ausência longa.

## Sujeira

Refeição aceita agenda digestão para 2 minutos depois, se não houver sujeira/digestão pendente. No máximo uma necessidade de limpeza. Novas refeições não adiam a digestão nem empilham cocôs.

Sujeira aplica apenas `dirtyMoodPenalty=20`; não causa perda contínua de Humor-base. Clique no cocô para limpar (ou foque nele e use Enter). A ação remove a sujeira e exatamente sua penalidade; não concede +X de Humor ou Companhia. Cliques repetidos sem sujeira não geram benefícios. Barra de Humor deixa de ficar vermelha imediatamente.

## Persistência, migração e reset

Chave atual: `digimon-bonds:digi-pet:prototype:v3` em `localStorage`.

Guarda necessidades, baseMood, atividade, relógios, preferência descoberta, contador de treinos, histórico, ambiente e skin. Lê saves v2/v1 se ainda não houver v3 e mantém as chaves antigas intactas. Vínculo antigo vira Companhia. Como saves antigos só tinham Humor exibido, a migração reconstrói baseMood pelas causas temporárias presentes, até o limite de 100, preservando a leitura anterior quando possível. Descanso antigo sem timestamps inicia uma nova sessão cronometrada, sem energia retroativa instantânea.

JSON inválido ou formato incompatível é preservado numa chave `...:v3:backup:<timestamp>` antes de iniciar um novo pet; a interface avisa. Se o navegador bloquear armazenamento, funciona em memória com aviso no rodapé. Abas desta versão acompanham o save mais recente.

**Resetar protótipo → Resetar dados** restaura apenas o save v3 (incluindo descobertas, atividade e histórico); não remove saves anteriores ou outros dados do Bonds. Cancelar não altera dados.

## Histórico / teste

O botão Histórico/Teste foi removido. Para desenvolvimento local, o diálogo ainda pode ser aberto pelo atalho **Ctrl+Shift+D**: +5 minutos, +1 hora, +12 horas, +24 horas, forçar sujeira, reduzir necessidades e concluir atividade. Nada disso aparece na área principal de controles. A simulação afeta somente o relógio do pet. O histórico continua salvo internamente.

## Arquivos desta etapa

Alterados nesta iteração: `index.html`, `digi-pet.js`, `pet-config.js`, `pet-sprites.js`, `pet-presentation.test.cjs` e `README.md`.

Criados: `compact-device.css` e `pet-motion.js`. A limpeza visual anterior, as duas sprites e os módulos de fala continuam preservados.

Preservados: lógica de cuidados, schema do save v3, arte urbana, sala, jardim e servidor local. O projeto continua isolado em `prototypes/digi-pet`.

## Verificação

`node pet-engine.test.cjs`: 24 testes de tempo offline, conclusão única, descanso parcial, comidas/recusa/preferência, Companhia após graça, Humor composto, limpeza exata, migração/persistência, conversa, debug e canais de fala.

`node pet-presentation.test.cjs`: 16 testes com relógio, DOM e animações simulados. Cobrem piscadas/fallback, pausa/retomada, descarte, dimensões dos PNGs, expiração das falas, silêncio, inicialização contra o HTML atual, durações variáveis de respiração, reação de toque de 320ms e blink manual sem sobreposição. A integração simulada também confere que tocar não grava alterações no save e é bloqueado durante atividade.

Total desta iteração: 40 testes passando e sintaxe JavaScript conferida. A validação visual real no navegador desta iteração está pendente pelo bloqueio anterior da execução do Edge pelo revisor automático de aprovação por limite de uso. Isso não foi uma avaliação de risco. Nenhuma captura da etapa anterior deve ser tratada como prévia atualizada desta iteração.

## Limites

Somente protótipo local. Nada publicado, enviado ao GitHub ou mesclado. Sem deploy, backend, IA, ficha real, XP, Laço oficial, Battle Link, Forumeiros ou alterações em módulos/workflows de publicação. Nenhuma skin nova nesta etapa.
