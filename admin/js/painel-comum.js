/* =====================================================================
   PAINEL — COMPORTAMENTO COMUM A TODAS AS PÁGINAS
   =====================================================================
   Preenche o e-mail do usuário logado no rodapé do menu e liga o
   botão "Sair". Incluído em toda página do painel, depois do
   auth-guard.js.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const sessao = await API.getSessao();
  const rotuloUsuario = document.getElementById('painel-usuario');
  if (sessao?.user?.email && rotuloUsuario) rotuloUsuario.textContent = sessao.user.email;

  const botaoSair = document.getElementById('btn-sair');
  if (botaoSair) {
    botaoSair.addEventListener('click', async () => {
      await API.logout();
      window.location.href = 'login.html';
    });
  }

  ligarMenuMobile();
});

// No celular, o menu lateral vira uma gaveta escondida — esses três
// elementos (botão de abrir, fundo escurecido, botão de fechar) existem
// em toda página do painel; aqui é só ligar o abrir/fechar.
function ligarMenuMobile() {
  const menu = document.querySelector('.painel__menu');
  const fundo = document.getElementById('painel-menu-fundo');
  const botaoAbrir = document.getElementById('btn-abrir-menu');
  const botaoFechar = document.getElementById('btn-fechar-menu');
  if (!menu || !fundo || !botaoAbrir) return;

  function abrir() {
    menu.classList.add('aberto');
    fundo.classList.add('aberto');
  }
  function fechar() {
    menu.classList.remove('aberto');
    fundo.classList.remove('aberto');
  }

  botaoAbrir.addEventListener('click', abrir);
  if (botaoFechar) botaoFechar.addEventListener('click', fechar);
  fundo.addEventListener('click', fechar);

  // escolher uma página no menu já fecha a gaveta sozinho (evita ela
  // ficar "grudada" aberta quando a próxima página carrega)
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', fechar));
}
