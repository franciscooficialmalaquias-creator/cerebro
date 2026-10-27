// Sincronização com o GitHub: o app lê e salva as notas direto no repositório do Cérebro.
// Cada nota salva vira um commit. Uma cópia fica guardada no aparelho para abrir na hora
// (e funcionar sem internet); o que for salvo offline sobe quando a conexão voltar.
(function () {
  const API = 'https://api.github.com';
  const K = { config: 'cerebro-github', cache: 'cerebro-cache-v1', pendentes: 'cerebro-pendentes', criado: 'cerebro-criado', atividade: 'cerebro-atividade' };
  const PADRAO = { repo: 'franciscooficialmalaquias-creator/cerebro-malaquias', ramo: 'main', token: '' };

  const ler = (k, p) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch { return p; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  let config = { ...PADRAO, ...ler(K.config, {}) };
  let abriuDoCache = false, origem = 'nenhuma';
  const ouvintes = new Set();
  let estado = { tipo: 'parado', texto: '' };
  function avisar(tipo, texto) { estado = { tipo, texto }; ouvintes.forEach(f => f(estado)); }

  // ---------- Login com GitHub ----------
  const LOGIN = window.CEREBRO_LOGIN || {};
  const loginPronto = () => !!(LOGIN.clientId && LOGIN.worker);
  const enderecoApp = () => location.origin + location.pathname;

  async function pedirAoWorker(rota, corpo) {
    const r = await fetch(LOGIN.worker.replace(/\/$/, '') + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.token) throw Object.assign(new Error(d.erro || 'O login falhou'), { status: r.status });
    return d;
  }
  // O token do login vence em ~8 h; o app renova sozinho com o "refresh" (vale ~6 meses e se renova a cada uso).
  let renovando = null;
  function renovar() {
    if (!config.refresh || !loginPronto()) return Promise.reject(Object.assign(new Error('sem renovação'), { status: 401 }));
    renovando ??= pedirAoWorker('/renova', { refresh: config.refresh }).then(d => {
      config = { ...config, token: d.token, refresh: d.refresh || config.refresh, expira: d.expira };
      gravar(K.config, config);
    }).finally(() => { renovando = null; });
    return renovando;
  }

  async function api(caminho, opcoes = {}) {
    if (config.expira && config.refresh && Date.now() > config.expira - 60000) await renovar();
    const cab = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: `Bearer ${config.token}` };
    if (opcoes.body) cab['Content-Type'] = 'application/json';
    const r = await fetch(API + caminho, { ...opcoes, headers: cab, cache: 'no-store' });
    if (r.status === 401 && config.refresh && !opcoes.jaRenovou) {
      await renovar();
      return api(caminho, { ...opcoes, jaRenovou: true });
    }
    if (!r.ok) {
      const e = new Error(`GitHub respondeu ${r.status}`);
      e.status = r.status;
      try { e.detalhe = (await r.json()).message; } catch { /* sem corpo */ }
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }

  function mensagemErro(e) {
    if (e instanceof TypeError || !navigator.onLine) return 'Sem internet — usando a cópia do aparelho';
    if (e.status === 401) return config.login ? 'O login venceu. Entre com o GitHub de novo.' : 'O token do GitHub não vale mais. Conecte de novo.';
    if (e.status === 403) return 'Sem permissão de escrita nesse repositório.';
    if (e.status === 404) return config.login
      ? 'O app de login ainda não foi instalado no repositório do cérebro.'
      : 'Repositório ou ramo não encontrado (ou o token não enxerga ele).';
    return 'Erro do GitHub: ' + (e.detalhe || e.message);
  }

  const deBase64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
  function paraBase64(txt) {
    const bytes = new TextEncoder().encode(txt);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const caminhoApi = p => p.split('/').map(encodeURIComponent).join('/');
  const linksDe = corpo => [...new Set([...corpo.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)].map(m => m[1].trim()))];
  // Só notas .md; pastas escondidas (.obsidian, .trash, .git…) e o README da raiz ficam de fora
  // (o Obsidian abre a pasta Projetos, então o README não é nota do cérebro).
  const ignorar = p => !p.endsWith('.md') || p === 'README.md' || p.split('/').some(seg => seg.startsWith('.'));

  async function emLotes(itens, n, fn) {
    const fila = [...itens];
    await Promise.all(Array.from({ length: Math.min(n, fila.length) }, async () => { while (fila.length) await fn(fila.shift()); }));
  }

  function notaDe(caminho, corpo, sha, criado) {
    const partes = caminho.split('/'), arquivo = partes.pop();
    const quando = criado || 0;
    return { id: caminho, titulo: arquivo.replace(/\.md$/, ''), pasta: partes.join('/'), corpo, links: linksDe(corpo), alterado: quando, criado: quando, sha };
  }
  function deCache(cache) {
    const criados = ler(K.criado, {});
    return Object.entries(cache.arquivos).filter(([p]) => !ignorar(p)).map(([p, a]) => notaDe(p, a.corpo, a.sha, criados[p]));
  }
  // Edições feitas sem internet aparecem por cima da cópia guardada até subirem.
  function aplicarPendentes(notas) {
    const pend = ler(K.pendentes, {});
    for (const p of Object.values(pend)) {
      const n = notas.find(x => x.id === p.id);
      if (n) { n.corpo = p.corpo; n.links = linksDe(p.corpo); n.sha = p.sha; }
      else notas.push({ ...notaDe(p.id, p.corpo, p.sha, Date.now()), nova: true });
    }
    return notas;
  }

  // Baixa só o que mudou desde a última vez (compara o "sha" de cada arquivo).
  async function baixar() {
    const cache = ler(K.cache, { arquivos: {} });
    if (cache.repo !== config.repo) cache.arquivos = {};
    const arvore = await api(`/repos/${config.repo}/git/trees/${encodeURIComponent(config.ramo)}?recursive=1`);
    const blobs = arvore.tree.filter(t => t.type === 'blob' && !ignorar(t.path));
    const faltam = blobs.filter(b => cache.arquivos[b.path]?.sha !== b.sha);
    let feitos = 0;
    await emLotes(faltam, 8, async b => {
      const blob = await api(`/repos/${config.repo}/git/blobs/${b.sha}`);
      cache.arquivos[b.path] = { sha: b.sha, corpo: deBase64(blob.content) };
      if (faltam.length > 3) avisar('baixando', `Baixando notas… ${++feitos} de ${faltam.length}`);
    });
    const novos = {};
    for (const b of blobs) novos[b.path] = cache.arquivos[b.path];
    const mudou = faltam.length > 0 || Object.keys(cache.arquivos).length !== blobs.length;
    gravar(K.cache, { repo: config.repo, quando: Date.now(), arquivos: novos });
    const criados = ler(K.criado, {});
    buscarCriados(blobs.map(b => b.path).filter(p => !criados[p]));
    return { notas: deCache({ arquivos: novos }), mudou };
  }

  // Data em que cada nota nasceu = primeiro commit dela (usada pela varinha). Vem em segundo plano
  // e fica guardada, então só é buscada uma vez por nota.
  async function buscarCriados(caminhos) {
    if (!caminhos.length) return;
    const criados = ler(K.criado, {});
    let feitas = 0;
    await emLotes(caminhos, 6, async p => {
      try {
        const lista = await api(`/repos/${config.repo}/commits?path=${encodeURIComponent(p)}&sha=${encodeURIComponent(config.ramo)}&per_page=100`);
        const primeiro = lista[lista.length - 1];
        if (primeiro) criados[p] = Date.parse(primeiro.commit.author.date);
        if (++feitas % 10 === 0) gravar(K.criado, criados);
      } catch { /* tenta de novo na próxima abertura */ }
    });
    gravar(K.criado, criados);
  }

  // O que mudou no cérebro: os últimos commits (mensagem, quando e quais notas), para a aba Hoje.
  // Os arquivos de cada commit são buscados uma vez só; sem internet, volta a última lista guardada.
  async function atividade(qtd = 20) {
    if (!config.token) return window.CEREBRO?.atividade || [];
    const guardada = ler(K.atividade, { lista: [], arquivos: {} });
    try {
      const commits = await api(`/repos/${config.repo}/commits?sha=${encodeURIComponent(config.ramo)}&per_page=${qtd}`);
      const arquivos = {};
      for (const c of commits) if (guardada.arquivos[c.sha]) arquivos[c.sha] = guardada.arquivos[c.sha];
      await emLotes(commits.filter(c => !arquivos[c.sha]), 6, async c => {
        try {
          const d = await api(`/repos/${config.repo}/commits/${c.sha}`);
          arquivos[c.sha] = (d.files || []).filter(a => !ignorar(a.filename)).map(a => ({ id: a.filename, tipo: a.status }));
        } catch { /* fica sem a lista de notas desse commit */ }
      });
      const lista = commits.map(c => ({ sha: c.sha, msg: c.commit.message.split('\n')[0], quando: Date.parse(c.commit.author.date), arquivos: arquivos[c.sha] || [] }));
      gravar(K.atividade, { lista, arquivos });
      return lista;
    } catch { return guardada.lista; }
  }

  function guardarPendente(nota) {
    const pend = ler(K.pendentes, {});
    pend[nota.id] = { id: nota.id, corpo: nota.corpo, sha: nota.sha || null, titulo: nota.titulo };
    gravar(K.pendentes, pend);
  }
  function tirarPendente(id) { const pend = ler(K.pendentes, {}); delete pend[id]; gravar(K.pendentes, pend); }

  async function salvar(nota) {
    if (!config.token) {
      avisar('local', 'Mudança só nesta tela — conecte ao GitHub para salvar');
      return false;
    }
    avisar('salvando', 'Salvando no GitHub…');
    const corpo = { message: `${nota.sha ? 'Edita' : 'Cria'} ${nota.titulo} (Cérebro App)`, content: paraBase64(nota.corpo), branch: config.ramo };
    if (nota.sha) corpo.sha = nota.sha;
    try {
      const r = await api(`/repos/${config.repo}/contents/${caminhoApi(nota.id)}`, { method: 'PUT', body: JSON.stringify(corpo) });
      nota.sha = r.content.sha; nota.nova = false;
      const cache = ler(K.cache, { repo: config.repo, arquivos: {} });
      cache.arquivos[nota.id] = { sha: nota.sha, corpo: nota.corpo };
      gravar(K.cache, cache);
      tirarPendente(nota.id);
      avisar('ok', 'Salvo no GitHub');
      return true;
    } catch (e) {
      if (e instanceof TypeError || !navigator.onLine) {
        guardarPendente(nota);
        avisar('offline', 'Sem internet: guardado no aparelho, sobe quando voltar');
      } else if (e.status === 409) {
        guardarPendente(nota);
        avisar('erro', 'Essa nota mudou em outro lugar. Sua versão ficou guardada; recarregue para comparar.');
      } else avisar('erro', mensagemErro(e));
      return false;
    }
  }

  async function enviarPendentes() {
    const pend = Object.values(ler(K.pendentes, {}));
    for (const p of pend) {
      const n = window.C?.porId.get(p.id) || { ...p };
      n.corpo = p.corpo; if (p.sha) n.sha = p.sha;
      if (!(await salvar(n))) break;
    }
  }

  window.SYNC = {
    get conectado() { return !!config.token; },
    get repo() { return config.repo; },
    get ramo() { return config.ramo; },
    get origem() { return origem; },
    get estado() { return estado; },
    aoMudar(f) { ouvintes.add(f); f(estado); return () => ouvintes.delete(f); },

    get loginPronto() { return loginPronto(); },
    instalarApp: `https://github.com/apps/${LOGIN.slug || 'cerebro-malaquias-app'}/installations/new`,

    // "Entrar com GitHub": vai para a página de autorização do GitHub, que volta para o app com um código.
    entrarComGitHub() {
      const estadoLogin = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { sessionStorage.setItem('cerebro-login-estado', estadoLogin); } catch { /* ok */ }
      const u = new URL('https://github.com/login/oauth/authorize');
      u.searchParams.set('client_id', LOGIN.clientId);
      u.searchParams.set('redirect_uri', enderecoApp());
      u.searchParams.set('state', estadoLogin);
      location.href = u.toString();
    },

    // Volta do GitHub: troca o código pelo token (no servidor de login) e testa o acesso ao repositório.
    async receberCodigo(code, estadoLogin) {
      let esperado = null;
      try { esperado = sessionStorage.getItem('cerebro-login-estado'); sessionStorage.removeItem('cerebro-login-estado'); } catch { /* ok */ }
      if (!esperado || esperado !== estadoLogin) return { ok: false, motivo: 'O login não começou neste aparelho. Tente de novo.' };
      try {
        const d = await pedirAoWorker('/troca', { code });
        return await window.SYNC.conectar(d.token, PADRAO.repo, PADRAO.ramo, { refresh: d.refresh, expira: d.expira, login: true });
      } catch (e) { return { ok: false, motivo: e.message || 'O login falhou' }; }
    },

    // Testa o acesso antes de guardar: precisa enxergar o repositório e poder escrever nele.
    async conectar(token, repo, ramo, extras = {}) {
      const antes = config;
      config = { token: token.trim(), repo: repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, ''), ramo: (ramo || 'main').trim(), refresh: extras.refresh || null, expira: extras.expira || null, login: !!extras.login };
      try {
        const r = await api(`/repos/${config.repo}`);
        if (r.permissions && !r.permissions.push) throw Object.assign(new Error('sem escrita'), { status: 403 });
        await api(`/repos/${config.repo}/branches/${encodeURIComponent(config.ramo)}`);
        gravar(K.config, config);
        return { ok: true };
      } catch (e) {
        const motivo = mensagemErro(e);
        config = antes;
        return { ok: false, motivo, instalar: e.status === 404 && !!extras.login };
      }
    },
    desconectar() {
      [K.config, K.cache, K.pendentes, K.criado, K.atividade].forEach(k => { try { localStorage.removeItem(k); } catch { /* ok */ } });
      config = { ...PADRAO };
    },

    // Abre com o que der: a cópia guardada (na hora), o GitHub (primeira vez) ou os dados do PC.
    async obterNotas() {
      if (config.token) {
        const cache = ler(K.cache, null);
        if (cache && cache.repo === config.repo && Object.keys(cache.arquivos || {}).length) {
          abriuDoCache = true; origem = 'github';
          return aplicarPendentes(deCache(cache));
        }
        avisar('baixando', 'Baixando notas do GitHub…');
        const { notas } = await baixar();
        origem = 'github';
        return aplicarPendentes(notas);
      }
      if (window.CEREBRO) { origem = 'local'; return window.CEREBRO.notas; }
      return null;
    },

    // Depois que o app abriu: confere se o GitHub tem novidade e sobe o que ficou pendente.
    async depoisDeAbrir() {
      if (!config.token) { avisar('local', origem === 'local' ? 'Cópia deste PC (sem GitHub)' : ''); return; }
      try {
        let mudou = false;
        if (abriuDoCache) { avisar('baixando', 'Conferindo o GitHub…'); mudou = (await baixar()).mudou; }
        await enviarPendentes();
        if (mudou) avisar('novo', 'Tem notas novas no GitHub — toque para atualizar');
        else if (estado.tipo !== 'erro' && estado.tipo !== 'offline') avisar('ok', 'Sincronizado');
      } catch (e) { avisar(navigator.onLine ? 'erro' : 'offline', mensagemErro(e)); }
    },

    salvar,
    atividade,
  };

  addEventListener('online', () => { if (config.token) enviarPendentes().then(() => window.SYNC.depoisDeAbrir()); });
  addEventListener('offline', () => avisar('offline', 'Sem internet — usando a cópia do aparelho'));
})();
