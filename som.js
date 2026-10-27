// Sons mínimos, sintetizados na hora (sem arquivos de áudio). Baixinhos de propósito:
// confirmam uma ação e somem. O som não é o foco do app; dá para desligar no alto-falante.
(function () {
  let ctx = null, mestre = null;
  let ligado = true;
  try { ligado = localStorage.getItem('cerebro-som') !== '0'; } catch { /* sem storage */ }

  function audio() {
    if (!ligado) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      mestre = ctx.createGain(); mestre.gain.value = 0.5;
      mestre.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tom(freq, { tipo = 'sine', dur = 0.12, vol = 0.05, atraso = 0, deslize = 0 } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + atraso;
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.setValueAtTime(freq, t);
    if (deslize) o.frequency.exponentialRampToValueAtTime(freq * deslize, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mestre);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function sopro({ de = 200, ate = 1400, dur = 0.5, vol = 0.035 } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(de, t); f.frequency.exponentialRampToValueAtTime(ate, t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(mestre); src.start(t);
  }

  // Pentatônica: qualquer sequência de notas soa bem junta (a varinha toca uma por nota nova).
  const penta = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];
  let ultimoToque = 0, ultimoPop = 0;

  window.SOM = {
    get ligado() { return ligado; },
    alternar() {
      ligado = !ligado;
      try { localStorage.setItem('cerebro-som', ligado ? '1' : '0'); } catch { /* ok */ }
      if (ligado) tom(880, { dur: 0.1, vol: 0.04 });
      return ligado;
    },
    toque() { const t = performance.now(); if (t - ultimoToque < 90) return; ultimoToque = t; tom(1800, { dur: 0.035, vol: 0.012, tipo: 'triangle' }); },
    abrir() { tom(660, { dur: 0.09, vol: 0.035 }); tom(990, { dur: 0.14, vol: 0.03, atraso: 0.05 }); },
    selecionar() { tom(880, { dur: 0.35, vol: 0.035 }); tom(1320, { dur: 0.45, vol: 0.02, atraso: 0.02 }); },
    universo() { sopro({ de: 180, ate: 1200, dur: 0.55, vol: 0.03 }); },
    pop(i = 0) { const t = performance.now(); if (t - ultimoPop < 45) return; ultimoPop = t; tom(penta[i % penta.length], { dur: 0.28, vol: 0.03, tipo: 'triangle' }); },
    tema() { [0, 2, 4].forEach((k, j) => tom(penta[k + 3], { dur: 0.3, vol: 0.025, atraso: j * 0.06 })); },
    varinha() { sopro({ de: 2400, ate: 500, dur: 0.6, vol: 0.025 }); tom(1046.5, { dur: 0.5, vol: 0.025, atraso: 0.1, deslize: 1.5 }); },
    // Cérebro → fluxograma: sopro que sobe e notas subindo. O caminho de volta desce.
    espalhar() { sopro({ de: 260, ate: 2600, dur: 1.1, vol: 0.03 }); [0, 2, 4, 7].forEach((k, j) => tom(penta[k], { dur: 0.5, vol: 0.02, atraso: 0.15 + j * 0.11, tipo: 'triangle' })); },
    juntar() { sopro({ de: 2600, ate: 220, dur: 1.1, vol: 0.03 }); [7, 4, 2, 0].forEach((k, j) => tom(penta[k], { dur: 0.5, vol: 0.02, atraso: 0.15 + j * 0.11, tipo: 'triangle' })); },
    fim() { [4, 6, 9].forEach((k, j) => tom(penta[k], { dur: 0.6, vol: 0.025, atraso: j * 0.09 })); },
  };
})();
