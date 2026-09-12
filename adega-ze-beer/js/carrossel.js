/* =====================================================================
   ADEGA ZÉ BEER — MOTOR DOS CARROSSÉIS DE PRODUTO (estilo Netflix)
   =====================================================================
   A rolagem por toque já é nativa (overflow-x + scroll-snap no CSS) —
   esta função só liga as setas (visíveis no desktop) e desabilita elas
   automaticamente no início/fim da lista de produtos.
   ===================================================================== */

function configurarSetasCarrossel(blocoEl) {
  const pista = blocoEl.querySelector('[data-carrossel-pista]');
  const btnEsq = blocoEl.querySelector('[data-carrossel-seta="esq"]');
  const btnDir = blocoEl.querySelector('[data-carrossel-seta="dir"]');
  if (!pista || !btnEsq || !btnDir) return;

  function atualizarEstadoSetas() {
    const folga = 4; // margem de tolerância em px pra evitar flicker no fim exato
    btnEsq.disabled = pista.scrollLeft <= folga;
    btnDir.disabled = pista.scrollLeft >= pista.scrollWidth - pista.clientWidth - folga;
  }

  function rolar(direcao) {
    const distancia = pista.clientWidth * 0.85 * direcao;
    pista.scrollBy({ left: distancia, behavior: 'smooth' });
  }

  btnEsq.addEventListener('click', () => rolar(-1));
  btnDir.addEventListener('click', () => rolar(1));
  pista.addEventListener('scroll', atualizarEstadoSetas, { passive: true });
  window.addEventListener('resize', atualizarEstadoSetas);

  atualizarEstadoSetas();
}
