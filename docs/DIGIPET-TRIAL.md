# Digi-Pet: entrada de teste no App

O sexto card (DB–06) fica à direita do Battle Link na grade de duas colunas; no mobile segue a grade de uma coluna. Visível a todos, sem restrição ao usuário 1. O antigo JavaScript ID 29 do Forumeiros, responsável pelo botão flutuante da direita, foi desativado.

Ao clicar, um diálogo pede a senha de teste. A comparação local usa SHA-256; a senha digitada não é salva nem enviada pela rede. Erro, cancelamento e fechamento limpam o campo. Cada abertura exige a senha novamente. Este é um bloqueio visual de protótipo, não autenticação segura nem autorização para recompensas de RPG. O código e os assets são públicos; não há dados privados no pacote.

`digi-pet-trial.js` só é carregado após a senha correta. Contém o protótipo da branch `codex/digipet-visual`, com o runtime adaptado para o App, sem o botão flutuante nem a imagem do chaveiro. Fonte do runtime e empacotamento: `prototypes/digi-pet/forum-beta/app-runtime.mjs` e `build-app.mjs` naquela branch de trabalho.

O Digi-Pet abre em `dialog`, dentro de iframe `sandbox="allow-scripts"` sem acesso ao DOM, cookies ou recursos do App. CSP do documento do jogo bloqueia rede externa. Persistência por porta de mensagens limitada à janela e canal aleatório do iframe. Chave: `digimon-bonds:digi-pet:app-beta:u<ID>:v1` quando o fórum identificou a conta; acesso direto ou sem identidade usa `...:browser:v1`. Nenhum save do fórum ou ficha é removido. Nenhuma integração com backend, Scanner, Battle Link ou ficha real foi adicionada.

Validação: build de produção; 288 testes existentes; navegador com seis cards, posição lado a lado, senha errada/correta, cancelamento, nova solicitação ao reabrir, carregamento tardio, sandbox e mobile sem overflow. `work/verify-app-pet-card.cjs` no workspace de implementação guarda a verificação visual.

## Abertura dentro do App

Após a senha correta, o Digi-Pet abre centralizado dentro do App, sem nova aba ou janela. O dispositivo mantém sua própria carcaça, sem cabeçalho ou painel externo adicional. O botão de fechar retorna ao App; cada nova abertura pede a senha novamente.

A entrada carrega o runtime sob demanda e usa diretamente o diálogo sem moldura. A persistência continua na mesma chave local do App e não altera a ficha real. Os arquivos da janela independente permanecem apenas como implementação anterior; o card não os utiliza.

Validação de navegador: seis cards, senha incorreta/correta, abertura na mesma página sem popup, sandbox, cancelamento/reabertura e mobile sem overflow.

## Ritmo de cuidado — 27/10/2026

Comer, brincar e conversar levam 60 segundos, com relógio no visor e ações incompatíveis bloqueadas. O cuidado e os ganhos são registrados ao concluir. Uma comida paga é reservada do estoque no início; o save restaura a refeição sem cobrar novamente.

Treino e exploração duram 30 minutos reais nos dois presets. Ambos descontam 50 Energia e 15 Saciedade na saída, sem cobrança dupla ao concluir ou recarregar. A Disposição da exploração é calculada antes do custo. A regra de uma atividade principal por dia continua.

Descansar não mostra relógio. Recupera 100 Energia em 45 minutos (aprox. 2,22/min); partindo de Energia 50, completa em 22,5 minutos. Acorda automaticamente em 100, ou manualmente pelo botão Acordar, mantendo o ganho parcial. A recuperação continua por timestamp com a página fechada.

As imagens de comida usam caminhos explícitos para serem incorporadas no pacote isolado do fórum, cuja CSP permite somente imagens em data URI. Itens, cards e fragmentos também foram conferidos no pacote. Prêmios recebidos e cards restaurados têm apenas Ver inventário; o inventário permite fechar e voltar ao pet.

Testes: 93 testes do Digi-Pet; navegador sobre o build real com seis comidas, três itens, card inteiro e metade, cinco categorias de prêmio, relógios e retorno pelo inventário. Nenhum efeito de item/card/XP conectado à ficha ou backend.
