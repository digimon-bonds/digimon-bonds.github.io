# BONDS OS v10 — PUBLIC BETA PREP

Versão: 20261013-10-public-beta7. Instalação no painel não executada.

## Escopo

Default 2.0, seletor independente em ambas as versões, localStorage, fallback de sessão, bootstrap pequeno e deploy. Refinamentos do turno anterior incluídos; paisagens finais de Mundo Digital/Humano substituídas pelos últimos anexos. Nenhum módulo do App foi alterado.

## Testes do loader

Default, preferências 1/2, diagnósticos, troca com reload, storage indisponível, duplicações, CSS/JS com erro/timeout, handshake, DOM aguardado, recuperação após mutação parcial e proteção contra loop. Botão App preservado por referência em fixture. Bootstrap cancelado não inicializa loader atrasado.

## Navegador local

Bootstrap/loader reais com URLs reescritas somente nas fixtures: 2.0 → 1.0 → 2.0. Clássica sem classes/CSS/JS e main.innerHTML idêntico ao baseline. Falhas CSS e JS: mesma igualdade e seletor ativo na clássica. Falha parcial: reload recuperou HTML nativo, sem marca de mutação e sem nova carga da skin. Setas e ESC conferidos, foco retorna ao botão.

Rolagem 317 em topic-65: Hollow/avatar correto, corpo automático intacto. Templates de ficha/Mundo Humano preservados nas amostras. Paisagens e cena da comunidade verificadas visualmente.

## Limites reais

Não houve validação autenticada real de SCEditor, moderação, submissões, MP ou rolagens. Após as primeiras tentativas ignoradas, o navegador aplicou efetivamente 390px: home, seletor, subfórum, rolagem, ficha, editor, perfil e mensagens passaram sem overflow horizontal global. Isso valida as capturas e fixtures locais, não um aparelho físico nem sessão autenticada. Rodar BETA-CHECKLIST.md após a instalação manual. Prévia estática e fixtures não enviam formulários.

## Rede e rollback

Feed: normalmente 11, máximo 21 consultas por atualização; três simultâneas; timeout 12s; sem polling. Loader principal sempre é buscado para disponibilizar seletor, inclusive na clássica; CSS/JS/assets da skin apenas na 2.0. Preferência local permanente não é apagada em falha.

## Publicação

Build normal inclui /forum-skin/. Commit, workflow e verificação HTTPS final estão no PUBLICACAO.md do pacote entregue.

## Resultado automático

173 testes locais passaram; o bootstrap exato da documentação é comparado por teste. O build normal concluiu.

## Acabamento public-beta2

Seletor sem subtítulos, textos revisados, cabeçalho de comunidade e status beta removidos. Slots de publicidade da plataforma ocultos somente na Skin 2.0. Quantidade de dados acompanha a opção selecionada por CSS, sem alterar eventos, valores ou regras nativas. Prévia do editor distingue #preview de posts numéricos, preservando o conteúdo da mensagem. Bootstrap revisado somente para pintura inicial e chave do loader; atualização manual documentada no guia.

## Frame de transição — public-beta3

Durante bootstrap/loading, #wrap fica transparente e sem interação, deixando apenas o fundo escuro. A proteção é contínua entre bootstrap e loader; ready e recuperação removem a classe e restauram a interface. Skin clássica explicitamente selecionada não recebe a proteção.

## Telefone sem rolagens — public-beta4

Posts automáticos de dados reconhecidos pelo preâmbulo e estrutura nativos são excluídos antes da ordenação/limite do feed. Posts comuns do narrador e templates de jogadores continuam elegíveis. A exibição e identidade de rolagens dentro dos tópicos permanecem intactas.

## Cards e ilustração — public-beta5

Convite Discord atualizado para https://discord.gg/U3dQqZJFw. Digibank (t14) separada em 75 cards nas capturas, cores por elemento, imagens e circuitos; Personagens Humanos (t19) com 14 cards de arquétipos e destaque de habilidade. Reparo de Coração Gentil em PNG transparente (ARTE-CORACAO.md). Apenas Sistemas recebe reorganização do conteúdo.

Capa de tópico: último post narrativo de Omegamon, ignorando mensagens automáticas de rolagem. A busca começa pela página da última mensagem, confirma a última paginação e recua quando não encontra narrativa do autor. Prioriza .db-terminal-v2-header img do template enviado e depois o campo image de data-db-project; não usa enemyImage ou avatares. Sem imagem no último post, mantém a composição temática. Duas buscas simultâneas, somente cards próximos da tela, sem polling e sem persistir conteúdo entre sessões. Templates permanecem intactos.

Validação no navegador: 75 Digimon/14 arquétipos; 390px sem overflow global (scrollWidth 382); template narrativo #474 preservado e banner XZVp8vwH reconhecido após ler página p25. Outros 27 templates de jogadores preservados na captura de exemplo. Bootstrap public-beta4 mantido sem alteração; revisão do loader atualizada para public-beta5.

Validação final desta revisão: 179 testes locais passaram; build de produção concluído. O bootstrap não mudou nesta revisão.


## Capas por área e isolamento de templates — public-beta6

As capas e as consultas de banners ficam restritas ao Mundo Humano, Mundo Digital e seus subfóruns. Sistemas, Fichas e demais áreas mantêm os cards de circuitos sem imagens.

No tópico t77, o template de Dreiqui abre `<b>` em `Vou provar que já sou crescidinho!` sem `</b>`, nas mensagens #212, #269 e #379. O parser reconstrói essas tags em mensagens seguintes e envolve `.postprofile` e `.postbody`; o grid então comprime ambos na coluna de avatar. A skin remove somente wrappers de formatação entre `.inner` e os componentes nativos. Os nós de conteúdo e seus templates permanecem intactos. A correção na fonte do template é `<b>Vou provar que já sou crescidinho!</b></div>`.

Não foram editadas mensagens, nem alterado o bootstrap instalado. O loader usa revisão public-beta6 para CSS/JS.

Validação public-beta6: 184 testes aprovados; em Sistemas, 11 cards sem capas/consultas; em Tóquio, 11 cards com capas. No t77, todos os 20 conteúdos da captura foram preservados, a mensagem #377 voltou de uma coluna de 210px para 996px, e o documento não apresenta overflow global a 390px.


## Leitura de Sistemas — public-beta7

Os posts narrativos da conta Omegamon em Sistemas recebem uma superfície de leitura de até 860px, com recuo interno de até 42px e blocos de prosa de até 70ch. Seções, exemplos e tabelas de referência possuem tratamentos distintos. Foram removidas apenas quebras de linha de espaçamento entre blocos; as quebras dentro do texto e das listas permanecem. Textos justificados no desktop; alinhamento à esquerda em telas pequenas para evitar espaços excessivos.

Os 14 arquétipos usam nomes em dourado claro, fonte de 22px/700, cabeçalho próprio com índice e cards de habilidade mais definidos. No celular, títulos de 20px e descrições alinhadas à esquerda. A edição se aplica ao template de Sistemas; posts autorais nos mundos continuam preservados. Bootstrap inalterado.

Verificação: Humanos, Mecânicas e Digimon com prosa de 566px no viewport de 1280px; 14 arquétipos sem overflow a 390px; 75 entradas Digibank sem overflow interno. Testes completos e verificação HTTPS acompanham a publicação.
