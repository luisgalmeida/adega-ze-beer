/* =====================================================================
   ADEGA ZÉ BEER — LÓGICA DE FINALIZAR PEDIDO (finalizar-pedido.html)
   =====================================================================
   Fluxo: escolher retirada ou entrega (muda os campos exigidos e se
   entra taxa de entrega) → nome/telefone (sempre) → endereço (só na
   entrega) → forma de pagamento (dinheiro com troco, pix com chave +
   whatsapp, débito/crédito sem campo extra) → confirmar, o que grava
   o pedido com data/hora exata e leva pra tela de confirmação.
   ===================================================================== */

let CONFIG_LOJA = null;
let ITENS_CESTA = [];
let tipoEntregaAtual = 'retirada';
let formaPagamentoAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
  ITENS_CESTA = Carrinho.ler();
  if (ITENS_CESTA.length === 0) {
    document.getElementById('finalizar-vazio').hidden = false;
    return;
  }

  const { data: config } = await API.getConfigLoja();
  CONFIG_LOJA = config || {};

  if (CONFIG_LOJA.cidade_regiao) document.getElementById('topbar-cidade').textContent = CONFIG_LOJA.cidade_regiao;
  document.getElementById('texto-taxa-entrega').textContent = `+ R$ ${formatarPreco(CONFIG_LOJA.valor_entrega || 0)}`;
  preencherRodape();

  document.getElementById('miolo-finalizar').hidden = false;
  renderizarResumo();
  ligarOpcoesDeEntrega();
  ligarFormaPagamento();
  ligarBuscaCep();
  ligarEnvioFormulario();
});

function preencherRodape() {
  if (CONFIG_LOJA.endereco) document.getElementById('rodape-endereco').innerHTML = CONFIG_LOJA.endereco.replace(/, /, ',<br>');
  if (CONFIG_LOJA.whatsapp) {
    document.getElementById('rodape-whatsapp-texto').textContent = CONFIG_LOJA.whatsapp;
    document.getElementById('rodape-whatsapp-link').href = `https://wa.me/${CONFIG_LOJA.whatsapp}`;
  }
  if (CONFIG_LOJA.instagram_url) document.getElementById('rodape-instagram-link').href = CONFIG_LOJA.instagram_url;
}

/* ---------- Resumo ---------- */
function renderizarResumo() {
  const container = document.getElementById('resumo-itens-finalizar');
  container.innerHTML = ITENS_CESTA.map((i) => `
    <div class="resumo-linha">
      <span>${i.quantidade}x ${i.nome}${i.detalhes ? ` <small style="color:var(--cor-texto-suave);">(${i.detalhes})</small>` : ''}</span>
      <span>R$ ${formatarPreco(i.preco_unit * i.quantidade)}</span>
    </div>
  `).join('');
  atualizarTotais();
}

function atualizarTotais() {
  const subtotal = ITENS_CESTA.reduce((soma, i) => soma + i.preco_unit * i.quantidade, 0);
  const ehEntrega = tipoEntregaAtual === 'entrega';
  const taxa = ehEntrega ? Number(CONFIG_LOJA.valor_entrega || 0) : 0;

  document.getElementById('resumo-subtotal-finalizar').textContent = `R$ ${formatarPreco(subtotal)}`;

  // Na retirada, a linha continua visível mas vira um aviso sem valor —
  // não soma nada ao total, só deixa claro que não tem taxa de entrega
  document.getElementById('resumo-rotulo-entrega').textContent = ehEntrega ? 'Taxa de entrega' : 'Sem taxa de entrega';
  document.getElementById('resumo-taxa-entrega').textContent = ehEntrega ? `R$ ${formatarPreco(taxa)}` : '';

  document.getElementById('resumo-total-finalizar').textContent = `R$ ${formatarPreco(subtotal + taxa)}`;
  atualizarCalculoTroco();
}

/* ---------- Retirada / Entrega ---------- */
function ligarOpcoesDeEntrega() {
  document.querySelectorAll('input[name="tipo_entrega"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      tipoEntregaAtual = radio.value;
      document.querySelectorAll('.opcao-entrega').forEach((label) => label.classList.toggle('selecionada', label.dataset.opcao === tipoEntregaAtual));
      document.getElementById('bloco-endereco').hidden = tipoEntregaAtual !== 'entrega';

      // Forma de pagamento só faz sentido combinar antes da entrega — na
      // retirada, o cliente resolve isso na hora, direto na loja
      const ehEntrega = tipoEntregaAtual === 'entrega';
      document.getElementById('bloco-forma-pagamento').hidden = !ehEntrega;
      if (!ehEntrega) {
        formaPagamentoAtual = null;
        document.querySelectorAll('input[name="forma_pagamento"]').forEach((r) => (r.checked = false));
        document.getElementById('campo-troco').hidden = true;
        document.getElementById('bloco-pix').hidden = true;
        document.getElementById('erro-pagamento').style.display = 'none';
      }

      atualizarTotais();
    });
  });
  document.querySelector('.opcao-entrega[data-opcao="retirada"]').classList.add('selecionada');
  document.getElementById('bloco-forma-pagamento').hidden = true; // estado inicial: retirada
}

/* ---------- Forma de pagamento ---------- */
function ligarFormaPagamento() {
  document.querySelectorAll('input[name="forma_pagamento"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      formaPagamentoAtual = radio.value;
      document.getElementById('campo-troco').hidden = formaPagamentoAtual !== 'dinheiro';
      document.getElementById('bloco-pix').hidden = formaPagamentoAtual !== 'pix';
      document.getElementById('erro-pagamento').style.display = 'none';
      if (formaPagamentoAtual === 'pix') preencherPix();
    });
  });
  document.getElementById('campo-troco-para').addEventListener('input', atualizarCalculoTroco);
}

function preencherPix() {
  document.getElementById('pix-chave').textContent = CONFIG_LOJA.chave_pix || '(chave não configurada)';
  const whats = CONFIG_LOJA.whatsapp_pix || CONFIG_LOJA.whatsapp;
  if (whats) document.getElementById('pix-whatsapp-link').href = `https://wa.me/${whats}`;
}

function atualizarCalculoTroco() {
  const el = document.getElementById('campo-troco-calculo');
  const valorInformado = Number(document.getElementById('campo-troco-para').value);
  if (!valorInformado) { el.textContent = ''; return; }
  const subtotal = ITENS_CESTA.reduce((soma, i) => soma + i.preco_unit * i.quantidade, 0);
  const taxa = tipoEntregaAtual === 'entrega' ? Number(CONFIG_LOJA.valor_entrega || 0) : 0;
  const total = subtotal + taxa;
  const troco = valorInformado - total;
  el.textContent = troco >= 0 ? `Troco: R$ ${formatarPreco(troco)}` : `Valor menor que o total do pedido (R$ ${formatarPreco(total)}).`;
  el.style.color = troco >= 0 ? 'var(--cor-texto-suave)' : 'var(--cor-erro)';
}

/* ---------- CEP / ViaCEP ---------- */
function ligarBuscaCep() {
  const campoCep = document.getElementById('campo-cep');
  campoCep.addEventListener('input', () => {
    let valor = campoCep.value.replace(/\D/g, '').slice(0, 8);
    if (valor.length > 5) valor = `${valor.slice(0, 5)}-${valor.slice(5)}`;
    campoCep.value = valor;
  });
  campoCep.addEventListener('blur', buscarCep);
}

async function buscarCep() {
  const campoCep = document.getElementById('campo-cep');
  const digitos = campoCep.value.replace(/\D/g, '');
  if (digitos.length !== 8) return;

  document.getElementById('campo-rua').value = 'Buscando...';
  document.getElementById('campo-bairro').value = 'Buscando...';

  const { data, error } = await buscarEnderecoPorCep(digitos);

  if (error) {
    document.getElementById('campo-rua').value = '';
    document.getElementById('campo-bairro').value = '';
    mostrarToast(error.message, 'erro');
    marcarErro('campo-cep', true);
    return;
  }

  marcarErro('campo-cep', false);
  document.getElementById('campo-rua').value = data.rua;
  document.getElementById('campo-bairro').value = data.bairro;
  campoCep.dataset.cidade = data.cidade;
  campoCep.dataset.estado = data.estado;
  document.getElementById('campo-numero').focus();
}

/* ---------- Envio ---------- */
function ligarEnvioFormulario() {
  document.getElementById('form-pedido').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!validarFormulario()) return;

    const botao = document.getElementById('btn-confirmar-pedido');
    botao.disabled = true;
    botao.textContent = 'Enviando...';

    const campoCep = document.getElementById('campo-cep');
    const payload = {
      tipo_entrega: tipoEntregaAtual,
      cliente_nome: document.getElementById('campo-nome').value.trim(),
      telefone: document.getElementById('campo-telefone').value.trim(),
      forma_pagamento: formaPagamentoAtual,
      troco_para: formaPagamentoAtual === 'dinheiro' ? document.getElementById('campo-troco-para').value : null,
      itens: ITENS_CESTA.map((i) => ({ tipo: i.tipo || 'produto', produto_id: i.produto_id, nome: i.nome, detalhes: i.detalhes || null, preco_unit: i.preco_unit, quantidade: i.quantidade })),
      valor_entrega: CONFIG_LOJA.valor_entrega || 0,
    };

    if (tipoEntregaAtual === 'entrega') {
      Object.assign(payload, {
        cep: campoCep.value,
        rua: document.getElementById('campo-rua').value,
        bairro: document.getElementById('campo-bairro').value,
        cidade: campoCep.dataset.cidade || '',
        estado: campoCep.dataset.estado || '',
        numero_casa: document.getElementById('campo-numero').value.trim(),
        complemento: document.getElementById('campo-complemento').value.trim(),
      });
    }

    const { data: pedido, error } = await API.criarPedido(payload);

    if (error) {
      mostrarToast('Não foi possível enviar o pedido. Tente novamente.', 'erro');
      botao.disabled = false;
      botao.textContent = 'Confirmar Pedido';
      return;
    }

    Carrinho.limpar();
    window.location.href = `pedido-confirmado.html?pedido=${pedido.id}`;
  });
}

function validarFormulario() {
  let valido = true;
  const obrigatorios = ['campo-nome', 'campo-telefone'];
  if (tipoEntregaAtual === 'entrega') obrigatorios.push('campo-cep', 'campo-rua', 'campo-numero', 'campo-bairro', 'campo-complemento');

  obrigatorios.forEach((id) => {
    const vazio = !document.getElementById(id).value.trim();
    marcarErro(id, vazio);
    if (vazio) valido = false;
  });

  const erroPagamento = document.getElementById('erro-pagamento');
  if (tipoEntregaAtual === 'entrega' && !formaPagamentoAtual) {
    erroPagamento.style.display = 'block';
    valido = false;
  } else {
    erroPagamento.style.display = 'none';
  }

  if (!valido) mostrarToast('Confira os campos destacados antes de continuar.', 'erro');
  return valido;
}

function marcarErro(idCampo, temErro) {
  document.getElementById(idCampo).closest('.campo').classList.toggle('tem-erro', temErro);
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
