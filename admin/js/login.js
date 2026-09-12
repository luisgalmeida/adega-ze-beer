/* =====================================================================
   PAINEL — LÓGICA DE LOGIN (admin/login.html)
   ===================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Se já está logado, não faz sentido ver a tela de login de novo
  if (await API.getSessao()) {
    window.location.href = 'pedidos.html';
    return;
  }

  document.getElementById('form-login').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const email = document.getElementById('campo-email').value.trim();
    const senha = document.getElementById('campo-senha').value;
    const botao = document.getElementById('btn-entrar');
    const mensagemErro = document.getElementById('mensagem-erro');

    botao.disabled = true;
    botao.textContent = 'Entrando...';
    mensagemErro.style.display = 'none';

    const { error } = await API.login(email, senha);

    if (error) {
      mensagemErro.textContent = error.message;
      mensagemErro.style.display = 'block';
      botao.disabled = false;
      botao.textContent = 'Entrar';
      return;
    }

    window.location.href = 'pedidos.html';
  });
});
