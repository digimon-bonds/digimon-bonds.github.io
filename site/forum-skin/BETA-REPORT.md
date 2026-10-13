# BONDS OS v10 — PUBLIC BETA PREP

Versão: 20261013-10-public-beta5. Instalação no painel não executada.

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
