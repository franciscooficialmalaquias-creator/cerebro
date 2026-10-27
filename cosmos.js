// Cérebro — interface. Dois modos: Nota (ler e escrever) e Universo (o grafo 3D).
// inicio.js chama iniciarCosmos() depois que as notas chegaram (do GitHub ou do PC).
window.iniciarCosmos = function () {
  const raizEl = document.getElementById('app');

  const guardado = (k, padrao) => { try { return localStorage.getItem(k) || padrao; } catch { return padrao; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ok */ } };

  let temaId = TEMAS[guardado('cerebro-tema', 'buraco')] ? guardado('cerebro-tema', 'buraco') : 'buraco';
  let tema = TEMAS[temaId];
  // Cores dos projetos: as do tema no modo Cérebro; as naturais no Fluxograma e no Simples (igual ao grafo).
  let formaUI = ['fluxo', 'simples'].includes(guardado('cerebro-forma', 'cerebro')) ? guardado('cerebro-forma', 'cerebro') : 'cerebro';
  const paletaUI = () => (formaUI !== 'cerebro' && window.PALETA_NATURAL ? window.PALETA_NATURAL : tema.paleta);
  const cor = n => { const p = paletaUI(); return p[(C.indiceGrupo.get(n.grupo) || 0) % p.length]; };
  const totalLinks = C.notas.reduce((s, n) => s + C.saidas(n.id).length, 0);

  const svg = (d, t = 18) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ic = {
    busca: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 16),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    seta: svg('<path d="m9 6 6 6-6 6"/>', 12),
    fechar: svg('<path d="M6 6l12 12M18 6 6 18"/>', 16),
    lapis: svg('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>', 14),
    varinha: svg('<path d="m3 21 12-12M15 4V2M15 16v-2M8 9H6M22 9h-2M17.8 11.8 19 13M17.8 6.2 19 5M12.2 6.2 11 5M15 9l-1.5 1.5"/>', 20),
    girar: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
    cerebro: svg('<path d="M9.5 3A2.5 2.5 0 0 0 7 5.5v.3A3 3 0 0 0 4.5 9a3 3 0 0 0 .5 5.6V15a3 3 0 0 0 4.5 2.6A2.5 2.5 0 0 0 12 19.5V4.5A2.5 2.5 0 0 0 9.5 3ZM14.5 3A2.5 2.5 0 0 1 17 5.5v.3A3 3 0 0 1 19.5 9a3 3 0 0 1-.5 5.6V15a3 3 0 0 1-4.5 2.6A2.5 2.5 0 0 1 12 19.5"/>'),
    fluxo: svg('<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5" r="2.2"/><circle cx="19" cy="19" r="2.2"/><circle cx="12" cy="12" r="1.6"/><path d="M7.2 12h3.2M13.4 11l3.9-4.5M13.4 13l3.9 4.5"/>'),
    simples: svg('<circle cx="6" cy="7" r="2"/><circle cx="17" cy="6" r="2"/><circle cx="12" cy="17" r="2"/><path d="M8 7h7M7 9l4 6.5M16 8l-3 7"/>'),
    mais: svg('<path d="M12 5v14M5 12h14"/>', 15),
    raio: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>'),
    texto: svg('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
    alvo: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>'),
    paleta: svg('<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 21a2.5 2.5 0 0 1 0-5h1.5a2.5 2.5 0 0 0 2.5-2.5"/>'),
    somOn: svg('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
    somOff: svg('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/>'),
    parar: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>', 14),
    hoje: svg('<path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/>', 22),
    orbita: svg('<circle cx="12" cy="12" r="2.6"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)"/><circle cx="20" cy="8.6" r="1.1" fill="currentColor"/>', 22),
    notas: svg('<path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', 22),
    lupa: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 22),
    voltar: svg('<path d="m15 6-6 6 6 6"/>', 20),
    baixar: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 18),
    compartilhar: svg('<path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/>', 16),
  };
  const celular = () => matchMedia('(max-width: 860px)').matches;
  const tremer = () => { try { navigator.vibrate?.(6); } catch { /* ok */ } };

  raizEl.innerHTML = `
    <div class="cz" data-modo="${guardado('cerebro-modo', 'hoje')}" data-menu="0">
      <canvas class="cz-ceu" aria-hidden="true"></canvas>
      <header class="cz-topo">
        <button class="cz-icone cz-so-celular" data-acao="menu" aria-label="Abrir notas">${ic.menu}</button>
        <div class="cz-marca"><span class="cz-logo"></span><span>Cérebro</span></div>
        <div class="cz-modos" role="tablist">
          <span class="cz-modos-luz" aria-hidden="true"></span>
          <button role="tab" data-modo-btn="hoje">Hoje</button>
          <button role="tab" data-modo-btn="nota">Nota</button>
          <button role="tab" data-modo-btn="universo">Universo</button>
        </div>
        <button class="cz-busca" data-acao="busca">${ic.busca}<span>Buscar no cérebro</span><kbd>Ctrl K</kbd></button>
        <div class="cz-acoes">
          <button class="cz-sync" data-acao="conexao" data-estado="parado" title="Conexão com o GitHub"><span class="cz-pulso"></span><span class="cz-sync-texto">…</span></button>
          <button class="cz-icone cz-so-celular" data-acao="busca" aria-label="Buscar">${ic.busca}</button>
          <button class="cz-icone" data-acao="temas" aria-label="Trocar tema" aria-expanded="false">${ic.paleta}</button>
          <button class="cz-icone" data-acao="som" aria-label="Som">${SOM.ligado ? ic.somOn : ic.somOff}</button>
        </div>
        <div class="cz-temas" hidden></div>
      </header>

      <aside class="cz-lado cz-vidro">
        <div class="cz-lado-titulo cz-so-celular"><b>Notas</b><span>${C.notas.length} notas · ${C.grupos.length} projetos</span></div>
        <div class="cz-lado-topo">
          <button class="cz-nova" data-acao="nova">${ic.mais}<span>Nova nota</span></button>
          <form class="cz-nova-form" hidden><input name="titulo" placeholder="Nome da nota" autocomplete="off" spellcheck="false" maxlength="120"></form>
        </div>
        <div class="cz-arvore"></div>
      </aside>
      <div class="cz-veu" data-acao="fechar-menu"></div>

      <section class="cz-vista-hoje"><div class="cz-hoje"></div></section>

      <section class="cz-vista-nota">
        <main class="cz-centro cz-vidro"><div class="cz-rolagem"><article class="cz-nota"></article></div></main>
        <aside class="cz-dir cz-vidro">
          <section><h4>Vizinhança</h4><canvas class="cz-mini"></canvas></section>
          <section class="cz-entradas"></section>
          <section class="cz-topicos"></section>
        </aside>
      </section>

      <section class="cz-vista-universo">
        <canvas class="cz-universo"></canvas>
        <div class="cz-hud-titulo">
          <b>Universo</b>
          <span>${C.notas.length} neurônios · ${totalLinks} conexões</span>
        </div>
        <div class="cz-forma" role="tablist" aria-label="Forma do universo">
          <span class="cz-forma-luz" aria-hidden="true"></span>
          <button role="tab" data-forma="cerebro">${ic.cerebro}<span>Cérebro</span></button>
          <button role="tab" data-forma="fluxo">${ic.fluxo}<span>Fluxograma</span></button>
          <button role="tab" data-forma="simples">${ic.simples}<span>Simples</span></button>
        </div>
        <div class="cz-ferramentas" role="toolbar" aria-label="Controles do universo">
          <button class="cz-ferr cz-ferr-varinha" data-acao="varinha" data-dica="Varinha: ver o cérebro crescer">${ic.varinha}</button>
          <span class="cz-ferr-sep"></span>
          <button class="cz-ferr" data-acao="girar" aria-pressed="true" data-dica="Girar sozinho">${ic.girar}</button>
          <button class="cz-ferr" data-acao="sinais" aria-pressed="true" data-dica="Sinapses">${ic.raio}</button>
          <button class="cz-ferr" data-acao="rotulos" aria-pressed="false" data-dica="Todos os nomes">${ic.texto}</button>
          <button class="cz-ferr" data-acao="centro" data-dica="Centralizar">${ic.alvo}</button>
        </div>
        <div class="cz-legenda"></div>
        <div class="cz-dica-no" hidden></div>
        <div class="cz-cartao" hidden></div>
        <div class="cz-linha-tempo" hidden>
          <div class="cz-lt-topo"><span class="cz-lt-data"></span><span class="cz-lt-conta"></span></div>
          <div class="cz-lt-nota"></div>
          <div class="cz-lt-barra"><i></i></div>
          <div class="cz-lt-acoes">
            <button data-vel="1">1×</button><button data-vel="2">2×</button><button data-vel="4">4×</button>
            <button class="cz-lt-parar" data-acao="parar-varinha">${ic.parar}Parar</button>
          </div>
        </div>
      </section>

      <nav class="cz-abas" aria-label="Seções">
        <span class="cz-abas-luz" aria-hidden="true"></span>
        <button data-aba="hoje">${ic.hoje}<span>Hoje</span></button>
        <button data-aba="universo">${ic.orbita}<span>Universo</span></button>
        <button data-aba="notas">${ic.notas}<span>Notas</span></button>
        <button data-aba="busca">${ic.lupa}<span>Buscar</span></button>
      </nav>

      <div class="cz-paleta" hidden>
        <div class="cz-paleta-caixa" role="dialog" aria-label="Buscar">
          <div class="cz-paleta-campo">${ic.busca}<input placeholder="Buscar notas, projetos, trechos…" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>
          <div class="cz-paleta-lista" role="listbox"></div>
        </div>
      </div>
    </div>`;

  const raiz = raizEl.querySelector('.cz');
  const $ = s => raiz.querySelector(s);
  let atual = null, editando = false, mini = null, universo = null, selecionado = null;
  let velocidade = 2;
  const abertos = new Set(), ocultos = new Set();

  // ---------- Tema ----------
  function aplicarTema(id, comSom) {
    temaId = id; tema = TEMAS[id];
    for (const [k, v] of Object.entries(tema.css)) raiz.style.setProperty('--' + k, v);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema.css.fundo);
    guardar('cerebro-tema', id);
    universo?.definirTema(tema); mini?.definirTema(tema); heroi?.definirTema(tema);
    if (atual) { desenharArvore(); desenharLegenda(); }
    raiz.querySelectorAll('.cz-tema').forEach(b => b.setAttribute('aria-checked', b.dataset.tema === id));
    if (comSom) SOM.tema();
  }
  function desenharTemas() {
    $('.cz-temas').innerHTML = `<p>Tema</p>` + Object.entries(TEMAS).map(([id, t]) => `
      <button class="cz-tema" role="menuitemradio" data-tema="${id}" aria-checked="${id === temaId}"
        style="--a:${t.paleta[0]};--b:${t.paleta[1]};--c:${t.paleta[3]};--f:${t.css.fundo}">
        <span class="cz-orbe cz-orbe-${t.nucleo}"></span>
        <span><b>${t.nome}</b><small>${t.descricao}</small></span>
      </button>`).join('');
  }
  function alternarTemas(forcar) {
    const p = $('.cz-temas'), btn = $('[data-acao="temas"]');
    const abrir = forcar ?? p.hidden;
    btn.setAttribute('aria-expanded', abrir);
    if (abrir) { p.hidden = false; requestAnimationFrame(() => p.dataset.aberto = '1'); }
    else { delete p.dataset.aberto; setTimeout(() => { if (!p.dataset.aberto) p.hidden = true; }, C.reduzido ? 0 : 140); }
  }

  // ---------- Céu de fundo (estrelas que piscam) ----------
  const ceu = $('.cz-ceu'), cctx = ceu.getContext('2d');
  const estrelasCeu = Array.from({ length: 260 }, (_, i) => ({ x: (i * 7919 % 1000) / 1000, y: (i * 104729 % 1000) / 1000, b: 0.2 + (i * 31 % 80) / 100, f: i * 1.7 }));
  let rafCeu = 0, mx = 0.5, my = 0.5;
  function desenharCeu(t) {
    const w = ceu.clientWidth, h = ceu.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (ceu.width !== Math.round(w * dpr)) { ceu.width = w * dpr; ceu.height = h * dpr; }
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0); cctx.clearRect(0, 0, w, h);
    cctx.fillStyle = tema.estrela;
    for (const e of estrelasCeu) {
      // Paralaxe leve com o mouse: estrelas mais brilhantes parecem mais perto.
      const x = (e.x * w + (mx - 0.5) * 18 * e.b + w) % w, y = (e.y * h + (my - 0.5) * 18 * e.b + h) % h;
      cctx.globalAlpha = e.b * (C.reduzido ? 0.7 : 0.45 + 0.55 * Math.sin(t * 0.001 + e.f));
      cctx.fillRect(x, y, e.b > 0.85 ? 1.5 : 1, e.b > 0.85 ? 1.5 : 1);
    }
    rafCeu = requestAnimationFrame(desenharCeu);
  }

  // ---------- Árvore ----------
  function desenharArvore() {
    $('.cz-arvore').innerHTML = C.grupos.map(g => `
      <div class="cz-grupo" data-aberto="${abertos.has(g.nome)}">
        <button class="cz-grupo-btn" data-grupo="${C.esc(g.nome)}">
          <span class="cz-seta">${ic.seta}</span>
          <span class="cz-bolinha" style="--c:${cor(g.notas[0])}"></span>
          <span class="cz-grupo-nome">${C.esc(g.nome)}</span>
          <span class="cz-conta">${g.notas.length}</span>
        </button>
        <div class="cz-itens">${abertos.has(g.nome) ? g.notas.map((n, i) => `
          <a href="#" class="cz-item" data-id="${C.esc(n.id)}" style="--i:${i}" ${atual && n.id === atual.id ? 'aria-current="page"' : ''}>${C.esc(n.titulo)}</a>`).join('') : ''}
        </div>
      </div>`).join('');
  }

  // ---------- Modos ----------
  // Modos: hoje, nota e universo; no celular há também "lista" (as notas em tela cheia).
  function irPara(modo, comSom) {
    if (modo === 'lista' && !celular()) modo = 'nota';
    raiz.dataset.modo = modo;
    raiz.dataset.menu = '0';
    if (modo !== 'lista') guardar('cerebro-modo', modo);
    raiz.querySelectorAll('[data-modo-btn]').forEach(b => b.setAttribute('aria-selected', b.dataset.modoBtn === modo));
    moverLuzModos();
    marcarAbas();
    if (modo === 'universo') { criarUniverso(); universo.pausar(false); requestAnimationFrame(() => marcarForma(universo.forma)); mini?.destruir(); mini = null; if (comSom) SOM.universo(); }
    else { universo?.pararVarinha(); universo?.pausar(true); desenharMini(); }
    if (modo === 'hoje') montarHoje(); else heroi?.pausar(true);
  }
  function moverLuzModos() {
    const b = raiz.querySelector(`[data-modo-btn="${raiz.dataset.modo === 'lista' ? 'nota' : raiz.dataset.modo}"]`), luz = $('.cz-modos-luz');
    if (!b) return;
    luz.style.width = b.offsetWidth + 'px';
    luz.style.transform = `translateX(${b.offsetLeft - 3}px)`;
  }
  // Barra de abas do celular: a luz desliza até a aba ativa.
  function marcarAbas() {
    const m = raiz.dataset.modo, aba = m === 'nota' || m === 'lista' ? 'notas' : m;
    raiz.querySelectorAll('[data-aba]').forEach(b => b.setAttribute('aria-current', b.dataset.aba === aba));
    const b = raiz.querySelector(`[data-aba="${aba}"]`), luz = $('.cz-abas-luz');
    if (b && b.offsetWidth) { luz.style.width = b.offsetWidth + 'px'; luz.style.transform = `translateX(${b.offsetLeft}px)`; }
  }

  // ---------- Hoje: acompanhar o cérebro ----------
  let heroi = null, atividade = null, pedindoAtividade = false;
  const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function saudacao() { const h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function diaDe(t) {
    const zero = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const d = new Date(t), dif = Math.round((zero(new Date()) - zero(d)) / 864e5);
    return dif === 0 ? 'Hoje' : dif === 1 ? 'Ontem' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  function haQuanto(t) {
    const min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ontem' : d < 30 ? `há ${d} dias` : new Date(t).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }
  const notaPrincipal = g => g.notas.find(n => n.titulo === g.nome) || g.notas[0];

  function montarHoje() {
    const el = $('.cz-hoje');
    if (!el.dataset.feito) {
      el.dataset.feito = '1';
      const semana = Date.now() - 7 * 864e5;
      el.innerHTML = `
        <header class="cz-hoje-topo">
          <p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>${saudacao()}</h1>
        </header>
        <div class="cz-heroi">
          <canvas class="cz-heroi-tela" aria-label="Seu cérebro em 3D"></canvas>
          <button class="cz-heroi-ir" data-acao="ir-universo">Abrir o universo ${ic.seta}</button>
        </div>
        <div class="cz-numeros">
          <div><b data-conta="${C.notas.length}">0</b><span>notas</span></div>
          <div><b data-conta="${totalLinks}">0</b><span>conexões</span></div>
          <div><b data-conta="${C.grupos.length}">0</b><span>projetos</span></div>
          <div><b data-conta="${C.notas.filter(n => n.criado > semana).length}">0</b><span>novas na semana</span></div>
        </div>
        <div class="cz-instalar-cartao"></div>
        <section class="cz-sec"><h4>O que mudou</h4><div class="cz-atividade">${'<div class="cz-esqueleto"></div>'.repeat(3)}</div></section>
        <section class="cz-sec"><h4>Projetos</h4><div class="cz-projetos"></div></section>`;
      [...el.children].forEach((c, i) => { c.style.setProperty('--d', `${i * 45}ms`); c.classList.add('cz-entra'); });
      contar(el);
      desenharProjetos();
    }
    desenharInstalar();
    // O cérebro do alto da página: o mesmo motor do universo, girando sozinho.
    if (!heroi) {
      heroi = Universo($('.cz-heroi-tela'), {
        tema, forma: 'cerebro', estrelas: false, rotulos: 'nunca', escala: 1.45,
        aoClicar: n => { irPara('universo', true); if (n) setTimeout(() => selecionar(n.id), 80); },
      });
    } else heroi.pausar(false);
    if (!atividade && !pedindoAtividade) {
      pedindoAtividade = true;
      SYNC.atividade().then(l => { atividade = l || []; desenharAtividade(); desenharProjetos(); }).catch(() => { atividade = []; desenharAtividade(); }).finally(() => { pedindoAtividade = false; });
    }
  }
  function contar(el) {
    el.querySelectorAll('[data-conta]').forEach(b => {
      const fim = +b.dataset.conta;
      if (C.reduzido) { b.textContent = fim; return; }
      const t0 = performance.now();
      const passo = t => { const k = Math.min(1, (t - t0) / 900); b.textContent = Math.round(fim * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    });
  }
  function desenharAtividade() {
    const el = $('.cz-atividade');
    if (!el) return;
    if (!atividade.length) { el.innerHTML = `<p class="cz-vazio">${SYNC.conectado ? 'Nada novo por aqui.' : 'Entre com o GitHub para ver o que mudou.'}</p>`; return; }
    let ultimoDia = '';
    el.innerHTML = atividade.slice(0, 14).map((ev, i) => {
      const dia = diaDe(ev.quando), cabeca = dia !== ultimoDia ? `<div class="cz-dia">${dia}</div>` : '';
      ultimoDia = dia;
      const m = ev.msg.match(/^([\w-]+):\s*(.+)$/), tag = m ? m[1] : '', texto = m ? m[2] : ev.msg;
      const notas = ev.arquivos.map(a => ({ ...a, n: C.porId.get(a.id) })).filter(a => a.n);
      const c = notas[0] ? cor(notas[0].n) : 'var(--acento)';
      return `${cabeca}<article class="cz-ev" style="--c:${c};--i:${i}">
        <span class="cz-ev-ponto"></span>
        <div class="cz-ev-corpo">
          <p>${tag ? `<span class="cz-ev-tag">${C.esc(tag)}</span>` : ''}${C.esc(texto)}</p>
          <small>${new Date(ev.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${notas.length ? ` · ${notas.length} ${notas.length === 1 ? 'nota' : 'notas'}` : ''}</small>
          ${notas.length ? `<div class="cz-ev-notas">${notas.slice(0, 4).map(a => `<a href="#" class="cz-chip" data-id="${C.esc(a.id)}"><span class="cz-bolinha" style="--c:${cor(a.n)}"></span>${C.esc(a.n.titulo)}${a.tipo === 'added' ? '<em>nova</em>' : ''}</a>`).join('')}${notas.length > 4 ? `<span class="cz-mais">+${notas.length - 4}</span>` : ''}</div>` : ''}
        </div>
      </article>`;
    }).join('');
  }
  function desenharProjetos() {
    const el = $('.cz-projetos');
    if (!el) return;
    const recente = new Map();
    for (const ev of atividade || []) for (const a of ev.arquivos) {
      const g = C.porId.get(a.id)?.grupo;
      if (g && !recente.has(g)) recente.set(g, ev.quando);
    }
    const grupos = [...C.grupos].sort((a, b) => (recente.get(b.nome) || 0) - (recente.get(a.nome) || 0) || b.notas.length - a.notas.length);
    const maior = Math.max(...C.grupos.map(g => g.notas.length));
    el.innerHTML = grupos.map(g => `
      <a href="#" class="cz-projeto" data-id="${C.esc(notaPrincipal(g).id)}" style="--c:${cor(g.notas[0])};--p:${(g.notas.length / maior).toFixed(3)}">
        <span class="cz-projeto-nome"><span class="cz-bolinha"></span>${C.esc(g.nome)}</span>
        <span class="cz-projeto-info">${g.notas.length} ${g.notas.length === 1 ? 'nota' : 'notas'}${recente.has(g.nome) ? ` · mexido ${haQuanto(recente.get(g.nome))}` : ''}</span>
        <span class="cz-projeto-barra"><i></i></span>
      </a>`).join('');
  }
  // Instalar como app: no Android/PC o navegador deixa pedir; no iPhone só pelo menu Compartilhar.
  function desenharInstalar() {
    const el = $('.cz-instalar-cartao');
    if (!el) return;
    let html = '';
    if (!instalado() && guardado('cerebro-sem-instalar', '') !== '1') {
      if (window.pedidoInstalar) html = `<p><b>Instale o Cérebro</b>Vira um app no celular ou no PC: abre em tela cheia e funciona sem internet.</p><button class="cz-primario" data-acao="instalar">${ic.baixar}Instalar</button>`;
      else if (ios) html = `<p><b>Coloque o Cérebro na tela inicial</b>No Safari, toque em Compartilhar ${ic.compartilhar} e depois em “Adicionar à Tela de Início”.</p>`;
      else if (celular()) html = `<p><b>Coloque o Cérebro na tela inicial</b>No Chrome, toque no menu ⋮ e depois em “Instalar app” (ou “Adicionar à tela inicial”).</p>`;
    }
    el.hidden = !html;
    el.innerHTML = html ? `${html}<button class="cz-icone cz-instalar-x" data-acao="sem-instalar" aria-label="Dispensar">${ic.fechar}</button>` : '';
  }
  addEventListener('cerebro-instalavel', desenharInstalar);
  addEventListener('appinstalled', desenharInstalar);

  // ---------- Nota ----------
  function abrir(id, { som = true } = {}) {
    const n = C.porId.get(id);
    if (!n) return;
    atual = n; editando = false;
    abertos.add(n.grupo);
    desenharArvore();
    if (raiz.dataset.modo !== 'nota') irPara('nota');
    desenharNota();
    raiz.dataset.menu = '0';
    $('.cz-rolagem').scrollTo({ top: 0 });
    if (som) SOM.abrir();
  }

  function desenharNota() {
    const n = atual;
    const entradas = C.entradas(n.id), saidas = C.saidas(n.id);
    const lista = entradas.length
      ? entradas.map(e => `<a href="#" class="cz-ligacao" data-id="${C.esc(e.id)}"><span class="cz-bolinha" style="--c:${cor(e)}"></span><span><b>${C.esc(e.titulo)}</b><small>${C.esc(C.resumo(e, 80))}</small></span></a>`).join('')
      : '<p class="cz-vazio">Nenhuma nota aponta para cá ainda.</p>';
    $('.cz-nota').innerHTML = `
      <div class="cz-cabeca">
        <button class="cz-voltar cz-so-celular" data-acao="voltar">${ic.voltar}Notas</button>
        <div class="cz-trilha"><span class="cz-bolinha" style="--c:${cor(n)}"></span>${C.esc(n.grupo)}<span>›</span>${C.esc(n.titulo)}</div>
        <h1>${C.esc(n.titulo)}</h1>
        <div class="cz-meta">
          <span>${C.palavras(n)} palavras</span><span>${saidas.length} links</span><span>${entradas.length} ligações</span>${n.criado ? `<span>nasceu ${new Date(n.criado).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>` : ''}
          <button class="cz-botao" data-acao="ver-no-universo">${ic.alvo.replace('width="18" height="18"', 'width="14" height="14"')}Ver no universo</button>
          <button class="cz-botao" data-acao="editar">${ic.lapis}${editando ? 'Salvar' : 'Editar'}</button>
        </div>
      </div>
      ${editando ? `<textarea class="cz-editor" spellcheck="false">${C.esc(n.corpo)}</textarea>` : `<div class="cz-corpo">${C.html(C.semTitulo(n))}</div>`}
      <div class="cz-ligacoes-celular"><h4>Ligações</h4>${lista}</div>`;
    [...$('.cz-nota').querySelectorAll('.cz-cabeca > *, .cz-corpo > *')].slice(0, 10).forEach((el, i) => {
      el.style.setProperty('--d', `${i * 30}ms`);
      el.classList.add('cz-entra');
    });
    if (editando) $('.cz-editor').focus();
    $('.cz-entradas').innerHTML = `<h4>Ligações <span>${entradas.length}</span></h4>${lista}`;
    const tops = C.topicos(n);
    $('.cz-topicos').innerHTML = tops.length ? `<h4>Nesta nota</h4>${tops.map((t, i) => `<a href="#" class="cz-topico" data-topico="${i}" style="padding-left:${8 + (t.nivel - 2) * 12}px">${C.esc(t.texto)}</a>`).join('')}` : '';
    desenharMini();
  }

  function desenharMini() {
    mini?.destruir(); mini = null;
    if (!atual || raiz.dataset.modo !== 'nota' || getComputedStyle($('.cz-dir')).display === 'none') return;
    mini = Universo($('.cz-mini'), {
      tema, forma: formaUI, foco: atual.id, profundidade: 1, estrelas: false, nucleo: false, rotulos: 'auto', escala: 1.1,
      aoClicar: n => { if (n && n.id !== atual.id) abrir(n.id); },
      aoSobre: n => { if (n) SOM.toque(); },
    });
  }

  function alternarEdicao() {
    if (!atual) return;
    if (editando) {
      const texto = $('.cz-editor').value;
      // Salva no GitHub só se mudou alguma coisa (nota nova sempre sobe).
      if (texto !== atual.corpo || atual.nova) { C.atualizar(atual.id, texto); SYNC.salvar(atual); }
    }
    editando = !editando;
    desenharNota();
  }

  // ---------- Universo ----------
  function criarUniverso() {
    if (universo) return;
    universo = Universo($('.cz-universo'), {
      tema, forma: formaGuardada(),
      aoSobre: (n, p) => {
        const d = $('.cz-dica-no');
        if (!n) { d.hidden = true; return; }
        SOM.toque();
        d.hidden = false;
        d.innerHTML = `<span class="cz-bolinha" style="--c:${cor(n)}"></span><b>${C.esc(n.titulo)}</b><small>${C.esc(n.grupo)} · ${C.entradas(n.id).length + C.saidas(n.id).length} conexões</small>`;
        const largura = $('.cz-vista-universo').clientWidth;
        d.style.transform = `translate(${Math.min(p.x + 14, largura - 260)}px, ${p.y + 14}px)`;
      },
      aoClicar: n => selecionar(n ? n.id : null),
      aoPop: (n, gi) => SOM.pop(gi),
      aoPasso: info => {
        $('.cz-lt-data').textContent = new Date(info.nota.criado).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        $('.cz-lt-conta').textContent = `${info.notas} de ${info.total} notas`;
        const el = $('.cz-lt-nota');
        el.textContent = info.nota.titulo;
        el.style.color = cor(info.nota);
        $('.cz-lt-barra i').style.transform = `scaleX(${info.progresso})`;
      },
      aoFimVarinha: terminou => {
        $('.cz-linha-tempo').hidden = true;
        raiz.removeAttribute('data-varinha');
        $('[data-acao="varinha"]').removeAttribute('data-ativo');
        if (terminou) SOM.fim();
      },
    });
    marcarForma(universo.forma);
    universo.ocultar([...ocultos]);
    desenharLegenda();
  }

  // ---------- Cérebro ⇄ Fluxograma ----------
  const FORMAS = ['cerebro', 'fluxo', 'simples'];
  function formaGuardada() { const f = guardado('cerebro-forma', 'cerebro'); return FORMAS.includes(f) ? f : 'fluxo'; }
  function marcarForma(f) {
    if (formaUI !== f) { formaUI = f; desenharArvore(); desenharLegenda(); }
    raiz.dataset.forma = f;
    raiz.querySelectorAll('[data-forma]').forEach(b => b.setAttribute('aria-selected', b.dataset.forma === f));
    const b = raiz.querySelector(`[data-forma="${f}"]`), luz = $('.cz-forma-luz');
    if (b && b.offsetWidth) { luz.style.width = b.offsetWidth + 'px'; luz.style.transform = `translateX(${b.offsetLeft - 3}px)`; }
  }
  function trocarForma(f) {
    if (!universo || universo.forma === f) return;
    const antes = universo.forma;
    if (universo.varinhaAtiva) universo.pararVarinha();
    selecionar(null);
    universo.definirForma(f);
    guardar('cerebro-forma', f);
    marcarForma(f);
    if (f === 'cerebro') SOM.juntar(); else if (antes === 'cerebro') SOM.espalhar(); else SOM.toque();
  }

  function selecionar(id) {
    selecionado = id;
    universo?.selecionar(id);
    const c = $('.cz-cartao');
    if (!id) { c.hidden = true; return; }
    const n = C.porId.get(id);
    SOM.selecionar();
    universo.voarPara(id);
    const viz = [...new Set([...C.saidas(id), ...C.entradas(id)])];
    c.hidden = false;
    c.innerHTML = `
      <button class="cz-icone cz-cartao-x" data-acao="fechar-cartao" aria-label="Fechar">${ic.fechar}</button>
      <div class="cz-trilha"><span class="cz-bolinha" style="--c:${cor(n)}"></span>${C.esc(n.grupo)}</div>
      <h3>${C.esc(n.titulo)}</h3>
      <p>${C.esc(C.resumo(n, 170))}</p>
      <div class="cz-cartao-viz">${viz.slice(0, 8).map(v => `<button class="cz-chip" data-selecionar="${C.esc(v.id)}"><span class="cz-bolinha" style="--c:${cor(v)}"></span>${C.esc(v.titulo)}</button>`).join('')}${viz.length > 8 ? `<span class="cz-mais">+${viz.length - 8}</span>` : ''}</div>
      <button class="cz-primario" data-id="${C.esc(n.id)}">Abrir nota</button>`;
    c.classList.remove('cz-surge'); void c.offsetWidth; c.classList.add('cz-surge');
  }

  function desenharLegenda() {
    $('.cz-legenda').innerHTML = C.grupos.map(g => `
      <button class="cz-chip" data-legenda="${C.esc(g.nome)}" aria-pressed="${!ocultos.has(g.nome)}">
        <span class="cz-bolinha" style="--c:${cor(g.notas[0])}"></span>${C.esc(g.nome)}<small>${g.notas.length}</small>
      </button>`).join('');
  }

  function varinha() {
    if (!universo) return;
    if (universo.varinhaAtiva) { universo.pararVarinha(); return; }
    selecionar(null);
    $('.cz-linha-tempo').hidden = false;
    raiz.setAttribute('data-varinha', '');
    $('[data-acao="varinha"]').setAttribute('data-ativo', '');
    raiz.querySelectorAll('[data-vel]').forEach(b => b.toggleAttribute('data-ativo', +b.dataset.vel === velocidade));
    SOM.varinha();
    universo.centralizar();
    universo.iniciarVarinha(velocidade);
  }

  // ---------- Busca ----------
  // Ctrl K abre dezenas de vezes por dia: abre e fecha sem animação (regra da skill de animação).
  let sel = 0, resultados = [];
  function abrirBusca() {
    const p = $('.cz-paleta');
    p.hidden = false;
    const campo = p.querySelector('input');
    campo.value = ''; campo.focus();
    listar('');
  }
  function fecharBusca() { $('.cz-paleta').hidden = true; universo?.destacar(null); }
  function listar(q) {
    resultados = q ? C.buscar(q, 9) : [...C.notas].sort((a, b) => b.criado - a.criado).slice(0, 7).map(nota => ({ nota, trecho: C.resumo(nota, 90) }));
    sel = 0;
    if (raiz.dataset.modo === 'universo') universo?.destacar(q ? resultados.map(r => r.nota.id) : null);
    $('.cz-paleta-lista').innerHTML = (q ? '' : '<div class="cz-paleta-rotulo">Mais novas</div>') + (resultados.length
      ? resultados.map((r, i) => `<a href="#" class="cz-res" role="option" data-res="${C.esc(r.nota.id)}" data-i="${i}" aria-selected="${i === 0}">
          <span class="cz-bolinha" style="--c:${cor(r.nota)}"></span>
          <span><b>${C.marcar(r.nota.titulo, q)}</b><small>${C.marcar(r.trecho || r.nota.grupo, q)}</small></span>
          <em>${C.esc(r.nota.grupo)}</em></a>`).join('')
      : `<div class="cz-vazio">Nada com “${C.esc(q)}”.</div>`);
  }
  function escolher(id) {
    fecharBusca();
    if (raiz.dataset.modo === 'universo') selecionar(id);
    else abrir(id);
  }
  function moverSel(d) {
    if (!resultados.length) return;
    sel = (sel + d + resultados.length) % resultados.length;
    raiz.querySelectorAll('.cz-res').forEach((el, i) => el.setAttribute('aria-selected', i === sel));
    raiz.querySelector(`.cz-res[data-i="${sel}"]`).scrollIntoView({ block: 'nearest' });
  }

  // ---------- Eventos ----------
  function alternarFerramenta(btn, valor) { btn.setAttribute('aria-pressed', valor); }
  // ---------- Nota nova ----------
  function abrirNovaNota() {
    const form = $('.cz-nova-form');
    form.hidden = false; $('.cz-nova').hidden = true;
    const campo = form.querySelector('input');
    campo.value = ''; campo.focus();
  }
  function fecharNovaNota() { $('.cz-nova-form').hidden = true; $('.cz-nova').hidden = false; }
  function criarNota(titulo) {
    fecharNovaNota();
    if (!titulo.trim()) return;
    const n = C.criar(titulo, atual?.pasta || 'Projetos');
    // O universo é montado de novo na próxima vez, já com a nota nova.
    if (universo) { universo.destruir(); universo = null; }
    if (heroi) { heroi.destruir(); heroi = null; }
    abrir(n.id);
    editando = true;
    desenharNota();
  }

  // ---------- Status do GitHub ----------
  SYNC.aoMudar(st => {
    const b = $('.cz-sync');
    if (!b) return;
    b.dataset.estado = st.tipo;
    b.querySelector('.cz-sync-texto').textContent = st.texto || (SYNC.conectado ? 'Sincronizado' : 'Sem GitHub');
    b.title = st.texto || 'Conexão com o GitHub';
  });

  const acoes = {
    conexao: () => { if (SYNC.estado.tipo === 'novo') location.reload(); else CONEXAO.painel(raiz); },
    nova: abrirNovaNota,
    menu: () => raiz.dataset.menu = '1',
    'fechar-menu': () => raiz.dataset.menu = '0',
    busca: abrirBusca,
    editar: alternarEdicao,
    temas: () => alternarTemas(),
    som: () => { const on = SOM.alternar(); $('[data-acao="som"]').innerHTML = on ? ic.somOn : ic.somOff; },
    varinha,
    'parar-varinha': () => universo?.pararVarinha(),
    'fechar-cartao': () => selecionar(null),
    'ver-no-universo': () => { const id = atual.id; irPara('universo', true); setTimeout(() => selecionar(id), 60); },
    girar: b => alternarFerramenta(b, universo.girar(b.getAttribute('aria-pressed') !== 'true')),
    sinais: b => alternarFerramenta(b, universo.sinais(b.getAttribute('aria-pressed') !== 'true')),
    rotulos: b => { const v = b.getAttribute('aria-pressed') !== 'true'; universo.rotulos(v ? 'sempre' : 'auto'); alternarFerramenta(b, v); },
    centro: () => { selecionar(null); universo.centralizar(); },
    'ir-universo': () => irPara('universo', true),
    voltar: () => irPara('lista'),
    instalar: async () => {
      const p = window.pedidoInstalar;
      if (!p) return;
      p.prompt();
      try { await p.userChoice; } catch { /* ok */ }
      window.pedidoInstalar = null;
      desenharInstalar();
    },
    'sem-instalar': () => { guardar('cerebro-sem-instalar', '1'); desenharInstalar(); },
  };
  function irParaAba(aba) {
    tremer();
    if (aba === 'busca') { abrirBusca(); return; }
    if (aba === 'notas') {
      // Já na lista: volta ao topo; lendo uma nota: volta para a lista.
      if (raiz.dataset.modo === 'lista') $('.cz-lado').scrollTo({ top: 0, behavior: C.reduzido ? 'auto' : 'smooth' });
      else irPara('lista');
      return;
    }
    if (raiz.dataset.modo === aba && aba === 'hoje') { $('.cz-vista-hoje').scrollTo({ top: 0, behavior: C.reduzido ? 'auto' : 'smooth' }); return; }
    irPara(aba, true);
  }
  raiz.addEventListener('click', e => {
    const alvo = e.target.closest('[data-id],[data-res],[data-grupo],[data-acao],[data-topico],[data-modo-btn],[data-tema],[data-legenda],[data-selecionar],[data-vel],[data-forma],[data-aba]');
    if (!$('.cz-temas').hidden && !e.target.closest('.cz-temas,[data-acao="temas"]')) alternarTemas(false);
    if (!alvo) { if (e.target.classList.contains('cz-paleta')) fecharBusca(); return; }
    const d = alvo.dataset;
    if (d.aba) { irParaAba(d.aba); return; }
    if (d.id) { e.preventDefault(); fecharBusca(); abrir(d.id); return; }
    if (d.res) { e.preventDefault(); escolher(d.res); return; }
    if (d.modoBtn) { irPara(d.modoBtn, true); if (d.modoBtn === 'nota' && !atual) abrir(C.inicial().id, { som: false }); return; }
    if (d.tema) { aplicarTema(d.tema, true); return; }
    if (d.selecionar) { selecionar(d.selecionar); return; }
    if (d.forma) { trocarForma(d.forma); return; }
    if (d.vel) {
      velocidade = +d.vel;
      raiz.querySelectorAll('[data-vel]').forEach(b => b.toggleAttribute('data-ativo', b === alvo));
      if (universo?.varinhaAtiva) universo.iniciarVarinha(velocidade);
      return;
    }
    if (d.legenda) {
      ocultos.has(d.legenda) ? ocultos.delete(d.legenda) : ocultos.add(d.legenda);
      alvo.setAttribute('aria-pressed', !ocultos.has(d.legenda));
      universo?.ocultar([...ocultos]);
      return;
    }
    if (d.grupo) { abertos.has(d.grupo) ? abertos.delete(d.grupo) : abertos.add(d.grupo); desenharArvore(); return; }
    if (d.topico) {
      e.preventDefault();
      $('.cz-corpo')?.querySelectorAll('h2, h3')[+d.topico]?.scrollIntoView({ behavior: C.reduzido ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    acoes[d.acao]?.(alvo);
  });
  raiz.querySelector('.cz-paleta input').addEventListener('input', e => listar(e.target.value));
  $('.cz-nova-form').addEventListener('submit', e => { e.preventDefault(); criarNota(e.target.titulo.value); });
  $('.cz-nova-form input').addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); fecharNovaNota(); } });
  $('.cz-nova-form input').addEventListener('blur', () => setTimeout(() => { if (!$('.cz-nova-form').hidden && !$('.cz-nova-form input').value) fecharNovaNota(); }, 150));
  raiz.addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth; my = e.clientY / innerHeight;
    const p = e.target.closest?.('.cz-vidro');
    if (!p) return;
    const r = p.getBoundingClientRect();
    p.style.setProperty('--mx', `${e.clientX - r.left}px`);
    p.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    const digitando = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    if (mod && k === 'k') { e.preventDefault(); $('.cz-paleta').hidden ? abrirBusca() : fecharBusca(); return; }
    if (mod && k === 'e') { e.preventDefault(); if (raiz.dataset.modo === 'nota') alternarEdicao(); return; }
    if (mod && k === 'g') { e.preventDefault(); irPara(raiz.dataset.modo === 'universo' ? 'nota' : 'universo', true); if (!atual) abrir(C.inicial().id, { som: false }); return; }
    if (e.key === 'Escape') {
      if (!$('.cz-paleta').hidden) return fecharBusca();
      if (!$('.cz-temas').hidden) return alternarTemas(false);
      if (universo?.varinhaAtiva) return universo.pararVarinha();
      if (selecionado) return selecionar(null);
      raiz.dataset.menu = '0';
      return;
    }
    if (!$('.cz-paleta').hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moverSel(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); moverSel(-1); }
      if (e.key === 'Enter' && resultados[sel]) { e.preventDefault(); escolher(resultados[sel].nota.id); }
      return;
    }
    if (!digitando && !mod && raiz.dataset.modo === 'universo' && k === 'w') varinha();
    if (!digitando && !mod && raiz.dataset.modo === 'universo' && k === 'f' && universo) trocarForma(FORMAS[(FORMAS.indexOf(universo.forma) + 1) % FORMAS.length]);
  });
  addEventListener('resize', () => {
    moverLuzModos(); marcarAbas();
    if (raiz.dataset.modo === 'lista' && !celular()) irPara('nota');
    if (universo) marcarForma(universo.forma); if (raiz.dataset.modo === 'nota' && !mini) desenharMini(); });

  // ---------- Início ----------
  desenharTemas();
  aplicarTema(temaId);
  atual = C.inicial();
  abertos.add(atual.grupo);
  desenharArvore();
  desenharNota();
  irPara(['hoje', 'nota', 'universo'].includes(raiz.dataset.modo) ? raiz.dataset.modo : 'hoje');
  requestAnimationFrame(() => requestAnimationFrame(() => raiz.setAttribute('data-pronto', '')));
  rafCeu = requestAnimationFrame(desenharCeu);
  void rafCeu;
};
