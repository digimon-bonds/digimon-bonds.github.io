# Digi-Pet — teste Omegamon (usuário 1)

Status: autorizado explicitamente pelo usuário e ativado em 26/10/2026 para Omegamon (ID 1). Pacote da branch de teste publicado por CDN; main e GitHub Pages não foram alterados.

## Instalação preparada

O pacote está em commit 01a3e28, branch codex/digipet-visual. Nenhum push para main, alteração de workflow, build do App ou publicação de GitHub Pages é necessário. O bootstrap aponta para a versão imutável desse commit no CDN e confere SHA-384.

Após autorizar/disponibilizar a branch: criar uma entrada JavaScript nova no Forumeiros, título Digi-Pet — teste Omegamon u1; permissões Administradores sim, Moderadores/Membros/Convidados não; em todas as páginas. Conteúdo: forumeiros-bootstrap.js. Não alterar as 19 entradas existentes. Desativar essa entrada remove o acesso e preserva o save.

## Isolamento

Bootstrap e launcher exigem login, ID 1 e nome Omegamon. Interface não é autorização de recompensas RPG: nenhuma ficha, XP real, backend, Scanner ou Battle Link é acessado. Código e artes estáticos não contêm dados pessoais, credenciais nem saves. A eventual branch de assets é pública; não representa liberação do botão a outros usuários.

Iframe srcdoc com sandbox allow-scripts (sem allow-same-origin), CSP sem rede e sem acesso ao DOM/cookies do fórum. Port de persistência aceita mensagens apenas da janela do iframe e de um canal aleatório por abertura. Chave exclusiva no navegador do fórum: digimon-bonds:digi-pet:forum-beta:u1:v1. Não migra nem modifica saves do App/localhost.

## Imagem

button-original.png é cópia byte a byte da imagem fornecida: SHA-256 1a9586cb32cd17a01f60ad36c392ee15ed261514a894671933dcde02f8415ace. Sem recorte, filtros ou edição. Somente dimensionamento proporcional de exibição (76px desktop, 64px mobile).

## Verificação

work/verify-forum-beta.cjs valida bloqueio de visitantes/outros usuários, imagem idêntica, montagem única, abertura/fechamento, sandbox, salvamento/reabertura, rejeição de mensagens externas, nenhuma requisição dentro do iframe, App preservado e desktop/mobile. Capturas em outputs/digi-pet-forum-beta-desktop.png e outputs/digi-pet-forum-beta-mobile.png.

## Instalação verificada no fórum

Entrada JavaScript nova ID 29: Digi-Pet — teste Omegamon u1. Administradores sim; moderadores, membros e convidados não. Todas as páginas. Bootstrap com allowlist de login + user_id 1 + username Omegamon e SRI SHA-384. Fonte imutável: commit 01a3e284248eea81db20635c5244b020598dba0e.

Verificação na sessão real do Omegamon: botão à direita, imagem original, abertura em overlay, Exterior diurno, Conversar, fechamento e retomada com habitat/Companhia salvos. Página e JavaScript baixados sem sessão não incluem o bootstrap do Digi-Pet. Capturas reais: outputs/digi-pet-forum-live-button.png e outputs/digi-pet-forum-live-overlay.png. Nenhuma integração com ficha/backend, alteração de scripts anteriores, main, workflows ou publicação de Pages.
