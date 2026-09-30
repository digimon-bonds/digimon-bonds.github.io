# Produção no GitHub Pages

O README original foi preservado. A aplicação é HTML/CSS/JavaScript com ES modules, sem Vite ou dependências npm de execução.

- `site/`: fonte integral do Character Creator e assets.
- `scripts/build.mjs`: build estático para `dist/`, na raiz de https://digimon-bonds.github.io/.
- `.github/workflows/pages.yml`: teste, build e publicação a cada push para main.
- `server/`: fonte do serviço existente de imagens/fichas, mantido na hospedagem atual (Cloudflare Worker + R2). GitHub Pages não executa esse código.

## Build

Node 24: `npm ci`, `npm test`, `npm run build`. O build só recria `dist/` neste checkout. Nada é removido de `site/`.

## Forumeiros

`site/hosting.js` envia as três rotas `/api/*` ao serviço existente em https://bonds-character-app.mateuzim-alves.chatgpt.site quando a interface roda no GitHub Pages. O backend permite CORS especificamente para https://digimon-bonds.github.io. Os posts e PNGs permanecem persistentes no R2 existente; a hospedagem antiga deve continuar ativa. Não há tokens no cliente nem nos workflows.

## Dados locais

Chaves e comportamento do localStorage permanecem iguais. Navegadores isolam dados por domínio: para levar uma ficha do endereço antigo ao GitHub Pages, use EXPORT JSON no antigo e IMPORT JSON no novo. Não apagar nem sobrescrever dados do endereço antigo.

## GitHub

Settings → Pages → Source: GitHub Actions. O workflow não usa subdiretório de projeto e publica apenas dist/. Configurações do backend não são publicadas como arquivos estáticos.
