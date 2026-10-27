// Núcleo do app: notas, links, ligações, busca e markdown. O grafo 3D fica em universo.js.
// montarNucleo(notas) cria window.C. As notas vêm do GitHub (sync.js) ou, no PC, de dados-cerebro.js.
window.montarNucleo = function (notas) {
  notas.forEach(n => { n.corpo = n.corpo.replace(/\r\n?/g, '\n').replace(/^﻿/, ''); });
  const porId = new Map(notas.map(n => [n.id, n]));
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Grupo = projeto. "Projetos/PFSDR/x.md" e "Projetos/PFSDR.md" caem no mesmo grupo.
  const pastasProjeto = new Set(notas.map(n => n.pasta.split('/')[1]).filter(Boolean));
  function grupo(n) {
    const seg = n.pasta.split('/');
    if (seg[1]) return seg[1];
    if (pastasProjeto.has(n.titulo)) return n.titulo;
    return 'Soltas';
  }
  notas.forEach(n => { n.grupo = grupo(n); });

  const grupos = [...new Set(notas.map(n => n.grupo))]
    .sort((a, b) => (a === 'Soltas') - (b === 'Soltas') || a.localeCompare(b, 'pt-BR'))
    .map((nome, i) => ({
      nome,
      indice: i,
      notas: notas.filter(n => n.grupo === nome).sort((a, b) =>
        (b.titulo === nome) - (a.titulo === nome) || a.titulo.localeCompare(b.titulo, 'pt-BR')),
    }));
  const indiceGrupo = new Map(grupos.map(g => [g.nome, g.indice]));

  // Resolve [[link]] como o Obsidian: mesmo nome na mesma pasta primeiro, depois caminho, depois qualquer.
  function resolver(alvo, de) {
    alvo = alvo.trim().replace(/\.md$/, '');
    const mesmos = notas.filter(n => n.titulo === alvo);
    if (mesmos.length) return (mesmos.find(n => de && n.pasta === de.pasta) || mesmos[0]).id;
    const porCaminho = notas.find(n => n.id.endsWith('/' + alvo + '.md') || n.id === alvo + '.md');
    return porCaminho ? porCaminho.id : null;
  }

  let saidas, entradas;
  function indexar() {
    saidas = new Map();
    entradas = new Map(notas.map(n => [n.id, new Set()]));
    for (const n of notas) {
      const s = new Set();
      for (const l of n.links) {
        const id = resolver(l, n);
        if (id && id !== n.id) { s.add(id); entradas.get(id).add(n.id); }
      }
      saidas.set(n.id, s);
    }
  }
  indexar();

  function atualizar(id, corpo) {
    const n = porId.get(id);
    n.corpo = corpo;
    n.links = [...new Set([...corpo.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)].map(m => m[1].trim()))];
    n.alterado = Date.now();
    indexar();
  }

  // Nota nova na mesma pasta da nota aberta (ou em Projetos). Só existe na tela até ser salva.
  function criar(titulo, pasta = 'Projetos') {
    const limpo = titulo.replace(/[\/:*?"<>|#^[\]]/g, '').trim() || 'Nova nota';
    let nome = limpo, k = 2;
    while (porId.has(`${pasta}/${nome}.md`)) nome = `${limpo} ${k++}`;
    const n = { id: `${pasta}/${nome}.md`, titulo: nome, pasta, corpo: `# ${nome}\n\n`, links: [], alterado: Date.now(), criado: Date.now(), nova: true };
    n.grupo = grupo(n);
    notas.push(n); porId.set(n.id, n);
    let g = grupos.find(x => x.nome === n.grupo);
    if (!g) { g = { nome: n.grupo, indice: grupos.length, notas: [] }; grupos.push(g); indiceGrupo.set(g.nome, g.indice); }
    g.notas.push(n);
    indexar();
    return n;
  }

  function html(n) {
    const corpo = n.corpo.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, alvo, ancora, apelido) => {
      const id = resolver(alvo, n);
      const texto = esc(apelido || alvo.split('/').pop());
      return id
        ? `<a class="wl" href="#" data-id="${esc(id)}">${texto}</a>`
        : `<span class="wl wl-x" title="Nota ainda não existe">${texto}</span>`;
    });
    const saida = window.marked ? marked.parse(corpo, { gfm: true, breaks: false }) : `<pre>${esc(corpo)}</pre>`;
    // Links externos sempre em aba nova.
    return saida.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
  }

  // Remove o primeiro "# Título" quando ele repete o nome da nota (o título já aparece no cabeçalho).
  function semTitulo(n) {
    const m = n.corpo.match(/^\s*#\s+(.+)\n/);
    return m ? { ...n, corpo: n.corpo.slice(m[0].length) } : n;
  }

  function topicos(n) {
    return [...n.corpo.matchAll(/^(#{2,3})\s+(.+)$/gm)].map(m => ({ nivel: m[1].length, texto: m[2].replace(/[*_`]/g, '') }));
  }

  function resumo(n, tam = 140) {
    const texto = semTitulo(n).corpo
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a.split('/').pop())
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, ' ')
      .replace(/[*_`]+/g, '')
      .replace(/[#>|]+|-{2,}/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ').trim();
    return texto.length > tam ? texto.slice(0, tam).replace(/\s\S*$/, '') + '…' : texto;
  }

  const palavras = n => (n.corpo.match(/\S+/g) || []).length;

  const normal = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function buscar(q, max = 12) {
    const t = normal(q.trim());
    if (!t) return [];
    const termos = t.split(/\s+/);
    const res = [];
    for (const n of notas) {
      const titulo = normal(n.titulo), corpo = normal(n.corpo);
      let pontos = 0;
      for (const termo of termos) {
        if (titulo.startsWith(termo)) pontos += 12;
        else if (titulo.includes(termo)) pontos += 8;
        else if (normal(n.grupo).includes(termo)) pontos += 4;
        const ocorr = corpo.split(termo).length - 1;
        if (!ocorr && !titulo.includes(termo)) { pontos = 0; break; }
        pontos += Math.min(ocorr, 6);
      }
      if (pontos > 0) {
        const pos = corpo.indexOf(termos[0]);
        let trecho = '';
        if (pos >= 0) {
          const ini = Math.max(0, pos - 40);
          trecho = n.corpo.slice(ini, pos + 90).replace(/\s+/g, ' ').replace(/[#*`\[\]]/g, '');
          trecho = (ini > 0 ? '…' : '') + trecho + '…';
        }
        res.push({ nota: n, pontos, trecho });
      }
    }
    return res.sort((a, b) => b.pontos - a.pontos).slice(0, max);
  }

  function marcar(texto, q) {
    const termos = normal(q.trim()).split(/\s+/).filter(Boolean);
    if (!termos.length) return esc(texto);
    // Normaliza letra a letra para os índices baterem com o texto original.
    const base = [...texto].map(c => c.length > 1 ? '\u0000' : (normal(c)[0] || c)).join('');
    const marca = new Array(base.length).fill(false);
    for (const termo of termos) {
      let i = base.indexOf(termo);
      while (i >= 0) { for (let k = i; k < i + termo.length; k++) marca[k] = true; i = base.indexOf(termo, i + termo.length); }
    }
    const letras = [...texto];
    let out = '', aberto = false;
    letras.forEach((c, i) => {
      if (marca[i] && !aberto) { out += '<mark>'; aberto = true; }
      if (!marca[i] && aberto) { out += '</mark>'; aberto = false; }
      out += esc(c);
    });
    return out + (aberto ? '</mark>' : '');
  }

  function tempo(ms) {
    const d = (Date.now() - ms) / 1000;
    if (d < 60) return 'agora';
    if (d < 3600) return `há ${Math.floor(d / 60)} min`;
    if (d < 86400) return `há ${Math.floor(d / 3600)} h`;
    const dias = Math.floor(d / 86400);
    if (dias < 30) return dias === 1 ? 'ontem' : `há ${dias} dias`;
    return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  window.C = {
    notas, porId, grupos, indiceGrupo, reduzido, esc, resolver, html, semTitulo, topicos, resumo, palavras,
    buscar, marcar, tempo, atualizar, criar,
    saidas: id => [...saidas.get(id)].map(i => porId.get(i)),
    entradas: id => [...entradas.get(id)].map(i => porId.get(i)),
    // Abre na nota mais ligada do cérebro (um "hub"), que mostra melhor links e vizinhança.
    inicial: () => [...notas].sort((a, b) => saidas.get(b.id).size - saidas.get(a.id).size)[0] || notas[0],
  };
};
