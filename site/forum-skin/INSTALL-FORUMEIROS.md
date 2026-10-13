# Instalar BONDS OS — beta pública controlada

Versão: 20261013-10-public-beta7. A instalação é manual; esta entrega não alterou o painel. Depois de instalar, visitantes sem preferência recebem a Skin 2.0.

## Antes de começar

Salve uma cópia dos códigos atuais do fórum. Desative somente os loaders experimentais antigos do BONDS OS para evitar concorrência. Não altere o botão DIGIMON BONDS APP, o CSS clássico, templates ou os outros códigos.

## Passo a passo

1. Entre no Painel de Controle do Forumeiros com sua conta administradora.
2. Abra **Módulos → HTML & JavaScript → Gestão dos códigos JavaScript**.
3. Mantenha **Gestão dos códigos JavaScript ativada: Sim**. Não desative o gerenciamento geral, pois o App e outros scripts dependem dele.
4. Edite o JavaScript existente **BONDS OS — Interface pública**; não crie um segundo loader.
5. Em Título, escreva **BONDS OS — Interface pública**.
6. Em Investimento/Localização, marque **Todas as páginas**. Deixe as opções individuais desmarcadas. Nenhuma outra opção especial é necessária.
7. No campo de código, cole EXATAMENTE o bloco abaixo, sem adicionar tags `<script>`.
8. Clique em **Confirmar/Salvar**, conforme o botão apresentado pelo painel.

```javascript
/* BONDS OS — copiar este arquivo no Forumeiros: Todas as páginas. */
(function(){
  if(document.getElementById('bonds-os-loader'))return;
  var q=new URLSearchParams(location.search).get('bondsos'),v='2',f='';
  try{var p=localStorage.getItem('bondsSkinVersion');if(p==='1'||p==='2')v=p;}catch(_){}
  try{f=sessionStorage.getItem('bondsSkinFailsafe')||'';}catch(_){}
  if(q==='0')v='1';if(q==='1'&&f!=='once'){v='2';f='';}
  var s=document.createElement('script'),c,t;s.id='bonds-os-loader';
  function clear(){clearTimeout(t);document.documentElement.classList.remove('bonds-bootstrap-loading');if(c)c.remove();}
  if(v==='2'&&!f&&q!=='fallback'){
    c=document.createElement('style');c.id='bonds-bootstrap-critical';
    c.textContent='html.bonds-bootstrap-loading,html.bonds-bootstrap-loading body{background:#0b202b!important;color:#dcebf0!important}html.bonds-bootstrap-loading :is(#wrap,#page-body,#main-content,.headerbar,.post,.postbody,.postprofile,.panel,.forabg,.forumbg,.navbar){background-color:#0b202b!important;background-image:none!important}html.bonds-bootstrap-loading #page-header .navbar{visibility:hidden!important}html.bonds-bootstrap-loading #wrap{opacity:0!important;pointer-events:none!important}';
    document.head.appendChild(c);document.documentElement.classList.add('bonds-bootstrap-loading');
  }
  s.src='https://digimon-bonds.github.io/forum-skin/forumeiros-loader.js?v=20261013-10-public-beta4';
  function cancel(){s.dataset.bondsCancelled='1';s.remove();clear();}
  s.onload=clear;s.onerror=cancel;t=setTimeout(cancel,12000);document.head.appendChild(s);
}());
```

## Testar

Abra https://digimonbonds.forumeiros.com/?bondsos=1 para selecionar 2.0 e gravar a preferência. Recarregue uma página normal do fórum. No canto superior direito, VERSÃO DA SKIN abre o menu; a opção ativa tem o círculo preenchido. Teste 1.0 e depois 2.0. Cada troca salva e recarrega a página; salve seus rascunhos antes de trocar.

Sem preferência, a versão é 2.0. A escolha fica neste navegador/origem em localStorage, chave bondsSkinVersion, valores 1 e 2; acompanha login/logout, sem modificar permissões. Se o storage for bloqueado, o padrão continua 2.0; o seletor usa o parâmetro da URL na página atual para manter a escolha durante o reload. Links seguintes sem parâmetro voltam ao padrão quando não há storage.

Para minimizar a primeira pintura bege, o bootstrap deve executar cedo, no head gerado pelo gerenciador em Todas as páginas. Ele mantém o fundo escuro e oculta temporariamente #wrap durante o carregamento, impedindo que logo, banner e conteúdo clássicos apareçam antes da nova skin. A proteção passa do bootstrap ao loader sem intervalo e é removida quando a skin fica pronta ou ocorre falha/timeout. Na clássica não aplica esse fundo. Código injetado tarde por outra ferramenta não consegue impedir uma pintura que já ocorreu.

Execute BETA-CHECKLIST.md com admin, conta comum e visitante. Testes locais não comprovam SCEditor, moderação, envios, MP ou dados em sessão real. Verifique também a largura móvel de 390px.

## Voltar à clássica imediatamente

Abra https://digimonbonds.forumeiros.com/?bondsos=0 — isso seleciona e salva a Skin 1.0, mantendo o seletor disponível.

## Desativar completamente em emergência

Volte à Gestão dos códigos JavaScript e desative/remova somente **BONDS OS — Interface pública**; recarregue o fórum. Não desative o gerenciamento JavaScript geral nem o código do App. O CSS clássico nunca foi removido, portanto volta naturalmente.

## Falhas temporárias

Falha/timeout CSS ou JS: remove os recursos e loading da camada, mostra a clássica e mantém o seletor. A preferência permanente não é apagada. Falha após DOM parcial: marca recuperação em sessionStorage e recarrega uma vez; a página seguinte fica clássica, sem loop. O usuário pode tentar 2.0 novamente pelo seletor ou diagnóstico. Sem sessionStorage, usa internamente bondsos=fallback, sem gravar preferência 1.

Falha do transporte do loader: remove o fundo temporário em até 12s e mantém o fórum nativo. Nesse caso o seletor depende do loader voltar a responder; use a URL clássica ou desative o bootstrap no painel.

## Atualizações futuras

O código do painel só carrega o loader hospedado. Atualizações normais de CSS/JS/loader não exigem colar código novamente; a revisão do loader controla o cache de CSS/JS. O bootstrap usa um identificador explícito, sem Date.now. O cache do GitHub Pages pode reter o loader por alguns minutos; use Ctrl+F5 ao validar um deploy novo.

## Revisão de acabamento

Nesta revisão é necessário substituir uma vez o bootstrap existente pelo bloco acima: a faixa clássica aparece antes do download do loader, e a URL anterior do próprio loader pode permanecer em cache. A nova chave explícita atualiza loader, CSS e JS. Apenas publicar os arquivos não invalida o loader já armazenado no navegador. Não foram feitas alterações no painel nesta entrega.

## Correção do frame de transição

A revisão public-beta3 oculta o invólucro nativo durante as duas etapas do carregamento. A mudança no bootstrap é necessária porque o logo antigo aparece antes de o loader remoto chegar. Substitua somente o bootstrap BONDS OS existente; não altere o CSS clássico, templates ou App.

## Atualização public-beta5

Se já instalou o bootstrap public-beta4 com proteção do frame inicial, mantenha-o. Esta revisão altera somente os recursos hospedados e a chave CSS/JS do loader. O loader já armazenado em cache pode levar alguns minutos para atualizar; Ctrl+F5 força a revalidação no navegador em uso. Não crie outro bootstrap.


## Atualização public-beta6

Mantenha o bootstrap atual. Esta revisão restringe capas aos mundos e protege a estrutura dos posts contra tags de formatação não fechadas por templates.


## Atualização public-beta7

Refinamento do template de leitura em Sistemas e destaque dos nomes dos arquétipos. Mantenha o bootstrap instalado. A revisão do loader atualiza as URLs de CSS e JavaScript.
