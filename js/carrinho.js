/* =====================================================================
   ADEGA ZÉ BEER — LÓGICA DA PÁGINA "MINHA CESTA" (carrinho.html)
   ===================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const { data: config } = await API.getConfigLoja();
  if (config) {
    if (config.cidade_regiao) document.getElementById('topbar-cidade').textContent = config.cidade_regiao;
    if (config.endereco) document.getElementById('rodape-endereco').innerHTML = config.endereco.replace(/, /, ',<br>');
    if (config.whatsapp) {
      document.getElementById('rodape-whatsapp-texto').textContent = config.whatsapp;
      document.getElementById('rodape-whatsapp-link').href = `https://wa.me/${config.whatsapp}`;
    }
    if (config.instagram_url) document.getElementById('rodape-instagram-link').href = config.instagram_url;
  }
  renderizarCarrinho();
});

function renderizarCarrinho() {
  const itens = Carrinho.ler();
  const miolo = document.getElementById('miolo-carrinho');
  const vazio = document.getElementById('carrinho-vazio');

  if (itens.length === 0) {
    miolo.hidden = true;
    vazio.hidden = false;
    return;
  }

  miolo.hidden = false;
  vazio.hidden = true;

  const lista = document.getElementById('lista-itens-carrinho');
  lista.innerHTML = itens.map((item) => itemCarrinhoHtml(item)).join('');

  itens.forEach((item) => {
    const linha = document.querySelector(`[data-linha-id="${item.linha_id}"]`);
    linha.querySelector('[data-acao="menos"]').addEventListener('click', () => {
      Carrinho.atualizarQuantidade(item.linha_id, item.quantidade - 1);
      renderizarCarrinho();
    });
    linha.querySelector('[data-acao="mais"]').addEventListener('click', () => {
      Carrinho.atualizarQuantidade(item.linha_id, item.quantidade + 1);
      renderizarCarrinho();
    });
    linha.querySelector('[data-acao="remover"]').addEventListener('click', () => {
      Carrinho.remover(item.linha_id);
      mostrarToast(`${item.nome} removido da cesta`);
      renderizarCarrinho();
    });
  });

  atualizarResumo(itens);
}

function itemCarrinhoHtml(item) {
  const subtotal = item.preco_unit * item.quantidade;
  return `
    <div class="item-carrinho" data-linha-id="${item.linha_id}">
      <div class="item-carrinho__imagem"><img src="${item.imagem_url}" alt="${item.nome}"></div>
      <div>
        <div class="item-carrinho__nome">${item.nome}</div>
        ${item.detalhes ? `<div class="item-carrinho__preco-unit">${item.detalhes}</div>` : ''}
        <div class="item-carrinho__preco-unit">R$ ${formatarPreco(item.preco_unit)} / un.</div>
        <div class="seletor-qtd" style="margin-top:6px;">
          <button type="button" data-acao="menos" aria-label="Diminuir quantidade"><span class="icone">${ICONS.minus}</span></button>
          <span class="valor">${item.quantidade}</span>
          <button type="button" data-acao="mais" aria-label="Aumentar quantidade"><span class="icone">${ICONS.plus}</span></button>
        </div>
      </div>
      <div class="item-carrinho__controles">
        <span class="item-carrinho__subtotal">R$ ${formatarPreco(subtotal)}</span>
        <button type="button" class="item-carrinho__remover" data-acao="remover">Remover</button>
      </div>
    </div>
  `;
}

function atualizarResumo(itens) {
  const total = itens.reduce((soma, i) => soma + i.preco_unit * i.quantidade, 0);
  document.getElementById('resumo-subtotal').textContent = `R$ ${formatarPreco(total)}`;
  document.getElementById('resumo-total').textContent = `R$ ${formatarPreco(total)}`;
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
