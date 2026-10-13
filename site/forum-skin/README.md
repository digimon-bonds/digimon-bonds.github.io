# BONDS OS v10 — BETA CONTROLADO

Versão do loader: **20261013-10-beta2**. Beta2 inclui os refinamentos visuais e de texto solicitados, preservando mecânicas e templates de jogadores.

## Ativação e limites

- Ativar: https://digimonbonds.forumeiros.com/?bondsos=1
- Desativar: https://digimonbonds.forumeiros.com/?bondsos=0
- Preferência em sessionStorage, restrita à sessão da aba. Login/logout na mesma aba mantém a preferência; isso NÃO significa manter autorização ou dados privados.
- Sem ativação, o loader não adiciona nós, classes, listeners nem requests da skin. Nenhum módulo do App importa o loader.
- Se o storage estiver bloqueado, a URL explícita funciona naquela página; a navegação seguinte sem parâmetro fica na skin original.
- O parâmetro não é controle de acesso: qualquer pessoa que souber a URL pode ativar o beta. O fórum continua controlando permissões e conteúdos. “Controlado” significa adesão voluntária, não autenticação privada.

## Publicação e instalação pelo responsável

O build normal copia site/ para dist/ e inclui forum-skin/ automaticamente. O workflow Pages executa testes e build no push para main. Não há necessidade de alterar App, workflow ou configurações do Forumeiros para hospedar os estáticos.

Entradas HTTPS:

- https://digimon-bonds.github.io/forum-skin/bonds-os.css
- https://digimon-bonds.github.io/forum-skin/bonds-os.js
- https://digimon-bonds.github.io/forum-skin/forumeiros-loader.js

Após conferir a publicação, salvar uma cópia dos códigos atuais no painel Forumeiros e colar SOMENTE o conteúdo de forumeiros-loader.js em Gestão dos códigos JavaScript, todas as páginas. Desativar qualquer loader experimental duplicado. Não colar CSS da skin no CSS global nem substituir templates do fórum. A instalação será feita pelo responsável, não por esta entrega.

BASE_URL e VERSION estão no início do loader. Mantenha a versão da entrega ao instalar; para nova entrega, troque VERSION. Assets convertidos têm nomes novos e imutáveis nesta versão. Arquivos autorais dos jogadores permanecem nos endereços originais.

## Rollback

1. Para sair do beta, abrir ?bondsos=0 no fórum. A navegação recarrega o documento nativo e remove a preferência da sessão.
2. Se houver erro persistente, desativar o loader no painel e recarregar a aba. A skin original e os demais scripts não foram removidos.
3. Em falha de download/timeout CSS ou JS (20s por recurso), o loader remove seus recursos/classes e limpa a preferência.
4. Se houver falha de inicialização após reorganizar o DOM, a página é recarregada uma vez com ?bondsos=0 para recuperar os nós/handlers originais. Não se tenta reconstruir formulários por clonagem.
5. Carregamentos duplicados são bloqueados por IDs dos recursos, estado de inicialização e proteção do evento de CSS.

Falha do feed não desativa a skin: o widget nativo permanece disponível. O rollback de DOM parcial acontece durante inicialização, antes da interação; o loader não intercepta submissões. Nenhum rollback modifica banco de dados, permissões ou posts.

## Últimos Posts e orçamento de rede

Antes: inicia junto da montagem da home; normalmente 11 consultas, máximo 21.
Depois: espera window.load e requestIdleCallback (limite de espera 2s), com setTimeout de 250ms onde idle não existe. O botão Atualizar pode antecipar a consulta e cancela a tarefa pendente.

Uma busca /search?search_id=latest, até 10 últimas páginas de tópicos, até 10 páginas anteriores quando a última tem menos de 10 mensagens. Fórmula: **1 + T + P**, 0 ≤ P ≤ T ≤ 10; normalmente 11, máximo 21 por atualização. Até três requisições simultâneas, timeout individual 12s. Sem polling, proxy, backend novo ou cache persistente.

URLs iguais (ignorando âncora) compartilham a mesma promessa dentro da atualização. Cliques durante atualização não disparam outro lote. Cada nova atualização tem cache novo. Credenciais e mode same-origin impedem consultas a outra origem, inclusive em redirect. As respostas HTML são analisadas em documento inerte: scripts remotos não são executados. Conteúdo é limitado ao que a sessão do fórum consegue acessar.

Dez mensagens ordenadas pelo ID, eliminando apenas IDs repetidos, com autores repetidos/tópicos repetidos permitidos. A lista aparece progressivamente. Falhas parciais são indicadas; sem mensagens válidas, o widget nativo fica aberto. A prévia estática usa amostra identificada e não comprova a rede/sessão real.

## Compatibilidade

A skin reorganiza nós existentes e preserva handlers por referência. Não troca name/action de inputs/forms, não instala handlers nativos, não intercepta submit, não altera mecânica de dados nem grupos/permissões. Eventos próprios usam nomes bonds-os-ready / bonds-os-failed. Não há MutationObserver nem polling.

Grupos 2 e 3 são apenas heurísticas de apresentação (Narrador e Digiescolhido). data-profile-type pode substituir o rótulo visual. Não concedem nenhum acesso.

Templates de jogadores não são reescritos: o tratamento interno de conteúdo fica em Sistemas. Templates com tinta escura e fundo transparente/inválido recebem uma base clara externa para conservar legibilidade. Imagens de dados automáticos ficam compactas; imagens autorais conservam seus tamanhos. Templates fixos podem rolar dentro do post no celular.

O CSS é opt-in, prefixado por html.bonds-os-preview. SCEditor, seletor de rolagens, botões de moderação, responder/criar/editar/citar/excluir, mensagens e preferências continuam pertencendo ao Forumeiros. A preservação desses contratos por código NÃO comprova funcionamento autenticado. Execute [BETA-CHECKLIST.md](./BETA-CHECKLIST.md).

## Assets e verificação

[ASSETS.md](./ASSETS.md) registra tamanhos e comparação lossless. Hero e vetores mantidos. Não foram alteradas imagens autorais dos posts.

Testes do loader, feed e contratos fazem parte de scripts/forum-*.test.mjs e do npm test normal. Build: npm run build. [BETA-REPORT.md](./BETA-REPORT.md) separa validação local de pendências reais. Warnings do Forumeiros/anúncios/terceiros devem ser classificados pela origem do erro; não são automaticamente bugs da skin.

## Correções finais solicitadas

O loader injeta CSS crítico síncrono apenas no opt-in, antes de buscar a skin: superfícies estruturais escuras sem molduras/imagens antigas. Não oculta o body; é removido no ready e no rollback. Para impedir a primeira pintura bege, o loader precisa executar no head antes da pintura (gerenciador JavaScript do Forumeiros em todas as páginas), e não ser injetado tardiamente por extensão/rodapé. A hospedagem isoladamente não corrige carregamento tardio.

Nas páginas com subfóruns, oculta somente a lista vazia “Nenhuma mensagem”; fóruns realmente vazios conservam seu aviso. A imagem aprovada de Estrela em Ascensão em Sistemas recebe uma versão com rosto corrigido; nenhuma imagem de jogador é substituída.

## Refinamentos beta2

Resumo de categorias removido da abertura; textos atualizados. Controles nativos de criar/responder ficam em card à esquerda. Horário e opções já fornecidas pelo fórum são movidos por referência ao cabeçalho do post; nenhuma permissão ou URL é criada. Estruturas antigas do editor recebem reset fora dos conteúdos de jogadores. Visor do celular mais claro e pôster fornecido integrado à comunidade. Instalações do beta1 devem substituir o loader pelo desta entrega para usar o cache bust 20261013-10-beta2.
