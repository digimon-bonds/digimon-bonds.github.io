# Digi-Pet — etapa 1: protótipo visual

## Abrir localmente

Abra `index.html` diretamente no navegador. A sala, as animações e os quatro botões funcionam offline, sem instalação.

Para usar um servidor local, com Node.js disponível:

```powershell
node serve.mjs
```

Abra http://127.0.0.1:4231. Encerre com Ctrl+C. Se estiver na raiz do repositório, use `node prototypes/digi-pet/serve.mjs`.

## Composição

Sala própria em navy e azul-petróleo, janela digital, terminal CRT discreto, almofada, planta e brinquedo. Cyan na iluminação e âmbar em pequenos detalhes. Agumon centralizado sobre um piso em perspectiva; respiração, sombra e partículas suaves. Interface curta com nome, espécie, estágio e um indicador visual de link estável. Todos esses elementos são demonstrativos.

Comida, Brincar, Treinar e Conversar mostram frases por 3,2 segundos e uma reação visual. Não alteram atributos nem gravam estado. O botão de ampliação usa tela cheia do navegador quando disponível; Esc sai. Não há áudio. A preferência do sistema por movimento reduzido desativa animações.

## Arquivos

- `index.html`: estrutura semântica da experiência e ícones vetoriais locais.
- `digi-pet.css`: composição, responsividade, estados e animações.
- `digi-pet.js`: objeto `mockPartner`, função `renderPartner` e feedback temporário.
- `assets/room.svg`: cenário vetorial original, editável separadamente.
- `assets/agumon.png`: placeholder reutilizado de `site/assets/partner-cutouts/agumon.png` do Bonds; permanece arte do personagem original, sem reivindicação de autoria.
- `serve.mjs`: servidor estático opcional, limitado a `127.0.0.1:4231`.
- `README.md`: acesso e escopo.

## Limite da etapa

O objeto mock é somente uma entrada de apresentação, sem constituir um modelo permanente de personagem. A imagem pode ser trocada pela propriedade `image`; `renderPartner(partner)` concentra a apresentação dos dados. Integração futura exige autorização e definição do contrato real.

Sem APIs, backend, autenticação, armazenamento, ficha, XP, Laço ou regras. Nenhuma alteração em módulos existentes, build, publicação ou workflows. O protótipo fica em `prototypes/digi-pet`, fora do diretório `site` usado pelo build atual. Nada foi publicado, enviado ao GitHub ou mesclado.

## Verificação local

Conferido no Edge: 1440×900, 1366×768, 1024×650, 390×844 e 360×640, sem scroll e com os quatro botões visíveis. Verificados os quatro feedbacks, desaparecimento da mensagem, carregamento do PNG e uso por `file://`. Sem erros JavaScript ou requisições externas. Telas abaixo da altura mínima podem rolar para preservar a usabilidade.
