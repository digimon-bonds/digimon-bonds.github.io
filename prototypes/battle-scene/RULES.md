# Regras auditadas — 7 de outubro de 2026

Os textos colados são requisitos de experiência. Os tópicos do fórum prevalecem para as mecânicas.

## Fontes

- [01. Mecânicas Básicas](https://digimonbonds.forumeiros.com/t4-01-mecanicas-basicas): d6, sucessos, cancelamento de Vantagem/Desvantagem, Forçar Teste e Esforço.
- [02. Personagens Humanos](https://digimonbonds.forumeiros.com/t19-02-personagens-humanos): Características, Talentos e Energia.
- [03. Digimon](https://digimonbonds.forumeiros.com/t6-03-digimon): marcadores, Assinaturas, efeitos, Elementos, Atributos Digitais, evolução.
- [04. Laços](https://digimonbonds.forumeiros.com/t8-04-lacos): gastos, perdas, ações adicionais e sobrevivência.
- [05. Combate](https://digimonbonds.forumeiros.com/t18-05-combate): ações independentes, ataque oposto, Defesa e Condições.

## Divergências e complementos relevantes

**Campeão custa 1 Energia ao final da rodada, 0 PL.** A tabela publicada confirma essa cobrança. A transformação não tem custo inicial. Perfeito custa 2 Energia / 1 PL; Mega 3 / 2. Nenhum custo é cobrado ao finalizar apenas o turno da dupla: a cobrança ocorre automaticamente ao encerrar a rodada completa, usando as escolhas de manutenção configuradas.

Esquiva é reação. A base é Agilidade + bônus de estágio; Qualidades relevantes são acrescentadas uma vez. O exemplo do fórum evita interpretar a palavra Esquiva como um valor já bonificado e somar o estágio novamente. Defender usa uma ação e altera as Esquivas até a próxima oportunidade.

Além de dano base + diferença, o motor inclui a vantagem de Atributo Digital (Vacina > Vírus > Data > Vacina), e o efeito Pesado. Os efeitos opcionais substituem/reduzem dano somente quando ativados. Efeitos com limite por alvo são registrados por técnica e forma.

Trocar forma conserva os PV perdidos. Devolver não reduz abaixo de 1 apenas pela troca. A manutenção pode ser recusada; falta de recursos devolve sem pagamento parcial. Reduzir a Energia a 0 por manutenção exige a opção extrema explícita. Usos são separados por forma, compartilhados pelas técnicas da forma, e não reiniciam ao transformar.

Forçar Teste repete somente a rolagem falha, com o mesmo grupo/modificador, uma vez. A perda de 2 PL pode produzir valor negativo, conforme a atualização e confirmação do autor em 07/10/2026; não cobra outra Assinatura nem outro bônus de PL. NPC sem parceria não recebe PL inventados. Multi-Attack é limitado por personagem/turno; não libera indefinidamente a dupla.

Ataques humanos usam Corpo + um Talento relevante + PL opcionais e Esforço opcional. Dano base 1; o alvo Digimon reage com Esquiva. A ação humana é separada da ação do parceiro. Artes Marciais e Boken são exemplos fictícios do LAB, editáveis antes da primeira ação.

Até cinco duplas aliadas e cinco NPCs inimigos. Recursos, ações e manutenção são separados por parceria; finalizar uma não bloqueia as outras. A narração é feita somente no fórum. Cada lado ocupa uma formação horizontal, com rolagem e escolha de alvo explícitas. Em telas estreitas a arena permite rolagem horizontal para preservar a escala.

## Decisões locais que precisam de arbitragem futura

- Fichas e projeções são fictícias. Imagens de evolução são temporárias, substituíveis por PNG no LAB. Não representam uma linha canônica aprovada. O LAB permite atributos além da distribuição de criação para testar casos; não valida personagens reais.
- Metade de dano ímpar arredonda para cima neste laboratório. Os tópicos consultados não especificam arredondamento; a decisão fica centralizada em `attackResult` para revisão.
- Ao faltar manutenção, a projeção retorna ao Novato. A 0 PV, retorna ao Novato com 0 PV e fica fora de combate; consequências e forma final narrativa cabem ao narrador. Não há recuperação gratuita.
- Condições temporárias expiram depois da próxima ação do portador. Atordoado consome a próxima ação; veneno permanece e causa dano ao final da ação. Imobilizado mantém a ação; o narrador precisa vetar abordagens que exijam movimento.
- Ajudar/interagir usa teste arbitrado, sem inventar bônus automáticos. Digivice e efeitos de Assinatura não presentes nas fichas do laboratório ainda não são resolvidos automaticamente.
- Sem iniciativa fixa. O usuário controla NPCs por seleção explícita. Isso é simulação de controle local, sem autenticação/autorização de contas.

## Mapa técnico

`fixtures.mjs` fornece dados locais; futuramente um adaptador poderá fornecer formas de fichas reais. `rules.mjs` contém constantes e marcadores; `dice.mjs` resolve d6; `resources.mjs`, `conditions.mjs` e `evolution.mjs` concentram suas regras. `engine.mjs` executa transições imutáveis e transações de ataque, esquiva e aceite. `battle.js` apresenta resultados já definidos: animação nunca decide nem repete uma rolagem. `scene.audio = false` reserva configuração para áudio futuro, sem sons nesta etapa.

## Fila, condições e fichas públicas (7/10/2026)

As definições de condições foram conferidas em https://digimonbonds.forumeiros.com/t18-05-combate. Incapacitado conta como Vulnerável; não é por si só a mesma coisa que PV zero. Desorientado modifica Ataque; Vulnerável modifica Esquiva; Fraco reduz dano; Estimulado concede Vantagem; Atordoado consome a próxima ação; Envenenado causa o Poder do aplicador após agir. Imobilizado restringe movimento e precisa de avaliação narrativa.

As resoluções são armazenadas separadamente, com custos e ação reservados na declaração. Cada Esquiva e aceite são manuais. Mudanças de participantes não apagam o log nem restituem ações. Aguardar/Observar apenas consomem a ação humana. A categoria https://digimonbonds.forumeiros.com/f9-fichas-aprovadas fornece as fichas públicas para leitura local. Nenhuma identidade ou permissão de conta é inferida desse acesso. Ataques vazios não viram técnicas inventadas; efeitos não implementados continuam visíveis e exigem arbitragem do Narrador.

## Ajustes de outubro: alvos humanos e revisão

Janela de Defesa decidida explicitamente pelo usuário: pode ser declarada depois de receber a rolagem do ataque, desde que o Digimon ainda tenha ação e não tenha rolado a esquiva. Consome sua ação e dá Vantagem imediatamente. Depois de rolar a esquiva, aplique o resultado pendente antes de declarar uma nova Defesa; a postura não modifica dados já rolados. A duração segue a regra publicada: até a próxima oportunidade de agir.

Fontes: https://digimonbonds.forumeiros.com/t19-02-personagens-humanos, https://digimonbonds.forumeiros.com/t18-05-combate, https://digimonbonds.forumeiros.com/t8-04-lacos.

A Energia humana representa sua condição física e sofre dano. Zero tira o Humano de combate. Força para Lutar custa 3 PL disponíveis, permanece em 1 PV/Energia e é oferecida no momento da perda fatal. Corpo + Talento pertinente para a Esquiva humana é uma interpretação do teste geral de Característica + Talento, sujeita ao Narrador.

Por solicitação explícita do usuário, o protótipo permite revisar e Forçar Ataque imediatamente após a rolagem e antes da defesa, mesmo sem saber ainda se o ataque falhou no teste oposto. Esse ponto é uma adaptação solicitada: a descrição publicada de Forçar fala em teste falho. O custo solicitado é 2 PL, inclusive negativos, uma vez por teste. A esquiva ainda precisa falhar para ser forçada. Cada lado confirma seus dados antes de aplicar o resultado.

## Rodadas sem liberação por lado

Restaurado a pedido do usuário: cada participante pode agir enquanto tiver ação disponível na rodada. Deve primeiro resolver os ataques direcionados a si, inclusive aplicar o resultado da esquiva. Esquiva é reação e não gasta a ação normal; depois dela, o participante pode atacar na mesma rodada sem liberação do Narrador. Defesa continua gastando a ação normal para obter Vantagem. Humanos mantêm sua ação separada. Multi-Attack é escolhido ao aceitar a primeira rolagem de ataque, por 2 PL disponíveis. Conforme o fluxo solicitado pelo autor, o atacante rola e confirma os dois ataques antes de o defensor resolver suas duas esquivas, cada uma com dados e aplicação próprios. O custo é cobrado uma única vez e não há terceiro ataque na mesma rodada. A próxima rodada abre automaticamente após o aceite do último resultado, quando todas as ações (incluindo as humanas) foram usadas/dispensadas e toda a fila foi aplicada. Se a última ação for Observar ou dispensar uma ação restante, ela também conclui a rodada automaticamente. Manutenção ocorre uma vez nesse encerramento, usando as opções configuradas. Não há botão de liberação manual.


O estado de combate e a aleatoriedade agora são controlados e salvos pelo servidor local. A rolagem é persistida antes de ser exibida; atualizar não restitui ações ou custos. Apenas o Narrador autenticado pode recomeçar a cena. Ao chegar a 0 PV/Energia, o Log registra que o combatente está fora de batalha; Força para Lutar que preserve 1 não gera essa mensagem.


## Digivice em combate

Fonte: https://digimonbonds.forumeiros.com/t15-08-digivice. Booster e Protocolos Especiais usam a ação do Humano, preservando a do parceiro. Nenhuma melhoria é concedida automaticamente por nível. A importação conserva os registros estruturados e reconhece slots numerados do fórum, com tolerância a caixa, acentos e pontuação.

Booster 1: uma ativação por combate, Vantagem no próximo Ataque. Booster 2 também permite escolher a próxima Esquiva. Booster 3 permite duas ativações por combate. A Vantagem entra na regra normal de cancelamento; não modifica rolagens já feitas. Forçar usa o mesmo grupo e modificador da rolagem original.

Cada Protocolo instalado pode ser ativado uma vez por combate; expira ao concluir a próxima ação do Digimon (Esquiva é reação). Troca de Elemento muda espécie e assinaturas para o elemento registrado na aquisição; Reforço de PV soma 10 PV atuais/máximos e os retira ao expirar; Reforço de Esquiva soma 1d6; Reforço de Dano soma 2; Qualidade Temporária concede Rank 2; Ataque Temporário usa o maior Rank das assinaturas da forma atual. Parâmetros vêm da ficha, nunca de escolhas enviadas pelo cliente. Para Ataque Temporário, registre `Nome | Elemento | Efeito` (efeito opcional). Parâmetros não reconhecidos bloqueiam a ativação e solicitam revisão da ficha. Scanner de Cards permanece bloqueado por solicitação do usuário.

Usos, ação consumida e bônus pendentes são persistidos pelo repositório. Recomeçar Cena remove os usos/bônus, preservando as melhorias instaladas. A interface só permite ativar quando o servidor anuncia suporte ao comando.

## Imagens e resolução

A Galeria fica em `archive/galeria/index.html`, sem card na página inicial. O editor pesquisa qualquer nome do Digibank, sem elementos de imagem nos resultados; apenas o item selecionado solicita a arte, priorizando o recorte transparente quando disponível. A cena não pré-carrega a galeria inteira. O botão AÇÃO reutiliza a ilustração e as cores padrão do Digivice das fichas.

A apresentação dos dados dura aproximadamente 400 ms, sem revelação sequencial por dado. O resultado continua vindo do servidor e sendo persistido antes da animação. A atualização periódica não sobrepõe requisições nem roda com a página oculta. O editor de assinatura apresenta os efeitos do catálogo: os já implementados são automáticos; os demais são conservados como `sourceEffects`, identificados como aplicação manual pelo Narrador, sem efeito automático inventado.
