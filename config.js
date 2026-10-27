// Login com GitHub: o GitHub App "cerebro-malaquias-app" (só enxerga o repositório do cérebro)
// e o servidor de login na Cloudflare (login/worker.js), que guarda a parte secreta.
// O Client ID é público; o segredo nunca fica aqui.
window.CEREBRO_LOGIN = {
  clientId: 'Iv23ctGaQENISW3L5Zsq',
  worker: 'https://cerebro-login.franciscomalaquias-now.workers.dev',
  slug: 'cerebro-malaquias-app',
};
