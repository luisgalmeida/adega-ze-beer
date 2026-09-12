/* =====================================================================
   PAINEL — COPÃO (copao.html)
   Energéticos (exclusivos daqui), sabores de gelo (só leitura — edição
   fica em Combos) e o CRUD dos produtos de copão.
   ===================================================================== */

let TODOS_COPOES = [];
let TODOS_ENERGETICOS = [];

document.addEventListener('DOMContentLoaded', async () => {
  await carregarBannerCopao();
  await carregarEnergeticos();
  await carregarSaboresLeitura();
  await carregarCopoes();
  ligarFormularioEnergetico();
  ligarModalCopao();
});

/* ---------- Banner e texto ---------- */
async function carregarBannerCopao() {
  const { data: config } = await API.getConfigLoja();
  document.getElementById('copao-banner-url').value = config?.copao_banner_url || '';
  document.getElementById('copao-texto-info').value = config?.copao_texto_info || 'Copo 770ml\nEnergético\nGelo saborizado';
  document.getElementById('btn-salvar-banner-copao').addEventListener('click', async () => {
    const url = document.getElementById('copao-banner-url').value.trim();
    const texto = document.getElementById('copao-texto-info').value;
    const { error } = await API.salvarConfigLoja({ copao_banner_url: url, copao_texto_info: texto });
    if (error) { mostrarToast('Não foi possível salvar.', 'erro'); return; }
    mostrarToast('Configuração do copão atualizada.', 'sucesso');
  });
}

/* ---------- Energéticos ---------- */
async function carregarEnergeticos() {
  const { data } = await API.getEnergeticos();
  TODOS_ENERGETICOS = data;
  const lista = document.getElementById('lista-energeticos');
  if (TODOS_ENERGETICOS.length === 0) {
    lista.innerHTML = '<p style="color:var(--cor-texto-suave); font-size:13.5px;">Nenhum energético cadastrado ainda.</p>';
    return;
  }
  lista.innerHTML = TODOS_ENERGETICOS.map((e) => `
    <div class="item-simples">
      <span><span class="item-simples__nome">${e.nome}</span>${e.preco_adicional > 0 ? `<span class="item-simples__preco">+ R$ ${formatarPreco(e.preco_adicional)}</span>` : '<span class="item-simples__preco" style="color:var(--cor-texto-suave);">Incluso</span>'}</span>
      <button type="button" class="item-simples__remover" data-id="${e.id}" data-nome="${e.nome}">Remover</button>
    </div>
  `).join('');
  lista.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => excluirEnergetico(b.dataset.id, b.dataset.nome)));
}

function ligarFormularioEnergetico() {
  document.getElementById('form-energetico').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const nome = document.getElementById('novo-energetico-nome').value.trim();
    const preco = document.getElementById('novo-energetico-preco').value;
    if (!nome) return;
    const { error } = await API.criarEnergetico({ nome, preco_adicional: preco || 0 });
    if (error) { mostrarToast('Não foi possível adicionar.', 'erro'); return; }
    document.getElementById('form-energetico').reset();
    mostrarToast('Energético adicionado.', 'sucesso');
    carregarEnergeticos();
  });
}

async function excluirEnergetico(id, nome) {
  if (!confirm(`Remover o energético "${nome}"?`)) return;
  const { error } = await API.excluirEnergetico(id);
  if (error) { mostrarToast('Não foi possível remover.', 'erro'); return; }
  mostrarToast('Energético removido.', 'sucesso');
  carregarEnergeticos();
}

/* ---------- Sabores de gelo (leitura) ---------- */
async function carregarSaboresLeitura() {
  const { data: sabores } = await API.getSaboresGelo();
  const lista = document.getElementById('lista-sabores-leitura');
  lista.innerHTML = sabores.length === 0
    ? '<p style="color:var(--cor-texto-suave); font-size:13.5px;">Nenhum sabor cadastrado ainda.</p>'
    : sabores.map((s) => `<div class="item-simples"><span class="item-simples__nome">${s.nome}</span></div>`).join('');
}

/* ---------- Produtos de copão ---------- */
async function carregarCopoes() {
  const { data } = await API.getCopaoProdutos();
  TODOS_COPOES = data;
  const corpo = document.getElementById('tabela-copoes');
  const vazio = document.getElementById('copoes-vazio');

  if (TODOS_COPOES.length === 0) {
    document.querySelector('.tabela-wrap').hidden = true;
    vazio.hidden = false;
    return;
  }
  document.querySelector('.tabela-wrap').hidden = false;
  vazio.hidden = true;

  corpo.innerHTML = TODOS_COPOES.map((c) => `
    <tr>
      <td><img class="tabela__miniatura" src="${c.imagem_url || 'https://placehold.co/100x100/B30A08/B30A08?text=%20'}" alt=""></td>
      <td>${c.nome}</td>
      <td>R$ ${formatarPreco(c.preco)}</td>
      <td><span class="selo-status selo-status--${c.disponivel ? 'disponivel' : 'indisponivel'}">${c.disponivel ? 'Disponível' : 'Indisponível'}</span></td>
      <td class="tabela__acoes"><div class="tabela__acoes-grupo">
        <button class="tabela__link-acao" data-acao="editar" data-id="${c.id}">Editar</button>
        <button class="tabela__link-acao tabela__link-acao--excluir" data-acao="excluir" data-id="${c.id}" data-nome="${c.nome}">Excluir</button>
      </div></td>
    </tr>
  `).join('');

  corpo.querySelectorAll('[data-acao="editar"]').forEach((b) => b.addEventListener('click', () => abrirModalEdicao(b.dataset.id)));
  corpo.querySelectorAll('[data-acao="excluir"]').forEach((b) => b.addEventListener('click', () => excluirCopao(b.dataset.id, b.dataset.nome)));
}

function ligarModalCopao() {
  const modal = document.getElementById('modal-copao');
  document.getElementById('btn-novo-copao').addEventListener('click', abrirModalNovo);
  document.getElementById('fechar-modal-copao').addEventListener('click', fecharModal);
  document.getElementById('cancelar-modal-copao').addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
  document.getElementById('form-copao').addEventListener('submit', salvarCopao);
}

function abrirModalNovo() {
  document.getElementById('modal-copao-titulo').textContent = 'Novo copão';
  document.getElementById('form-copao').reset();
  document.getElementById('copao-id').value = '';
  document.getElementById('copao-disponivel').checked = true;
  document.getElementById('modal-copao').classList.add('aberto');
}

function abrirModalEdicao(id) {
  const copao = TODOS_COPOES.find((c) => c.id === id);
  if (!copao) return;
  document.getElementById('modal-copao-titulo').textContent = 'Editar copão';
  document.getElementById('copao-id').value = copao.id;
  document.getElementById('copao-nome').value = copao.nome;
  document.getElementById('copao-preco').value = copao.preco;
  document.getElementById('copao-imagem').value = copao.imagem_url || '';
  document.getElementById('copao-descricao').value = copao.descricao || '';
  document.getElementById('copao-disponivel').checked = copao.disponivel;
  document.getElementById('modal-copao').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal-copao').classList.remove('aberto');
}

async function salvarCopao(evento) {
  evento.preventDefault();
  const id = document.getElementById('copao-id').value;
  const dados = {
    nome: document.getElementById('copao-nome').value.trim(),
    preco: document.getElementById('copao-preco').value,
    imagem_url: document.getElementById('copao-imagem').value.trim() || 'https://placehold.co/600x600/B30A08/B30A08?text=%20',
    descricao: document.getElementById('copao-descricao').value.trim(),
    disponivel: document.getElementById('copao-disponivel').checked,
  };

  const { error } = id ? await API.atualizarCopaoProduto(id, dados) : await API.criarCopaoProduto(dados);
  if (error) { mostrarToast('Não foi possível salvar o copão.', 'erro'); return; }
  mostrarToast('Copão salvo com sucesso.', 'sucesso');
  fecharModal();
  carregarCopoes();
}

async function excluirCopao(id, nome) {
  if (!confirm(`Excluir o copão "${nome}"?`)) return;
  const { error } = await API.excluirCopaoProduto(id);
  if (error) { mostrarToast('Não foi possível excluir.', 'erro'); return; }
  mostrarToast('Copão excluído.', 'sucesso');
  carregarCopoes();
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
