# Identidade do Battle Link

A ponte `forum-app-bridge.js` é carregada pelo loader existente nas duas skins. Ela reutiliza `#db-app-frame` do overlay instalado e `_userdata` da sessão nativa. Não cria iframe nem login adicional.

O App aceita mensagens exclusivamente da origem https://digimonbonds.forumeiros.com e de seu parent; o fórum exige a origem https://digimon-bonds.github.io e o contentWindow do iframe existente. As respostas carregam o requestId da solicitação. Nenhuma identidade vem da URL ou do armazenamento local.

A importação lê o ID do perfil do autor do post da ficha; páginas públicas sem link de perfil usam o autor do DiscussionForumPosting JSON-LD. ID e nome são preservados em source, humano e participante. Cenas antigas recuperam metadados no fórum durante a sessão. O ID 1 (Omegamon) é a exceção de interface; nome igual não concede acesso. As permissões atuais de narrador e as regras de combate continuam vigentes.

Esta é uma integração de identidade e interface. postMessage validado não é uma credencial assinada de servidor. Os endpoints existentes continuam usando suas próprias sessões e claims; autorização contra clientes adulterados exigirá uma identidade comprovada no servidor. Cenas abertas diretamente fora do overlay ficam sem controles de jogador até serem abertas pelo App do fórum.
