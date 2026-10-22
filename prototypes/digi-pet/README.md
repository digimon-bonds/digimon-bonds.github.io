# Digi-Pet — protótipo funcional local

## Abrir

Com Node.js 22 ou superior, execute nesta pasta:

```powershell
node serve.mjs
```

Abra http://127.0.0.1:4231. Ctrl+C encerra o servidor. Na raiz da branch do projeto: `node prototypes/digi-pet/serve.mjs`.

O HTML também pode ser aberto diretamente para uma prévia offline; para persistência previsível, use sempre o mesmo endereço local e navegador. O armazenamento de `file://` depende do navegador e é separado do endereço HTTP.

## Visual preservado

O visor, a carcaça, o quarto e o jardim permanecem. O seletor Interior / Exterior também é salvo. Agumon continua sendo o PNG de exemplo. Respiração, movimento, sombra animada, partículas e reação corporal foram desativados/removidos: a imagem permanece estática, inclusive dormindo. O sono é indicado por texto e iluminação suave, sem novos assets do personagem.

## Quatro estados (0 a 100)

| Estado | Inicial | Comportamento |
| --- | ---: | --- |
| Saciedade | 65 | Sobe ao comer; diminui com tempo e treino. |
| Humor | 60 | Sobe ao brincar e conversar. Não cai pela ausência. |
| Energia | 70 | Gasta em brincadeiras/treino; recupera acordado ou dormindo. |
| Vínculo | 10 | Sobe ao conversar e nunca diminui com o tempo. É exclusivo deste protótipo. |

Os indicadores são números discretos, sem barras. Condições derivadas, em ordem de prioridade: Dormindo; Com fome (Saciedade ≤30); Cansado (Energia ≤25); Feliz (Humor ≥75); Tranquilo. Condições não são atributos adicionais nem modificam recursos oficiais.

## Ações e regras

| Ação | Efeito | Limite |
| --- | --- | --- |
| Comida | +20 Saciedade | Não alimenta se já estiver em 100. |
| Brincar | +15 Humor, −12 Energia | Exige Energia ≥12. |
| Treinar | −20 Energia, −8 Saciedade | Exige Energia ≥20 e Saciedade ≥10. |
| Conversar | +5 Vínculo, +4 Humor | Disponível acordado. |
| Dormir | Liga descanso: +8 Energia, −1 Saciedade por minuto | Sem ganho instantâneo; acorda automaticamente em 100 Energia. |
| Acordar | Encerra o sono | Sem alteração instantânea de estados. |
| Limpar | Remove um cocô | Sem bônus ou punições de estados. |

As quatro ações principais têm intervalo de 5 segundos para repetir a mesma ação. Outras ações continuam disponíveis. Durante o sono, é necessário acordar antes de usar as quatro ações; limpar e trocar ambiente continuam possíveis. Valores ficam entre 0 e 100. Uma ação recusada explica o motivo sem registrar sucesso nem gastar estados.

Cada sucesso registra ação e horário; o histórico mantém as últimas 12 entradas e contadores acumulados. Treinos são registrados nesse histórico/contador, sem criar outro atributo, XP, PL, evolução ou bônus de combate. Mensagens são placeholders de Agumon; os dados de apresentação continuam no `mockPartner`.

## Passagem do tempo e ausência gentil

- Um passo a cada 60 segundos: acordado, −2 Saciedade e +1 Energia; dormindo, −1 Saciedade e +8 Energia.
- A interface verifica o relógio a cada segundo e ao voltar à aba. Minutos incompletos são preservados; não há contagem duplicada ao recarregar.
- Iniciar ou encerrar sono começa um novo minuto de descanso/atividade, sem aproveitar uma fração de minuto anterior para ganhar energia instantânea.
- Após uma ausência, calcula no máximo 30 minutos; o excesso é descartado e não vira dívida nas próximas visitas.
- A perda passiva de Saciedade para em 20. Se um treino já tiver levado abaixo disso, o relógio não diminui mais nem oferece recuperação artificial.
- Humor e Vínculo não caem com o tempo. Sem doença, morte, perda de XP ou punição por ausência.

## Digestão e limpeza

Uma refeição agenda digestão para 2 minutos depois, se não houver cocô ou digestão pendente. Novas refeições não empilham sujeira nem adiam a digestão em curso. No máximo um cocô aparece no cenário, compartilhado entre Interior e Exterior. Limpar o remove. A sujeira não reduz estados, não causa doença e não gera penalidades; é uma necessidade simples de cuidado, sem um quinto atributo.

## Salvar e resetar

`localStorage`, chave exclusiva:

```text
digimon-bonds:digi-pet:prototype:v1
```

Guarda os quatro estados, sono, habitat, digestão, sujeira, horários, contadores e histórico. Não armazena ficha real nem dados de outros módulos. Salva após ações e atualizações de tempo; outra aba acompanha o estado salvo mais recente. Valores inválidos são normalizados; JSON inválido inicia um pet novo. Se o navegador bloquear o armazenamento, o jogo continua em memória e o rodapé indica sessão temporária.

No rodapé, **Resetar protótipo → Resetar dados** restaura apenas esta chave, inclusive histórico, sono, sujeira, relógio e ambiente. Há opção Cancelar. Nenhuma outra chave do Bonds é removida.

Para testar sem esperar: **Histórico / teste → Simular +5 minutos**. Avança somente o relógio do pet, aplica as mesmas regras de tempo/digestão e registra a simulação; não altera o relógio do computador.

## Arquivos desta etapa

Alterados: `index.html`, `digi-pet.css`, `digi-pet.js`, `README.md`.

Criados: `pet-engine.js` (configuração e funções puras de estado/tempo/ações/validação) e `pet-engine.test.cjs` (testes determinísticos).

Preservados: `assets/room.svg`, `assets/garden.svg`, `assets/agumon.png`, `serve.mjs`.

`mockPartner` continua sendo só apresentação temporária. `pet-engine.js` guarda exclusivamente o estado deste experimento, independente das regras do RPG. Nenhum contrato de ficha real foi criado.

## Verificação

Execute `node pet-engine.test.cjs`: 10 testes de efeitos, cooldown, limites, tempo fracionado, ausência longa, sono, digestão/limpeza, restauração, simulação e condições.

Conferência no Edge: ações, recarga e nova aba, histórico, cancelamento/confirmação de reset, simulação de tempo, sono, limpeza, ausência de 10 dias, sincronização entre abas e armazenamento inválido/bloqueado. Layout sem scroll em 1440×900, 1366×768, 1024×650, 390×844 e 360×740. Sem animação do personagem, erros JavaScript ou requisições externas. Telas menores podem rolar para preservar controles.

## Referência e limites

O ciclo de alimentação, diversão, sono e limpeza foi inspirado no manual oficial Tamagotchi Connection da Bandai: https://www.bandai.com/amfile/file/download/file/242/product/1297925/ . Os valores e proteções deste protótipo são escolhas próprias para validação, não regras da Bandai.

Sem backend, ficha real, autenticação, IA, Forumeiros, XP, PL ou Laço oficial. Somente arquivos em `prototypes/digi-pet`, fora do build de publicação. Nenhuma publicação, deploy, push, merge, mudança em GitHub Pages ou workflow.
