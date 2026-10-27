// Universo: o grafo do Cérebro em 3D, desenhado à mão num canvas (sem biblioteca).
// Notas são neurônios, links são conexões, e sinais correm pelas conexões como sinapses.
// A "varinha" refaz o crescimento do cérebro na ordem em que as notas nasceram,
// com a mesma regra do timelapse do Obsidian (estudo REA em rea-estudos/obsidian-graph-timelapse).
(function () {
  const TAU = Math.PI * 2;
  const quart = t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
  const saida = t => 1 - Math.pow(1 - t, 3);

  function Universo(canvas, o = {}) {
    const ctx = canvas.getContext('2d');
    const op = Object.assign({
      foco: null, profundidade: 1, estrelas: true, nucleo: true, sinais: true, rotulos: 'auto',
      forma: 'cerebro', girar: true, escala: 1,
      aoSobre: () => {}, aoClicar: () => {}, aoPasso: () => {}, aoFimVarinha: () => {}, aoPop: () => {},
    }, o);
    let tema = op.tema;
    const reduzido = C.reduzido;

    // ---------- Quais notas entram ----------
    let ids;
    if (op.foco) {
      const vistos = new Set([op.foco]);
      let fronteira = [op.foco];
      for (let p = 0; p < op.profundidade; p++) {
        const prox = [];
        for (const id of fronteira) for (const v of [...C.saidas(id), ...C.entradas(id)]) if (!vistos.has(v.id)) { vistos.add(v.id); prox.push(v.id); }
        fronteira = prox;
      }
      ids = [...vistos];
    } else ids = C.notas.map(n => n.id);

    const nos = ids.map((id, i) => {
      const nota = C.porId.get(id);
      const grau = C.saidas(id).length + C.entradas(id).length;
      // Semente em espiral esférica: o layout nasce espalhado e estável (sem aleatório).
      const y = 1 - (i / Math.max(1, ids.length - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      return {
        id, nota, grau, gi: C.indiceGrupo.get(nota.grupo) || 0,
        x: Math.cos(a) * r * 160, y: y * 130, z: Math.sin(a) * r * 160, vx: 0, vy: 0, vz: 0,
        raio: 3.2 + Math.sqrt(grau) * 1.5, luz: 1, flash: 0, vis: true, t0: 0,
        sx: 0, sy: 0, s: 0, d: 0,
      };
    });
    const idx = new Map(nos.map((n, i) => [n.id, i]));
    const arestas = [];
    for (const n of nos) for (const alvo of C.saidas(n.id)) if (idx.has(alvo.id)) arestas.push({ a: idx.get(n.id), b: idx.get(alvo.id), vis: true, t0: 0 });
    const vizinhos = nos.map(() => []);
    arestas.forEach((e, k) => { vizinhos[e.a].push([e.b, k]); vizinhos[e.b].push([e.a, k]); });

    // ---------- Layouts ----------
    // O universo principal tem dois layouts calculados uma vez só:
    //  • cérebro: as notas na superfície de um cérebro anatômico (dois hemisférios, cerebelo e tronco),
    //    cada projeto numa região, com milhares de neurônios de enfeite desenhando a silhueta;
    //  • fluxograma: plano, de frente, limpo — o grafo clássico.
    // Trocar de um para o outro anima cada nota do lugar atual até o outro layout.
    let semente = 3;
    const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;

    function simular(pos, { passos = 260, plano = false, comprimento = 42, repulsao = 900, puxar, depois } = {}) {
      const v = pos.map(() => ({ x: 0, y: 0, z: 0 }));
      let alfa = 1;
      for (let s = 0; s < passos; s++) {
        for (let i = 0; i < pos.length; i++) {
          const a = pos[i];
          for (let j = i + 1; j < pos.length; j++) {
            const b = pos[j];
            let dx = a.x - b.x, dy = a.y - b.y, dz = plano ? 0 : a.z - b.z;
            const d2 = dx * dx + dy * dy + dz * dz || 0.01;
            if (d2 > 160000) continue;
            const f = repulsao / d2 * alfa;
            dx *= f; dy *= f; dz *= f;
            v[i].x += dx; v[i].y += dy; v[i].z += dz; v[j].x -= dx; v[j].y -= dy; v[j].z -= dz;
          }
        }
        for (const e of arestas) {
          const a = pos[e.a], b = pos[e.b];
          const dx = b.x - a.x, dy = b.y - a.y, dz = plano ? 0 : b.z - a.z, d = Math.hypot(dx, dy, dz) || 1;
          const f = (d - comprimento) * 0.01 * alfa;
          v[e.a].x += dx / d * f; v[e.a].y += dy / d * f; v[e.a].z += dz / d * f;
          v[e.b].x -= dx / d * f; v[e.b].y -= dy / d * f; v[e.b].z -= dz / d * f;
        }
        for (let i = 0; i < pos.length; i++) {
          if (puxar) puxar(pos[i], v[i], i, alfa);
          v[i].x *= 0.62; v[i].y *= 0.62; v[i].z *= 0.62;
          pos[i].x += v[i].x; pos[i].y += v[i].y; pos[i].z = plano ? 0 : pos[i].z + v[i].z;
          if (depois) depois(pos[i], i);
        }
        alfa = Math.max(alfa * 0.985, 0.02);
      }
      return pos;
    }

    // Forma do cérebro (eixo z = frente/trás, y = cima/baixo, x = esquerda/direita). Só o cérebro
    // (os dois hemisférios), sem cerebelo nem tronco.
    const HEMI = { a: 98, b: 128, c: 180, cx: 50, sobe: -25 };
    // Giros: ondas com o espaço "torcido" antes, o que dá o desenho de minhoca dos sulcos.
    function sulcos(x, y, z) {
      const wx = x + 14 * Math.sin(z * 0.04 + y * 0.03), wy = y + 14 * Math.sin(x * 0.035 + z * 0.03), wz = z + 14 * Math.sin(y * 0.045 + x * 0.02);
      return Math.sin(wx * 0.11 + Math.sin(wz * 0.07) * 1.6) * Math.cos(wy * 0.1 + Math.sin(wx * 0.06) * 1.4) + 0.5 * Math.sin(wz * 0.13 + wy * 0.05);
    }
    const dobra = (x, y, z) => 1 + 0.028 * sulcos(x, y, z);
    function naSuperficie(lado, vx, vy, vz, fundo = 1) {
      const n = Math.hypot(vx, vy, vz) || 1, u = vz / n, lat = Math.max(0, lado * vx / n);
      let b;
      if (vy >= 0) b = HEMI.b * (1 - 0.18 * u * u - 0.06 * u);           // topo mais alto atrás do meio (parietal)
      else {
        // Base: o lobo temporal desce na lateral, à frente do meio; embaixo do frontal sobe; o occipital é cheio.
        const temporal = Math.exp(-((u - 0.12) ** 2) / 0.045) * (0.35 + 0.65 * lat);
        const orbital = Math.max(0, (u - 0.5) / 0.5);
        b = HEMI.b * (0.42 + 0.3 * temporal - 0.12 * orbital + 0.08 * Math.max(0, -u));
      }
      const a = HEMI.a * (1 - 0.14 * Math.max(0, u) - 0.06 * Math.max(0, -u)) * (vy < 0 ? 0.95 : 1);
      const c = HEMI.c * (vz > 0 ? 1 : 0.94);
      const k = 1 / Math.sqrt((vx / a) ** 2 + (vy / b) ** 2 + (vz / c) ** 2);
      const x = vx * k, y = vy * k, z = vz * k, d = dobra(x, y, z) * fundo;
      // A face de dentro de cada hemisfério para no meio (fissura longitudinal).
      return { x: lado * Math.max(4, lado * (lado * HEMI.cx + x * d)), y: y * d + HEMI.sobe, z: z * d };
    }
    const ladoDe = gi => (gi % 2 ? 1 : -1);

    function layoutCerebro() {
      // Cada projeto ganha uma região do hemisfério (frontal, parietal, occipital, temporal…).
      const regioes = [[0.55, 0.5, 0.75], [0.6, 0.15, -0.8], [0.85, -0.45, 0.2], [0.35, 0.9, -0.15], [0.95, 0.15, 0.05], [0.4, 0.55, 0.85], [0.7, -0.2, -0.55]];
      const grupos = [...new Set(nos.map(n => n.gi))].sort((a, b) => a - b);
      const ancora = new Map();
      const usados = { '-1': 0, '1': 0 };
      for (const gi of grupos) {
        const lado = ladoDe(gi), r = regioes[usados[lado]++ % regioes.length];
        ancora.set(gi, naSuperficie(lado, lado * r[0], r[1], r[2]));
      }
      const pos = nos.map(n => {
        const an = ancora.get(n.gi), lado = ladoDe(n.gi);
        const p = { x: an.x + (rnd() - 0.5) * 40, y: an.y + (rnd() - 0.5) * 40, z: an.z + (rnd() - 0.5) * 40 };
        return naSuperficie(lado, p.x - lado * HEMI.cx, p.y - HEMI.sobe, p.z, 1.03);
      });
      return simular(pos, {
        passos: 220, repulsao: 700, comprimento: 46,
        puxar: (p, v, i, alfa) => { const an = ancora.get(nos[i].gi); v.x += (an.x - p.x) * 0.004 * alfa; v.y += (an.y - p.y) * 0.004 * alfa; v.z += (an.z - p.z) * 0.004 * alfa; },
        // Depois de cada passo a nota volta para a superfície do seu hemisfério (um pouco por fora, para brilhar acima dos giros).
        depois: (p, i) => { const lado = ladoDe(nos[i].gi); Object.assign(p, naSuperficie(lado, p.x - lado * HEMI.cx, p.y - HEMI.sobe, p.z, 1.04)); },
      });
    }

    // Simples: plano, de frente, agrupado por projeto.
    function layoutPlano(base) {
      const grupos = [...new Set(nos.map(n => n.gi))].sort((a, b) => a - b);
      const centroG = new Map(grupos.map((gi, k) => { const a = k / grupos.length * TAU - Math.PI / 2; return [gi, { x: Math.cos(a) * 250, y: Math.sin(a) * 170 }]; }));
      // Começa da projeção do cérebro visto de lado: cada nota já sai perto de onde estava.
      const pos = base.map(p => ({ x: p.z * 1.3, y: p.y * 1.1, z: 0 }));
      simular(pos, {
        passos: 300, plano: true, repulsao: 1100, comprimento: 50,
        puxar: (p, v, i, alfa) => { const c = centroG.get(nos[i].gi); v.x += (c.x - p.x) * 0.006 * alfa - p.x * 0.002 * alfa; v.y += (c.y - p.y) * 0.006 * alfa - p.y * 0.002 * alfa; },
      });
      // Enquadra: largura até ±360, altura até ±230, centralizado.
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of pos) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
      const k = Math.min(720 / (x1 - x0 || 1), 460 / (y1 - y0 || 1)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return pos.map(p => ({ x: (p.x - cx) * k, y: (p.y - cy) * k, z: 0 }));
    }

    // Fluxograma 3D em camadas de importância (inspirado na "cone tree" da Xerox PARC):
    // o que é mais importante fica no alto e perto do eixo; o resto desce em anéis cada vez mais
    // abertos. Cada projeto ocupa uma fatia do círculo, e o buraco negro fica embaixo de tudo.
    // (Na tela o y cresce para baixo: y negativo = em cima.)
    const CAMADAS = [
      { nome: 'NÚCLEO', y: -240, r: 118 },
      { nome: 'PRINCIPAIS', y: -100, r: 205 },
      { nome: 'APOIO', y: 40, r: 290 },
      { nome: 'DETALHES', y: 180, r: 372 },
    ];
    const BASE_Y = 360;
    const setores = new Map();
    // Importância: a nota principal do projeto (ou uma muito ligada) é núcleo; depois, pelo número de ligações.
    const camadaDe = n => (n.nota.titulo === n.nota.grupo || n.grau >= 14 ? 0 : n.grau >= 6 ? 1 : n.grau >= 3 ? 2 : 3);

    function layoutCamadas() {
      nos.forEach((n, i) => { n.camada = camadaDe(n); n.yAlvo = CAMADAS[n.camada].y + ((i * 37) % 5 - 2) * 7; });
      const grupos = [...new Set(nos.map(n => n.gi))].sort((a, b) => a - b);
      let ang = -Math.PI / 2;
      for (const gi of grupos) {
        const larg = TAU * nos.filter(n => n.gi === gi).length / nos.length;
        setores.set(gi, { a0: ang, a1: ang + larg, meio: ang + larg / 2 });
        ang += larg;
      }
      const pos = nos.map(() => ({ x: 0, y: 0, z: 0 }));
      for (const gi of grupos) for (let c = 0; c < CAMADAS.length; c++) {
        const lista = nos.map((n, i) => i).filter(i => nos[i].gi === gi && nos[i].camada === c).sort((a, b) => nos[b].grau - nos[a].grau);
        const st = setores.get(gi), L = CAMADAS[c];
        lista.forEach((i, k) => {
          const t = (k + 1) / (lista.length + 1), a = st.a0 + (st.a1 - st.a0) * (0.12 + 0.76 * t);
          const r = L.r + (k % 2 ? 1 : -1) * (c > 1 ? 22 : 8);
          pos[i] = { x: Math.cos(a) * r, y: nos[i].yAlvo, z: Math.sin(a) * r };
        });
      }
      return simular(pos, {
        passos: 160, repulsao: 520, comprimento: 70,
        puxar: (p, v, i, alfa) => {
          const n = nos[i], L = CAMADAS[n.camada], st = setores.get(n.gi);
          v.y += (n.yAlvo - p.y) * 0.3;                                   // fica na altura da sua camada
          const r = Math.hypot(p.x, p.z) || 1, k = (L.r - r) * 0.06;      // perto do anel
          v.x += p.x / r * k; v.z += p.z / r * k;
          v.x += (Math.cos(st.meio) * L.r - p.x) * 0.005 * alfa;         // dentro da fatia do projeto
          v.z += (Math.sin(st.meio) * L.r - p.z) * 0.005 * alfa;
        },
      });
    }

    // Neurônios de enfeite: desenham a silhueta do cérebro (não são notas).
    function gerarNeuronios() {
      const lista = [];
      const ponto = (x, y, z, b) => { const u = rnd() * 2 - 1, t = rnd() * TAU, q = Math.sqrt(1 - u * u); lista.push({ x, y, z, b, dx: Math.cos(t) * q, dy: u, dz: Math.sin(t) * q, f: rnd() * TAU, sx: 0, sy: 0, s: 0, d: 0 }); };
      for (const lado of [-1, 1]) {
        for (let i = 0; i < 2300; i++) {
          const u = rnd() * 2 - 1, t = rnd() * TAU, q = Math.sqrt(1 - u * u);
          const vx = Math.cos(t) * q, vy = u, vz = Math.sin(t) * q;
          if (lado * vx < -0.25) continue; // a face de dentro quase não aparece
          const p = naSuperficie(lado, vx, vy, vz, 0.985 + rnd() * 0.02);
          if (lado * p.x < 5) continue;
          // Fissuras principais como faixas mais vazias: a lateral (Sylvius) e o sulco central.
          const lat = lado * vx, fz = vz, fy = vy;
          if (lat > 0.3 && fz > -0.3 && fz < 0.5 && Math.abs(fy - (-0.3 + (0.45 - fz) * 0.5)) < 0.035 && rnd() < 0.85) continue;
          if (fy > 0 && Math.abs(fz - (0.05 + (1 - fy) * 0.15)) < 0.025 && rnd() < 0.75) continue;
          const g = sulcos(p.x - lado * HEMI.cx, p.y - HEMI.sobe, p.z);
          ponto(p.x, p.y, p.z, 0.2 + 0.8 * Math.min(1, Math.max(0, (g + 0.3) / 1.3)));
        }
      }
      return lista;
    }

    let posCerebro, posFluxo, posPlano, neuronios = [];
    if (op.foco) {
      // Mapa de uma nota só: um layout simples, sem cérebro.
      posCerebro = posFluxo = posPlano = simular(nos.map(n => ({ x: n.x, y: n.y, z: n.z })), { passos: 220 });
    } else {
      // A forma foi pensada com y para cima; na tela o y cresce para baixo, então inverte no fim.
      posCerebro = layoutCerebro().map(p => ({ x: p.x, y: -p.y, z: p.z }));
      posFluxo = layoutCamadas();
      posPlano = layoutPlano(posCerebro);
      neuronios = gerarNeuronios();
      neuronios.forEach(p => { p.y = -p.y; p.dy = -p.dy; });
    }
    if (!['fluxo', 'simples'].includes(op.forma)) op.forma = 'cerebro';
    // m = sai do cérebro (0 cérebro, 1 fora dele) · s = estilo (0 espacial, 1 simples).
    // O "jeito fluxograma" (anéis, núcleo embaixo, cores naturais) vale m × (1 − s).
    const geoDe = f => (f === 'cerebro' ? 0 : 1), estiloDe = f => (f === 'simples' ? 1 : 0);
    const posDe = f => (f === 'cerebro' ? posCerebro : f === 'fluxo' ? posFluxo : posPlano);
    const forma = { m: geoDe(op.forma), s: estiloDe(op.forma), trans: null };
    const jeitoFluxo = () => forma.m * (1 - forma.s);
    const atrasos = nos.map((n, i) => ((i * 7919) % 97) / 97 * 0.28);
    nos.forEach((n, i) => Object.assign(n, posDe(op.forma)[i]));

    // Posição de cada nota neste quadro (durante a troca, cada uma sai com um pequeno atraso
    // e faz um arco para fora antes de pousar — é o que dá a sensação de "se espalhar").
    function aplicarForma(agora) {
      const tr = forma.trans;
      if (!tr) return;
      const T = Math.min(1, (agora - tr.t0) / tr.dur), eT = quart(T);
      if (tr.mexe) {
        for (let i = 0; i < nos.length; i++) {
          const t = Math.min(1, Math.max(0, (T - atrasos[i]) / 0.72)), e = quart(t);
          const de = tr.de[i], para = tr.alvo[i], n = nos[i];
          const x = de.x + (para.x - de.x) * e, y = de.y + (para.y - de.y) * e, z = de.z + (para.z - de.z) * e;
          const r = Math.hypot(x, y, z) || 1, arco = Math.sin(Math.PI * e) * 42;
          n.x = x + x / r * arco; n.y = y + y / r * arco; n.z = z + z / r * arco;
        }
      }
      forma.m = tr.m0 + (tr.m1 - tr.m0) * eT;
      forma.s = tr.s0 + (tr.s1 - tr.s0) * eT;
      if (tr.camPara) {
        cam.yaw = tr.cam.yaw + (tr.camPara.yaw - tr.cam.yaw) * eT;
        cam.pitch = tr.cam.pitch + (tr.camPara.pitch - tr.cam.pitch) * eT;
        cam.dist = tr.cam.dist + (tr.camPara.dist - tr.cam.dist) * eT;
        for (const k of ['x', 'y', 'z']) cam.alvo[k] = tr.cam.alvo[k] + (tr.camPara.alvo[k] - tr.cam.alvo[k]) * eT;
      }
      if (T >= 1) {
        forma.trans = null; forma.m = tr.m1; forma.s = tr.s1;
        if (tr.mexe) nos.forEach((n, i) => Object.assign(n, tr.alvo[i]));
      }
    }

    // Câmera de cada forma: cérebro de três quartos; fluxograma de cima, inclinado, para ver as
    // camadas; simples de frente e reto.
    function camDe(f) {
      if (f === 'simples') return { yaw: Math.round(cam.yaw / TAU) * TAU, pitch: 0, dist: distDe(f), alvo: { x: 0, y: 0, z: 0 } };
      if (f === 'fluxo') return { yaw: cam.yaw - 0.5, pitch: 0.36, dist: distDe(f), alvo: { x: 0, y: 30, z: 0 } };
      return { yaw: cam.yaw - 0.6, pitch: 0.22, dist: distDe(f), alvo: { x: 0, y: 0, z: 0 } };
    }

    function trocarForma(f) {
      if (op.foco || (f === op.forma && !forma.trans)) return;
      const antes = op.forma;
      op.forma = f;
      const alvo = posDe(f), mexe = alvo !== posDe(antes) || !!forma.trans?.mexe;
      voo = null; inercia.yaw = inercia.pitch = 0;
      if (estiloDe(f)) sinais.length = 0;
      forma.trans = {
        t0: performance.now(), dur: reduzido ? 1 : mexe ? 1500 : 450, m0: forma.m, m1: geoDe(f), s0: forma.s, s1: estiloDe(f), mexe, alvo,
        de: nos.map(n => ({ x: n.x, y: n.y, z: n.z })),
        cam: { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, alvo: { ...cam.alvo } },
        camPara: mexe ? camDe(f) : null,
      };
    }
    // Modo simples: limpo, sem brilho nem efeitos, mas com a cara do app — fundo do tema com uma
    // grade de pontinhos (como uma prancheta) e notas como anéis na cor do projeto.
    const fundoTema = () => tema.css?.fundo || '#050505';
    function desenharPrancheta(alfa) {
      ctx.globalAlpha = alfa; ctx.fillStyle = fundoTema(); ctx.fillRect(0, 0, w, h);
      // A grade acompanha o zoom e o arrastar, então parece uma folha de verdade.
      const o = projetar(0, 0, 0, tmpGrade), passo = Math.max(14, 34 * o.s);
      const x0 = ((o.sx % passo) + passo) % passo, y0 = ((o.sy % passo) + passo) % passo;
      ctx.fillStyle = tema.rotulo; ctx.globalAlpha = alfa * 0.16;
      for (let x = x0; x < w; x += passo) for (let y = y0; y < h; y += passo) ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      ctx.globalAlpha = 1;
    }
    const tmpGrade = { sx: 0, sy: 0, s: 0, d: 0 };

    // ---------- Câmera ----------
    // Distância de cada forma; em tela estreita (celular em pé) a câmera recua um pouco.
    const distDe = f => (op.foco ? 560 : f === 'fluxo' ? 1180 : f === 'simples' ? 680 : 600) * (canvas.clientWidth && canvas.clientWidth < 600 ? (f === 'fluxo' && !op.foco ? 1.75 : 1.3) : 1);
    const cam = { yaw: -0.6, pitch: 0.22, dist: 600, alvo: { x: 0, y: 0, z: 0 } };
    if (!op.foco) Object.assign(cam, camDe(op.forma), { yaw: op.forma === 'simples' ? 0 : -0.6 });
    if (op.foco) { const f = nos[idx.get(op.foco)]; cam.alvo = { x: f.x, y: f.y, z: f.z }; }
    let voo = null, giro = op.girar && !reduzido, ultimoToque = 0, inercia = { yaw: 0, pitch: 0 };
    let w = 0, h = 0, dpr = 1, foco3 = 1;

    function projetar(x, y, z, p) {
      const vx = x - cam.alvo.x, vy = y - cam.alvo.y, vz = z - cam.alvo.z;
      const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      const x1 = vx * cy - vz * sy, z1 = vx * sy + vz * cy;
      const y2 = vy * cp - z1 * sp, z2 = vy * sp + z1 * cp;
      const d = z2 + cam.dist;
      const s = d > 20 ? foco3 / d : 0;
      p.sx = w / 2 + x1 * s; p.sy = h / 2 + y2 * s; p.s = s; p.d = d;
      return p;
    }

    // ---------- Estrelas e núcleo ----------
    const estrelas = [];
    if (op.estrelas) {
      let semente = 7;
      const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 700; i++) {
        const u = rnd() * 2 - 1, t = rnd() * TAU, r = 1800 + rnd() * 1400, q = Math.sqrt(1 - u * u);
        estrelas.push({ x: Math.cos(t) * q * r, y: u * r, z: Math.sin(t) * q * r, b: 0.25 + rnd() * 0.75, f: rnd() * TAU, sx: 0, sy: 0, s: 0, d: 0 });
      }
    }
    // Galáxia (tema Via Láctea): braços em espiral num plano, girando de verdade em 3D.
    const galaxia = [];
    {
      let semente = 11;
      const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 1400; i++) {
        const braco = i % 3, t = rnd() ** 0.7, ang = t * 9 + braco * TAU / 3 + (rnd() - 0.5) * 0.7, r = 20 + t * 190;
        galaxia.push({ r, ang, y: (rnd() - 0.5) * 10 * (1 - t), b: 0.3 + rnd() * 0.7, sx: 0, sy: 0, s: 0, d: 0 });
      }
    }

    // Brilho pronto por cor (desenhar gradiente a cada quadro custa caro).
    const sprites = new Map();
    function sprite(cor) {
      if (sprites.has(cor)) return sprites.get(cor);
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, cor); gr.addColorStop(0.18, cor); gr.addColorStop(0.4, cor + '55'); gr.addColorStop(1, cor + '00');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      sprites.set(cor, c);
      return c;
    }
    // No cérebro, as cores do tema; fora dele, cores naturais, mais fáceis de ler.
    const paletaAtual = () => (forma.m > 0.5 && window.PALETA_NATURAL ? window.PALETA_NATURAL : tema.paleta);
    const corNo = n => { const p = paletaAtual(); return p[n.gi % p.length]; };

    // ---------- Sinais (sinapses) ----------
    const sinais = [];
    let proxSinal = 0;
    function disparar(de, k, cascata) {
      const e = arestas[k];
      if (!e.vis || sinais.length > 70) return;
      sinais.push({ k, de, para: e.a === de ? e.b : e.a, t: 0, v: 0.012 + Math.random() * 0.01, cascata });
    }
    function dispararDe(i, cascata = 1) { if (forma.s > 0.5) return; for (const [, k] of vizinhos[i]) disparar(i, k, cascata); }

    // ---------- Estado de interação ----------
    let sobre = -1, selecionado = op.foco ? idx.get(op.foco) : -1, ocultos = new Set(), destaque = null;
    let raf = 0, vivo = true, tempo = 0, pausado = false;
    let varinha = null;

    function medir() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
      // No celular em pé a tela é estreita: aproveita a altura para o cérebro não ficar pequeno.
      foco3 = Math.max(Math.min(w, h) * 1.05, Math.min(w * 1.5, h * 0.8)) * op.escala;
    }

    function visivel(n) { return n.vis && !ocultos.has(n.nota.grupo); }

    // Ponto de controle da curva: puxado para fora do centro, para a conexão parecer um dendrito.
    function controle(a, b) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2, d = Math.hypot(mx, my, mz) || 1;
      return { x: mx + mx / d * 18, y: my + my / d * 18, z: mz + mz / d * 18 };
    }
    const ctrl = arestas.map(() => ({ sx: 0, sy: 0, s: 0, d: 0 }));
    const bez = (p0, p1, p2, t) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

    function desenharNucleo(c, s) {
      const tipo = op.nucleo ? tema.nucleo : 'nada';
      if (tipo === 'nada' || s <= 0) return;
      // Raio do núcleo em pixels: 38 unidades do mundo, com a mesma perspectiva das notas.
      // O núcleo cresce enquanto o cérebro vira fluxograma.
      const r = Math.max(6, 50 * s * 0.62);
      ctx.save();
      ctx.translate(c.sx, c.sy);
      if (tipo === 'buraco') buracoNegro(r);
      else if (tipo === 'nebulosa') nebulosa(r);
      else if (tipo === 'estrela') supernova(r);
      else if (tipo === 'galaxia') galaxiaNucleo(r);
      else if (tipo === 'orbitas') orbitas(r);
      ctx.restore();
    }

    function buracoNegro(r) {
      const inc = 0.18 + Math.abs(Math.sin(cam.pitch)) * 0.55; // achatamento do disco conforme a inclinação
      ctx.globalCompositeOperation = 'lighter';
      let g = ctx.createRadialGradient(0, 0, r, 0, 0, r * 5);
      g.addColorStop(0, 'rgba(255,150,60,.28)'); g.addColorStop(0.4, 'rgba(255,90,30,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 5, 0, TAU); ctx.fill();
      // Disco de acreção: anéis com faixas que giram (por dentro gira mais rápido).
      for (let k = 0; k < 26; k++) {
        const rr = r * (1.45 + k * 0.075), luz = 1 - k / 26;
        const giroK = tempo * (0.0016 / (0.5 + k * 0.05));
        for (let seg = 0; seg < 10; seg++) {
          const a0 = giroK + seg * TAU / 10 + k * 0.4, a1 = a0 + TAU / 10 * 0.62;
          const doppler = 0.55 + 0.45 * Math.cos((a0 + a1) / 2 + cam.yaw);
          ctx.strokeStyle = `rgba(${255},${Math.round(140 + 100 * luz)},${Math.round(60 + 150 * luz * luz)},${(0.05 + 0.16 * luz) * doppler})`;
          ctx.lineWidth = r * 0.07;
          ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * inc, 0, a0, a1); ctx.stroke();
        }
      }
      // Anel de fótons e a parte de trás do disco, curvada por cima do horizonte (lente gravitacional).
      ctx.strokeStyle = 'rgba(255,220,170,.55)'; ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.08, r * 1.32, r * 1.18, 0, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,140,.85)'; ctx.lineWidth = Math.max(1, r * 0.035);
      ctx.beginPath(); ctx.arc(0, 0, r * 1.03, 0, TAU); ctx.stroke();
      // Frente do disco passa na frente do horizonte.
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 12; k++) {
        const rr = r * (1.45 + k * 0.15), luz = 1 - k / 12;
        ctx.strokeStyle = `rgba(255,${Math.round(150 + 90 * luz)},${Math.round(80 + 120 * luz)},${0.06 + 0.1 * luz})`;
        ctx.lineWidth = r * 0.12;
        ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * inc, 0, 0.08, Math.PI - 0.08); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function nebulosa(r) {
      ctx.globalCompositeOperation = 'lighter';
      const cores = tema.nucleoCores;
      cores.forEach((cor, i) => {
        const a = tempo * 0.0002 + i * TAU / cores.length;
        const x = Math.cos(a) * r * 0.9, y = Math.sin(a * 1.3) * r * 0.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
        g.addColorStop(0, cor + '55'); g.addColorStop(1, cor + '00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
      });
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.9);
      g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    function supernova(r) {
      ctx.globalCompositeOperation = 'lighter';
      const pulso = 1 + Math.sin(tempo * 0.002) * 0.06;
      let g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4 * pulso);
      g.addColorStop(0, 'rgba(255,240,220,.9)'); g.addColorStop(0.12, 'rgba(255,170,120,.45)'); g.addColorStop(0.45, 'rgba(255,80,140,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 4 * pulso, 0, TAU); ctx.fill();
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12 + tempo * 0.00012, comp = r * (2.4 + (i % 3) * 0.8) * pulso;
        g = ctx.createLinearGradient(0, 0, Math.cos(a) * comp, Math.sin(a) * comp);
        g.addColorStop(0, 'rgba(255,220,200,.35)'); g.addColorStop(1, 'rgba(255,120,160,0)');
        ctx.strokeStyle = g; ctx.lineWidth = r * 0.06;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * comp, Math.sin(a) * comp); ctx.stroke();
      }
      // Onda de choque que se expande de tempos em tempos.
      const fase = (tempo % 5200) / 5200;
      ctx.strokeStyle = `rgba(255,150,190,${0.35 * (1 - fase)})`; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(0, 0, r * (1 + fase * 6), 0, TAU); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    function galaxiaNucleo(r) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
      g.addColorStop(0, 'rgba(235,245,255,.8)'); g.addColorStop(0.3, 'rgba(160,200,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    function orbitas(r) {
      ctx.strokeStyle = tema.linha; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const inc = 0.25 + Math.abs(Math.sin(cam.pitch + i * 0.5)) * 0.5;
        ctx.globalAlpha = 0.5 - i * 0.12;
        ctx.beginPath(); ctx.ellipse(0, 0, r * (2.6 + i * 1.6), r * (2.6 + i * 1.6) * inc, cam.yaw * 0.2 + i * 0.6, 0, TAU); ctx.stroke();
        const a = tempo * 0.0004 * (3 - i) + i;
        ctx.fillStyle = tema.acento; ctx.globalAlpha = 0.9;
        const rx = r * (2.6 + i * 1.6), ry = rx * inc, rot = cam.yaw * 0.2 + i * 0.6;
        const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
        ctx.beginPath(); ctx.arc(px * Math.cos(rot) - py * Math.sin(rot), px * Math.sin(rot) + py * Math.cos(rot), 2.2, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ---------- Quadro ----------
    function quadro(agora) {
      if (!vivo || pausado) return;
      const dt = Math.min(50, agora - (tempo || agora));
      tempo = agora;
      aplicarForma(agora);

      // Câmera: voo, inércia e giro lento
      if (voo) {
        const t = Math.min(1, (agora - voo.t0) / voo.dur), e = quart(t);
        cam.alvo.x = voo.de.x + (voo.para.x - voo.de.x) * e; cam.alvo.y = voo.de.y + (voo.para.y - voo.de.y) * e; cam.alvo.z = voo.de.z + (voo.para.z - voo.de.z) * e;
        cam.dist = voo.dist0 + (voo.dist1 - voo.dist0) * e;
        if (t >= 1) voo = null;
      }
      if (!pressionado && !forma.trans) {
        cam.yaw += inercia.yaw; cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch + inercia.pitch));
        inercia.yaw *= 0.94; inercia.pitch *= 0.94;
        if (giro && op.forma !== 'simples' && agora - ultimoToque > 2500) cam.yaw += 0.0011 * dt / 16;
      }

      if (varinha) passoVarinha(agora);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Estrelas distantes
      // Modo simples: a prancheta por baixo de tudo.
      if (forma.s > 0 && !op.foco) desenharPrancheta(forma.s);
      if (estrelas.length && forma.s < 0.99) {
        ctx.fillStyle = tema.estrela;
        for (const e of estrelas) {
          projetar(e.x + cam.alvo.x, e.y + cam.alvo.y, e.z + cam.alvo.z, e);
          if (e.s <= 0 || e.sx < 0 || e.sx > w || e.sy < 0 || e.sy > h) continue;
          ctx.globalAlpha = e.b * (reduzido ? 0.8 : 0.55 + 0.45 * Math.sin(agora * 0.0015 + e.f)) * (1 - forma.s) * (1 - 0.5 * jeitoFluxo());
          const t = e.b > 0.85 ? 1.6 : 1;
          ctx.fillRect(e.sx, e.sy, t, t);
        }
        ctx.globalAlpha = 1;
      }

      // Projeta tudo
      for (const n of nos) projetar(n.x, n.y, n.z, n);
      arestas.forEach((e, k) => { const c = controle(nos[e.a], nos[e.b]); projetar(c.x, c.y, c.z, ctrl[k]); });
      const centro = projetar(0, op.foco ? 0 : BASE_Y * forma.m, 0, { sx: 0, sy: 0, s: 0, d: 0 });
      for (const p of neuronios) projetar(p.x, p.y, p.z, p);

      // Galáxia em 3D (tema Via Láctea), atrás de tudo
      if (op.nucleo && tema.nucleo === 'galaxia' && forma.m * (1 - forma.s) > 0.01) {
        ctx.globalCompositeOperation = 'lighter';
        const giroG = agora * 0.00005;
        for (const p of galaxia) {
          const a = p.ang + giroG * (180 / p.r);
          projetar(Math.cos(a) * p.r, p.y, Math.sin(a) * p.r, p);
          if (p.s <= 0) continue;
          ctx.globalAlpha = p.b * 0.5 * forma.m * (1 - forma.s);
          ctx.fillStyle = p.r < 50 ? '#fff4e0' : '#b9d4ff';
          ctx.fillRect(p.sx, p.sy, 1.3, 1.3);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }

      // Luz de destaque (passar o mouse / selecionar / busca)
      const ativo = sobre >= 0 ? sobre : selecionado;
      const vizAtivo = ativo >= 0 ? new Set(vizinhos[ativo].map(v => v[0])) : null;
      for (let i = 0; i < nos.length; i++) {
        const n = nos[i];
        let alvo = 1;
        if (destaque) alvo = destaque.has(n.id) ? 1 : 0.12;
        else if (ativo >= 0) alvo = i === ativo || vizAtivo.has(i) ? 1 : 0.16;
        n.luz += (alvo - n.luz) * (reduzido ? 1 : 0.14);
        n.flash = Math.max(0, n.flash - dt / 600);
      }

      // Ordem de pintura por profundidade: o que está atrás do núcleo vem antes dele.
      const ordem = nos.map((_, i) => i).sort((a, b) => nos[b].d - nos[a].d);
      const ordemA = arestas.map((_, k) => k).sort((a, b) => ctrl[b].d - ctrl[a].d);
      const atras = k => ctrl[k].d > centro.d;
      const atrasNo = i => nos[i].d > centro.d;

      desenharNeuronios(true, centro, agora);
      desenharCamadas(jeitoFluxo(), agora);
      desenharArestas(ordemA.filter(atras), ativo, agora);
      desenharNos(ordem.filter(atrasNo), ativo, vizAtivo, agora);
      // Um de cada vez: no cérebro não há núcleo; no fluxograma o núcleo (buraco negro etc.) aparece no meio.
      const luzNucleo = forma.m * (1 - forma.s);
      if (luzNucleo > 0.01) { ctx.globalAlpha = luzNucleo * 0.85; desenharNucleo(centro, centro.s); }
      ctx.globalAlpha = 1;
      desenharNeuronios(false, centro, agora);
      desenharArestas(ordemA.filter(k => !atras(k)), ativo, agora);
      desenharSinais(dt);
      desenharNos(ordem.filter(i => !atrasNo(i)), ativo, vizAtivo, agora);
      desenharRotulos(ordem, ativo, vizAtivo);

      // Sinais espontâneos: o cérebro "pensando" sozinho
      if (op.sinais && !reduzido && forma.s < 0.5 && agora > proxSinal && arestas.length) {
        proxSinal = agora + 260 + Math.random() * 420;
        const k = Math.floor(Math.random() * arestas.length), e = arestas[k];
        if (e.vis && visivel(nos[e.a]) && visivel(nos[e.b])) {
          const desce = op.forma === 'fluxo' && nos[e.a].camada !== nos[e.b].camada;
          disparar(desce ? (nos[e.a].camada < nos[e.b].camada ? e.a : e.b) : Math.random() < 0.5 ? e.a : e.b, k, 2);
        }
      }
      raf = requestAnimationFrame(quadro);
    }

    // Neurônios de enfeite: somem se espalhando para fora quando o cérebro vira fluxograma.
    function desenharNeuronios(atras, centro, agora) {
      if (!neuronios.length || forma.m > 0.98) return;
      const m = forma.m, some = Math.min(1, m / 0.7), vis = 1 - some * some * (3 - 2 * some);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = tema.paleta[0];
      for (const p of neuronios) {
        let sx = p.sx, sy = p.sy, d = p.d;
        if (m > 0) {
          const k = 1 + m * 0.7, x = p.x * k + p.dx * m * 90, y = p.y * k + p.dy * m * 90, z = p.z * k + p.dz * m * 90;
          projetar(x, y, z, tmp); sx = tmp.sx; sy = tmp.sy; d = tmp.d;
        }
        if ((d > centro.d) !== atras || d < 30) continue;
        const brilho = reduzido ? 1 : 0.7 + 0.3 * Math.sin(agora * 0.002 + p.f);
        ctx.globalAlpha = p.b * 0.8 * vis * brilho * Math.min(1, 520 / d);
        const t = (p.b > 0.8 ? 2.2 : 1.5) * Math.min(1.6, Math.max(0.7, p.s || tmp.s));
        ctx.fillRect(sx - t / 2, sy - t / 2, t, t);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    const tmp = { sx: 0, sy: 0, s: 0, d: 0 };

    // Fluxograma: anéis das camadas (com o nome de cada uma), nome de cada projeto na borda da sua
    // fatia e um feixe de luz subindo de cada nota do núcleo. Tudo some suave na troca de forma.
    const tmpAnel = { sx: 0, sy: 0, s: 0, d: 0 };
    const TEXTO_CLARO = '#f1ede6';
    function desenharCamadas(f, agora) {
      if (f < 0.01 || op.foco) return;
      ctx.save();
      ctx.textBaseline = 'middle';
      CAMADAS.forEach((L, c) => {
        let esq = null;
        ctx.beginPath();
        for (let k = 0; k <= 96; k++) {
          const a = k / 96 * TAU;
          projetar(Math.cos(a) * L.r, L.y, Math.sin(a) * L.r, tmpAnel);
          if (k === 0) ctx.moveTo(tmpAnel.sx, tmpAnel.sy); else ctx.lineTo(tmpAnel.sx, tmpAnel.sy);
          if (!esq || tmpAnel.sx < esq.sx) esq = { sx: tmpAnel.sx, sy: tmpAnel.sy };
        }
        ctx.strokeStyle = TEXTO_CLARO; ctx.lineWidth = 1; ctx.setLineDash([2, 7]);
        ctx.globalAlpha = f * (0.26 + 0.06 * (CAMADAS.length - 1 - c));
        ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = f * 0.6; ctx.font = '600 10px Inter, system-ui'; ctx.textAlign = 'right';
        ctx.fillStyle = TEXTO_CLARO;
        ctx.fillText(L.nome, esq.sx - 12, esq.sy);
      });
      // Nome de cada projeto fora do anel de baixo, na cor dele; os do fundo ficam mais apagados.
      const fora = CAMADAS[CAMADAS.length - 1];
      ctx.font = '700 12px Inter, system-ui'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      for (const [gi, st] of setores) {
        projetar(Math.cos(st.meio) * (fora.r + 62), fora.y + 38, Math.sin(st.meio) * (fora.r + 62), tmpAnel);
        if (tmpAnel.s <= 0) continue;
        const nome = (C.grupos[gi]?.nome || '').toUpperCase();
        ctx.globalAlpha = f * Math.min(1, Math.max(0.3, 1.6 - tmpAnel.d / cam.dist));
        ctx.strokeStyle = fundoTema(); ctx.lineWidth = 4; ctx.strokeText(nome, tmpAnel.sx, tmpAnel.sy);
        ctx.fillStyle = paletaAtual()[gi % paletaAtual().length]; ctx.fillText(nome, tmpAnel.sx, tmpAnel.sy);
      }
      // Faróis: das notas do núcleo sobe um feixe de luz — dá para achar o que importa de longe.
      ctx.globalCompositeOperation = 'lighter';
      for (const n of nos) {
        if (n.camada !== 0 || !visivel(n) || n.s <= 0) continue;
        projetar(n.x, n.y - 120, n.z, tmpAnel);
        const g = ctx.createLinearGradient(n.sx, n.sy, tmpAnel.sx, tmpAnel.sy), cor = corNo(n);
        g.addColorStop(0, cor + 'aa'); g.addColorStop(1, cor + '00');
        ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.5, 3 * n.s); ctx.globalAlpha = f * n.luz * (0.75 + 0.25 * Math.sin(agora * 0.002 + n.gi));
        ctx.beginPath(); ctx.moveTo(n.sx, n.sy); ctx.lineTo(tmpAnel.sx, tmpAnel.sy); ctx.stroke();
      }
      ctx.restore();
    }

    function desenharArestas(lista, ativo, agora) {
      for (const k of lista) {
        const e = arestas[k], a = nos[e.a], b = nos[e.b];
        if (!e.vis || !visivel(a) || !visivel(b) || a.s <= 0 || b.s <= 0) continue;
        const liga = ativo >= 0 && (e.a === ativo || e.b === ativo);
        const prof = Math.min(1, Math.max(0.15, 520 / ((a.d + b.d) / 2)));
        let fim = 1;
        if (e.t0) { fim = Math.min(1, (agora - e.t0) / 320); fim = saida(fim); }
        const st = forma.s;
        ctx.globalAlpha = (liga ? 0.95 : 0.55 * Math.min(a.luz, b.luz) * (0.45 + 0.55 * forma.m)) * (prof + (1 - prof) * st);
        ctx.strokeStyle = liga ? (st > 0.5 ? tema.acento : tema.linhaAtiva) : jeitoFluxo() > 0.5 ? 'rgba(232, 226, 212, .2)' : tema.linha;
        ctx.lineWidth = liga ? 1.4 : 0.8;
        // No modo simples as linhas ficam retas, como no Obsidian.
        const c0 = ctrl[k], c = { sx: c0.sx + ((a.sx + b.sx) / 2 - c0.sx) * st, sy: c0.sy + ((a.sy + b.sy) / 2 - c0.sy) * st };
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy);
        if (fim >= 1) ctx.quadraticCurveTo(c.sx, c.sy, b.sx, b.sy);
        else {
          // Caneta: a linha sai da nota nova e vai sendo traçada até a outra ponta.
          const passos = 12;
          for (let i = 1; i <= passos; i++) { const t = (i / passos) * fim; ctx.lineTo(bez(a.sx, c.sx, b.sx, t), bez(a.sy, c.sy, b.sy, t)); }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function desenharSinais(dt) {
      if (forma.s > 0.5) { sinais.length = 0; return; }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sinais.length - 1; i >= 0; i--) {
        const s = sinais[i], e = arestas[s.k], a = nos[s.de], b = nos[s.para], c = ctrl[s.k];
        s.t += s.v * dt / 16;
        if (s.t >= 1) {
          sinais.splice(i, 1);
          b.flash = 1;
          // Cascata: às vezes o neurônio que recebeu dispara para um vizinho.
          if (s.cascata > 0 && Math.random() < 0.55) {
            const opcoes = vizinhos[s.para].filter(([v]) => v !== s.de);
            if (opcoes.length) { const [, k2] = opcoes[Math.floor(Math.random() * opcoes.length)]; disparar(s.para, k2, s.cascata - 1); }
          }
          continue;
        }
        if (!visivel(a) || !visivel(b) || a.s <= 0 || b.s <= 0 || !e.vis) continue;
        const t = s.t;
        const x = bez(a.sx, c.sx, b.sx, t), y = bez(a.sy, c.sy, b.sy, t);
        const t2 = Math.max(0, t - 0.12), x2 = bez(a.sx, c.sx, b.sx, t2), y2 = bez(a.sy, c.sy, b.sy, t2);
        const g = ctx.createLinearGradient(x2, y2, x, y);
        g.addColorStop(0, tema.sinal + '00'); g.addColorStop(1, tema.sinal);
        ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke();
        ctx.drawImage(sprite(tema.sinal), x - 5, y - 5, 10, 10);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    function desenharNos(lista, ativo, vizAtivo, agora) {
      for (const i of lista) {
        const n = nos[i];
        if (!visivel(n) || n.s <= 0) continue;
        let esc = 1;
        if (n.t0) {
          // Pop ao nascer (varinha): cresce, passa um pouco do tamanho e assenta.
          const t = Math.min(1, (agora - n.t0) / 420);
          esc = reduzido ? 1 : (t < 0.6 ? 0.55 + saida(t / 0.6) * 0.75 : 1.3 - saida((t - 0.6) / 0.4) * 0.3);
          if (t < 1 && !reduzido) {
            ctx.globalAlpha = (1 - t) * 0.8; ctx.strokeStyle = corNo(n); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(n.sx, n.sy, (n.raio + t * 26) * n.s * 0.95, 0, TAU); ctx.stroke();
          }
        }
        const r = n.raio * n.s * 0.95 * (0.72 + 0.28 * forma.m) * esc * (i === ativo ? 1.35 : 1);
        const cor = corNo(n);
        const st = forma.s, luz = n.luz * (Math.min(1, Math.max(0.25, 560 / n.d)) * (1 - st) + st);
        if (st < 1) {
          ctx.globalAlpha = luz * (1 - st);
          ctx.globalCompositeOperation = 'lighter';
          const halo = r * (1.9 + 0.9 * forma.m + n.flash * 2.5);
          ctx.drawImage(sprite(cor), n.sx - halo, n.sy - halo, halo * 2, halo * 2);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = n.flash > 0.05 ? '#fff' : cor;
          ctx.beginPath(); ctx.arc(n.sx, n.sy, Math.max(1.2, r), 0, TAU); ctx.fill();
        }
        if (st > 0) {
          // Simples: anel fino na cor do projeto; as notas mais ligadas ficam preenchidas.
          const rr = Math.max(2.5, r * 0.95), hub = n.grau >= 8;
          ctx.globalAlpha = Math.max(0.3, luz) * st;
          ctx.fillStyle = fundoTema();
          ctx.beginPath(); ctx.arc(n.sx, n.sy, rr, 0, TAU); ctx.fill();
          if (hub || i === ativo) { ctx.fillStyle = i === ativo ? tema.acento : cor; ctx.globalAlpha *= i === ativo ? 1 : 0.55; ctx.fill(); ctx.globalAlpha = Math.max(0.3, luz) * st; }
          ctx.strokeStyle = i === ativo ? tema.acento : cor; ctx.lineWidth = hub ? 1.8 : 1.4;
          ctx.stroke();
        }
        const fx = jeitoFluxo();
        if (fx > 0.01 && n.camada <= 1) {
          // Núcleo: anel tracejado girando; principais: anel fino.
          ctx.globalAlpha = fx * n.luz * (n.camada === 0 ? 0.85 : 0.4);
          ctx.strokeStyle = cor; ctx.lineWidth = n.camada === 0 ? 1.4 : 1;
          if (n.camada === 0) { ctx.setLineDash([4, 5]); ctx.lineDashOffset = -agora * 0.01; }
          ctx.beginPath(); ctx.arc(n.sx, n.sy, r * (n.camada === 0 ? 2.3 : 1.7), 0, TAU); ctx.stroke();
          ctx.setLineDash([]);
        }
        if (i === ativo) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 4, 0, TAU); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    function desenharRotulos(ordem, ativo, vizAtivo) {
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      const simples = forma.s > 0.5, base = distDe(op.forma);
      for (const i of ordem) {
        const n = nos[i];
        if (!visivel(n) || n.s <= 0) continue;
        // Zoom desta nota: 1 = distância normal; 2 = duas vezes mais perto.
        const zoom = n.s * base / foco3;
        let a;
        if (i === ativo || (destaque && destaque.has(n.id))) a = 1;
        else if (vizAtivo && vizAtivo.has(i)) a = 0.95;
        else if (op.rotulos === 'sempre') a = 0.85;
        else if (op.rotulos === 'nunca') a = 0;
        else if (ativo >= 0 || destaque) a = 0;
        else {
          // Como no Obsidian: os nomes vão aparecendo conforme o zoom, e as notas mais ligadas aparecem antes.
          const limiar = jeitoFluxo() > 0.5 && n.camada !== undefined
            ? [canvas.clientWidth < 600 ? 1.05 : 0.45, 1.3, 1.6, 1.9][n.camada]
            : 2 - Math.min(1.15, Math.sqrt(n.grau) * 0.26) - (op.foco ? 1 : 0);
          a = Math.min(1, Math.max(0, (zoom - limiar) / 0.3)) * 0.85;
        }
        a *= Math.min(1, n.luz + 0.3);
        // No cérebro, os nomes das notas do lado de trás ficam mais apagados.
        if (forma.m < 0.5 && !op.foco && i !== ativo) a *= Math.min(1, Math.max(0.2, 1.6 - n.d / cam.dist));
        if (a < 0.02) continue;
        const tam = op.foco ? 10 : Math.min(14, Math.max(10, 10.5 * Math.sqrt(zoom)));
        ctx.font = `500 ${tam.toFixed(1)}px Inter, system-ui`;
        const r = n.raio * n.s * 0.95;
        const texto = n.nota.titulo.length > 34 ? n.nota.titulo.slice(0, 32) + '…' : n.nota.titulo;
        ctx.globalAlpha = a;
        ctx.strokeStyle = simples ? fundoTema() : tema.rotuloFundo; ctx.lineWidth = 3.5;
        ctx.strokeText(texto, n.sx, n.sy + r + 6 + tam);
        ctx.fillStyle = i === ativo ? (simples ? tema.acento : '#fff') : jeitoFluxo() > 0.5 ? TEXTO_CLARO : tema.rotulo;
        ctx.fillText(texto, n.sx, n.sy + r + 6 + tam);
      }
      ctx.globalAlpha = 1;
    }

    // ---------- Varinha (timelapse) ----------
    function iniciarVarinha(velocidade = 2) {
      // Mesma regra do Obsidian: notas em ordem de criação; cada nota e cada link dela é um passo;
      // velocidade = 0,5 × √(total de passos), entre 5 e 100 passos por segundo.
      const ordemNotas = nos.map((n, i) => i).sort((a, b) => (nos[a].nota.criado - nos[b].nota.criado) || nos[a].id.localeCompare(nos[b].id));
      const passos = [];
      for (const i of ordemNotas) {
        passos.push({ tipo: 'no', i });
        arestas.forEach((e, k) => { if (e.a === i) passos.push({ tipo: 'link', k }); });
      }
      nos.forEach(n => { n.vis = false; n.t0 = 0; });
      arestas.forEach(e => { e.vis = false; e.t0 = 0; });
      sinais.length = 0;
      const porSeg = Math.min(100, Math.max(5, 0.5 * Math.sqrt(passos.length))) * velocidade;
      varinha = { passos, feito: 0, t0: performance.now(), porSeg, ordemNotas, notas: 0 };
      giro = !reduzido;
    }
    function passoVarinha(agora) {
      const v = varinha;
      const alvo = Math.min(v.passos.length, Math.floor((agora - v.t0) / 1000 * v.porSeg) + 1);
      while (v.feito < alvo) {
        const p = v.passos[v.feito++];
        if (p.tipo === 'no') {
          const n = nos[p.i];
          n.vis = true; n.t0 = agora; v.notas++;
          // Links de notas mais antigas para esta aparecem junto com ela.
          arestas.forEach(e => { if (!e.vis && e.b === p.i && nos[e.a].vis) { e.vis = true; e.t0 = agora; } });
          op.aoPop(n.nota, n.gi);
          op.aoPasso({ nota: n.nota, notas: v.notas, total: nos.length, progresso: v.feito / v.passos.length });
        } else {
          const e = arestas[p.k];
          if (!e.vis && nos[e.b].vis) { e.vis = true; e.t0 = agora; if (!reduzido && Math.random() < 0.5) disparar(e.a, p.k, 0); }
        }
      }
      if (v.feito >= v.passos.length) pararVarinha(true);
    }
    function pararVarinha(terminou) {
      if (!varinha) return;
      varinha = null;
      nos.forEach(n => { n.vis = true; });
      arestas.forEach(e => { e.vis = true; });
      op.aoFimVarinha(!!terminou);
    }

    // ---------- Entrada: arrastar, girar, zoom, pinça ----------
    const ev = [];
    const ouvir = (alvo, tipo, fn, opc) => { alvo.addEventListener(tipo, fn, opc); ev.push([alvo, tipo, fn, opc]); };
    const ponteiros = new Map();
    let pressionado = false, inicio = null, moveu = false, ultimo = null, pinca = null;
    function noEm(x, y) {
      // O mais perto da câmera ganha quando duas bolinhas se sobrepõem na tela.
      let melhor = -1;
      for (let i = 0; i < nos.length; i++) {
        const n = nos[i];
        if (!visivel(n) || n.s <= 0) continue;
        const r = Math.max(8, n.raio * n.s * 0.95 + 6);
        if (Math.hypot(n.sx - x, n.sy - y) < r && (melhor < 0 || n.d < nos[melhor].d)) melhor = i;
      }
      return melhor;
    }
    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    ouvir(canvas, 'pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      ponteiros.set(e.pointerId, pos(e));
      pressionado = true; moveu = false; ultimoToque = performance.now();
      inicio = pos(e); ultimo = { ...inicio, t: performance.now() };
      inercia.yaw = inercia.pitch = 0; voo = null;
      if (ponteiros.size === 2) { const [p1, p2] = [...ponteiros.values()]; pinca = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), dist: cam.dist }; }
    });
    ouvir(canvas, 'pointermove', e => {
      const p = pos(e);
      if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, p);
      if (pinca && ponteiros.size === 2) {
        const [p1, p2] = [...ponteiros.values()];
        cam.dist = Math.max(160, Math.min(2200, pinca.dist * pinca.d / Math.max(10, Math.hypot(p1.x - p2.x, p1.y - p2.y))));
        moveu = true; return;
      }
      if (pressionado && inicio) {
        if (Math.hypot(p.x - inicio.x, p.y - inicio.y) > 4) moveu = true;
        if (moveu && !forma.trans) {
          const dx = p.x - ultimo.x, dy = p.y - ultimo.y;
          // No fluxograma arrastar move a folha; no cérebro, gira.
          if (op.forma === 'simples' && !op.foco) { const k = cam.dist / foco3; cam.alvo.x -= dx * k; cam.alvo.y -= dy * k; ultimo = { ...p, t: performance.now() }; ultimoToque = performance.now(); return; }
          cam.yaw += dx * 0.006; cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch + dy * 0.006));
          inercia.yaw = dx * 0.006; inercia.pitch = dy * 0.006;
          ultimo = { ...p, t: performance.now() };
          ultimoToque = performance.now();
        }
        return;
      }
      const i = noEm(p.x, p.y);
      if (i !== sobre) {
        sobre = i;
        canvas.style.cursor = i >= 0 ? 'pointer' : 'grab';
        if (i >= 0) dispararDe(i, 1);
        op.aoSobre(i >= 0 ? nos[i].nota : null, p);
      }
    });
    const soltar = e => {
      ponteiros.delete(e.pointerId);
      if (ponteiros.size < 2) pinca = null;
      if (!pressionado) return;
      if (ponteiros.size === 0) pressionado = false;
      if (performance.now() - (ultimo?.t || 0) > 80) { inercia.yaw = inercia.pitch = 0; }
      if (!moveu && e.type === 'pointerup') {
        const p = pos(e), i = noEm(p.x, p.y);
        if (i >= 0) { dispararDe(i, 2); op.aoClicar(nos[i].nota); }
        else op.aoClicar(null);
      }
      inicio = null;
    };
    ouvir(canvas, 'pointerup', soltar);
    ouvir(canvas, 'pointercancel', soltar);
    ouvir(canvas, 'pointerleave', () => { if (!pressionado && sobre >= 0) { sobre = -1; op.aoSobre(null); } });
    ouvir(canvas, 'wheel', e => {
      e.preventDefault();
      cam.dist = Math.max(160, Math.min(2200, cam.dist * Math.exp(e.deltaY * 0.0012)));
      ultimoToque = performance.now(); voo = null;
    }, { passive: false });

    const ro = new ResizeObserver(medir);
    medir(); ro.observe(canvas);
    cam.dist = distDe(op.forma);
    raf = requestAnimationFrame(quadro);

    function voarPara(id, dist) {
      const i = idx.get(id);
      if (i === undefined) return;
      const n = nos[i];
      voo = { t0: performance.now(), dur: reduzido ? 1 : 750, de: { ...cam.alvo }, para: { x: n.x, y: n.y, z: n.z }, dist0: cam.dist, dist1: dist || Math.min(cam.dist, 560) };
      ultimoToque = performance.now();
    }

    return {
      destruir() { vivo = false; cancelAnimationFrame(raf); ro.disconnect(); ev.forEach(([a, t, f, o]) => a.removeEventListener(t, f, o)); },
      // Escondido (outra aba do app), não desenha: poupa bateria no celular.
      pausar(v) {
        if (v === pausado || !vivo) return;
        pausado = v; cancelAnimationFrame(raf);
        if (!v) { tempo = 0; raf = requestAnimationFrame(quadro); }
      },
      definirTema(t) { tema = t; sprites.clear(); },
      definirForma: trocarForma,
      get forma() { return op.forma; },
      girar(v) { giro = v && !reduzido; return giro; },
      sinais(v) { op.sinais = v; if (!v) sinais.length = 0; return v; },
      rotulos(v) { op.rotulos = v; },
      ocultar(grupos) { ocultos = new Set(grupos); },
      destacar(lista) { destaque = lista && lista.length ? new Set(lista) : null; },
      selecionar(id) { selecionado = id ? (idx.get(id) ?? -1) : -1; if (selecionado >= 0) dispararDe(selecionado, 2); },
      voarPara,
      centralizar() { voo = { t0: performance.now(), dur: reduzido ? 1 : 750, de: { ...cam.alvo }, para: op.foco ? { x: 0, y: 0, z: 0 } : camDe(op.forma).alvo, dist0: cam.dist, dist1: distDe(op.forma) }; },
      iniciarVarinha, pararVarinha: () => pararVarinha(false),
      get varinhaAtiva() { return !!varinha; },
      existe: id => idx.has(id),
    };
  }

  window.Universo = Universo;
})();
