# Exclusão persistente de cenas

DELETE /api/scenes?id=<sceneId> reutiliza o mesmo token/cookie e a mesma verificação de expiração do Narrador. Exige origem permitida, valida validSceneId(), verifica a existência e remove battle/scenes/<id> e battle/cards/<id> pelo R2 Bucket.delete(). Sucesso: 200. Ausente: 404. ID inválido: 400. Sem sessão válida ou origem indevida: 403.

GET /api/scenes passa a ser público, para entrar no Battle Link sem senha. POST e as demais permissões permanecem como antes. A interface exige ID 1 do fórum e sessão de Narrador para mostrar exclusão; dentro da arena, o botão pertence à aba Narrador. A confirmação usa o nome da cena, e o card só é removido após sucesso persistente.

Conforme decisão do usuário nesta tarefa, permanece a autenticação atual de Narrador até existir comprovação da sessão do fórum no servidor. O ID vindo do iframe não é aceito pelo endpoint como substituto do token/cookie. Não foi criado outro login. A sessão atual não comprova, por si só, um ID do fórum ao servidor.

Publicar primeiro o Worker persistente e depois o frontend GitHub. A interface verifica capabilities.sceneDeletion para não liberar um endpoint ausente. O envio de credenciais ao helper oficial Sites foi rejeitado pela revisão automática nesta sessão; o backend não foi publicado. Não publicar somente o frontend: a listagem pública depende da atualização do backend.

Validação: node --test --test-isolation=none scripts/*.test.mjs prototypes/battle-scene/*.test.mjs; npm run build. Testes usam armazenamento em memória descartável, sem apagar cenas reais.
