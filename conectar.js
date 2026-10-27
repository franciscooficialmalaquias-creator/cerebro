// Tela de conexão com o GitHub (primeira vez em cada aparelho) e o painel de conexão dentro do app.
// O jeito principal é o botão "Entrar com GitHub"; colar um token fica como alternativa escondida.
(function () {
  const LINK_TOKEN = 'https://github.com/settings/personal-access-tokens/new';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GITHUB_ICONE = '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8Z"/></svg>';

  function entrar(instalar) {
    if (!SYNC.loginPronto) return '';
    return `
      <button class="cz-primario cz-entrar" data-c="entrar">${GITHUB_ICONE}<span>Entrar com GitHub</span></button>
      ${instalar ? `<a class="cz-botao cz-instalar" href="${SYNC.instalarApp}" target="_blank" rel="noopener">Instalar o app no repositório do cérebro</a>` : ''}`;
  }

  function formulario() {
    const form = `
      <form class="cz-conexao-form" autocomplete="off">
        <label><span>Token do GitHub</span>
          <input name="token" type="password" placeholder="github_pat_…" required spellcheck="false" autocomplete="off"></label>
        <label><span>Repositório do cérebro</span>
          <input name="repo" value="${esc(SYNC.repo)}" required spellcheck="false"></label>
        <label><span>Ramo</span>
          <input name="ramo" value="${esc(SYNC.ramo)}" required spellcheck="false"></label>
        <p class="cz-conexao-erro" role="alert" hidden></p>
        <button class="cz-primario" type="submit">Conectar</button>
      </form>
      <details class="cz-conexao-ajuda">
        <summary>Como criar o token (2 minutos)</summary>
        <ol>
          <li>Abra <a href="${LINK_TOKEN}" target="_blank" rel="noopener">github.com → Settings → Fine-grained tokens</a> e clique em <b>Generate new token</b>.</li>
          <li>Em <b>Repository access</b>, escolha <b>Only select repositories</b> e marque só o <b>cerebro-malaquias</b>.</li>
          <li>Em <b>Permissions → Repository permissions</b>, coloque <b>Contents: Read and write</b>.</li>
          <li>Gere, copie e cole aqui. O token fica guardado só neste aparelho.</li>
        </ol>
      </details>`;
    // Com o login pronto, o token vira plano B (fechado).
    return SYNC.loginPronto ? `<details class="cz-conexao-token"><summary>Prefiro colar um token</summary>${form}</details>` : form;
  }

  function ligar(raiz, aoConectar) {
    raiz.querySelector('[data-c="entrar"]')?.addEventListener('click', e => {
      e.currentTarget.disabled = true;
      e.currentTarget.querySelector('span').textContent = 'Abrindo o GitHub…';
      SYNC.entrarComGitHub();
    });
    const form = raiz.querySelector('.cz-conexao-form');
    if (!form) return;
    const erro = form.querySelector('.cz-conexao-erro'), botao = form.querySelector('button');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = new FormData(form);
      botao.disabled = true; botao.textContent = 'Conferindo…'; erro.hidden = true;
      const r = await SYNC.conectar(d.get('token'), d.get('repo'), d.get('ramo'));
      if (r.ok) { botao.textContent = 'Conectado'; aoConectar(); return; }
      erro.textContent = r.motivo; erro.hidden = false;
      botao.disabled = false; botao.textContent = 'Conectar';
    });
  }

  window.CONEXAO = {
    // Tela cheia, antes do app abrir. "instalar" = o login deu certo mas o app não está no repositório.
    tela(el, motivo, instalar) {
      el.innerHTML = `
        <div class="cz cz-tela-conexao" data-pronto>
          <div class="cz-conexao-caixa">
            <div class="cz-marca"><span class="cz-logo"></span><span>Cérebro</span></div>
            <h1>${SYNC.loginPronto ? 'Entrar no seu cérebro' : 'Conectar ao seu cérebro no GitHub'}</h1>
            <p>As notas são lidas e salvas direto no seu repositório. ${SYNC.loginPronto ? 'Entre uma vez e este aparelho fica conectado.' : 'Cada nota salva vira um commit.'}</p>
            ${motivo ? `<p class="cz-conexao-erro">${esc(motivo)}</p>` : ''}
            ${entrar(instalar)}
            ${formulario()}
          </div>
        </div>`;
      for (const [k, v] of Object.entries((window.TEMAS?.buraco || {}).css || {})) el.firstElementChild.style.setProperty('--' + k, v);
      ligar(el, () => location.reload());
    },

    // Painel dentro do app (clicando no status de sincronização).
    painel(raiz) {
      let p = raiz.querySelector('.cz-conexao-painel');
      if (p) { p.remove(); return; }
      p = document.createElement('div');
      p.className = 'cz-conexao-painel';
      const st = SYNC.estado;
      p.innerHTML = SYNC.conectado ? `
        <div class="cz-conexao-caixa" role="dialog" aria-label="Conexão com o GitHub">
          <h3>Conectado ao GitHub</h3>
          <p class="cz-conexao-linha"><span>Repositório</span><b>${esc(SYNC.repo)}</b></p>
          <p class="cz-conexao-linha"><span>Ramo</span><b>${esc(SYNC.ramo)}</b></p>
          <p class="cz-conexao-linha"><span>Situação</span><b>${esc(st.texto || 'Sincronizado')}</b></p>
          <div class="cz-conexao-botoes">
            <button class="cz-primario" data-c="recarregar">Atualizar agora</button>
            <button class="cz-botao" data-c="sair">Sair deste aparelho</button>
          </div>
        </div>` : `
        <div class="cz-conexao-caixa" role="dialog" aria-label="Conectar ao GitHub">
          <h3>${SYNC.loginPronto ? 'Entrar no GitHub' : 'Conectar ao GitHub'}</h3>
          <p>Agora as notas vêm ${SYNC.origem === 'local' ? 'da cópia deste PC' : 'só desta tela'}. Entre para ler e salvar no repositório.</p>
          ${entrar(false)}
          ${formulario()}
        </div>`;
      raiz.appendChild(p);
      p.addEventListener('click', e => {
        if (e.target === p) p.remove();
        const c = e.target.closest('[data-c]')?.dataset.c;
        if (c === 'recarregar') location.reload();
        if (c === 'sair' && confirm('Sair deste aparelho? O acesso e a cópia das notas saem dele (nada muda no GitHub).')) { SYNC.desconectar(); location.reload(); }
      });
      if (!SYNC.conectado) ligar(p, () => location.reload());
    },
  };
})();
