/* =====================================================================
   ADEGA ZÉ BEER — CESTA
   =====================================================================
   A cesta NÃO é uma tabela do backend — só existe no navegador do
   cliente enquanto ele monta o pedido. Guarda o estado em localStorage
   só neste dispositivo; quando o cliente confirma o pedido, os itens
   viram um registro na tabela `pedidos` via API.criarPedido().

   Cada linha da cesta tem um `linha_id` próprio (sempre único) — é o
   que usamos pra editar/remover, em vez do id do produto. Isso importa
   porque um Combo ou Copão com sabores diferentes escolhidos gera
   linhas distintas na cesta mesmo sendo "o mesmo produto base": duas
   pessoas pedindo o mesmo combo com gelos diferentes não podem virar
   uma linha só com quantidade 2.
   ===================================================================== */

const Carrinho = (() => {
  const CHAVE = 'azb_carrinho';

  function ler() {
    return JSON.parse(localStorage.getItem(CHAVE) || '[]');
  }

  function gravar(itens) {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
    atualizarCabecalho();
  }

  function gerarLinhaId() {
    return 'linha_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // Adiciona um produto simples da vitrine (respeitando o preço de oferta,
  // se ativo). Produtos iguais se juntam numa linha só, somando quantidade.
  function adicionar(produto, quantidade = 1) {
    const itens = ler();
    const precoUnitario = produto.em_oferta && produto.preco_oferta != null ? produto.preco_oferta : produto.preco;
    const existente = itens.find((i) => i.tipo === 'produto' && i.produto_id === produto.id);
    if (existente) {
      existente.quantidade += quantidade;
    } else {
      itens.push({
        linha_id: gerarLinhaId(),
        tipo: 'produto',
        produto_id: produto.id,
        nome: produto.nome,
        detalhes: null,
        preco_unit: precoUnitario,
        imagem_url: produto.imagem_url,
        quantidade,
      });
    }
    gravar(itens);
  }

  // Adiciona um item composto (Combo ou Copão) — sempre cria uma linha
  // nova, nunca junta com outra, porque as escolhas (sabores, energético)
  // podem ser diferentes mesmo quando o produto-base é o mesmo.
  // item: { tipo: 'combo'|'copao', produto_id, nome, detalhes, preco_unit, imagem_url, quantidade, opcoes }
  function adicionarComposto(item) {
    const itens = ler();
    itens.push({ linha_id: gerarLinhaId(), quantidade: 1, ...item });
    gravar(itens);
  }

  function atualizarQuantidade(linhaId, quantidade) {
    let itens = ler();
    if (quantidade <= 0) {
      itens = itens.filter((i) => i.linha_id !== linhaId);
    } else {
      const item = itens.find((i) => i.linha_id === linhaId);
      if (item) item.quantidade = quantidade;
    }
    gravar(itens);
  }

  function remover(linhaId) {
    gravar(ler().filter((i) => i.linha_id !== linhaId));
  }

  function limpar() {
    gravar([]);
  }

  function total() {
    return ler().reduce((soma, item) => soma + item.preco_unit * item.quantidade, 0);
  }

  function totalItens() {
    return ler().reduce((soma, item) => soma + item.quantidade, 0);
  }

  // Atualiza a bolinha de contagem e o valor no botão de cesta do cabeçalho,
  // e também o botão flutuante "Finalizar Pedido" (só aparece com item na cesta)
  function atualizarCabecalho() {
    const qtd = totalItens();
    document.querySelectorAll('[data-carrinho-contador]').forEach((el) => (el.textContent = qtd));
    const valor = document.querySelector('[data-cesta-valor]');
    if (valor) valor.textContent = `R$ ${total().toFixed(2).replace('.', ',')}`;
    const flutuante = document.getElementById('btn-flutuante-cesta');
    if (flutuante) flutuante.hidden = qtd === 0;
  }

  return { ler, adicionar, adicionarComposto, atualizarQuantidade, remover, limpar, total, totalItens, atualizarCabecalho };
})();

document.addEventListener('DOMContentLoaded', () => Carrinho.atualizarCabecalho());
