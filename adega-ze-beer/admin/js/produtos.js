/* =====================================================================
   PAINEL — CRUD DE PRODUTOS (produtos.html)
   =====================================================================
   Busca a lista completa uma vez e filtra tudo no navegador (nome,
   categoria, oferta, status e faixa de preço) — assim os filtros
   combinam entre si sem precisar ir e voltar no "banco" a cada troca.
   ===================================================================== */

let todosProdutos = [];
let mapaCategorias = {};

document.addEventListener('DOMContentLoaded', async () => {
  await carregarCategoriasNoSelect();
  await carregarProdutos();
  ligarFiltros();
  ligarModalDeProduto();
});

async function carregarCategoriasNoSelect() {
  const { data: categorias } = await API.getCategorias();
  categorias.forEach((c) => (mapaCategorias[c.id] = c.nome));

  document.getElementById('produto-categoria').innerHTML = categorias.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');

  const opcoesFiltro = categorias.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
  document.getElementById('filtro-categoria').insertAdjacentHTML('beforeend', opcoesFiltro);
}

async function carregarProdutos() {
  const { data } = await API.getProdutos({});
  todosProdutos = data;
  aplicarFiltros();
}

/* ---------- Filtros ---------- */
function ligarFiltros() {
  const camposTexto = ['busca-produtos'];
  const camposSelect = ['filtro-categoria', 'filtro-oferta', 'filtro-status'];
  let temporizador;

  camposTexto.forEach((id) => {
    document.getElementById(id).addEventListener('input', () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(aplicarFiltros, 250);
    });
  });
  camposSelect.forEach((id) => {
    document.getElementById(id).addEventListener('change', aplicarFiltros);
  });

  document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
    [...camposTexto, ...camposSelect].forEach((id) => (document.getElementById(id).value = ''));
    aplicarFiltros();
  });
}

function aplicarFiltros() {
  const nome = document.getElementById('busca-produtos').value.trim().toLowerCase();
  const categoriaId = document.getElementById('filtro-categoria').value;
  const oferta = document.getElementById('filtro-oferta').value;
  const status = document.getElementById('filtro-status').value;

  let lista = todosProdutos;
  if (nome) lista = lista.filter((p) => p.nome.toLowerCase().includes(nome));
  if (categoriaId) lista = lista.filter((p) => p.categoria_id === categoriaId);
  if (oferta === 'sim') lista = lista.filter((p) => p.em_oferta);
  if (oferta === 'nao') lista = lista.filter((p) => !p.em_oferta);
  if (status === 'disponivel') lista = lista.filter((p) => p.disponivel);
  if (status === 'indisponivel') lista = lista.filter((p) => !p.disponivel);

  renderizarTabela(lista);
}

/* ---------- Tabela (PC) + lista em cartões (celular) ---------- */
function renderizarTabela(produtos) {
  const corpo = document.getElementById('tabela-produtos');
  const vazio = document.getElementById('produtos-vazio');

  if (produtos.length === 0) {
    document.querySelector('.tabela-wrap').hidden = true;
    document.getElementById('lista-produtos-mobile').innerHTML = '';
    vazio.hidden = false;
    return;
  }
  document.querySelector('.tabela-wrap').hidden = false;
  vazio.hidden = true;

  corpo.innerHTML = produtos.map((p) => `
    <tr>
      <td><img class="tabela__miniatura" src="${p.imagem_url}" alt=""></td>
      <td>${p.nome}</td>
      <td>${mapaCategorias[p.categoria_id] || '—'}</td>
      <td>R$ ${formatarPreco(p.preco)}</td>
      <td>${p.em_oferta ? `<span class="selo-status selo-status--promocao">R$ ${formatarPreco(p.preco_oferta)}</span>` : '<span style="color:var(--cor-texto-suave);font-size:12.5px;">—</span>'}</td>
      <td><span class="selo-status selo-status--${p.disponivel ? 'disponivel' : 'indisponivel'}">${p.disponivel ? 'Disponível' : 'Indisponível'}</span></td>
      <td class="tabela__acoes"><div class="tabela__acoes-grupo">
        <button class="tabela__link-acao" data-acao="editar" data-id="${p.id}">Editar</button>
        <button class="tabela__link-acao tabela__link-acao--excluir" data-acao="excluir" data-id="${p.id}">Excluir</button>
      </div></td>
    </tr>
  `).join('');

  renderizarCartoesMobile(produtos);

  corpo.querySelectorAll('[data-acao="editar"]').forEach((b) => b.addEventListener('click', () => abrirModalEdicao(b.dataset.id)));
  corpo.querySelectorAll('[data-acao="excluir"]').forEach((b) => b.addEventListener('click', () => excluirProduto(b.dataset.id)));
}

// Versão enxuta pro celular: só imagem, nome e preço — clicar em
// qualquer parte do cartão já abre a edição (sem precisar caçar o link)
function renderizarCartoesMobile(produtos) {
  const container = document.getElementById('lista-produtos-mobile');
  container.innerHTML = produtos.map((p) => `
    <div class="cartao-produto-mobile" data-id="${p.id}">
      <img src="${p.imagem_url}" alt="">
      <div>
        <div class="cartao-produto-mobile__nome">${p.nome}</div>
        <div>
          ${p.em_oferta ? `<span class="cartao-produto-mobile__preco-antigo">R$ ${formatarPreco(p.preco)}</span>` : ''}
          <span class="cartao-produto-mobile__preco">R$ ${formatarPreco(p.em_oferta ? p.preco_oferta : p.preco)}</span>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.cartao-produto-mobile').forEach((cartao) => {
    cartao.addEventListener('click', () => abrirModalEdicao(cartao.dataset.id));
  });
}

/* ---------- Modal (cadastro/edição) ---------- */

function ligarModalDeProduto() {
  const modal = document.getElementById('modal-produto');
  document.getElementById('btn-novo-produto').addEventListener('click', () => abrirModalNovo());
  document.getElementById('fechar-modal-produto').addEventListener('click', () => fecharModal());
  document.getElementById('cancelar-modal-produto').addEventListener('click', () => fecharModal());
  modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
  document.getElementById('form-produto').addEventListener('submit', salvarProduto);

  // Mostra/esconde o campo de preço promocional conforme o checkbox de promoção
  document.getElementById('produto-em-oferta').addEventListener('change', (evento) => {
    document.getElementById('bloco-promocao').classList.toggle('ativo', evento.target.checked);
  });
}

function abrirModalNovo() {
  document.getElementById('modal-produto-titulo').textContent = 'Novo produto';
  document.getElementById('form-produto').reset();
  document.getElementById('produto-id').value = '';
  document.getElementById('produto-disponivel').checked = true;
  document.getElementById('produto-em-oferta').checked = false;
  document.getElementById('bloco-promocao').classList.remove('ativo');
  document.getElementById('modal-produto').classList.add('aberto');
}

function abrirModalEdicao(id) {
  const produto = todosProdutos.find((p) => p.id === id);
  if (!produto) return;
  document.getElementById('modal-produto-titulo').textContent = 'Editar produto';
  document.getElementById('produto-id').value = produto.id;
  document.getElementById('produto-nome').value = produto.nome;
  document.getElementById('produto-categoria').value = produto.categoria_id;
  document.getElementById('produto-preco').value = produto.preco;
  document.getElementById('produto-imagem').value = produto.imagem_url;
  document.getElementById('produto-descricao').value = produto.descricao;
  document.getElementById('produto-disponivel').checked = produto.disponivel;
  document.getElementById('produto-em-oferta').checked = !!produto.em_oferta;
  document.getElementById('produto-preco-oferta').value = produto.preco_oferta || '';
  document.getElementById('bloco-promocao').classList.toggle('ativo', !!produto.em_oferta);
  document.getElementById('modal-produto').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal-produto').classList.remove('aberto');
}

async function salvarProduto(evento) {
  evento.preventDefault();
  const id = document.getElementById('produto-id').value;
  const emPromocao = document.getElementById('produto-em-oferta').checked;
  const precoPromocional = document.getElementById('produto-preco-oferta').value;

  if (emPromocao && (!precoPromocional || Number(precoPromocional) <= 0)) {
    mostrarToast('Informe um preço promocional válido.', 'erro');
    return;
  }
  if (emPromocao && Number(precoPromocional) >= Number(document.getElementById('produto-preco').value)) {
    mostrarToast('O preço promocional precisa ser menor que o preço normal.', 'erro');
    return;
  }

  const dados = {
    nome: document.getElementById('produto-nome').value.trim(),
    categoria_id: document.getElementById('produto-categoria').value,
    preco: document.getElementById('produto-preco').value,
    imagem_url: document.getElementById('produto-imagem').value.trim() || `https://placehold.co/600x600/B30A08/B30A08?text=%20`,
    descricao: document.getElementById('produto-descricao').value.trim(),
    disponivel: document.getElementById('produto-disponivel').checked,
    em_oferta: emPromocao,
    preco_oferta: emPromocao ? precoPromocional : null,
  };

  const botao = document.getElementById('salvar-produto');
  botao.disabled = true;
  botao.textContent = 'Salvando...';

  const { error } = id ? await API.atualizarProduto(id, dados) : await API.criarProduto(dados);

  botao.disabled = false;
  botao.textContent = 'Salvar produto';

  if (error) { mostrarToast('Não foi possível salvar o produto.', 'erro'); return; }

  mostrarToast('Produto salvo com sucesso.', 'sucesso');
  fecharModal();
  carregarProdutos();
}

async function excluirProduto(id) {
  const produto = todosProdutos.find((p) => p.id === id);
  if (!confirm(`Excluir "${produto?.nome}"? Essa ação não pode ser desfeita.`)) return;
  const { error } = await API.excluirProduto(id);
  if (error) { mostrarToast('Não foi possível excluir o produto.', 'erro'); return; }
  mostrarToast('Produto excluído.', 'sucesso');
  carregarProdutos();
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
