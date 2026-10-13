# BONDS OS v10 — PUBLIC BETA PREP

Versão: 20261013-10-public-beta2. Instalação no painel não executada.

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
