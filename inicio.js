// Partida do app: pega as notas (cópia do aparelho, GitHub ou, no PC, o arquivo gerado pelo script),
// monta o núcleo e a interface, e só depois confere o GitHub em segundo plano.
(async function () {
  const app = document.getElementById('app');
  const noPC = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* sem offline, segue */ });
  // Android e PC: o navegador avisa que dá para instalar; a aba Hoje mostra o botão "Instalar".
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.pedidoInstalar = e; dispatchEvent(new Event('cerebro-instalavel')); });

  app.innerHTML = '<div class="cz-abrindo"><span class="cz-logo"></span><p>Abrindo o cérebro…</p></div>';
  const tirarAbrindo = SYNC.aoMudar(st => { const p = app.querySelector('.cz-abrindo p'); if (p && st.texto) p.textContent = st.texto; });

  // Volta do "Entrar com GitHub": o endereço chega com ?code=…; troca pelo acesso e limpa o endereço.
  const volta = new URLSearchParams(location.search);
  if (volta.get('code')) {
    history.replaceState(null, '', location.pathname);
    app.querySelector('.cz-abrindo p').textContent = 'Entrando…';
    const r = await SYNC.receberCodigo(volta.get('code'), volta.get('state'));
    if (!r.ok) { tirarAbrindo(); CONEXAO.tela(app, r.motivo, r.instalar); return; }
  } else if (volta.get('error')) {
    history.replaceState(null, '', location.pathname);
    tirarAbrindo(); CONEXAO.tela(app, 'O login foi cancelado no GitHub.'); return;
  }

  // No PC, sem GitHub conectado, usa a cópia gerada por "node scripts/gerar-dados.mjs" (se existir).
  if (!SYNC.conectado && noPC) {
    await new Promise(ok => { const s = document.createElement('script'); s.src = 'dados-cerebro.js'; s.onload = s.onerror = ok; document.head.appendChild(s); });
  }

  let notas = null, motivo = '';
  try { notas = await SYNC.obterNotas(); } catch (e) { motivo = e.status === 401 ? 'O token não vale mais. Crie um novo e conecte de novo.' : 'Não deu para baixar as notas agora. Confira a internet e o token.'; }
  tirarAbrindo();

  if (!notas || !notas.length) { CONEXAO.tela(app, motivo); return; }
  montarNucleo(notas);
  iniciarCosmos();
  SYNC.depoisDeAbrir();
})();
