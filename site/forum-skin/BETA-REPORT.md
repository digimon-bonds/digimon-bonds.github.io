# BONDS OS v10 BETA PREP

Versão atual: 20261013-10-beta2. Os registros abaixo do beta1 são históricos; ver refinamentos beta2 no final.

## Publicação

Build normal inclui forum-skin/ em dist/. As URLs e o resultado final do deploy são registrados no relatório PUBLICACAO.md do pacote entregue. Nenhum loader instalado no Forumeiros por esta tarefa.

## Validação automática

165 testes do repositório passaram, incluindo 29 testes de loader/feed/contratos; build normal concluído. Testes de loader: opt-in, off, storage bloqueado, sessão em navegação/login/logout simulados, duplicação, CSS/JS com falha ou timeout, handshake e recarga nativa após DOM parcial. Feed: múltiplas mensagens no mesmo tópico, deduplicação por ID, mesma origem, cache por atualização, timeout/abort, fallback e agendamento após load/idle.

Esses testes de navegação/login/logout usam ambiente simulado; NÃO comprovam sessões autenticadas reais, SCEditor real, moderação real, envio de posts, MP, cadastros ou rolagens reais. As demonstrações locais também não enviam formulários.

## Performance

Antes: início imediato, normalmente 11 e até 21 requests. Depois: início após load/idle (ou timeout de 250ms), cache de promessas por atualização e bloqueio de lote simultâneo. Mesmo orçamento máximo 1 + T + P = 21; normalmente 11; até três simultâneas; timeout 12s cada; zero polling. Sem cache entre sessões ou atualizações.

## Assets

Antes 5025863 bytes; após conversões/limpeza 3239495 bytes. Quatro PNGs para WebP lossless com RGBA idêntico. Com a reparação de Estrela em Ascensão, total final 3913087 bytes. Hero intacto. Ver ASSETS.md e ARTE-ARQUETIPO.md.

## Pendências reais

Instalar o loader pelo responsável e executar BETA-CHECKLIST.md com ADMIN, USUÁRIO COMUM e VISITANTE. Confirmar ordem de execução no head para impedir primeira pintura antiga. O opt-in não é autenticação: qualquer pessoa pode usar o parâmetro, mas não ganha permissões. Templates largos podem rolar internamente. A prévia estática não contém todas as páginas de histórico; links sem captura levam ao fórum público.

## Classificação de erros

BONDS OS: falhas com origem forum-skin/bonds-os.js ou forumeiros-loader.js, seletor inválido da skin, asset desta pasta ausente ou regressão reproduzível somente no beta. EXTERNO: respostas/console de anúncios, Forumeiros, hosts de imagem de posts e terceiros que também falham sem beta. Registrar ambas separadamente; não mascarar erro real com catch genérico.

## Verificação visual local

Desktop 1280px: home, Mundo Humano, fórum vazio, tópico 58, editor, perfil e mensagens inicializam sem overflow horizontal global. Arquétipos carrega a arte reparada. Mundo Humano oculta a lista redundante; fórum 16 realmente vazio mantém aviso. Console local sem erros/warnings nas páginas verificadas. Fixture com CSS atrasado 8s mostrou bonds-os-loading, fundo rgb(7,20,29), frame none e body visível; concluiu ready removendo CSS crítico.

A capacidade de viewport solicitada em 390px continuou reportando innerWidth 1280px neste navegador. Portanto NÃO foi possível comprovar 390px nesta execução; conferir no checklist real. Formulários locais são demonstrações inertes.

## Refinamentos beta2 — 2026-10-13

Textos e sumário da home revisados; card de composição à esquerda; editor sem molduras antigas; visor claro e pôster inteiro; perfil com circuitos e cabeçalho de ações. Reprodução local com links Citar/Editar/Excluir: mesmos nós, mesmos hrefs, três handlers preservados e disparados, sem envio. Horário movido por referência. Formulário de Responder com título aninhado: mesmo form/textarea, action/name/value preservados; fundo antigo ausente. Templates da amostra Mundo Humano permanecem idênticos. Isso não é validação autenticada real: editor e controles foram reproduzidos com fixtures locais identificadas. Últimos Posts e opt-in inalterados.
