/* =====================================================================
   ADEGA ZÉ BEER — LÓGICA DA PÁGINA INICIAL (index.html)
   ===================================================================== */

let TODAS_CATEGORIAS = [];
let TODOS_PRODUTOS = [];
let CONFIG_LOJA = null;

document.addEventListener('DOMContentLoaded', async () => {

  const [{ data: config }, { data: categorias }, { data: produtos }] = await Promise.all([
    API.getConfigLoja(),
    API.getCategorias(),
    API.getProdutos({ apenasDisponiveis: true }),
  ]);

  CONFIG_LOJA = config;
  TODAS_CATEGORIAS = categorias.filter((c) => c.mostrar_na_vitrine !== false);
  TODOS_PRODUTOS = produtos;

  preencherCabecalhoERodape(config);
  renderizarVitrine(''); // estado inicial: sem busca, mostra tudo

  ligarBusca();
});

/* ---------- Cabeçalho e rodapé ---------- */
function preencherCabecalhoERodape(config) {
  if (!config) return;
  if (config.cidade_regiao) document.getElementById('topbar-cidade').textContent = config.cidade_regiao;

  if (config.combo_banner_url) document.getElementById('banner-combo-home').src = config.combo_banner_url;
  if (config.copao_banner_url) document.getElementById('banner-copao-home').src = config.copao_banner_url;

  const enderecoEl = document.getElementById('rodape-endereco');
  if (config.endereco) enderecoEl.innerHTML = config.endereco.replace(/, /, ',<br>');

  const numeroFormatado = config.whatsapp ? formatarTelefone(config.whatsapp.replace(/^55/, '')) : '';
  if (config.whatsapp) {
    document.getElementById('rodape-whatsapp-texto').textContent = numeroFormatado;
    document.getElementById('rodape-whatsapp-link').href = `https://wa.me/${config.whatsapp}`;
  } else {
    document.getElementById('rodape-whatsapp-link').hidden = true;
  }

  if (config.instagram_url) {
    const handle = config.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '');
    document.getElementById('rodape-instagram-texto').textContent = handle;
    document.getElementById('rodape-instagram-link').href = config.instagram_url;
  } else {
    document.getElementById('rodape-instagram-link').hidden = true;
  }
}

function formatarTelefone(numero) {
  const digitos = numero.replace(/\D/g, '');
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos[2]} ${digitos.slice(3, 7)}-${digitos.slice(7)}`;
  return numero;
}

/* ---------- Busca ---------- */
function ligarBusca() {
  const input = document.getElementById('campo-busca-input');
  const botaoLimpar = document.getElementById('btn-limpar-busca');
  let temporizador;

  input.addEventListener('input', () => {
    botaoLimpar.hidden = input.value.trim() === '';
    clearTimeout(temporizador);
    temporizador = setTimeout(() => renderizarVitrine(input.value.trim()), 250);
  });

  botaoLimpar.addEventListener('click', () => {
    input.value = '';
    botaoLimpar.hidden = true;
    renderizarVitrine('');
    input.focus();
  });
}

/* ---------- Monta a página inteira (com ou sem termo de busca) ---------- */
function renderizarVitrine(termoBusca) {
  const buscando = termoBusca.length > 0;

  // Ofertas do dia e os cards de Combo/Copão só aparecem fora do modo de busca
  document.getElementById('secao-combo').hidden = buscando;
  document.getElementById('secao-copao').hidden = buscando;

  montarOfertasDoDia(buscando);
  montarCarrosseis(termoBusca);
}

/* ---------- Ofertas do dia ---------- */
function montarOfertasDoDia(buscando) {
  const secao = document.getElementById('secao-ofertas');
  if (buscando || CONFIG_LOJA?.ofertas_do_dia_ativa === false) {
    secao.hidden = true;
    return;
  }
  const produtosEmOferta = TODOS_PRODUTOS.filter((p) => p.em_oferta && p.preco_oferta != null);
  if (produtosEmOferta.length === 0) {
    secao.hidden = true;
    return;
  }
  secao.hidden = false;
  const pista = document.getElementById('pista-ofertas');
  pista.innerHTML = produtosEmOferta.map((p) => cartaoProdutoHtml(p, { mostrarSeloOferta: true })).join('');
  ligarBotoesAdicionar(pista);
}

/* ---------- Carrosséis por categoria (com ou sem busca) ---------- */
function montarCarrosseis(termoBusca) {
  document.getElementById('carrosseis-skeleton').hidden = true;
  const container = document.getElementById('carrosseis-lista');
  const vazio = document.getElementById('carrosseis-vazio');
  const termo = normalizar(termoBusca);

  // Pra cada categoria, decide se ela entra e em que ordem os produtos aparecem
  const blocos = TODAS_CATEGORIAS.map((categoria) => {
    let produtosDaCategoria = TODOS_PRODUTOS.filter((p) => p.categoria_id === categoria.id);
    if (produtosDaCategoria.length === 0) return null;

    if (termo) {
      const categoriaBate = normalizar(categoria.nome).includes(termo);
      const produtosQueBatem = produtosDaCategoria.filter((p) => normalizar(p.nome).includes(termo));
      if (!categoriaBate && produtosQueBatem.length === 0) return null; // categoria não participa da busca

      // produtos cujo nome bate com a busca aparecem primeiro no carrossel
      const idsQueBatem = new Set(produtosQueBatem.map((p) => p.id));
      produtosDaCategoria = [
        ...produtosDaCategoria.filter((p) => idsQueBatem.has(p.id)),
        ...produtosDaCategoria.filter((p) => !idsQueBatem.has(p.id)),
      ];
    }

    return { categoria, produtosDaCategoria };
  }).filter(Boolean);

  // Fora do modo de busca, respeita o teto opcional de carrosséis (Configurações → Vitrine)
  const limite = !termo && Number(CONFIG_LOJA?.quantidade_carrosseis_vitrine) > 0
    ? Number(CONFIG_LOJA.quantidade_carrosseis_vitrine)
    : blocos.length;
  const blocosVisiveis = blocos.slice(0, limite);

  if (blocosVisiveis.length === 0) {
    container.innerHTML = '';
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  container.innerHTML = blocosVisiveis.map(({ categoria, produtosDaCategoria }) => `
    <section class="secao">
      <div class="bloco-carrossel">
        <div class="bloco-carrossel__cabecalho">
          <h2 class="secao__titulo" style="margin-bottom:0;">${categoria.nome}</h2>
          <div class="bloco-carrossel__setas">
            <button type="button" class="bloco-carrossel__seta" data-carrossel-seta="esq" aria-label="Ver anteriores"><span class="icone">${ICONS.chevronLeft}</span></button>
            <button type="button" class="bloco-carrossel__seta" data-carrossel-seta="dir" aria-label="Ver mais"><span class="icone">${ICONS.chevronRight}</span></button>
          </div>
        </div>
        <div class="bloco-carrossel__pista" data-carrossel-pista>
          ${produtosDaCategoria.map((p) => cartaoProdutoHtml(p, { mostrarSeloOferta: false })).join('')}
        </div>
      </div>
    </section>
  `).join('');

  document.querySelectorAll('#carrosseis-lista .bloco-carrossel').forEach((bloco) => configurarSetasCarrossel(bloco));
  ligarBotoesAdicionar(container);
}

/* ---------- Cartão de produto (reutilizado em Ofertas e nos carrosséis normais) ---------- */
function cartaoProdutoHtml(produto, { mostrarSeloOferta }) {
  const emOferta = produto.em_oferta && produto.preco_oferta != null;
  const nomeCategoria = TODAS_CATEGORIAS.find((c) => c.id === produto.categoria_id)?.nome || '';
  return `
    <div class="cartao-produto">
      <div class="cartao-produto__imagem-wrap">
        ${emOferta && mostrarSeloOferta ? `<span class="selo-oferta">Oferta</span>` : ''}
        <img src="${produto.imagem_url}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="cartao-produto__corpo">
        <div class="cartao-produto__topo">
          <span class="cartao-produto__categoria">${nomeCategoria}</span>
          ${emOferta ? `<span class="cartao-produto__preco-antigo">R$ ${formatarPreco(produto.preco)}</span>` : ''}
        </div>
        <h3 class="cartao-produto__nome">${produto.nome}</h3>
        <div class="cartao-produto__preco">R$ ${formatarPreco(emOferta ? produto.preco_oferta : produto.preco)}</div>
        <div class="cartao-produto__rodape">
          <button class="btn-adicionar" data-adicionar-id="${produto.id}"><span class="icone">${ICONS.plus}</span> Adicionar</button>
        </div>
      </div>
    </div>
  `;
}

function ligarBotoesAdicionar(escopoEl) {
  escopoEl.querySelectorAll('[data-adicionar-id]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const produto = TODOS_PRODUTOS.find((p) => p.id === botao.dataset.adicionarId);
      Carrinho.adicionar(produto, 1);
      mostrarToast(`${produto.nome} adicionado à cesta`, 'sucesso');
    });
  });
}

// Remove acentos e caixa alta pra comparação de busca ("Cerveja" === "cerveja" === "cervéja")
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatarPreco(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}
