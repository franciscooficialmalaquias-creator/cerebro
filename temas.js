// Temas espaciais. Cada um define as cores da interface (variáveis CSS), a paleta dos neurônios
// (uma cor por projeto, todas da mesma família para não brigarem) e o que fica no centro do cérebro.
window.TEMAS = {
  nebulosa: {
    nome: 'Nebulosa', descricao: 'Violeta e ciano, nuvem de gás no centro',
    css: { fundo: '#06051a', vidro: 'rgba(20, 16, 44, .58)', borda: 'rgba(196, 180, 255, .10)', texto: '#ece9ff', suave: 'rgba(236, 233, 255, .62)', fraco: 'rgba(236, 233, 255, .36)', acento: '#a98bff', acento2: '#5fe3f0', ceu1: 'rgba(130, 60, 255, .22)', ceu2: 'rgba(30, 200, 230, .12)', ceu3: 'rgba(255, 90, 200, .08)' },
    paleta: ['#b9a3ff', '#7fdcff', '#ff9fd8', '#a2f5d6', '#ffd396', '#8fa9ff', '#e2a9ff', '#79f0ff', '#ffb5a6', '#cdf5a0'],
    linha: 'rgba(190, 175, 255, .30)', linhaAtiva: 'rgba(255, 255, 255, .85)', sinal: '#efe6ff', estrela: '#ffffff',
    rotulo: 'rgba(236, 233, 255, .78)', rotuloFundo: 'rgba(6, 5, 26, .85)', acento: '#a98bff',
    nucleo: 'nebulosa', nucleoCores: ['#8a4dff', '#1fd2e6', '#ff4fc8'],
  },
  buraco: {
    nome: 'Buraco Negro', descricao: 'Preto absoluto e o disco dourado girando',
    css: { fundo: '#020203', vidro: 'rgba(18, 13, 9, .62)', borda: 'rgba(255, 196, 140, .10)', texto: '#fff3e6', suave: 'rgba(255, 243, 230, .62)', fraco: 'rgba(255, 243, 230, .36)', acento: '#ffae5c', acento2: '#ff7a45', ceu1: 'rgba(255, 120, 40, .10)', ceu2: 'rgba(255, 190, 100, .05)', ceu3: 'rgba(120, 40, 10, .10)' },
    paleta: ['#ffbb66', '#ff8f57', '#ffdba3', '#f5764a', '#ffe9c9', '#eba765', '#ffa585', '#ffcf94', '#e08a52', '#fff3dd'],
    linha: 'rgba(255, 190, 130, .26)', linhaAtiva: 'rgba(255, 240, 215, .9)', sinal: '#fff1d4', estrela: '#fff4e8',
    rotulo: 'rgba(255, 238, 220, .8)', rotuloFundo: 'rgba(2, 2, 3, .9)', acento: '#ffae5c',
    nucleo: 'buraco',
  },
  lactea: {
    nome: 'Via Láctea', descricao: 'Azul profundo e uma galáxia em espiral',
    css: { fundo: '#030812', vidro: 'rgba(10, 20, 38, .58)', borda: 'rgba(160, 200, 255, .10)', texto: '#e8f2ff', suave: 'rgba(232, 242, 255, .62)', fraco: 'rgba(232, 242, 255, .36)', acento: '#7cc4ff', acento2: '#b8a6ff', ceu1: 'rgba(60, 120, 255, .16)', ceu2: 'rgba(200, 220, 255, .06)', ceu3: 'rgba(120, 90, 255, .08)' },
    paleta: ['#a3d6ff', '#cfe9ff', '#7ea9ff', '#adfff5', '#e2dbff', '#72d3ff', '#bccaff', '#91f2ff', '#d9f2ff', '#9db9ff'],
    linha: 'rgba(160, 200, 255, .26)', linhaAtiva: 'rgba(255, 255, 255, .9)', sinal: '#e6f3ff', estrela: '#eaf3ff',
    rotulo: 'rgba(232, 242, 255, .8)', rotuloFundo: 'rgba(3, 8, 18, .88)', acento: '#7cc4ff',
    nucleo: 'galaxia',
  },
  supernova: {
    nome: 'Supernova', descricao: 'Rosa e coral, uma estrela explodindo',
    css: { fundo: '#0b0410', vidro: 'rgba(30, 12, 30, .58)', borda: 'rgba(255, 170, 200, .10)', texto: '#fff0f4', suave: 'rgba(255, 240, 244, .62)', fraco: 'rgba(255, 240, 244, .36)', acento: '#ff6b9a', acento2: '#ffb46b', ceu1: 'rgba(255, 60, 130, .14)', ceu2: 'rgba(255, 170, 80, .08)', ceu3: 'rgba(180, 60, 255, .08)' },
    paleta: ['#ff7896', '#ffbc75', '#ffe680', '#ff96dc', '#ffa478', '#ffd3e2', '#f06ad6', '#ffc6a6', '#ff85ad', '#ffe6ad'],
    linha: 'rgba(255, 170, 200, .26)', linhaAtiva: 'rgba(255, 245, 248, .9)', sinal: '#fff0f5', estrela: '#fff5f8',
    rotulo: 'rgba(255, 240, 244, .8)', rotuloFundo: 'rgba(11, 4, 16, .88)', acento: '#ff6b9a',
    nucleo: 'estrela',
  },
  orbita: {
    nome: 'Órbita', descricao: 'Grafite limpo, um único azul',
    css: { fundo: '#0a0b0d', vidro: 'rgba(22, 24, 28, .66)', borda: 'rgba(255, 255, 255, .08)', texto: '#eceef1', suave: 'rgba(236, 238, 241, .6)', fraco: 'rgba(236, 238, 241, .34)', acento: '#5b8cff', acento2: '#5b8cff', ceu1: 'rgba(91, 140, 255, .06)', ceu2: 'rgba(255, 255, 255, .02)', ceu3: 'rgba(0, 0, 0, 0)' },
    paleta: ['#eef0f3', '#c9ced6', '#aab1bc', '#8e97a5', '#dadee4', '#b8bfc9', '#9ca5b2', '#f6f7f9', '#808a98', '#d0d5dc'],
    linha: 'rgba(255, 255, 255, .16)', linhaAtiva: 'rgba(91, 140, 255, .95)', sinal: '#7fa6ff', estrela: '#ffffff',
    rotulo: 'rgba(236, 238, 241, .78)', rotuloFundo: 'rgba(10, 11, 13, .9)', acento: '#5b8cff',
    nucleo: 'orbitas',
  },
};

// Cores naturais (sálvia, ocre, terracota, azul-ardósia…), usadas fora do modo Cérebro:
// mais fáceis de ler sobre o fundo escuro e iguais em todos os temas.
window.PALETA_NATURAL = ['#9cc9a5', '#e6c07a', '#e09a7e', '#8fb4dc', '#c7b0de', '#7ccfc3', '#d8c9a3', '#e8a3ae', '#b5cc7d', '#c0c4cf'];
