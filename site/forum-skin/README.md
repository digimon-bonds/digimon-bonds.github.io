# BONDS OS v10 — PUBLIC BETA

Versão: 20261013-10-public-beta7. Após instalação manual, Skin 2.0 é padrão; Skin 1.0 é o fórum original com apenas o seletor independente. Não houve acesso ou alteração no painel Forumeiros.

## Instalação

Siga [INSTALL-FORUMEIROS.md](./INSTALL-FORUMEIROS.md). Cole apenas forum-bootstrap.js em Todas as páginas, desativando loaders BONDS OS anteriores. App e CSS/templates clássicos permanecem intactos.

Arquitetura: Forumeiros → bootstrap → loader hospedado → escolha 1.0/2.0 → CSS/JS somente na 2.0.

## Preferência e diagnóstico

localStorage: bondsSkinVersion = 1 ou 2. Sem preferência válida: 2. Botão VERSÃO DA SKIN no canto superior direito; clique/teclado, setas, Escape e clique fora. Selecionar salva e usa location.reload; nenhum desmonte ao vivo. A preferência acompanha o navegador, não concede permissões.

?bondsos=1 seleciona/persiste 2; ?bondsos=0 seleciona/persiste 1. Com localStorage bloqueado, default 2 e diagnóstico/seletor funcionam na URL atual, sem persistência entre páginas comuns.

## Failsafe

Timeout de CSS/JS: 20s por recurso. Remove camada/loading, mantém página clássica e seletor; preferência preservada. Falha parcial: sessionStorage bondsSkinFailsafe=once, reload único; próxima entrada usa clássica e converte marca em classic. Diagnóstico/seletor pode limpar a marca para tentar novamente. Sem storage de sessão, usa URL temporária bondsos=fallback. Não clona formulários nem tenta reverter DOM parcialmente alterado.

Bootstrap: menos de 2 KB, transporte com prazo de 12s e pintura estrutural temporária apenas para 2.0. Se cancelado, um loader atrasado é ignorado. Não esconde body. Na clássica não aplica loading nem baixa CSS/JS da skin. O seletor e seu CSS mínimo pertencem ao loader.

## Contratos

Nenhum módulo do App, Battle Link, Character Creator, Digibank, Studio ou JavaScript do botão App foi alterado. Templates de jogadores, mecânica dos dados, permissões, names/actions e SCEditor permanecem nativos. A identidade visual de rolagens corresponde ao solicitante; autor técnico e conteúdo automático ficam intactos. [BETA3-NOTES.md](./BETA3-NOTES.md) registra os refinamentos visuais autorizados antes desta implantação. As duas paisagens finais foram substituídas pelos anexos mais recentes.

## Últimos Posts

Após load/idle; cache de promessas por atualização; até três requisições simultâneas; timeout 12s; 1 + T + P, normalmente 11 e máximo 21. Sem polling, proxy ou cache persistente. Mesma origem e sessão nativa. IDs de mensagem únicos; múltiplas mensagens do mesmo tópico preservadas. O feed indisponível mantém o widget nativo.

## Assets e testes

[ASSETS.md](./ASSETS.md): WebP lossless e comparação RGBA. Cinco assets anteriores permanecem por compatibilidade de cache, sem downloads pela composição atual.

[BETA-REPORT.md](./BETA-REPORT.md) distingue testes locais de sessões reais. [BETA-CHECKLIST.md](./BETA-CHECKLIST.md) deve ser executado com admin, conta comum e visitante. Nunca considerar controles autenticados reais validados apenas por fixtures locais.

## Entradas HTTPS

- https://digimon-bonds.github.io/forum-skin/forum-bootstrap.js
- https://digimon-bonds.github.io/forum-skin/forumeiros-loader.js
- https://digimon-bonds.github.io/forum-skin/bonds-os.css
- https://digimon-bonds.github.io/forum-skin/bonds-os.js

Build normal copia site/ para dist/; workflow Pages faz testes/build/deploy. Versão explícita no loader; nenhum Date.now por request. Scripts de QA/prévias locais não são parte da implantação no painel.
