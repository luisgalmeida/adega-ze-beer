/* =====================================================================
   PAINEL — PEDIDOS RECEBIDOS (pedidos.html)
   =====================================================================
   Essa é a tela que fecha o fluxo inteiro: cada linha aqui foi criada
   por API.criarPedido() lá na página finalizar-pedido.html da vitrine,
   já com a data/hora exata em que o cliente confirmou e com o tipo de
   entrega escolhido (retirada ou entrega, com a taxa aplicada).
   ===================================================================== */

let todosPedidos = [];
// Por padrão, pedidos concluídos ficam de fora da lista — só aparecem
// quando o dono marca esse chip explicitamente. Os outros três status
// já começam marcados (é o que interessa acompanhar no dia a dia).
let statusAtivos = new Set(['novo', 'andamento', 'perdido']);
let filtroDataAtual = '';
let pedidoAbertoId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await carregarPedidos();
  ligarFiltros();
  ligarModal();

  const idNaUrl = new URLSearchParams(window.location.search).get('id');
  if (idNaUrl) abrirDetalhe(idNaUrl);
});

async function carregarPedidos() {
  const { data } = await API.getPedidos();
  todosPedidos = data;
  renderizarTabela();
}

function renderizarTabela() {
  let lista = todosPedidos.filter((p) => statusAtivos.has(p.status));
  if (filtroDataAtual) lista = lista.filter((p) => dataLocalDoPedido(p.criado_em) === filtroDataAtual);

  const corpo = document.getElementById('tabela-pedidos');
  const vazio = document.getElementById('pedidos-vazio');

  if (lista.length === 0) {
    document.querySelector('.tabela-wrap').hidden = true;
    document.getElementById('lista-pedidos-mobile').innerHTML = '';
    vazio.hidden = false;
    return;
  }
  document.querySelector('.tabela-wrap').hidden = false;
  vazio.hidden = true;

  corpo.innerHTML = lista.map((p) => `
    <tr>
      <td>#${p.numero}</td>
      <td class="tabela__data">${formatarDataHora(p.criado_em)}</td>
      <td>${p.cliente_nome}</td>
      <td>${p.tipo_entrega === 'retirada' ? 'Retirada' : 'Entrega'}</td>
      <td>${p.itens.reduce((s, i) => s + i.quantidade, 0)} itens</td>
      <td>R$ ${formatarPreco(p.total)}</td>
      <td>${rotuloStatusHtml(p.status, p.id)}</td>
      <td><button class="tabela__link-acao" data-id="${p.id}">Ver detalhes</button></td>
    </tr>
  `).join('');

  corpo.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => abrirDetalhe(b.dataset.id)));
  corpo.querySelectorAll('[data-status-clicavel]').forEach((b) => b.addEventListener('click', (evento) => {
    evento.stopPropagation();
    abrirPopoverStatus(b);
  }));

  renderizarCartoesMobile(lista);
}

// Versão enxuta pro celular: só recebido em / entrega / status — clicar
// em qualquer parte do cartão abre os mesmos detalhes da versão desktop
function renderizarCartoesMobile(lista) {
  const container = document.getElementById('lista-pedidos-mobile');
  container.innerHTML = lista.map((p) => `
    <div class="cartao-pedido-mobile" data-id="${p.id}">
      <div class="cartao-pedido-mobile__topo">
        <span class="cartao-pedido-mobile__numero">#${p.numero}</span>
        ${rotuloStatusHtml(p.status, p.id)}
      </div>
      <div class="cartao-pedido-mobile__linha"><span class="icone">${ICONS.calendar}</span> ${formatarDataHora(p.criado_em)}</div>
      <div class="cartao-pedido-mobile__linha"><span class="icone">${p.tipo_entrega === 'retirada' ? ICONS.store : ICONS.truck}</span> ${p.tipo_entrega === 'retirada' ? 'Retirada' : 'Entrega'}</div>
    </div>
  `).join('');

  container.querySelectorAll('.cartao-pedido-mobile').forEach((cartao) => {
    cartao.addEventListener('click', (evento) => {
      // se o clique foi no selo de status (que já abre o popover sozinho), não abre o modal de detalhe junto
      if (evento.target.closest('[data-status-clicavel]')) return;
      abrirDetalhe(cartao.dataset.id);
    });
  });
  container.querySelectorAll('[data-status-clicavel]').forEach((b) => b.addEventListener('click', (evento) => {
    evento.stopPropagation();
    abrirPopoverStatus(b);
  }));
}

// Formata o criado_em (UTC) pro dia LOCAL do navegador — mesma lógica do
// dashboard.js, pra "Hoje" e o filtro de data baterem com o fuso do Brasil
function dataLocalDoPedido(isoString) {
  const data = new Date(isoString);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function ligarFiltros() {
  // Cada chip liga/desliga o próprio status, independente dos outros —
  // dá pra ver "Novos" e "Em andamento" juntos, por exemplo, sem
  // precisar escolher só um de cada vez.
  document.querySelectorAll('#chips-status-pedidos [data-status]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const status = chip.dataset.status;
      const ativo = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!ativo));
      if (ativo) statusAtivos.delete(status); else statusAtivos.add(status);
      renderizarTabela();
    });
  });

  const campoData = document.getElementById('filtro-data-pedidos');
  campoData.addEventListener('change', () => { filtroDataAtual = campoData.value; renderizarTabela(); });
  document.getElementById('limpar-filtro-data').addEventListener('click', () => { campoData.value = ''; filtroDataAtual = ''; renderizarTabela(); });
}

/* ---------- Modal de detalhe ---------- */

function ligarModal() {
  const modal = document.getElementById('modal-pedido');
  document.getElementById('fechar-modal-pedido').addEventListener('click', fecharModal);
  document.getElementById('fechar-modal-pedido-2').addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
  document.getElementById('salvar-status-pedido').addEventListener('click', salvarStatus);
}

function abrirDetalhe(id) {
  const pedido = todosPedidos.find((p) => p.id === id);
  if (!pedido) return;
  pedidoAbertoId = id;

  document.getElementById('modal-pedido-titulo').textContent = `Pedido #${pedido.numero}`;

  document.getElementById('detalhe-meta-pedido').innerHTML = `
    <span>📅 ${formatarDataHora(pedido.criado_em)}</span>
    <span>${pedido.tipo_entrega === 'retirada' ? '🏪 Retirada na loja' : '🚚 Entrega'}</span>
    <span>${rotuloFormaPagamento(pedido)}</span>
  `;

  document.getElementById('detalhe-itens-pedido').innerHTML = pedido.itens
    .map((i) => `
      <div class="detalhe-pedido__item">
        <span>${i.quantidade}x ${i.nome}${i.detalhes ? `<br><small style="color:var(--cor-texto-suave);">${i.detalhes}</small>` : ''}</span>
        <span>R$ ${formatarPreco(i.preco_unit * i.quantidade)}</span>
      </div>
    `)
    .join('');

  document.getElementById('detalhe-subtotal-pedido').textContent = `R$ ${formatarPreco(pedido.subtotal ?? pedido.total)}`;
  const linhaEntrega = document.getElementById('detalhe-entrega-linha');
  if (pedido.tipo_entrega === 'entrega' && pedido.valor_entrega > 0) {
    linhaEntrega.hidden = false;
    document.getElementById('detalhe-entrega-pedido').textContent = `R$ ${formatarPreco(pedido.valor_entrega)}`;
  } else {
    linhaEntrega.hidden = true;
  }
  document.getElementById('detalhe-total-pedido').textContent = `R$ ${formatarPreco(pedido.total)}`;

  const enderecoEl = document.getElementById('detalhe-endereco-pedido');
  const telefoneHtml = pedido.telefone ? `📞 ${pedido.telefone}<br>` : '';
  if (pedido.tipo_entrega === 'entrega') {
    enderecoEl.hidden = false;
    enderecoEl.innerHTML = `
      <strong>${pedido.cliente_nome}</strong><br>
      ${telefoneHtml}
      ${pedido.rua}, ${pedido.numero_casa}${pedido.complemento ? ' — ' + pedido.complemento : ''}<br>
      ${pedido.bairro} — ${pedido.cidade}/${pedido.estado}<br>
      CEP: ${pedido.cep}
    `;
  } else {
    enderecoEl.hidden = false;
    enderecoEl.innerHTML = `<strong>${pedido.cliente_nome}</strong><br>${telefoneHtml}Vai retirar o pedido na loja — sem endereço de entrega.`;
  }

  document.getElementById('select-status-pedido').value = pedido.status;
  document.getElementById('modal-pedido').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal-pedido').classList.remove('aberto');
  pedidoAbertoId = null;
  window.history.replaceState({}, '', 'pedidos.html');
}

async function salvarStatus() {
  const novoStatus = document.getElementById('select-status-pedido').value;
  const { error } = await API.atualizarStatusPedido(pedidoAbertoId, novoStatus);
  if (error) { mostrarToast('Não foi possível atualizar o status.', 'erro'); return; }
  mostrarToast('Status atualizado.', 'sucesso');
  fecharModal();
  carregarPedidos();
}

function rotuloFormaPagamento(pedido) {
  const mapa = { dinheiro: '💵 Dinheiro', pix: '💠 Pix', debito: '💳 Débito', credito: '💳 Crédito' };
  let texto = mapa[pedido.forma_pagamento] || 'Pagamento não informado';
  if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
    texto += ` (troco pra R$ ${formatarPreco(pedido.troco_para)})`;
  }
  return texto;
}

function rotuloStatusHtml(status, pedidoId) {
  const mapa = { novo: ['Novo', 'novo'], andamento: ['Em andamento', 'andamento'], concluido: ['Concluído', 'concluido'], perdido: ['Perdido', 'perdido'] };
  const [texto, classe] = mapa[status] || ['—', 'novo'];
  return `<button type="button" class="selo-status selo-status--${classe} selo-status-clicavel" data-status-clicavel data-pedido-id="${pedidoId}" title="Clique para trocar o status">${texto}</button>`;
}

/* ---------- Popover: trocar status com um clique, direto na tabela ---------- */
const OPCOES_STATUS = [
  { valor: 'novo', texto: 'Novo', cor: 'var(--cor-alerta)' },
  { valor: 'andamento', texto: 'Em andamento', cor: '#92720B' },
  { valor: 'concluido', texto: 'Concluído', cor: 'var(--cor-sucesso)' },
  { valor: 'perdido', texto: 'Perdido', cor: 'var(--cor-erro)' },
];

function getPopoverStatus() {
  let popover = document.getElementById('popover-status-global');
  if (!popover) {
    popover = document.createElement('div');
    popover.id = 'popover-status-global';
    popover.className = 'popover-status';
    popover.innerHTML = OPCOES_STATUS.map((op) => `
      <button type="button" data-valor="${op.valor}">
        <span class="bolinha" style="background:${op.cor}"></span> ${op.texto}
      </button>
    `).join('');
    document.body.appendChild(popover);
    document.addEventListener('click', () => popover.classList.remove('aberto'));
  }
  return popover;
}

function abrirPopoverStatus(botaoBadge) {
  const popover = getPopoverStatus();
  const pedidoId = botaoBadge.dataset.pedidoId;
  const retangulo = botaoBadge.getBoundingClientRect();

  popover.style.top = `${retangulo.bottom + 6}px`;
  popover.style.left = `${Math.min(retangulo.left, window.innerWidth - 180)}px`;
  popover.classList.add('aberto');

  popover.querySelectorAll('button').forEach((botaoOpcao) => {
    botaoOpcao.onclick = async (evento) => {
      evento.stopPropagation();
      popover.classList.remove('aberto');
      const { error } = await API.atualizarStatusPedido(pedidoId, botaoOpcao.dataset.valor);
      if (error) { mostrarToast('Não foi possível atualizar o status.', 'erro'); return; }
      mostrarToast('Status atualizado.', 'sucesso');
      carregarPedidos();
    };
  });
}

// Formata pra "dd/mm/aaaa às hh:mm", no fuso horário do navegador (Brasil por padrão)
function formatarDataHora(isoString) {
  const data = new Date(isoString);
  const dataFmt = data.toLocaleDateString('pt-BR');
  const horaFmt = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dataFmt} ${horaFmt}`;
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
