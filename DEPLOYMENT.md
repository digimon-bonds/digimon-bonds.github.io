# Produção no GitHub Pages

O README original foi preservado. A aplicação é HTML/CSS/JavaScript com ES modules, sem Vite ou dependências npm de execução.

- `site/`: fonte integral do Character Creator e assets.
- `scripts/build.mjs`: build estático para `dist/`, na raiz de https://digimon-bonds.github.io/.
- `.github/workflows/pages.yml`: teste, build e publicação a cada push para main.
- `server/`: fonte do serviço existente de imagens/fichas, mantido na hospedagem atual (Cloudflare Worker + R2). GitHub Pages não executa esse código.

## Build

Node 24: `npm ci`, `npm test`, `npm run build`. O build só recria `dist/` neste checkout. Nada é removido de `site/`.

## Forumeiros

`site/hosting.js` envia as três rotas `/api/*` ao serviço existente em https://bonds-character-app.mateuzim-alves.chatgpt.site quando a interface roda no GitHub Pages. O backend permite CORS especificamente para https://digimon-bonds.github.io. Os posts e PNGs permanecem persistentes no R2 existente; a hospedagem antiga deve continuar ativa. Não há segredos de infraestrutura nem senha do narrador nos arquivos estáticos ou workflows.

## Dados locais

Chaves e comportamento do localStorage permanecem iguais. Navegadores isolam dados por domínio: para levar uma ficha do endereço antigo ao GitHub Pages, use EXPORT JSON no antigo e IMPORT JSON no novo. Não apagar nem sobrescrever dados do endereço antigo.

## GitHub

Settings → Pages → Source: GitHub Actions. O workflow não usa subdiretório de projeto e publica apenas dist/. Configurações do backend não são publicadas como arquivos estáticos.

## Cenas de batalha

O build inclui a interface do Battle Scene em `dist/battle/`. O card da página inicial abre `/battle/scenes.html` no próprio GitHub Pages. Todas as páginas e artes do Battle Link são publicadas nesse domínio. Apenas as chamadas de API vão ao serviço existente, com CORS limitado à origem exata do GitHub.

`server/battle-api.mjs` usa o R2 existente para sessões temporárias do narrador, cards e estados independentes por cena. A senha é validada no servidor. O estado usa revisão, identificador de solicitação e gravação condicional por ETag; uma atualização concorrente é rejeitada e retorna o estado salvo. Nenhum estado de teste de `.battle-state/` entra no build.

Ao publicar o serviço, inclua `server/battle-api.mjs` e os módulos importados de `prototypes/battle-scene/`. Preserve o binding R2 BUCKET. A interface de produção abre `https://digimon-bonds.github.io/battle/scenes.html`. No GitHub, a sessão temporária do narrador fica em sessionStorage e é enviada via Authorization; a identificação aleatória do navegador fica em localStorage para preservar o controle após F5. Na origem do serviço, os cookies HttpOnly existentes continuam funcionando. Tokens não vão em URLs. Não depende de cookies de terceiros.

A integração com contas e propriedade real das fichas continua pendente. O acesso do narrador usa uma sessão de 12 horas; o botão Criar cena pede novamente sua senha. Cada cena recebe um link próprio. O campo de fundo personalizado é refletido no card da galeria.
