# Digi-Pet: entrada de teste no App

O sexto card (DB–06) fica à direita do Battle Link na grade de duas colunas; no mobile segue a grade de uma coluna. Visível a todos, sem restrição ao usuário 1. O antigo JavaScript ID 29 do Forumeiros, responsável pelo botão flutuante da direita, foi desativado.

Ao clicar, um diálogo pede a senha de teste. A comparação local usa SHA-256; a senha digitada não é salva nem enviada pela rede. Erro, cancelamento e fechamento limpam o campo. Cada abertura exige a senha novamente. Este é um bloqueio visual de protótipo, não autenticação segura nem autorização para recompensas de RPG. O código e os assets são públicos; não há dados privados no pacote.

`digi-pet-trial.js` só é carregado após a senha correta. Contém o protótipo da branch `codex/digipet-visual`, com o runtime adaptado para o App, sem o botão flutuante nem a imagem do chaveiro. Fonte do runtime e empacotamento: `prototypes/digi-pet/forum-beta/app-runtime.mjs` e `build-app.mjs` naquela branch de trabalho.

O Digi-Pet abre em `dialog`, dentro de iframe `sandbox="allow-scripts"` sem acesso ao DOM, cookies ou recursos do App. CSP do documento do jogo bloqueia rede externa. Persistência por porta de mensagens limitada à janela e canal aleatório do iframe. Chave: `digimon-bonds:digi-pet:app-beta:u<ID>:v1` quando o fórum identificou a conta; acesso direto ou sem identidade usa `...:browser:v1`. Nenhum save do fórum ou ficha é removido. Nenhuma integração com backend, Scanner, Battle Link ou ficha real foi adicionada.

Validação: build de produção; 288 testes existentes; navegador com seis cards, posição lado a lado, senha errada/correta, cancelamento, nova solicitação ao reabrir, carregamento tardio, sandbox e mobile sem overflow. `work/verify-app-pet-card.cjs` no workspace de implementação guarda a verificação visual.

## Janela independente e apresentação sem moldura

Após a senha correta, o App abre digi-pet-window.html em uma janela pop-up redimensionável (o navegador pode escolher uma aba). O tamanho inicial é até 500×920, ajustado à tela. A janela mostra somente o dispositivo e mantém os controles nativos para minimizar/maximizar/fechar. Não há cabeçalho de ACESSO DE TESTE nem borda/painel extra envolvendo o aparelho.

O acesso inicial usa um identificador aleatório por abertura e uma troca postMessage que valida origem, janela emissora e token. Isso funciona mesmo quando o armazenamento de terceiros do App é particionado. O App aguarda até 8 segundos pela confirmação e oferece Abrir aqui quando não recebe resposta. O fragmento é removido da URL ao carregar. Não contém senha. A janela mantém apenas uma autorização de sessão para permitir F5 e zera opener; continua jogável mesmo depois de fechar o App/fórum. O save usa a mesma chave da versão anterior do App. Não migra o antigo teste do domínio do fórum.

Quando pop-ups são bloqueados, a interface explica como permitir e oferece Abrir aqui. A alternativa mantém o player isolado e remove a moldura e o cabeçalho extra. Testes de navegador: senha errada, popup independente, ausência de cabeçalho/borda, opener nulo, save após F5, funcionamento após fechar o App, redimensionamento e fallback bloqueado; 288 testes existentes passaram. Fontes: app-window-runtime.mjs e build-app.mjs na branch do protótipo.

Compatibilidade conferida com o App em iframe de outra origem e com popup sem confirmação, além de popup bloqueado explicitamente. Na primeira abertura independente, um save do App pode ser copiado pelo canal validado se ainda não existir save na janela. Dados existentes da janela nunca são sobrescritos por essa migração inicial.
