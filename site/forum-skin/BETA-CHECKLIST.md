# BONDS OS v10 — checklist obrigatório do beta real

Versão: 20261013-10-public-beta1. **Nenhuma linha abaixo foi marcada como validada em sessão autenticada.** O responsável deve preencher data, conta/perfil (sem senha), navegador, URL e observação.

Execute cada caso com skin original (?bondsos=0) e beta (?bondsos=1), desktop e ~390px onde aplicável. Use área e conteúdo descartáveis para envios/moderação/exclusão. Não cole senhas/tokens/cookies no relatório. Salve o rascunho antes de testar falhas de rede.

Data: ____ · Navegador: ____ · Conta/perfil: ____ · Versão: ____

## ADMIN

| Teste | Resultado esperado | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|:---:|:---:|---|
| Login | Entrar; beta permanece na mesma aba; identidade e permissões corretas. | ☐ | ☐ | |
| Logout | Sair; conteúdo restrito desaparece, preferência de skin permanece. | ☐ | ☐ | |
| Responder tópico | Enviar um post de teste e conferir uma única publicação. | ☐ | ☐ | |
| Criar tópico | Criar em área de testes; título, categoria e conteúdo corretos. | ☐ | ☐ | |
| Editar | Editar post de teste, manter ID/HTML e anexos. | ☐ | ☐ | |
| Citar | Abrir citação com texto/autor corretos; retornar ao post citado. | ☐ | ☐ | |
| Excluir | Excluir somente post descartável de teste; confirmação nativa presente. | ☐ | ☐ | |
| Moderação | Mover/bloquear/desbloquear tópico descartável; menus e permissões nativos. | ☐ | ☐ | |
| Perfil | Abrir perfis; avatar circular, campos e links funcionais. | ☐ | ☐ | |
| Preferências | Abrir e salvar preferência reversível; campos nativos corretos. | ☐ | ☐ | |
| Mensagens privadas | Enviar à própria conta ou conta de teste; ler/responder; sem duplicação. | ☐ | ☐ | |
| Busca | Pesquisar termo público e restrito; somente resultados autorizados. | ☐ | ☐ | |
| Paginação | Página 1, próxima/anterior, última, links diretos e âncoras de mensagens. | ☐ | ☐ | |
| SCEditor | Digitar, alternar fonte/visual, BBCode, imagens, spoiler; menus acessíveis. | ☐ | ☐ | |
| Preview | Pré-visualizar e retornar; texto/formatação sem perda; sem envio automático. | ☐ | ☐ | |
| Rolagens/dados | Padrão, Vantagem, Desvantagem; acrescentar/remover dado; quantidade e resultado corretos. | ☐ | ☐ | |
| DIGIMON BONDS APP | Botão original abre destino esperado e não duplica a ação. | ☐ | ☐ | |
| Templates autorais | Mundo Humano/Digital: HTML, cores, imagens, links e spoiler preservados. Sistemas recebe skin. | ☐ | ☐ | |
| Mobile | Repetir editor, dados e navegação em ~390px; sem rolagem global. | ☐ | ☐ | |

## USUÁRIO COMUM

| Teste | Resultado esperado | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|:---:|:---:|---|
| Login/logout | Preferência deste navegador mantida; conteúdos/permissões acompanham a sessão real. | ☐ | ☐ | |
| Responder | Publicar uma única resposta no tópico de testes. | ☐ | ☐ | |
| Criar tópico | Criar apenas onde permitido; áreas proibidas continuam proibidas. | ☐ | ☐ | |
| Editar próprio post | Texto e template preservados; não ganha permissão sobre post de terceiros. | ☐ | ☐ | |
| Citar | Autor/texto corretos e link para mensagem original. | ☐ | ☐ | |
| Perfil | Campos e links preservados; rótulo visual não altera grupo. | ☐ | ☐ | |
| Mensagens privadas | Ler/enviar/responder em contas de teste; destinos corretos. | ☐ | ☐ | |
| Busca | Resultados limitados às permissões da conta. | ☐ | ☐ | |
| Paginação | Trocar página e usar âncoras/citações sem regressão. | ☐ | ☐ | |
| SCEditor e preview | Editar nos dois modos, prever e enviar sem perder formatação. | ☐ | ☐ | |
| Rolagens/dados | Testar os três modos, quantidade, adicionar/remover e resultado. | ☐ | ☐ | |
| Templates autorais | Template largo rola internamente; não corta controles nem altera imagens. | ☐ | ☐ | |
| Mobile | Repetir resposta/editor/perfil/MP em ~390px. | ☐ | ☐ | |

## VISITANTE

| Teste | Resultado esperado | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|:---:|:---:|---|
| Home | Hero/cards, conectados agora e widget fallback carregam sem autenticação. | ☐ | ☐ | |
| Categorias públicas | Abrir categorias/subfóruns; links e contadores corretos. | ☐ | ☐ | |
| Tópicos públicos | Posts/templates legíveis, dados compactos, sem moldura antiga nos anúncios. | ☐ | ☐ | |
| Busca pública | Acesso e resultados conforme regra original do fórum. | ☐ | ☐ | |
| Login | Abrir formulário; validação e destino nativos. | ☐ | ☐ | |
| Cadastro | Abrir formulário; campos e regras originais. Não é necessário concluir conta. | ☐ | ☐ | |
| Navegação geral | App, home, migalhas, perfil público, paginação e rodapé. | ☐ | ☐ | |
| Restrições | Áreas privadas permanecem inacessíveis; não aparecem no feed. | ☐ | ☐ | |
| Mobile | Home/listagem/tópico/login a ~390px sem rolagem horizontal global. | ☐ | ☐ | |

## Ativação, falhas e rede — em cada perfil

| Teste | Resultado esperado | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|:---:|:---:|---|
| Sem parâmetro e sem preferência | Skin 2.0 e seletor, sem preferência prévia. | ☐ | ☐ | |
| ?bondsos=1 | Seleciona e salva 2.0; páginas seguintes mantêm a escolha. | ☐ | ☐ | |
| ?bondsos=0 | Skin original; preferência 1 salva; navegação seguinte original. | ☐ | ☐ | |
| Storage bloqueado | Default 2; URL/seletor funciona no reload atual; sem persistência entre páginas comuns. | ☐ | ☐ | |
| CSS bloqueado no DevTools | Original mantida; preferência preservada; seletor disponível. | ☐ | ☐ | |
| JS bloqueado no DevTools | CSS/classes removidos; original utilizável. | ☐ | ☐ | |
| Rede pendente | Rollback após 20s por recurso; sem ciclo de recargas. | ☐ | ☐ | |
| Loader duplicado | Um CSS, um JS, um hero, um painel, sem handlers duplicados. | ☐ | ☐ | |
| Feed e Atualizar | Inicia após load/idle; até três consultas simultâneas; timeout 12s; máximo 21; sem polling. | ☐ | ☐ | |
| Feed após logout | Página nova não reutiliza cache privado anterior; permissões de visitante respeitadas. | ☐ | ☐ | |
| Feed indisponível | Widget Últimos assuntos visível; nenhum acesso extra. | ☐ | ☐ | |
| Console | Identificar origem: Bonds OS ou Forumeiros/anúncio/terceiro; registrar URL e mensagem sem dados sensíveis. | ☐ | ☐ | |

## Critério para encerrar o beta

Bloquear avanço se houver envio duplicado, permissão indevida, perda de texto/template, controles inacessíveis, erro relevante da skin, rolagem global causada pela skin ou rollback inoperante. Se falhar, usar ?bondsos=0 e desativar o loader no painel se necessário.

Beta pública com padrão 2.0 foi autorizada; instalação permanece manual pelo responsável. Encerramento do beta/produção estável depende dos resultados reais.

## Correções visuais finais

| Teste | Resultado esperado | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|:---:|:---:|---|
| Navegação lenta / cache vazio | Com loader no head, não pinta a moldura bege; conteúdo continua visível durante espera e falha. | ☐ | ☐ | |
| Mundo Humano / Digital com subfóruns | Sem lista “Nenhuma mensagem” redundante; subfóruns permanecem acessíveis. | ☐ | ☐ | |
| Subfórum realmente vazio | Aviso de vazio permanece; botão criar segue permissão original. | ☐ | ☐ | |
| Estrela em Ascensão / Sistemas | Arte corrigida, sem deformação, com alpha e proporção preservada. | ☐ | ☐ | |

## Beta2 — inspeção dos refinamentos

| Caso | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|---|---|
| Home sem sumário, textos novos, cena integrada da comunidade e visor claro | | | |
| Novo tópico à esquerda em Sistemas, Arquivos e cada área permitida | | | |
| Responder/criar/editar sem título antigo ou faixa bege | | | |
| Horário, citar, editar, excluir e demais opções nativas no cabeçalho | | | |
| Links e permissões dos controles mantidos após troca de página | | | |
| Avatar/nome mantidos, templates de jogadores intactos | | | |

## Beta3

| Caso | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|---|---|
| Rolagem mostra solicitante; resultado e permissões nativos intactos | | | |
| Perfil ausente na página usa inicial, sem foto errada | | | |
| Feed mostra solicitante da rolagem automática | | | |
| Parceiros/paisagens novos e cena da comunidade legíveis em desktop/celular | | | |

## PUBLIC BETA — seletor e transporte

| Teste | PASSOU | FALHOU | OBSERVAÇÃO |
|---|---|---|---|
| Sem preferência abre 2.0; escolha 1.0 persiste em outra página/aba | | | |
| Troca 2→1 e 1→2 salva e recarrega, sem resíduos | | | |
| Clássica sem CSS/JS/loading Bonds OS, somente seletor | | | |
| Botão App original intacto e sem sobreposição em desktop/390px | | | |
| Teclado, setas, ESC, clique fora e opção ativa acessíveis | | | |
| Falha CSS/JS mantém preferência e botão para tentar novamente | | | |
| Falha parcial recarrega uma vez; clássico sem loop | | | |
| Loader indisponível remove loading temporário após 12s | | | |
