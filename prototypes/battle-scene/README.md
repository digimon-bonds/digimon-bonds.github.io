# CENA DE BATALHA — laboratório tático local

Execute da raiz do projeto:

    node prototypes/battle-scene/serve.mjs

Abra http://127.0.0.1:4194/. Testes:

    node --test --test-isolation=none prototypes/battle-scene/engine.test.mjs

## Fluxo de teste

O protótipo abre em **JOGADOR**, aguardando a escolha manual de um aliado. A dupla selecionada não pode ser trocada após sua primeira ação na rodada. O jogador não rola ações ou Esquivas de NPCs: alterne para **NARRADOR** para resolver o lado do alvo, e depois volte ao jogador. Essa alternância é uma interface de teste local. O Narrador possui bloqueio por senha local, sem contas de jogadores.

**NARRATOR TERMINAL** reúne equipes, seleção de participantes, cenário, Local Lab, reinício e rodada em um painel recolhível. O LAB permite editar também nome do humano associado, qualidades (`nome | rank`) e ataques (`nome | rank | elemento | efeito`). Os efeitos implementados são eficiente, pesado, atordoador, venenoso, enfraquecedor, quebra-bloqueio, desorientador e imobilizador; deixe o efeito vazio para um ataque sem efeito.

HUDs, recursos e ações ficam separados da configuração administrativa. O log inicia recolhido; a resolução em espera é uma linha, e resultados aceitos podem ser recolhidos. As equipes mantêm o tamanho dos combatentes com rolagem horizontal. `responsive-check.html` permite conferir a interface em um iframe de 390 px.

1. Configure cenário ou fundo local. LOCAL LAB edita nome, forma, desbloqueio, estágio, atributos, recursos, PV, condições, PNG por forma, posição e escala durante a cena, desde que o participante não esteja envolvido em uma resolução pendente.
2. Escolha Aliado/Player ou NPC/Narrador. Configure um ataque ou Assinatura, atributo, Qualidade relevante, circunstância, PL e abordagem. Cancelar não altera nada.
3. Confirme: dados são determinados uma única vez e revelados pela animação. A ação do atacante fica bloqueada. O Humano conserva sua ação separada.
4. O atacante aceita sua rolagem ou usa **FORÇAR ATAQUE** uma vez por 2 PL. Somente depois o controlador do alvo recebe **ROLAR ESQUIVA**, configura Qualidade/Talento, circunstância e PL, e confirma a reação.
5. O defensor pode forçar uma Esquiva falha uma vez por 2 PL, inclusive abaixo de zero. Depois de aceitar a Esquiva, **ACEITAR RESULTADO / APLICAR** efetiva dano e efeitos. Se o golpe for fatal e houver 3 PL, o defensor decide sobre Força para Lutar. Não há turno ou rolagem automática de NPC.
6. Use separadamente Evoluir, teste do Humano, Defender, Interagir ou ação adicional de 2 PL. Encerrar Turno dispensa o que resta da dupla.
7. Aplique as resoluções. Quando todas as ações estiverem usadas ou dispensadas, a dupla aparece como TURNO CONCLUÍDO automaticamente. DISPENSAR AÇÕES RESTANTES dispensa ações que você não deseja usar. O painel O QUE FALTA? mostra ações e resoluções pendentes. O Narrador usa LIBERAR RODADA seguinte para aplicar manutenção uma vez e abrir novas ações.
8. Reiniciar repete o cenário configurado no LAB, apagando a sessão de combate. Recarregar restaura o estado salvo, sem gerar novos dados.

Formas Perfeito e Mega começam bloqueadas. Para testar, desbloqueie a forma correspondente no LAB e ajuste o Nível de Laço (5/8), PL e Energia; não são desbloqueadas automaticamente só por mudar o nível.

**Regras, fontes, diferenças dos prompts e decisões sujeitas ao narrador:** [RULES.md](RULES.md).

## Isolamento

Fora de `site/`: não entra no build do GitHub Pages. Sem contas, escrita no fórum, multiplayer ou armazenamento online. A leitura pública passa pelo servidor local. Arquivos escolhidos e dados são persistidos pelo servidor local; imagens enviadas aceitam até 12 MB. Movimento reduzido é respeitado. A correção solicitada para os aliases de Escuridão e imagem do Black Strabimon foi feita separadamente no Creator; não altera a integração de leitura do protótipo.

A qualquer momento, adicione aliados/duplas e NPCs até cinco por lado. Escolha CONTROLAR na base de cada Digimon, e o alvo na configuração do ataque. A formação permanece lado a lado; use a rolagem horizontal da arena quando houver pouco espaço. ATACAR no painel humano usa Corpo e o Talento selecionado; os talentos do Humano podem ser editados no LOCAL LAB, um por linha no formato `nome | rank`. Cada dupla tem seus recursos e manutenção. A narração é feita somente no fórum. Os dados de sucesso ficam verdes e a rolagem usa Web Crypto com rejeição dos valores excedentes, sem viés entre as seis faces. A animação é apenas visual.

Teste o motor e as equipes com `node --test --test-isolation=none prototypes/battle-scene/*.test.mjs`. Planejamento da integração futura: [INTEGRATION.md](INTEGRATION.md).

O motor guarda participantes em listas e separa ator, forma, Humano, parceria e controlador. Identidade de conta e permissões reais exigirão backend futuro; os locks atuais são somente locais.

## Arte local do Battle Scene

O catálogo usa os 30 Rookie com `partner` preenchido no Digibank do site. Cada PNG local foi recortado com `image_gen` a partir da imagem cadastrada no Digibank, com alpha transparente. O prompt pede remoção apenas do fundo e da sombra projetada, preservando desenho, cores, pose, partes brancas, acessórios e contornos. O catálogo mantém a origem de cada imagem, parceiro, ID do Digibank e metadados de transparência. O Digibank original não é alterado.

A importação de fichas e a renderização de cenas salvas usam essas artes através de `sheet-art.mjs`, com aliases para Piyomon/Biyomon, Plotmon/Salamon, V-mon/Veemon e outras grafias conhecidas. Espécies fora do catálogo conservam a imagem informada na ficha. A galeria mantém também `assets/alphamon.png` como asset interno, separado dos Rookie. Dados e habilidades dos exemplos continuam fictícios.

## Fichas públicas e resolução em equipe

No modo NARRADOR, abra NARRATOR TERMINAL → FICHAS APROVADAS // FÓRUM, atualize a lista e selecione uma ficha. O servidor local lê somente os tópicos encontrados na categoria pública de aprovadas. Revise a confirmação antes de inserir a dupla. Retrato, atributos, talentos, formas desbloqueadas, qualidades, ataques, PV, Energia e PL vêm da ficha. Campos ausentes e efeitos ainda não automatizados aparecem na confirmação e em ATRIBUTOS / QUALIDADES / ATAQUES. Uma imagem oficial inequívoca pode identificar um nome de espécie ausente, com aviso de revisão. Não existe autenticação de contas do fórum, vínculo de conta ou escrita remota.

RESOLUTION QUEUE mantém várias ações independentes. Selecione um cartão para rolar a Esquiva correspondente, forçar ou aplicar aquele resultado. Uma ação pendente reserva seus custos e não permite agir novamente com o mesmo participante. Para retirar um participante envolvido, primeiro aplique as ações que envolvem ele ou seu Humano. As demais entradas e saídas são permitidas durante o combate e ficam no log. Editar o LAB não devolve ações e usos consumidos.

OBSERVAR consome a ação do Humano sem custo ou rolagem, preparando DAR COORDENADAS somente para a rodada imediatamente seguinte. DAR COORDENADAS usa a ação do Humano e acrescenta +1d6 automaticamente ao próximo ataque comum ou de assinatura do parceiro naquela rodada, uma única vez. O bônus não se acumula e expira se não for usado. Passe o mouse ou foque as condições para ler seus efeitos. As condições de ataque, Esquiva, dano, veneno e perda da próxima ação são automáticas; deslocamento Imobilizado exige arbitragem narrativa.

O controle acima da arena libera a rodada seguinte após todas as resoluções e ações. Não há campo nem confirmação de narrativa. A manutenção é aplicada uma vez, ao encerrar. `forum-check.html` verifica a leitura das fichas públicas atuais; `*.test.mjs` verifica regras, fila e isolamento.

## Imagens das fichas

O catálogo geral de parceiros/evoluções foi cancelado a pedido do usuário. `sheet-art.mjs` contém somente seis artes já obtidas para espécies presentes nas fichas aprovadas (e suas fontes), além do Black Strabimon local. A importação usa a arte local quando houver correspondência exata ou apelido conhecido; as demais fichas preservam a imagem pública original. Nenhum fundo foi removido. Dados e habilidades dos exemplos continuam fictícios.

## Participantes e acesso local

`+ ALIADO / HUMANO` abre as fichas aprovadas e a opção de criar uma dupla NPC aliada; nenhum aliado aleatório é inserido. Selecione uma ficha, revise e confirme a importação, ou preencha os dados da nova dupla. `+ NPC INIMIGO` abre um formulário vazio com nome, link de imagem ou PNG, estágio, elemento, atributo digital, atributos, PV, qualidades, ataques e condições. Fechar ou cancelar não adiciona ninguém. EDITAR PARTICIPANTE continua editando participantes existentes.

O modo Narrador exige senha validada no servidor local. Um cookie de sessão HttpOnly/SameSite=Strict lembra a liberação ao alternar modos ou recarregar; reiniciar o servidor invalida as sessões. A senha em texto não é enviada ao cliente nem registrada pelo servidor. Isso é um bloqueio de interface do protótipo: o estado de combate continua no navegador; não substitui autorização de contas ou verificação de ações num backend multiplayer.

Não há Cancelar Resolução na interface: role a esquiva quando necessária e use Aceitar Resultado/Aplicar. Multi-Attack é escolhido ao aceitar a primeira rolagem de ataque do aliado, custa 2 PL disponíveis e pode ser usado uma vez por participante em cada rodada. Libera imediatamente o segundo ataque, sem esperar a esquiva do primeiro. Ambos são confirmados pelo atacante antes de liberar as duas reações do alvo. Cada esquiva tem rolagem, revisão e resultado próprios; após aplicar a primeira, a interface seleciona a próxima reação do participante controlado. Nenhuma esquiva gasta ou devolve a ação normal do defensor.

## Revisão de combate e interface

Os comandos principais agora formam um círculo: ações do Digimon na metade superior e do Humano na inferior. Ícones SVG próprios representam espada, assinatura, escudo, mão, mão com coração, DNA, olho e coordenadas. Mouse e foco de teclado destacam a ação em laranja e mostram a descrição no centro. Multi-Attack, manutenção e detalhes ficam em painéis abaixo do círculo. A disposição adapta o espaçamento em telas pequenas sem alterar as regras do motor.

DEFESA é o rótulo do comando de defender. Digimon usa azul e Humano usa âmbar, com os nomes digitais ao fundo das respectivas metades. Os botões flutuam somente 3 px ao longo de cinco segundos, sem deslocamento adicional no hover. A preferência do sistema por movimento reduzido desativa essa flutuação.

O destaque de hover/foco/seleção agora é verde para ambos. A paisagem conserva 700 px; os PNGs menores ficam por padrão na metade inferior, com os painéis de cada unidade atravessando a borda inferior em uma área própria. O Narrador pode alterar TAMANHO DO DIGIMON (1 = 100%) de 0,4 a 1,5, com a ampliação ancorada nos pés. A formação horizontal e sua rolagem continuam funcionando com equipes maiores.

A arena tem mais altura, espaço para os pés e comandos no estilo JRPG. Condições usam balões opacos; a ajuda de Observar aparece somente ao passar o mouse ou focar o botão. A galeria `art-catalog.html` mostra os 30 Rookie com parceiros cadastrados no Digibank, em PNG com fundo transparente, além de Alphamon como asset interno.

O atacante revisa a rolagem e pode Forçar Ataque uma vez, perdendo 2 PL, antes de aceitar. Somente depois o controlador do alvo pode rolar a Esquiva, forçar a própria falha uma vez ou aceitar. Então Aceitar Resultado / Aplicar efetiva o dano. Ataques recebidos pendentes bloqueiam novos ataques do alvo. A fila conserva cada resolução separadamente. Não há Cancelar Resolução.

Um ataque pode escolher Digimon ou Humano adversário. A Energia importada da ficha representa a vida humana; não existe PV humano separado. A reação humana usa Corpo + Talento pertinente, por interpretação do teste humano geral. O Narrador decide a pertinência do Talento.

Quando um golpe levar PV ou Energia a zero, o defensor com pelo menos 3 PL recebe a escolha contextual Força para Lutar: gastar 3 PL e permanecer com 1, ou aceitar zero. A oferta também aparece em perdas locais por esforço/manutenção/veneno. Não exige autorização antecipada. Forçar pode deixar PL negativo, mas sobreviver exige saldo disponível.

+ Aliado / Humano mantém a seleção de fichas e permite criar uma dupla NPC aliada com dados próprios. NPCs aliados são controlados pelo Narrador. Editar Participante permite inverter horizontalmente a arte. Ajustar PV / Energia / PL aplica cura ou dano narrativo sem devolver ações e impede editar recursos envolvidos em resolução pendente.

O Battle Log apresenta ações aplicadas, dano, erros e evolução, sem registrar cada dado ou esquiva. Detalhes mecânicos permanecem na resolução.

Tudo ainda é local e em memória. A escolha do controlador organiza as etapas, mas não transmite a cena entre PCs nem autentica jogadores. Recarregar reinicia os exemplos; nada é publicado ou enviado ao fórum.


## Salvamento e autoridade local

O servidor salva a cena em `.battle-state/scene.json` (ignorado pelo Git), incluindo ações, rolagens, recursos, efeitos, filas, imagens enviadas e cenário. Os dados são gerados no servidor e gravados antes da animação. F5, abas duplicadas e reiniciar o servidor preservam o estado; requisições repetidas ou com revisão antiga não criam novas rolagens. Somente a sessão autenticada do Narrador pode usar **Recomeçar Cena**. O arquivo de estado não é servido como recurso público.

Não há integração de contas nem autenticação dos jogadores do fórum nesta fase: a escolha do participante é vinculada à sessão local. A identidade e as permissões entre pessoas em computadores distintos exigirão o backend de contas. A persistência impede reset por atualizar/limpar o navegador; não protege contra alguém que controla os arquivos e o processo do próprio servidor.
