/* =====================================================================
   ADEGA ZÉ BEER — MONTE SEU COPÃO (montar-copao.html)
   =====================================================================
   Fluxo: escolher 1 copão (seleção única) + 1 energético (cada um pode
   ter um preço adicional diferente) + 1 sabor de gelo (não muda preço).
   Energético e gelo já nascem com a primeira opção marcada, então só
   falta escolher o copão pra liberar os botões de ação.
   ===================================================================== */

let COPOES = [];
let ENERGETICOS = [];
let SABORES_GELO = [];
let copaoSelecionadoId = null;
let energeticoSelecionadoId = null;
let geloSelecionadoId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const [{ data: config }, { data: copoes }, { data: energeticos }, { data: sabores }] = await Promise.all([
    API.getConfigLoja(),
    API.getCopaoProdutos(),
    API.getEnergeticos(),
    API.getSaboresGelo(),
  ]);

  if (config?.cidade_regiao) document.getElementById('topbar-cidade').textContent = config.cidade_regiao;
  if (config?.copao_banner_url) document.querySelector('.cartao-promo__banner img').src = config.copao_banner_url;
  if (config?.copao_texto_info) document.getElementById('caixa-info-copao').innerHTML = config.copao_texto_info.replace(/\n/g, '<br>');
  COPOES = copoes.filter((c) => c.disponivel !== false);
  ENERGETICOS = energeticos;
  SABORES_GELO = sabores;
  if (ENERGETICOS.length > 0) energeticoSelecionadoId = ENERGETICOS[0].id;
  if (SABORES_GELO.length > 0) geloSelecionadoId = SABORES_GELO[0].id;

  document.getElementById('carregando-copao').hidden = true;

  if (COPOES.length === 0) {
    document.getElementById('copao-vazio').hidden = false;
    return;
  }

  document.getElementById('conteudo-copao').hidden = false;
  renderizarCopoes();
  renderizarEnergeticos();
  renderizarGelos();
  ligarBotoesFinais();
});

function renderizarCopoes() {
  const pista = document.getElementById('pista-copoes');
  pista.innerHTML = COPOES.map((c) => cartaoSelecionavelHtml(c, c.id === copaoSelecionadoId)).join('');
  pista.querySelectorAll('[data-copao-id]').forEach((cartao) => {
    cartao.addEventListener('click', () => {
      copaoSelecionadoId = cartao.dataset.copaoId;
      renderizarCopoes();
      atualizarEstadoBotoes();
    });
  });
}

function cartaoSelecionavelHtml(produto, selecionado) {
  const classeEstado = copaoSelecionadoId ? (selecionado ? 'selecionado' : 'esmaecido') : '';
  return `
    <div class="cartao-produto cartao-produto--selecionavel ${classeEstado}" data-copao-id="${produto.id}">
      <div class="cartao-produto__imagem-wrap">
        ${selecionado ? `<span class="cartao-produto__marca-selecionado"><span class="icone">${ICONS.check}</span></span>` : ''}
        <img src="${produto.imagem_url || 'https://placehold.co/400x400/B30A08/B30A08?text=%20'}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="cartao-produto__corpo">
        <span class="cartao-produto__categoria">Copão</span>
        <h3 class="cartao-produto__nome">${produto.nome}</h3>
        <div class="cartao-produto__preco">R$ ${formatarPreco(produto.preco)}</div>
      </div>
    </div>
  `;
}

function renderizarEnergeticos() {
  const lista = document.getElementById('lista-energeticos');
  if (ENERGETICOS.length === 0) {
    lista.innerHTML = '<p style="color: var(--cor-texto-suave);">Nenhum energético cadastrado ainda.</p>';
    return;
  }
  lista.innerHTML = ENERGETICOS.map((e) => `
    <label class="linha-radio">
      <input type="radio" name="energetico" value="${e.id}" ${e.id === energeticoSelecionadoId ? 'checked' : ''}>
      ${e.nome}
      ${e.preco_adicional > 0 ? `<span class="linha-radio__extra">+ R$ ${formatarPreco(e.preco_adicional)}</span>` : ''}
    </label>
  `).join('');
  lista.querySelectorAll('input[name="energetico"]').forEach((r) => r.addEventListener('change', () => { energeticoSelecionadoId = r.value; }));
}

function renderizarGelos() {
  const lista = document.getElementById('lista-gelos-copao');
  if (SABORES_GELO.length === 0) {
    lista.innerHTML = '<p style="color: var(--cor-texto-suave);">Nenhum sabor de gelo cadastrado ainda.</p>';
    return;
  }
  lista.innerHTML = SABORES_GELO.map((s) => `
    <label class="linha-radio">
      <input type="radio" name="gelo-copao" value="${s.id}" ${s.id === geloSelecionadoId ? 'checked' : ''}>
      ${s.nome}
    </label>
  `).join('');
  lista.querySelectorAll('input[name="gelo-copao"]').forEach((r) => r.addEventListener('change', () => { geloSelecionadoId = r.value; }));
}

function atualizarEstadoBotoes() {
  document.getElementById('btn-finalizar-pedido').disabled = !copaoSelecionadoId;
}

function ligarBotoesFinais() {
  document.getElementById('btn-continuar-comprando').addEventListener('click', () => {
    if (!adicionarCopaoNaCesta()) return;
    window.location.href = 'index.html';
  });
  document.getElementById('btn-finalizar-pedido').addEventListener('click', () => {
    if (!adicionarCopaoNaCesta()) return;
    window.location.href = 'carrinho.html';
  });
}

function adicionarCopaoNaCesta() {
  if (!copaoSelecionadoId) {
    mostrarToast('Escolha um copão antes de continuar.', 'erro');
    return false;
  }
  const copao = COPOES.find((c) => c.id === copaoSelecionadoId);
  const energetico = ENERGETICOS.find((e) => e.id === energeticoSelecionadoId);
  const gelo = SABORES_GELO.find((s) => s.id === geloSelecionadoId);

  const precoTotal = copao.preco + (energetico?.preco_adicional || 0);
  const partesDetalhe = [];
  if (energetico) partesDetalhe.push(`Energético: ${energetico.nome}`);
  if (gelo) partesDetalhe.push(`Gelo: ${gelo.nome}`);

  Carrinho.adicionarComposto({
    tipo: 'copao',
    produto_id: copao.id,
    nome: `Copão de ${copao.nome}`,
    detalhes: partesDetalhe.join(' · '),
    preco_unit: precoTotal,
    imagem_url: copao.imagem_url,
    opcoes: { energetico_id: energetico?.id || null, gelo_id: gelo?.id || null },
  });

  mostrarToast(`${copao.nome} adicionado à cesta`, 'sucesso');
  return true;
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
