/* =====================================================================
   ADEGA ZÉ BEER — NOTIFICAÇÕES (TOAST)
   =====================================================================
   Pequeno aviso que aparece no rodapé da tela por alguns segundos.
   Usado tanto na vitrine ("Produto adicionado ao carrinho") quanto
   no painel ("Produto salvo com sucesso").
   ===================================================================== */

function mostrarToast(mensagem, tipo = 'padrao') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'sucesso' ? 'toast--sucesso' : tipo === 'erro' ? 'toast--erro' : ''}`;
  toast.textContent = mensagem;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}
