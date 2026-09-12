/* =====================================================================
   PAINEL — COMBOS (combos.html)
   Três blocos independentes: limite de gelos, lista de sabores
   (compartilhada com o Copão) e o CRUD dos produtos de combo.
   ===================================================================== */

let TODOS_COMBOS = [];
let TODOS_SABORES = [];

document.addEventListener('DOMContentLoaded', async () => {
  await carregarConfiguracaoGeloMax();
  await carregarSabores();
  await carregarCombos();
  ligarFormularioSabor();
  ligarModalCombo();
});

/* ---------- Limite de gelos + banner + texto ---------- */
async function carregarConfiguracaoGeloMax() {
  const { data: config } = await API.getConfigLoja();
  document.getElementById('combo-gelo-max').value = config?.combo_gelo_max ?? 4;
  document.getElementById('combo-banner-url').value = config?.combo_banner_url || '';
  document.getElementById('combo-texto-info').value = config?.combo_texto_info || `Todos os combos acompanham\n${config?.combo_gelo_max ?? 4} gelos\n${config?.combo_gelo_max ?? 4} copos\n${config?.combo_gelo_max ?? 4} canudos`;
  document.getElementById('btn-salvar-gelo-max').addEventListener('click', async () => {
    const valor = Number(document.getElementById('combo-gelo-max').value) || 4;
    const bannerUrl = document.getElementById('combo-banner-url').value.trim();
    const textoInfo = document.getElementById('combo-texto-info').value;
    const { error } = await API.salvarConfigLoja({ combo_gelo_max: valor, combo_banner_url: bannerUrl, combo_texto_info: textoInfo });
    if (error) { mostrarToast('Não foi possível salvar.', 'erro'); return; }
    mostrarToast('Configuração do combo atualizada.', 'sucesso');
  });
}

/* ---------- Sabores de gelo ---------- */
async function carregarSabores() {
  const { data } = await API.getSaboresGelo();
  TODOS_SABORES = data;
  const lista = document.getElementById('lista-sabores');
  if (TODOS_SABORES.length === 0) {
    lista.innerHTML = '<p style="color:var(--cor-texto-suave); font-size:13.5px;">Nenhum sabor cadastrado ainda.</p>';
    return;
  }
  lista.innerHTML = TODOS_SABORES.map((s) => `
    <div class="item-simples">
      <span class="item-simples__nome">${s.nome}</span>
      <button type="button" class="item-simples__remover" data-id="${s.id}" data-nome="${s.nome}">Remover</button>
    </div>
  `).join('');
  lista.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => excluirSabor(b.dataset.id, b.dataset.nome)));
}

function ligarFormularioSabor() {
  document.getElementById('form-sabor').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const campo = document.getElementById('novo-sabor-nome');
    const nome = campo.value.trim();
    if (!nome) return;
    const { error } = await API.criarSaborGelo(nome);
    if (error) { mostrarToast('Não foi possível adicionar.', 'erro'); return; }
    campo.value = '';
    mostrarToast('Sabor adicionado.', 'sucesso');
    carregarSabores();
  });
}

async function excluirSabor(id, nome) {
  if (!confirm(`Remover o sabor "${nome}"? Ele também sai da lista do Copão.`)) return;
  const { error } = await API.excluirSaborGelo(id);
  if (error) { mostrarToast('Não foi possível remover.', 'erro'); return; }
  mostrarToast('Sabor removido.', 'sucesso');
  carregarSabores();
}

/* ---------- Produtos de combo ---------- */
async function carregarCombos() {
  const { data } = await API.getComboProdutos();
  TODOS_COMBOS = data;
  const corpo = document.getElementById('tabela-combos');
  const vazio = document.getElementById('combos-vazio');

  if (TODOS_COMBOS.length === 0) {
    document.querySelector('.tabela-wrap').hidden = true;
    vazio.hidden = false;
    return;
  }
  document.querySelector('.tabela-wrap').hidden = false;
  vazio.hidden = true;

  corpo.innerHTML = TODOS_COMBOS.map((c) => `
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
  corpo.querySelectorAll('[data-acao="excluir"]').forEach((b) => b.addEventListener('click', () => excluirCombo(b.dataset.id, b.dataset.nome)));
}

function ligarModalCombo() {
  const modal = document.getElementById('modal-combo');
  document.getElementById('btn-novo-combo').addEventListener('click', abrirModalNovo);
  document.getElementById('fechar-modal-combo').addEventListener('click', fecharModal);
  document.getElementById('cancelar-modal-combo').addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
  document.getElementById('form-combo').addEventListener('submit', salvarCombo);
}

function abrirModalNovo() {
  document.getElementById('modal-combo-titulo').textContent = 'Novo combo';
  document.getElementById('form-combo').reset();
  document.getElementById('combo-id').value = '';
  document.getElementById('combo-disponivel').checked = true;
  document.getElementById('modal-combo').classList.add('aberto');
}

function abrirModalEdicao(id) {
  const combo = TODOS_COMBOS.find((c) => c.id === id);
  if (!combo) return;
  document.getElementById('modal-combo-titulo').textContent = 'Editar combo';
  document.getElementById('combo-id').value = combo.id;
  document.getElementById('combo-nome').value = combo.nome;
  document.getElementById('combo-preco').value = combo.preco;
  document.getElementById('combo-imagem').value = combo.imagem_url || '';
  document.getElementById('combo-descricao').value = combo.descricao || '';
  document.getElementById('combo-disponivel').checked = combo.disponivel;
  document.getElementById('modal-combo').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal-combo').classList.remove('aberto');
}

async function salvarCombo(evento) {
  evento.preventDefault();
  const id = document.getElementById('combo-id').value;
  const dados = {
    nome: document.getElementById('combo-nome').value.trim(),
    preco: document.getElementById('combo-preco').value,
    imagem_url: document.getElementById('combo-imagem').value.trim() || 'https://placehold.co/600x600/B30A08/B30A08?text=%20',
    descricao: document.getElementById('combo-descricao').value.trim(),
    disponivel: document.getElementById('combo-disponivel').checked,
  };

  const { error } = id ? await API.atualizarComboProduto(id, dados) : await API.criarComboProduto(dados);
  if (error) { mostrarToast('Não foi possível salvar o combo.', 'erro'); return; }
  mostrarToast('Combo salvo com sucesso.', 'sucesso');
  fecharModal();
  carregarCombos();
}

async function excluirCombo(id, nome) {
  if (!confirm(`Excluir o combo "${nome}"?`)) return;
  const { error } = await API.excluirComboProduto(id);
  if (error) { mostrarToast('Não foi possível excluir.', 'erro'); return; }
  mostrarToast('Combo excluído.', 'sucesso');
  carregarCombos();
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
