# Digi-Pet — loop de cuidado local

## Acesso

Execute `node serve.mjs` nesta pasta (Node.js 22+) e abra http://127.0.0.1:4231. Na raiz da branch: `node prototypes/digi-pet/serve.mjs`. Ctrl+C encerra o servidor. O HTML também abre diretamente, mas o endereço HTTP é recomendado para persistência consistente.

## Visor e cards

As skins Bonds e Street Link foram preservadas, sem criar novas skins. Textura é apenas da carcaça. Visor, controles, cards e menus têm fundo próprio opaco, sem herdar filtro/opacidade da skin. Descansar não escurece a tela inteira. Ações indisponíveis usam contraste/borda próprios, sem transparência.

Quatro cards separados, com ícones vetoriais originais: carne (Saciedade), rosto (Humor), raio (Energia) e coração (Companhia). Barras mantêm escala 0–100, valores e semântica de medidor acessível. O card de Humor fica vermelho enquanto houver sujeira.

Interior, Exterior e Agumon estático permanecem. Sem expressões ou animações novas do personagem. As moscas simples já existentes continuam e respeitam movimento reduzido.

## Dois canais de texto

- **PET SPEECH**: exclusivamente o balão de Agumon. Biblioteca temporária em `PET_SPEECH`, por contexto, independente da espécie. Frases curtas de fome, sono, solidão, tristeza, sujeira, comida e atividades.
- **SYSTEM FEEDBACK**: exclusivamente a área inferior. Início/fim de ações, recusa mecânica, intervalo de conversa, migração e instruções de cuidado.

A UI implementa `showPetSpeech` e `showSystemFeedback` separadamente. Nunca coloca avisos de sistema no balão. Uma fala fica normalmente pelo menos 8 segundos, com fila curta para reações. Necessidades urgentes podem interromper mensagens menos importantes. Prioridade contextual: sujeira, fome, cansaço, tristeza, solidão, atividade, casual. Reações diretas ao cuidado têm prioridade sobre fala casual; não há várias falas simultâneas.

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

Enquanto há uma atividade, outras ações principais ficam incompatíveis; limpeza e troca de ambiente continuam disponíveis. O botão Acordar fica disponível durante descanso. A faixa de atividade mostra estado e tempo restante. Inícios/conclusões são distintos no histórico.

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

Sujeira aplica apenas `dirtyMoodPenalty=20`; não causa perda contínua de Humor-base. Clique no cocô ou use Limpar. A ação remove a sujeira e exatamente sua penalidade; não concede +X de Humor ou Companhia. Cliques repetidos sem sujeira não geram benefícios. Barra de Humor deixa de ficar vermelha imediatamente.

## Persistência, migração e reset

Chave atual: `digimon-bonds:digi-pet:prototype:v3` em `localStorage`.

Guarda necessidades, baseMood, atividade, relógios, preferência descoberta, contador de treinos, histórico, ambiente e skin. Lê saves v2/v1 se ainda não houver v3 e mantém as chaves antigas intactas. Vínculo antigo vira Companhia. Como saves antigos só tinham Humor exibido, a migração reconstrói baseMood pelas causas temporárias presentes, até o limite de 100, preservando a leitura anterior quando possível. Descanso antigo sem timestamps inicia uma nova sessão cronometrada, sem energia retroativa instantânea.

JSON inválido ou formato incompatível é preservado numa chave `...:v3:backup:<timestamp>` antes de iniciar um novo pet; a interface avisa. Se o navegador bloquear armazenamento, funciona em memória com aviso no rodapé. Abas desta versão acompanham o save mais recente.

**Resetar protótipo → Resetar dados** restaura apenas o save v3 (incluindo descobertas, atividade e histórico); não remove saves anteriores ou outros dados do Bonds. Cancelar não altera dados.

## Histórico / teste

Todas as ferramentas de teste ficam no diálogo: +5 minutos, +1 hora, +12 horas, +24 horas, forçar sujeira, reduzir cada necessidade e concluir atividade. A simulação avança só o relógio deste pet e depois ajusta os timestamps, sem mudar o relógio do computador. São ferramentas explícitas de desenvolvimento, não recompensas do jogo.

## Arquivos desta etapa

Alterados: `index.html`, `digi-pet.js`, `pet-engine.js`, `pet-engine.test.cjs`, `README.md`.

Criados: `pet-config.js` e `care-interface.css`.

Preservados: skins e `device-skins.css`, CSS base, arte urbana, sala, jardim, PNG de Agumon e servidor local. O projeto continua isolado em `prototypes/digi-pet`.

## Verificação

`node pet-engine.test.cjs`: 24 testes de tempo offline, conclusão única, descanso parcial, comidas/recusa/preferência, Companhia após graça, Humor composto, limpeza exata, migração/persistência, conversa, debug e canais de fala.

No Edge: ambas as skins em 1440×900, 1366×768, 1024×650, 390×844 e 360×740, sem scroll e com controles visíveis; também conferido com atividade em andamento. Opacidade dos controles/visor =1, filtro do visor=none, personagem sem animação. Menu com seis comidas, descoberta/recusa, conclusão offline, descanso parcial, vermelho por sujeira, limpeza, cooldown, save legado e backup inválido conferidos. Sem erros JavaScript ou requisições externas. Telas menores podem rolar para preservar usabilidade.

## Limites

Somente protótipo local. Nada publicado, enviado ao GitHub ou mesclado. Sem deploy, backend, IA, ficha real, XP, Laço oficial, Battle Link, Forumeiros ou alterações em módulos/workflows de publicação. Nenhuma skin nova nesta etapa.
