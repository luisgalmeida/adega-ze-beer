/* =====================================================================
   PAINEL — DASHBOARD DE ESTATÍSTICAS (dashboard.html)
   =====================================================================
   Separado da tela de Pedidos: aqui é só número — quantidade de
   pedidos, produtos mais vendidos e valor vendido no período
   escolhido. A lista/operação do dia a dia dos pedidos fica em
   pedidos.html.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  ligarSeletorPeriodo();
  aplicarPreset('7'); // período inicial: últimos 7 dias
});

function ligarSeletorPeriodo() {
  document.querySelectorAll('[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => aplicarPreset(chip.dataset.preset));
  });
  document.getElementById('periodo-inicio').addEventListener('change', () => { desmarcarPresets(); carregarDashboard(); });
  document.getElementById('periodo-fim').addEventListener('change', () => { desmarcarPresets(); carregarDashboard(); });
}

function desmarcarPresets() {
  document.querySelectorAll('[data-preset]').forEach((c) => c.setAttribute('aria-pressed', 'false'));
}

function aplicarPreset(preset) {
  document.querySelectorAll('[data-preset]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.preset === preset)));

  const hoje = new Date();
  let inicio = new Date(hoje);

  if (preset === 'hoje') {
    // inicio já é hoje
  } else if (preset === '7') {
    inicio.setDate(hoje.getDate() - 6);
  } else if (preset === '30') {
    inicio.setDate(hoje.getDate() - 29);
  } else if (preset === 'mes') {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }

  document.getElementById('periodo-inicio').value = paraDataISO(inicio);
  document.getElementById('periodo-fim').value = paraDataISO(hoje);
  carregarDashboard();
}

function paraDataISO(data) {
  // Usa os componentes LOCAIS da data (não toISOString(), que converte pra
  // UTC e pode "pular" pro dia seguinte à noite em fusos atrás de UTC,
  // como o horário do Brasil — era exatamente o bug do filtro "Hoje").
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Mesma ideia, mas pra converter o criado_em (salvo em UTC) de volta pro
// dia LOCAL antes de comparar com os filtros de data — sem isso, pedidos
// feitos à noite podiam cair no dia errado do filtro.
function dataLocalDoPedido(isoString) {
  return paraDataISO(new Date(isoString));
}

async function carregarDashboard() {
  const dataInicio = document.getElementById('periodo-inicio').value;
  const dataFim = document.getElementById('periodo-fim').value;

  const [{ data: estatisticas }, { data: pedidosPeriodo }, { data: produtos }] = await Promise.all([
    API.getEstatisticas({ dataInicio, dataFim }),
    API.getPedidos(),
    API.getProdutos({}),
  ]);

  // Indicadores principais
  document.getElementById('ind-pedidos-periodo').textContent = estatisticas.totalPedidos;
  document.getElementById('ind-valor-vendido').textContent = `R$ ${formatarPreco(estatisticas.valorVendido)}`;
  const ticketMedio = estatisticas.totalPedidos > 0 ? estatisticas.valorVendido / estatisticas.totalPedidos : 0;
  document.getElementById('ind-ticket-medio').textContent = `R$ ${formatarPreco(ticketMedio)}`;
  document.getElementById('ind-produtos-ativos').textContent = produtos.filter((p) => p.disponivel).length;

  // Ranking de produtos mais vendidos (dentro do período)
  const rankingEl = document.getElementById('lista-ranking-produtos');
  const rankingVazio = document.getElementById('ranking-vazio');
  if (estatisticas.produtosMaisVendidos.length === 0) {
    rankingEl.hidden = true;
    rankingVazio.hidden = false;
  } else {
    rankingEl.hidden = false;
    rankingVazio.hidden = true;
    const maiorQuantidade = estatisticas.produtosMaisVendidos[0].quantidade;
    rankingEl.innerHTML = estatisticas.produtosMaisVendidos.map((item, i) => `
      <div class="item-ranking">
        <span class="item-ranking__posicao">${i + 1}</span>
        <span class="item-ranking__nome">${item.nome}</span>
        <span class="item-ranking__barra-fundo"><span class="item-ranking__barra" style="width:${(item.quantidade / maiorQuantidade) * 100}%"></span></span>
        <span class="item-ranking__valor">${item.quantidade}x</span>
      </div>
    `).join('');
  }

  // Pedidos por status, dentro do mesmo período filtrado
  const pedidosNoPeriodo = pedidosPeriodo.filter((p) => {
    const dia = dataLocalDoPedido(p.criado_em);
    return (!dataInicio || dia >= dataInicio) && (!dataFim || dia <= dataFim);
  });
  const contagem = { novo: 0, andamento: 0, concluido: 0, perdido: 0 };
  pedidosNoPeriodo.forEach((p) => { contagem[p.status] = (contagem[p.status] || 0) + 1; });
  const totalStatus = pedidosNoPeriodo.length || 1;
  const rotulos = { novo: 'Novos', andamento: 'Em andamento', concluido: 'Concluídos', perdido: 'Perdidos' };

  document.getElementById('lista-status-pedidos').innerHTML = Object.keys(rotulos).map((chave) => `
    <div class="item-ranking">
      <span class="item-ranking__nome">${rotulos[chave]}</span>
      <span class="item-ranking__barra-fundo"><span class="item-ranking__barra" style="width:${(contagem[chave] / totalStatus) * 100}%"></span></span>
      <span class="item-ranking__valor">${contagem[chave]}</span>
    </div>
  `).join('');
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
