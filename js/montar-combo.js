/* =====================================================================
   ADEGA ZÉ BEER — MONTE SEU COMBO (montar-combo.html)
   =====================================================================
   Fluxo: escolher 1 combo (seleção única — os outros ficam esmaecidos)
   + distribuir sabores de gelo até o limite configurado no painel
   (loja_config.combo_gelo_max, padrão 4). Só libera os botões de ação
   quando o combo estiver escolhido E o total de gelos bater exatamente
   com o limite — é o que o combo já inclui no preço.
   ===================================================================== */

let COMBOS = [];
let SABORES = [];
let GELO_MAX = 4;
let comboSelecionadoId = null;
let quantidadesSabor = {}; // { saborId: quantidade }

document.addEventListener('DOMContentLoaded', async () => {
  const [{ data: config }, { data: combos }, { data: sabores }] = await Promise.all([
    API.getConfigLoja(),
    API.getComboProdutos(),
    API.getSaboresGelo(),
  ]);

  if (config?.cidade_regiao) document.getElementById('topbar-cidade').textContent = config.cidade_regiao;
  if (config?.combo_banner_url) document.querySelector('.cartao-promo__banner img').src = config.combo_banner_url;
  GELO_MAX = Number(config?.combo_gelo_max) || 4;
  COMBOS = combos.filter((c) => c.disponivel !== false);
  SABORES = sabores;
  SABORES.forEach((s) => (quantidadesSabor[s.id] = 0));

  document.getElementById('caixa-info-combo').innerHTML = (config?.combo_texto_info || `Todos os combos acompanham\n${GELO_MAX} gelos\n${GELO_MAX} copos\n${GELO_MAX} canudos`).replace(/\n/g, '<br>');
  document.getElementById('titulo-sabores').textContent = `Selecione até ${GELO_MAX} gelos`;

  document.getElementById('carregando-combo').hidden = true;

  if (COMBOS.length === 0) {
    document.getElementById('combo-vazio').hidden = false;
    return;
  }

  document.getElementById('conteudo-combo').hidden = false;
  renderizarCombos();
  renderizarSabores();
  ligarBotoesFinais();
});

function renderizarCombos() {
  const pista = document.getElementById('pista-combos');
  pista.innerHTML = COMBOS.map((c) => cartaoSelecionavelHtml(c, c.id === comboSelecionadoId)).join('');
  pista.querySelectorAll('[data-combo-id]').forEach((cartao) => {
    cartao.addEventListener('click', () => {
      comboSelecionadoId = cartao.dataset.comboId;
      renderizarCombos();
      atualizarEstadoBotoes();
    });
  });
}

function cartaoSelecionavelHtml(produto, selecionado) {
  const classeEstado = comboSelecionadoId ? (selecionado ? 'selecionado' : 'esmaecido') : '';
  return `
    <div class="cartao-produto cartao-produto--selecionavel ${classeEstado}" data-combo-id="${produto.id}">
      <div class="cartao-produto__imagem-wrap">
        ${selecionado ? `<span class="cartao-produto__marca-selecionado"><span class="icone">${ICONS.check}</span></span>` : ''}
        <img src="${produto.imagem_url || 'https://placehold.co/400x400/B30A08/B30A08?text=%20'}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="cartao-produto__corpo">
        <span class="cartao-produto__categoria">Combo</span>
        <h3 class="cartao-produto__nome">${produto.nome}</h3>
        <div class="cartao-produto__preco">R$ ${formatarPreco(produto.preco)}</div>
      </div>
    </div>
  `;
}

function renderizarSabores() {
  const lista = document.getElementById('lista-sabores');
  if (SABORES.length === 0) {
    lista.innerHTML = '<p style="padding:16px 0; color: var(--cor-texto-suave);">Nenhum sabor de gelo cadastrado ainda.</p>';
    return;
  }
  lista.innerHTML = SABORES.map((s) => `
    <div class="linha-sabor">
      <div class="seletor-qtd">
        <button type="button" data-acao="menos" data-sabor-id="${s.id}" aria-label="Diminuir"><span class="icone">${ICONS.minus}</span></button>
        <span class="valor" id="valor-sabor-${s.id}">0</span>
        <button type="button" data-acao="mais" data-sabor-id="${s.id}" aria-label="Aumentar"><span class="icone">${ICONS.plus}</span></button>
      </div>
      <span class="linha-sabor__nome">${s.nome}</span>
    </div>
  `).join('');

  lista.querySelectorAll('[data-acao="mais"]').forEach((b) => b.addEventListener('click', () => alterarQuantidadeSabor(b.dataset.saborId, 1)));
  lista.querySelectorAll('[data-acao="menos"]').forEach((b) => b.addEventListener('click', () => alterarQuantidadeSabor(b.dataset.saborId, -1)));
  atualizarContadorSabores();
}

function alterarQuantidadeSabor(saborId, delta) {
  const totalAtual = totalSaboresSelecionados();
  if (delta > 0 && totalAtual >= GELO_MAX) return; // já bateu o limite compartilhado
  const novaQtd = quantidadesSabor[saborId] + delta;
  if (novaQtd < 0) return;
  quantidadesSabor[saborId] = novaQtd;
  document.getElementById(`valor-sabor-${saborId}`).textContent = novaQtd;
  atualizarContadorSabores();
  atualizarBotoesSabor();
  atualizarEstadoBotoes();
}

function totalSaboresSelecionados() {
  return Object.values(quantidadesSabor).reduce((a, b) => a + b, 0);
}

function atualizarContadorSabores() {
  const total = totalSaboresSelecionados();
  const el = document.getElementById('contador-sabores');
  el.textContent = `${total} de ${GELO_MAX} selecionados`;
  el.classList.toggle('completo', total === GELO_MAX);
}

function atualizarBotoesSabor() {
  const atingiuLimite = totalSaboresSelecionados() >= GELO_MAX;
  document.querySelectorAll('[data-acao="mais"][data-sabor-id]').forEach((b) => (b.disabled = atingiuLimite));
}

function atualizarEstadoBotoes() {
  const completo = comboSelecionadoId && totalSaboresSelecionados() === GELO_MAX;
  document.getElementById('btn-finalizar-pedido').disabled = !completo;
}

function ligarBotoesFinais() {
  document.getElementById('btn-continuar-comprando').addEventListener('click', () => {
    if (!adicionarComboNaCesta()) return;
    window.location.href = 'index.html';
  });
  document.getElementById('btn-finalizar-pedido').addEventListener('click', () => {
    if (!adicionarComboNaCesta()) return;
    window.location.href = 'carrinho.html';
  });
}

function adicionarComboNaCesta() {
  if (!comboSelecionadoId) {
    mostrarToast('Escolha um combo antes de continuar.', 'erro');
    return false;
  }
  if (totalSaboresSelecionados() !== GELO_MAX) {
    mostrarToast(`Escolha exatamente ${GELO_MAX} gelos (no total) antes de continuar.`, 'erro');
    return false;
  }

  const combo = COMBOS.find((c) => c.id === comboSelecionadoId);
  const saboresEscolhidos = SABORES.filter((s) => quantidadesSabor[s.id] > 0).map((s) => ({ sabor_id: s.id, nome: s.nome, quantidade: quantidadesSabor[s.id] }));
  const detalhes = 'Gelo: ' + saboresEscolhidos.map((s) => `${s.quantidade}x ${s.nome}`).join(', ');

  Carrinho.adicionarComposto({
    tipo: 'combo',
    produto_id: combo.id,
    nome: `Combo de ${combo.nome}`,
    detalhes,
    preco_unit: combo.preco,
    imagem_url: combo.imagem_url,
    opcoes: { sabores: saboresEscolhidos },
  });

  mostrarToast(`${combo.nome} adicionado à cesta`, 'sucesso');
  return true;
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
