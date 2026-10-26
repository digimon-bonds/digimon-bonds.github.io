# Digi-Pet: entrada de teste no App

O sexto card (DB–06) fica à direita do Battle Link na grade de duas colunas; no mobile segue a grade de uma coluna. Visível a todos, sem restrição ao usuário 1. O antigo JavaScript ID 29 do Forumeiros, responsável pelo botão flutuante da direita, foi desativado.

Ao clicar, um diálogo pede a senha de teste. A comparação local usa SHA-256; a senha digitada não é salva nem enviada pela rede. Erro, cancelamento e fechamento limpam o campo. Cada abertura exige a senha novamente. Este é um bloqueio visual de protótipo, não autenticação segura nem autorização para recompensas de RPG. O código e os assets são públicos; não há dados privados no pacote.

`digi-pet-trial.js` só é carregado após a senha correta. Contém o protótipo da branch `codex/digipet-visual`, com o runtime adaptado para o App, sem o botão flutuante nem a imagem do chaveiro. Fonte do runtime e empacotamento: `prototypes/digi-pet/forum-beta/app-runtime.mjs` e `build-app.mjs` naquela branch de trabalho.

O Digi-Pet abre em `dialog`, dentro de iframe `sandbox="allow-scripts"` sem acesso ao DOM, cookies ou recursos do App. CSP do documento do jogo bloqueia rede externa. Persistência por porta de mensagens limitada à janela e canal aleatório do iframe. Chave: `digimon-bonds:digi-pet:app-beta:u<ID>:v1` quando o fórum identificou a conta; acesso direto ou sem identidade usa `...:browser:v1`. Nenhum save do fórum ou ficha é removido. Nenhuma integração com backend, Scanner, Battle Link ou ficha real foi adicionada.

Validação: build de produção; 288 testes existentes; navegador com seis cards, posição lado a lado, senha errada/correta, cancelamento, nova solicitação ao reabrir, carregamento tardio, sandbox e mobile sem overflow. `work/verify-app-pet-card.cjs` no workspace de implementação guarda a verificação visual.
