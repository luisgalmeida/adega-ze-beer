/* =====================================================================
   PAINEL — GUARDA DE AUTENTICAÇÃO
   =====================================================================
   Incluído em TODAS as páginas do painel, exceto login.html. Roda
   antes de qualquer outra coisa e manda de volta pro login quem não
   estiver autenticado — é o equivalente, no modo demo, à proteção
   por sessão que o Supabase Auth (com RLS) faria de verdade no banco.
   ===================================================================== */

(async () => {
  if (!(await API.getSessao())) {
    window.location.href = 'login.html';
  }
})();
