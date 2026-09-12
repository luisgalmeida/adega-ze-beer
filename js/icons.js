/* =====================================================================
   ADEGA ZÉ BEER — ÍCONES MINIMALISTAS (SVG inline, sem dependências)
   =====================================================================
   Conjunto pequeno de ícones de linha, no estilo da referência visual.
   Uso: ICONS.chevronLeft, ICONS.basket, etc. — cada um já retorna a tag
   <svg> pronta pra colocar via innerHTML. Herdam a cor do texto (usam
   "currentColor"), então mudam de cor sozinhos conforme o CSS do
   elemento pai.
   ===================================================================== */

function _svg(inner, solido = false) {
  const preenchimento = solido ? 'currentColor' : 'none';
  const contorno = solido ? 'none' : 'currentColor';
  return `<svg viewBox="0 0 24 24" fill="${preenchimento}" stroke="${contorno}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

const ICONS = {
  chevronLeft: _svg('<polyline points="15 6 9 12 15 18"></polyline>'),
  chevronRight: _svg('<polyline points="9 6 15 12 9 18"></polyline>'),
  close: _svg('<line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line>'),
  plus: _svg('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'),
  minus: _svg('<line x1="5" y1="12" x2="19" y2="12"></line>'),
  check: _svg('<polyline points="20 6 9 17 4 12"></polyline>'),
  pencil: _svg('<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>'),
  trash: _svg('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>'),
  hamburger: _svg('<line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line>'),
  grid: _svg('<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>'),
  basket: _svg('<path d="M4 9h16l-1.6 9.6a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7L4 9Z"></path><path d="M8 9V7a4 4 0 0 1 8 0v2"></path><line x1="9" y1="12.5" x2="9.5" y2="16.5"></line><line x1="15" y1="12.5" x2="14.5" y2="16.5"></line>'),
  mapPin: _svg('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"></path><circle cx="12" cy="10" r="2.3"></circle>'),
  truck: _svg('<rect x="1" y="7" width="13" height="10" rx="1"></rect><path d="M14 10h4l3 3v4h-7"></path><circle cx="6" cy="19" r="1.8"></circle><circle cx="17" cy="19" r="1.8"></circle>'),
  whatsapp: '<svg viewBox="0 0 24 24" fill="#25D366" stroke="none" aria-hidden="true"><path d="M4 20l1.3-3.8A7.9 7.9 0 1 1 8.9 19L4 20Z"></path><path d="M8.3 9.6c.3 2.5 2.4 4.6 4.9 4.9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"></path></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="#E1306C"></rect><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="1.8"></circle><circle cx="17.3" cy="6.7" r="1" fill="#fff" stroke="none"></circle></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="#1877F2" stroke="none" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M14 21v-7h2.4l.4-3H14V9c0-.9.2-1.5 1.6-1.5H17V5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9V11H8.5v3H11v7Z" fill="#fff"></path></svg>',
  shieldCheck: _svg('<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"></path><polyline points="9 12 11 14 15 10"></polyline>'),
  headset: _svg('<path d="M4 13a8 8 0 0 1 16 0"></path><rect x="3" y="13" width="4" height="6" rx="1.5"></rect><rect x="17" y="13" width="4" height="6" rx="1.5"></rect><path d="M19 19v1a3 3 0 0 1-3 3h-2"></path>'),
  star: _svg('<polygon points="12 2 14.8 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.2 8.6"></polygon>', true),
  tag: _svg('<path d="M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5Z"></path><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"></circle>'),
  beerMug: _svg('<path d="M5 8h9v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"></path><path d="M14 10h2.3a2.3 2.3 0 0 1 0 4.6H14"></path><path d="M6 8c0-2.3.7-4 .7-4"></path><line x1="7" y1="12.5" x2="12" y2="12.5"></line>'),
  wineGlass: _svg('<path d="M7 3h10l-1 6a4 4 0 0 1-8 0L7 3Z"></path><line x1="12" y1="13" x2="12" y2="20"></line><line x1="8.3" y1="21" x2="15.7" y2="21"></line>'),
  bottle: _svg('<path d="M10 2h4v3l2 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7l2-2V2Z"></path><line x1="8.3" y1="11" x2="15.7" y2="11"></line>'),
  cup: _svg('<path d="M7 7h10l-1 12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L7 7Z"></path><line x1="14.5" y1="3" x2="11.5" y2="9"></line>'),
  snowflake: _svg('<line x1="12" y1="2" x2="12" y2="22"></line><line x1="4.5" y1="7" x2="19.5" y2="17"></line><line x1="19.5" y1="7" x2="4.5" y2="17"></line>'),
  chart: _svg('<line x1="4" y1="20" x2="20" y2="20"></line><rect x="6" y="12" width="3" height="8" rx="0.5"></rect><rect x="11" y="7" width="3" height="13" rx="0.5"></rect><rect x="16" y="3" width="3" height="17" rx="0.5"></rect>'),
  box: _svg('<path d="M21 8l-9-5-9 5 9 5 9-5Z"></path><path d="M3 8v8l9 5 9-5V8"></path><line x1="12" y1="13" x2="12" y2="21"></line>'),
  gear: _svg('<circle cx="12" cy="12" r="3.2"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"></path>'),
  calendar: _svg('<rect x="3" y="5" width="18" height="16" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line><line x1="8" y1="3" x2="8" y2="7"></line><line x1="16" y1="3" x2="16" y2="7"></line>'),
  store: _svg('<path d="M3 9l1.5-5h15L21 9"></path><path d="M3 9v11h18V9"></path><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"></path>'),
  search: _svg('<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>'),
  house: _svg('<path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>'),
  wallet: _svg('<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"></path><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3"></path><path d="M15 13a1.5 1.5 0 0 0 0 3h5v-3h-5Z"></path>'),
  grip: _svg('<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"></circle>'),
};

// Retorna o ícone mais adequado para o nome de uma categoria (usado no
// menu de navegação e nas "categorias em destaque"). Faz correspondência
// por palavra-chave, pra funcionar mesmo com categorias criadas pelo
// lojista no painel — cai num ícone genérico (tag) se nada bater.
function iconeDaCategoria(nomeCategoria = '') {
  const nome = nomeCategoria.toLowerCase();
  if (nome.includes('cerveja')) return ICONS.beerMug;
  if (nome.includes('vinho')) return ICONS.wineGlass;
  if (nome.includes('destila')) return ICONS.bottle;
  if (nome.includes('alco') || nome.includes('refri') || nome.includes('suco')) return ICONS.cup;
  if (nome.includes('gelo') || nome.includes('acess')) return ICONS.snowflake;
  return ICONS.tag;
}

// Preenche automaticamente qualquer elemento marcado com data-icone="nome"
// (ex: <span class="icone" data-icone="basket"></span>) assim que a página
// carrega — permite usar os ícones direto no HTML estático, sem precisar
// montar cada trecho de página via JavaScript.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-icone]').forEach((el) => {
    const nome = el.dataset.icone;
    if (ICONS[nome]) el.innerHTML = ICONS[nome];
  });
});
