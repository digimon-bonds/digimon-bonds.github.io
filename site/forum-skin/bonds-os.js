/* BONDS OS v10 — existing forum content stays the source of truth. */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('bonds-os-preview')) return;
  if (document.documentElement.dataset.bosInitialized) return;
  var scriptURL = document.currentScript && document.currentScript.src;
  var ASSETS = new URL('assets/', scriptURL || 'https://digimon-bonds.github.io/forum-skin/bonds-os.js').href;
  var LIMIT = 10;
  var descriptions = {
    4: ['Regras, mecânicas e informações para começar sua jornada.'],
    1: ['Histórias, registros e acontecimentos do universo Bonds.'],
    5: ['Fichas de personagens, parceiros e laços.'],
    6: ['Evolução, conquistas e atualizações da sua ficha.'],
    2: ['Explore cidades, encontre outros escolhidos e escreva sua história.'],
    3: ['Novos territórios, mistérios e encontros no Mundo Digital.'],
    8: ['Um tópico livre para teste de templates e outras ideias']
  };
  var categoryDescriptions = ['Seu primeiro passo no universo Bonds.', 'Cada laço deixa um registro.', 'Sua jornada acontece aqui', 'O encontro continua além da aventura.'];
  function make(tag, className, text) {
    var node = document.createElement(tag); node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function topicURL(ref) {
    try {
      var url = new URL(ref, location.origin);
      if (url.origin === location.origin && /^\/t\d+(?:p\d+)?(?:-|$)/.test(url.pathname)) return url;
    } catch (_) {}
    return null;
  }
  function rollActor(content) {
    if (!content || !content.textContent) return null;
    var match = content.textContent.trim().match(/^O membro\s+['“](.+?)['”]\s+realizou a seguinte ação:/);
    if (!match || !content.querySelector(':scope > div > hr') || !content.querySelector(':scope > div > img') || content.querySelector('table,style,article,section')) return null;
    return match[1].trim() || null;
  }
  function topicKey(url) { return url.pathname.match(/^\/t(\d+)/)[1]; }
  function pageOffset(url) { var m = url.pathname.match(/^\/t\d+p(\d+)/); return m ? Number(m[1]) : 0; }
  function parsePosts(doc, url, title) {
    var posts = [];
    // Old templates can close #main-content early; validate profile/anchor instead.
    doc.querySelectorAll('.post[id^="p"]').forEach(function (post) {
      var id = Number(post.id.slice(1));
      if (!Number.isSafeInteger(id) || id <= 0) return;
      var profile = post.querySelector('.postprofile[id="profile' + id + '"]');
      var name = profile && profile.querySelector('dt strong');
      var stamp = profile && profile.querySelector('.author');
      var anchor = stamp && stamp.closest('a[href]');
      var href = anchor && topicURL(anchor.getAttribute('href'));
      if (!name || !stamp || !href || href.hash !== '#' + id || topicKey(href) !== topicKey(url)) return;
      var actor = rollActor(post.querySelector('.postbody > .content'));
      posts.push({ id: id, title: title, author: actor || name.textContent.trim(), date: stamp.textContent.trim(), href: href.pathname + '#' + id });
    });
    return posts;
  }
  function newest(posts) {
    var seen = new Set();
    return posts.sort(function (a, b) { return b.id - a.id; }).filter(function (post) {
      if (seen.has(post.id)) return false;
      seen.add(post.id); return true;
    }).slice(0, LIMIT);
  }
  function readPage(url, cache) {
    if (url.origin !== location.origin) return Promise.reject(new Error('Origem não permitida'));
    var key = url.pathname + url.search;
    if (cache && cache.has(key)) return cache.get(key);
    var pending = fetchPage(url); if (cache) cache.set(key, pending);
    return pending;
  }
  async function fetchPage(url) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch(url.pathname + url.search, { credentials: 'same-origin', mode: 'same-origin', signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    } finally { clearTimeout(timeout); }
  }
  function topicsFrom(doc) {
    var result = [], seen = new Set();
    doc.querySelectorAll('ul.topics li.row').forEach(function (row) {
      var title = row.querySelector('a.topictitle');
      var latest = Array.from(row.querySelectorAll('.lastpost a[href]')).map(function (a) { return topicURL(a.getAttribute('href')); })
        .find(function (u) { return u && /^#\d+$/.test(u.hash); });
      if (!title || !latest || seen.has(topicKey(latest))) return;
      seen.add(topicKey(latest)); result.push({ url: latest, title: title.textContent.trim() });
    });
    return result.slice(0, LIMIT);
  }
  async function collectTopic(topic, cache) {
    var doc = await readPage(topic.url, cache), posts = parsePosts(doc, topic.url, topic.title);
    if (posts.length < LIMIT && pageOffset(topic.url) > 0) {
      var previous = Array.from(doc.querySelectorAll('.pagination a[href]')).map(function (a) { return topicURL(a.getAttribute('href')); })
        .filter(function (u) { return u && topicKey(u) === topicKey(topic.url) && pageOffset(u) < pageOffset(topic.url); })
        .sort(function (a, b) { return pageOffset(b) - pageOffset(a); })[0];
      if (previous) {
        try { posts = posts.concat(parsePosts(await readPage(previous, cache), previous, topic.title)); }
        catch (_) { posts.partial = true; }
      }
    }
    return posts;
  }
  function addActivity(aside) {
    var head = make('div', 'bos-activity-head');
    head.append(make('span', 'bos-eyebrow', 'DIGITAL LINK / INBOX'), make('h2', '', 'Últimos posts'));
    var refresh = make('button', 'bos-refresh', 'Atualizar ↻'); refresh.type = 'button';
    var status = make('p', 'bos-feed-status', 'Carregando as mensagens recentes…'); status.setAttribute('role', 'status');
    var list = make('ol', 'bos-post-stream');
    var fallback = make('details', 'bos-feed-fallback'); fallback.open = true;
    fallback.appendChild(make('summary', '', 'Últimos assuntos do fórum'));
    var native = document.querySelector('#f_widgets_col_1');
    if (native) fallback.appendChild(native);
    var hardware = make('div', 'bos-phone-hardware'); hardware.setAttribute('aria-hidden', 'true');
    hardware.append(make('span', 'bos-phone-speaker'), make('span', 'bos-phone-camera'));
    var screen = make('div', 'bos-phone-screen'), scroll = make('div', 'bos-phone-scroll');
    scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', 'Mensagens recentes — role para ver mais');
    scroll.append(list, fallback); screen.append(head, refresh, status, scroll);
    var home = make('div', 'bos-phone-home'); home.setAttribute('aria-hidden', 'true');
    aside.append(hardware, screen, home);
    function render(posts) {
      list.replaceChildren();
      newest(posts).forEach(function (post, index) {
        var item = make('li', 'bos-stream-entry'); item.dataset.postId = String(post.id);
        var number = make('span', 'bos-stream-number', String(index + 1).padStart(2, '0')); number.setAttribute('aria-hidden', 'true');
        var body = make('div', 'bos-stream-body'), topic = make('a', 'bos-stream-topic', post.title); topic.href = post.href;
        body.append(make('span', 'bos-stream-author', post.author), topic, make('span', 'bos-stream-date', post.date));
        item.append(number, body); list.appendChild(item);
      });
    }
    var loading = false, scheduled = null;
    async function load() {
      if (loading) return; loading = true;
      if (scheduled) { scheduled(); scheduled = null; }
      refresh.disabled = true; aside.setAttribute('aria-busy', 'true');
      try {
        var snapshot = document.querySelector('#bos-recent-snapshot');
        if (snapshot) {
          render(JSON.parse(snapshot.textContent)); status.textContent = 'Amostra pública capturada para esta prévia local.';
          fallback.open = false; return;
        }
        var cache = new Map(); // Per update only: never reuse another login/session's content.
        var topics = topicsFrom(await readPage(new URL('/search?search_id=latest', location.origin), cache));
        if (!topics.length) throw new Error('Nenhum tópico acessível');
        var collected = [], errors = 0, cursor = 0;
        async function worker() {
          while (cursor < topics.length) {
            var topic = topics[cursor++];
            try {
              var messages = await collectTopic(topic, cache);
              if (messages.partial) errors++;
              collected.push.apply(collected, messages);
              if (collected.length) { render(collected); fallback.open = false; }
            } catch (_) { errors++; }
          }
        }
        await Promise.all([worker(), worker(), worker()]);
        if (!collected.length) throw new Error('Nenhuma mensagem acessível');
        render(collected); fallback.open = false;
        status.textContent = errors ? 'Lista parcial: alguns tópicos não responderam. Tente atualizar.' : 'Cada mensagem é uma entrada, inclusive no mesmo tópico.';
      } catch (_) {
        status.textContent = 'Não foi possível atualizar os posts. Os assuntos do fórum continuam disponíveis abaixo.';
        fallback.open = true;
      } finally { loading = false; refresh.disabled = false; aside.removeAttribute('aria-busy'); }
    }
    refresh.addEventListener('click', load);
    // Let hero, navigation and native scripts finish before starting the activity requests.
    function schedule() {
      if (loading || list.children.length) return;
      if (typeof requestIdleCallback === 'function' && typeof cancelIdleCallback === 'function') {
        var idle = requestIdleCallback(load, { timeout: 2000 });
        scheduled = function () { cancelIdleCallback(idle); };
      } else {
        var delay = setTimeout(load, 250); scheduled = function () { clearTimeout(delay); };
      }
    }
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
  }

  function profileKind(profile) {
    var explicit = profile.getAttribute('data-profile-type') || '';
    if (/narrador|narrator/i.test(explicit)) return 'narrator';
    if (/digiescolhido|player/i.test(explicit)) return 'player';
    // Groups 2/3 are presentation heuristics, NOT authority or permission checks.
    // data-profile-type only overrides the visual label; native groups/access never change.
    if (profile.querySelector('.group-2, [href*="/g2-"], [href*="narrador"]')) return 'narrator';
    if (profile.querySelector('.group-3, [href*="/g3-"]')) return 'player';
    return 'guest';
  }
  function pageKind(source, home) {
    if (home) return 'home';
    var url = new URL(source, location.origin), path = url.pathname;
    if (/^\/t\d+/.test(path)) return 'topic';
    if (/^\/f\d+/.test(path)) return 'forum';
    if (/^\/c\d+/.test(path)) return 'category';
    if (/^\/u\d+/.test(path)) return 'profile';
    if (/posting|preview-editor/.test(path) || /^\/post(?:\/|$)/.test(path)) return 'editor';
    if (/privmsg|preview-inbox/.test(path)) return 'messages';
    if (/profile|preview-account/.test(path)) return 'account';
    if (/memberlist/.test(path)) return 'members';
    if (/groups|^\/g\d+/.test(path)) return 'groups';
    if (/search|discover/.test(path)) return 'search';
    if (/register/.test(path)) return 'register';
    if (/login/.test(path)) return 'login';
    if (/faq/.test(path)) return 'faq';
    return 'page';
  }
  function isSystemsPage(hrefs) {
    return hrefs.some(function(href){return /(?:^|\/)f4(?:-|$)/.test(href)||/(?:^|\/)forum-4\.html(?:[?#]|$)/.test(href);});
  }
  function actionLabel(link) {
    var href = link.getAttribute('href') || '';
    if (/[?&]mode=quote(?:&|$)/i.test(href)) return 'Citar';
    if (/[?&]mode=editpost(?:&|$)/i.test(href)) return 'Editar';
    if (/[?&]mode=delete(?:&|$)/i.test(href)) return 'Excluir';
    var image = link.querySelector('img');
    return link.getAttribute('aria-label') || link.title || (image && image.alt) || link.textContent.trim();
  }
  function movePostControls(profile, body, tools) {
    // Move the actual native nodes: keep URLs, inline handlers and existing permissions.
    var date = profile.querySelector(':scope > a:has(.author), :scope > .author');
    if (date) { date.classList.add('bos-post-date'); tools.appendChild(date); }
    [profile, body].forEach(function(parent){
      var controls = parent.querySelector(':scope > .profile-icons');
      if (!controls) return;
      controls.querySelectorAll('a').forEach(function(link){
        var label = actionLabel(link);
        if (label) { link.dataset.bosAction = label; if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label',label); }
      });
      tools.appendChild(controls);
    });
  }
  function enhanceCompose(main) {
    main.querySelectorAll('.post-icon, .reply-icon').forEach(function(icon){
      if (icon.closest('.content, .postprofile')) return;
      var buttons = icon.closest('.buttons');
      if (buttons) buttons.classList.add('bos-compose-card');
      else if (!icon.closest('.bos-compose-card')) { var card=make('div','bos-compose-card'); icon.before(card); card.appendChild(icon); }
      icon.querySelectorAll('a').forEach(function(link){
        var href=link.getAttribute('href') || '';
        link.dataset.bosCompose = /[?&]mode=reply(?:&|$)/i.test(href) || icon.classList.contains('reply-icon') ? 'Responder' : /[?&]mode=newtopic(?:&|$)/i.test(href) ? 'Novo tópico' : actionLabel(link) || 'Novo tópico';
        if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label',link.dataset.bosCompose);
      });
    });
  }
  function presentRollActor(post, profile, actor) {
    var preceding = Array.from(document.querySelectorAll('.post[id^="p"]'));
    var source = preceding.slice(0,preceding.indexOf(post)).reverse().find(function(candidate){
      if (candidate.hasAttribute('data-bos-roll')) return false;
      var name=candidate.querySelector('.postprofile dt > strong, .postprofile .bos-author-card > strong, .postprofile dt > a:not(:has(img))');
      return name && name.textContent.trim() === actor;
    });
    var original = profile.querySelector(':scope > dl');
    if (original) { original.dataset.bosRollOrigin=''; original.setAttribute('aria-hidden','true'); }
    var sourceProfile=source && source.querySelector('.postprofile'), avatar=sourceProfile && sourceProfile.querySelector('dt img');
    var data=make('dl','bos-roll-profile-data'), term=make('dt','');
    if (avatar) {
      var image=make('img',''); image.src=avatar.currentSrc || avatar.src; image.alt=actor;
      image.width=120; image.height=120; image.loading='lazy'; term.appendChild(image);
    } else { var fallback=make('span','bos-roll-avatar',Array.from(actor)[0].toUpperCase()); fallback.setAttribute('aria-hidden','true'); term.appendChild(fallback); }
    var card=make('div','bos-author-card'); card.append(make('strong','',actor),make('span','bos-author-role','Rolagem de dados')); term.appendChild(card); data.appendChild(term); profile.prepend(data);
    profile.dataset.bosRole=sourceProfile ? sourceProfile.dataset.bosRole || profileKind(sourceProfile) : 'guest';
    profile.dataset.bosRollAuthor=actor;
    post.dataset.bosRoll='';
    // Native bot profile/permissions and generated roll HTML remain in the document.
    // Only the displayed identity changes; controls are still moved from the native profile.
  }
  function enhanceInteriors(kind) {
    var main = document.querySelector('#main-content'); if (!main || kind === 'home') return;
    var systems = isSystemsPage(Array.from(main.querySelectorAll('.diretorio a')).map(function(a){return a.getAttribute('href')||'';}));
    document.documentElement.dataset.bosArea = systems ? 'systems' : 'authored';
    var names = {topic:'TRANSMISSÃO / HISTÓRIA',forum:'ARQUIVO / TÓPICOS',category:'REDE / FÓRUNS',profile:'IDENTIDADE / DIGIESCOLHIDO',editor:'ESCRITA / NOVA TRANSMISSÃO',messages:'DIGITAL LINK / MENSAGENS',account:'IDENTIDADE / CONTA',members:'COMUNIDADE / DIGIESCOLHIDOS',groups:'COMUNIDADE / GRUPOS',search:'REDE / PESQUISA',login:'ACESSO / CONEXÃO',register:'ACESSO / NOVO VÍNCULO',faq:'SUPORTE / PERGUNTAS'};
    if (!main.querySelector('.bos-page-heading')) {
      var title = Array.from(main.querySelectorAll('h1.page-title, h2.page-title, :scope > h1')).find(function(node){return !node.closest('.content, #topicreview');});
      var heading = make('header','bos-page-heading'); heading.appendChild(make('span','bos-eyebrow',names[kind] || 'DIGIMON BONDS / REDE'));
      if (!title) title = make('h1','page-title',document.title.replace(/ - Digimon Bonds$/,''));
      title.classList.add('bos-page-title'); heading.appendChild(title);
      var path = main.querySelector('.diretorio');
      if (path) {
        path.classList.add('bos-breadcrumbs'); path.setAttribute('aria-label','Caminho de navegação');
        var home = make('a','','Início'); home.href = '/'; path.prepend(home,document.createTextNode(' / ')); heading.appendChild(path);
      } else {
        var back = make('a','bos-back-home','← Página inicial'); back.href = '/'; heading.appendChild(back);
      }
      main.prepend(heading);
    }
    enhanceCompose(main);
    if (kind === 'editor') {
      // Legacy posting templates wrap their title/editor in post profile/body frames.
      // Scope this reset to structural shells; never touch quoted/player content.
      main.querySelectorAll('.postprofile, .postbody').forEach(function(shell){
        if (shell.closest('.post[id^="p"], #topicreview, .content')) return;
        shell.dataset.bosEditorShell='';
        if (shell.matches('.postprofile') && !shell.textContent.trim() && !shell.querySelector('input,select,textarea,button,iframe,img,a')) shell.dataset.bosEditorOrnament='';
      });
    }
    document.querySelectorAll('.forumbg').forEach(function (box) {
      if (!box.querySelector('a.topictitle')) {
        // Container forums list children instead of posts; keep true empty-forum notices.
        if (main.querySelector('.forabg a.forumtitle') && /^Nenhuma mensagem$/i.test((box.querySelector('li.row') || {}).textContent?.trim() || '')) box.dataset.bosContainerEmpty='';
        return;
      }
      box.dataset.bosTopics = '';
      box.querySelectorAll('li.row').forEach(function (row) {
        if (!row.querySelector('a.topictitle') || row.hasAttribute('data-bos-topic-row')) return;
        row.dataset.bosTopicRow = '';
        var term = row.querySelector('.dterm');
        var locked = term && /bloquead|locked/i.test(term.getAttribute('title') || '');
        var important = box.classList.contains('announcement');
        if (term && (locked || important)) term.prepend(make('span','bos-topic-state',important ? 'Importante' : 'Bloqueado'));
      });
    });
    // Platform-generated blocks must never fall back to the legacy profile frame.
    main.querySelectorAll('.post').forEach(function(post){
      if(post.id === 'p0' && post.querySelector('.akcelo-wrapper, [id^="taboola-"], [id^="Forumactif_"]')) post.dataset.bosSponsored='';
    });
    main.querySelectorAll('.pagination').forEach(function(pager){
      if(pager.closest('.postbody'))return;
      var previous=pager.previousElementSibling;
      if(previous && previous.matches('.pagination') && previous.textContent===pager.textContent && Array.from(previous.querySelectorAll('a')).map(function(a){return a.getAttribute('href');}).join('|')===Array.from(pager.querySelectorAll('a')).map(function(a){return a.getAttribute('href');}).join('|')){pager.remove();return;}
      pager.setAttribute('aria-label','Paginação do tópico');
      pager.querySelectorAll('a.pag-img').forEach(function(link){
        var img=link.querySelector('img'), label=img ? img.alt : '';
        link.dataset.bosArrow=/précéd|anterior|previous/i.test(label)?'←':'→';
        link.setAttribute('aria-label',label || 'Próxima página');
      });
    });
    document.querySelectorAll('.post[id^="p"]').forEach(function (post) {
      var id = post.id.slice(1), profile = post.querySelector('.postprofile'), body = post.querySelector('.postbody');
      if (!/^[1-9]\d*$/.test(id) || !profile || !body || post.hasAttribute('data-bos-post')) return;
      post.dataset.bosPost = id;
      var role = profileKind(profile);
      profile.dataset.bosRole = role;
      var name = profile.querySelector('dt > strong, dt > a:not(:has(img))');
      if(name) {
        var identity = make('div','bos-author-card');
        name.before(identity); identity.appendChild(name);
        identity.appendChild(make('span','bos-author-role',role === 'narrator' ? 'Narrador' : role === 'player' ? 'Digiescolhido' : 'Visitante'));
      }
      var content = body.querySelector('.content');
      // A system roll is identified by its generated preamble and flat image payload.
      // Only mark its outer post; all authored content nodes remain untouched.
      var actor = rollActor(content);
      if (actor) presentRollActor(post,profile,actor);
      if(content && !systems) {
        // Restore the inherited ink expected by an authored paper template without editing its nodes.
        var paper=Array.from(content.querySelectorAll('table,div,article,section')).find(function(node){var rgb=getComputedStyle(node).backgroundColor.match(/[\d.]+/g);return rgb&&(rgb.length<4||+rgb[3]>.85);});
        if(paper){var rgb=getComputedStyle(paper).backgroundColor.match(/[\d.]+/g);content.dataset.bosPaper=(+rgb[0]*.2126+ +rgb[1]*.7152+ +rgb[2]*.0722)>155?'light':'dark';}
        // Some authored templates have dark ink and an invalid/transparent background.
        // Restore the former light paper beneath them, without rewriting their styles.
        if(!paper) {
          var needsPaper=Array.from(content.querySelectorAll('div,p,span,font')).some(function(node){
            if(node.textContent.trim().length<40)return false;
            var ink=getComputedStyle(node).color.match(/[\d.]+/g);
            if(!ink || +ink[0]*.2126+ +ink[1]*.7152+ +ink[2]*.0722>65)return false;
            for(var parent=node;parent && parent!==content;parent=parent.parentElement){
              var paint=getComputedStyle(parent), rgba=paint.backgroundColor.match(/[\d.]+/g);
              if(paint.backgroundImage!=='none' || rgba && (rgba.length<4 || +rgba[3]>.85))return false;
            }
            return true;
          });
          if(needsPaper){content.dataset.bosBacking='light';content.dataset.bosPaper='light';}
        }
      }
      if(content && systems) {
        content.classList.add('bos-message-content');
        // Approved repair for this single Systems illustration; never touch player images.
        content.querySelectorAll('img[src="https://i.ibb.co/jPhxc34Z/image-removebg-preview-19.png"]').forEach(function(img){img.src=ASSETS+'arquetipo-estrela-v10.webp';});
        content.querySelectorAll('*').forEach(function(surface){
          if(/^(IMG|SVG|PATH|VIDEO|IFRAME)$/.test(surface.tagName))return;
          var paint=getComputedStyle(surface), rgba=paint.backgroundColor.match(/[\d.]+/g);
          if(paint.backgroundImage!=='none'||(rgba&&(rgba.length<4||+rgba[3]>.05)))surface.dataset.bosSurface='';
        });
        content.querySelectorAll('td, div[align], p').forEach(function(block){
          ['firstChild','lastChild'].forEach(function(edge){var node=block[edge];while(node&&(node.nodeName==='BR'||node.nodeType===3&&!node.textContent.trim())){node.remove();node=block[edge];}});
        });
        content.querySelectorAll('td[style]').forEach(function(cell){
          if(!cell.textContent.trim()&&!cell.querySelector('img,input,button')&&((parseFloat(cell.style.width)>0&&parseFloat(cell.style.width)<=12)||cell.style.borderBottom)) cell.dataset.bosDecoration='';
          if(cell.style.backgroundColor) {
            Array.from(cell.childNodes).forEach(function(node){if(node.nodeName==='BR'&&(!node.previousSibling||!node.nextSibling))node.remove();});
          }
        });
        content.querySelectorAll('br').forEach(function(br){var p=br.previousSibling;while(p&&p.nodeType===3&&!p.textContent.trim())p=p.previousSibling;if(p&&p.nodeName==='BR'){var q=p.previousSibling;while(q&&q.nodeType===3&&!q.textContent.trim())q=q.previousSibling;if(q&&q.nodeName==='BR')br.remove();}});
      }
      if(systems) body.querySelectorAll('.content [style], .content [bgcolor]').forEach(function (surface) {
        var paint = surface.style.backgroundColor || surface.getAttribute('bgcolor');
        if (!paint || surface.style.color) return;
        var styles = getComputedStyle(surface), rgb = styles.backgroundColor.match(/[\d.]+/g), ink = styles.color.match(/[\d.]+/g);
        if (!rgb || !ink || (rgb.length > 3 && +rgb[3] < .95)) return;
        function luminance(c) { return c.slice(0,3).map(function(v) { v=+v/255; return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4); }).reduce(function(a,v,i){return a+v*[.2126,.7152,.0722][i];},0); }
        var bg=luminance(rgb), fg=luminance(ink), ratio=(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05);
        if(ratio<4.5) surface.dataset.bosContrast = bg>.4?'light':'dark';
      });
      var tools = make('nav','bos-post-tools'); tools.setAttribute('aria-label','Navegação da mensagem ' + id);
      var permalink = make('a','','Mensagem #' + id); permalink.href = '#' + id;
      permalink.className='bos-post-permalink';
      tools.appendChild(permalink); movePostControls(profile,body,tools);
      var top = make('a','bos-post-top','↑ Topo'); top.href = '#page-header'; tools.appendChild(top); body.prepend(tools);
    });
    if (kind === 'profile') {
      main.querySelectorAll('.module .h3, .panel .h3, .module h3').forEach(function(title){
        if(/^últimos visitantes|^visitantes recentes/i.test(title.textContent.trim())) {var panel=title.closest('.module,.panel');if(panel)panel.remove();}
      });
      main.querySelectorAll('.panel').forEach(function (panel) { panel.dataset.bosProfile = ''; });
      var avatar = main.querySelector('.details dd img[alt]'); if (avatar) avatar.classList.add('bos-profile-avatar');
    }
    main.querySelectorAll('table.table1, table.forumline').forEach(function (table) {
      if (table.closest('.postbody, .bos-table-scroll')) return;
      table.dataset.bosTable = '';
      var scroll = make('div','bos-table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('role','region'); scroll.setAttribute('aria-label','Tabela — role horizontalmente para ver todas as colunas');
      table.before(scroll); scroll.appendChild(table);
    });
  }

  function enhance() {
    var count = document.querySelectorAll('#page-body .forabg ul.forums').length;
    var kind = pageKind(document.body.getAttribute('data-bos-source') || location.href, count >= 4 && !document.querySelector('.page-title'));
    document.documentElement.dataset.bosPage = kind;
    var header = document.querySelector('#page-header .headerbar');
    if (header && !header.querySelector('.bos-hero')) {
      var hero = make('div', 'bos-hero'), art = make('img', 'bos-hero-art');
      art.src = ASSETS + 'hero.jpg'; art.width = 1920; art.height = 1080;
      art.alt = 'Os escolhidos e seus parceiros Digimon reunidos junto ao trem'; art.decoding = 'async';
      var brand = make('a', 'bos-brand'); brand.href = '/';
      var logo = make('img', 'bos-logo'); logo.src = ASSETS + 'bonds-logo.svg'; logo.alt = 'Digimon Bonds'; logo.width = 560; logo.height = 190;
      brand.appendChild(logo);
      var status = make('div', 'bos-preview-status'); status.appendChild(make('span', 'bos-preview-label', 'BONDS OS // BETA PÚBLICA'));
      var exit = make('a', 'bos-exit', 'Usar Skin 1.0 ↗');
      var offURL = new URL(location.href); offURL.searchParams.set('bondsos', '0'); exit.href = offURL.href;
      status.appendChild(exit); hero.append(art, brand); header.appendChild(hero); header.dataset.bosReady = '';
      var nav = document.querySelector('#page-header .navbar'); if (nav) nav.appendChild(status);
    }
    var categories = Array.from(document.querySelectorAll('#page-body .forabg')).filter(function (c) { return c.querySelector('ul.forums'); });
    categories.forEach(function (category, index) {
      if (category.hasAttribute('data-bos-category')) return;
      category.dataset.bosCategory = String(index + 1);
      if (!category.id) category.id = 'bos-category-' + (index + 1);
      var heading = category.querySelector('li.header');
      if (heading) {
        heading.prepend(make('span', 'bos-category-index', String(index + 1).padStart(2, '0')));
        heading.appendChild(make('span', 'bos-category-desc', categoryDescriptions[index] || 'DIGITAL NETWORK'));
      }
      category.querySelectorAll('ul.forums li.row').forEach(function (row) {
        var link = row.querySelector('a.forumtitle'), dterm = row.querySelector('dd.dterm'); if (!link || !dterm) return;
        var id = (link.getAttribute('href') || '').match(/\/f(\d+)(?:-|$)/) || (link.getAttribute('href') || '').match(/(?:^|\/)(?:forum|board)-(\d+)\.html/), number = id ? id[1] : '00', info = descriptions[number];
        row.dataset.bosNode = number;
        row.dataset.bosKind = ({4:'guide',1:'story',5:'record',6:'update',2:'human',3:'digital',8:'social'})[number] || 'forum';
        var circuit = make('img', 'bos-card-circuit'); circuit.src = ASSETS + 'card-circuit.svg'; circuit.alt = ''; circuit.setAttribute('aria-hidden', 'true'); row.appendChild(circuit);
        var partner = {4: 'agumonhakase', 5: 'terriermon-assistant', 6: 'gatomon', 1: 'jijimon'}[number];
        if (partner) {
          var silhouette = make('img', 'bos-partner-shadow'); silhouette.src = ASSETS + (partner === 'jijimon' ? 'jijimon-cutout.webp' : partner + '.webp'); silhouette.alt = ''; silhouette.setAttribute('aria-hidden', 'true'); silhouette.loading = 'lazy';
          var window = make('div', 'bos-partner-window'); window.setAttribute('aria-hidden', 'true'); window.appendChild(silhouette); row.appendChild(window); row.classList.add('bos-has-partner'); window.appendChild(make('span', 'bos-partner-caption', partner.toUpperCase() + ' / DIGITAL PARTNER'));
        }
        if (number === '2' || number === '3' || number === '8') {
          var scene = make('img', 'bos-scene'); scene.src = ASSETS + (number === '2' ? 'human-world-v10.webp' : number === '3' ? 'digital-world-v10.webp' : 'bond-core.svg'); scene.alt = ''; scene.loading='lazy'; scene.decoding='async'; scene.setAttribute('aria-hidden','true'); row.appendChild(scene);
        }
        var meta = make('div', 'bos-node-meta');
        meta.append(make('span', '', (({4:'GUIA',1:'NARRATIVAS',5:'PERSONAGENS',6:'PROGRESSO',2:'EXPLORAÇÃO',3:'EXPLORAÇÃO',8:'CONVERSAS'})[number] || 'FÓRUM') + ' / ' + number.padStart(2, '0')), make('span', 'bos-link-label', '↗')); dterm.prepend(meta);
        if (info) {
          var description = make('p', 'bos-node-description', info[0]), title = dterm.querySelector('.hierarchy'); if (title) title.after(description);
        }
        dterm.querySelectorAll('a.gensmall').forEach(function (subforum) { var separator = subforum.nextSibling; if (separator && separator.nodeType === 3 && /^\s*,\s*$/.test(separator.textContent)) separator.remove(); });
        var latest = row.querySelector('.last-info a[title]'); if (latest && latest.title) latest.textContent = latest.title;
      });
    });
    if (kind === 'home' && categories.length >= 4 && !document.querySelector('.bos-home-layout')) {
      var layout = make('div', 'bos-home-layout'), stack = make('div', 'bos-category-stack'), aside = make('aside', 'bos-activity');
      aside.setAttribute('aria-label', 'Atividade recente do fórum'); categories[0].before(layout);
      categories.forEach(function (c) { stack.appendChild(c); }); layout.appendChild(stack);
      var community = make('section', 'bos-community-panel'); community.setAttribute('aria-label', 'Comunidade e atividade recente');
      var statistics = document.querySelector('#estatistics');
      if (statistics) { statistics.before(community); community.append(statistics, aside); }
      else { layout.after(community); community.appendChild(aside); }
      var intro = make('div', 'bos-home-intro');
      intro.append(make('span', 'bos-eyebrow', 'DIGIMON BONDS / COMMUNITY NETWORK'), make('h1', '', 'Nossos mundos estão conectados.'), make('p', '', 'Encontre seu parceiro e atravesse a fronteira.'));
      var welcome = make('div', 'bos-welcome-copy');
      while (intro.firstChild) welcome.appendChild(intro.firstChild);
      intro.appendChild(welcome); layout.before(intro); addActivity(aside);
      if (statistics) {
        var poster = make('figure','bos-community-art bos-community-scene'), posterImage=make('img','');
        posterImage.src=ASSETS+'community-bond.webp'; posterImage.alt='Um digiescolhido e seu parceiro Digimon juntos na cidade';
        posterImage.width=883; posterImage.height=439; posterImage.loading='lazy'; posterImage.decoding='async';
        poster.appendChild(posterImage); statistics.appendChild(poster);
      }
      var communityHeading = make('header', 'bos-community-heading');
      communityHeading.append(make('span','bos-eyebrow','LAÇOS / COMUNIDADE'),make('h2','','Conexões que continuam.'),make('p','','Quem faz parte desta história — e o que está acontecendo agora.'));
      community.prepend(communityHeading);
      [['.postinho', 'Mensagens publicadas'], ['.doidos', 'Digiescolhidos']].forEach(function (item) {
        var counter = document.querySelector('#estatistics ' + item[0]);
        var number = counter && counter.textContent.match(/\d[\d.,]*/);
        if (counter && number) counter.replaceChildren(make('span','bos-stat-value',number[0]),make('span','bos-stat-label',item[1]));
      });
      document.querySelectorAll('#estatistics .horas72, #estatistics .novinho').forEach(function(node){node.remove();});
      var newestUser = document.querySelector('#estatistics .novinho');
      if (newestUser) {
        var member = newestUser.querySelector('a');
        if (member) newestUser.replaceChildren(make('span','bos-stat-label','Novo digiescolhido'),member);
      }
      [['.agora','Conectados agora']].forEach(function (item) {
        var block = document.querySelector('#estatistics ' + item[0]); if (!block) return;
        var body = make('div', 'bos-members-body');
        while (block.firstChild) body.appendChild(block.firstChild);
        Array.from(body.childNodes).forEach(function (node) {
          if (node.nodeType === 3) node.textContent = node.textContent.replace(/^(?:Membros conectados nas últimas 72 horas:|Utilizadores registados:)\s*/i,'').replace(/^\s*,\s*$/,'');
        });
        body.querySelectorAll('br').forEach(function (br) { br.remove(); });
        block.append(make('h3', '', item[1]),body);
      });
    }
  }
  var baseEnhance = enhance;
  enhance = function () { baseEnhance(); enhanceInteriors(document.documentElement.dataset.bosPage); };
  function initialize() {
    if (document.documentElement.dataset.bosInitialized) return;
    document.documentElement.dataset.bosInitialized = 'loading';
    try {
      enhance();
      document.documentElement.dataset.bosInitialized = 'ready';
      document.dispatchEvent(new Event('bonds-os-ready'));
    } catch (error) {
      console.warn('[BONDS OS] Falha na inicialização.', error);
      document.dispatchEvent(new Event('bonds-os-failed'));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true }); else initialize();
}());
