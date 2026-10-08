# Fichas públicas, contas e permissões

O laboratório atual não autentica ninguém. Seus controles locais de narrador servem apenas para testar; não são uma autorização segura para partidas reais.

## Leitura das fichas

O adaptador local já reconhece o código de restauração do Bonds já presente nas fichas, recuperar a ficha completa, identificar o perfil proprietário e trazer o avatar público. Fichas clássicas devem passar pelo importador existente e por revisão quando houver campos ambíguos. O vínculo futuro deve registrar `forumUserId`, URL da ficha, data/versão de origem, retrato, formas e atributos. A identidade de uma ficha pública não prova que o visitante é seu dono.

O Digibank fornece espécies e imagens para a criação de NPCs. A ficha de batalha copia uma versão desses dados; selecionar a espécie não deve modificar o banco nem desbloquear formas ou sobrescrever atributos personalizados da ficha real.

## Login e vínculo

GitHub Pages hospeda arquivos estáticos: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages . Autorizações definitivas precisam de um serviço no servidor. Não é possível confiar numa opção local de administrador, num nome digitado ou em um avatar como prova de login.

Ainda não foi confirmado um mecanismo atual de SSO/API de autenticação suportado pelo Forumeiros. O tópico oficial de suporte https://help.forumotion.com/t162274-forum-api registra em 2023 a ausência de API formal; isso não confirma a disponibilidade atual de SSO. Antes de prometer login automático, verificar as opções reais do painel administrativo e obter um mecanismo de validação no servidor. Se não existir, usar uma conta Bonds vinculada uma vez ao perfil do fórum por verificação de propriedade/administração. Nenhuma senha do fórum deve ser coletada pelo App.

## Autoridade do combate

Cada partida deve guardar IDs de participantes e seus proprietários. O servidor valida a sessão e aceita a ação apenas do proprietário, ou de um narrador autorizado. Omegamon recebe o papel administrativo por seu ID de perfil verificado; o texto do nome não concede privilégios. Administrador pode adicionar/remover combatentes e NPCs; jogador controla somente os seus. Toda edição fica no histórico da partida.

Rolagens finais, perda de PL, PV e bloqueios de turno são transações do servidor, com ID de ação para impedir repetições e um registro versionado. Nunca aceitar o resultado de dados fornecido pelo navegador como resultado oficial. Cancelar uma confirmação não cria transação. Reenvios e duas abas não podem consumir a mesma ação duas vezes.

## Critérios para integrar

Validar ficha/avatar e versão antes de iniciar; testar troca de dono, acesso de visitante, jogador tentando usar ID alheio, narrador sem autorização, falsificação de papel, duas ações simultâneas e reenvio. Migrar o motor puro sem alterar o Creator/Digibank. Esta etapa não foi ativada nem publicada.

## Implementação local atual

A resolução possui três confirmações separadas: revisão do atacante, reação/revisão do defensor e aplicação do resultado. A escolha de gastar 3 PL para evitar zero pertence ao defensor. Essas etapas estão preparadas no motor local; compartilhar a cena entre computadores ainda exige servidor autoritativo, armazenamento da partida, identidade verificada e transporte das atualizações. O bloqueio por senha do Narrador não implementa essa sincronização.

`forum-service.mjs` consulta a categoria pública e restringe cada leitura aos tópicos ali encontrados, no domínio fixo do fórum. Não envia credenciais, cookies ou dados da batalha. As páginas são interpretadas em documento inerte, sem montar HTML ou executar scripts externos. O adaptador reutiliza a recuperação e normalização de fichas do Creator, servido somente como dependência de leitura: o Creator e o Digibank não foram modificados nesta etapa. A ficha importada é uma cópia local; editar ou combater não muda sua origem. Foram reconhecidas as 30 fichas públicas presentes em 7/10/2026, com avisos quando faltam ataques ou há efeitos não suportados. Isso não prova propriedade de conta.
