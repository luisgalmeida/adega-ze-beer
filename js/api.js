/* =====================================================================
   ADEGA ZÉ BEER — CAMADA api.js
   =====================================================================
   Esse é o ÚNICO arquivo que "conversa com o backend". Todas as
   páginas (vitrine e painel) chamam só as funções deste arquivo —
   nunca leem localStorage diretamente. É exatamente o papel que o
   api.js tem no design do sistema: manter o frontend agnóstico
   quanto ao backend escolhido.

   MODO ATUAL (demo): os dados ficam salvos no localStorage do
   navegador, simulando 4 "tabelas": categorias, produtos, pedidos
   e config_loja — os mesmos nomes e campos que a Supabase Backend
   Design v1.0 definiu.

   MODO PRODUÇÃO (Supabase): cada função abaixo tem, logo depois do
   bloco DEMO, um bloco comentado "PRODUÇÃO (Supabase)" já pronto.
   Pra ligar de verdade ao Supabase:
     1. Adicione o script do client em cada HTML, antes deste arquivo:
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     2. No topo deste arquivo, crie o client (veja variável `sb`
        comentada abaixo) com sua URL e sua chave anon.
     3. Em cada função, apague o bloco DEMO e descomente o bloco
        PRODUÇÃO correspondente.
   Veja o arquivo INSTRUCOES-SUPABASE.md para o passo a passo completo,
   incluindo o SQL das tabelas e as políticas de RLS.
   ===================================================================== */

const SUPABASE_URL = 'https://piwkjqcjkxzpmfjmpqpo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_iyvkiyAaBMaTe4Gav0wTwQ_I-RXSEqv';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const API = (() => {

  /* ---------------------------------------------------------------
     Chaves usadas no localStorage — cada uma representa uma "tabela"
     --------------------------------------------------------------- */
  const CHAVES = {
    categorias: 'azb_categorias',
    produtos: 'azb_produtos',
    pedidos: 'azb_pedidos',
    config: 'azb_config',
    sessao: 'azb_sessao',
    combo_produtos: 'azb_combo_produtos',
    copao_produtos: 'azb_copao_produtos',
    sabores_gelo: 'azb_sabores_gelo',
    energeticos: 'azb_energeticos',
  };

  /* ---------------------------------------------------------------
     Helpers internos do modo DEMO
     --------------------------------------------------------------- */

  // Lê uma "tabela" do localStorage (retorna array vazio se não existir)
  function lerTabela(nome) {
    const bruto = localStorage.getItem(CHAVES[nome]);
    return bruto ? JSON.parse(bruto) : [];
  }

  // Grava uma "tabela" inteira no localStorage
  function gravarTabela(nome, dados) {
    localStorage.setItem(CHAVES[nome], JSON.stringify(dados));
  }

  // Gera um id simples (no Supabase isso vira um uuid gerado pelo banco)
  function gerarId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // Simula a latência de uma chamada de rede real, pra você já ver os
  // estados de "carregando" (skeleton) funcionando mesmo em modo demo
  function simularLatencia(ms = 350) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Converte um criado_em (salvo em UTC, via toISOString()) pro dia LOCAL
  // do navegador, no formato 'YYYY-MM-DD' — usado pra comparar com filtros
  // de data. Nunca usar isoString.slice(0,10) direto: isso pega o dia em
  // UTC, que pode estar um dia à frente do dia local à noite (o Brasil,
  // por exemplo, está 3h atrás de UTC).
  function dataLocalDoPedido(isoString) {
    const data = new Date(isoString);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /* =================================================================
     CATEGORIAS
     Tabela Supabase: categorias (id uuid, nome text, slug text,
     mostrar_na_vitrine boolean, ordem int — controla a posição no
     menu e nos carrosséis da home; menor valor aparece primeiro)
     ================================================================= */

  async function getCategorias() {
    // Ordena por "ordem" (definida pelo dono no painel, em Categorias),
    // não mais por criado_em — é o que o menu, os cards de destaque e
    // os carrosséis da home seguem pra decidir a sequência.
    const { data, error } = await sb.from('categorias').select('*').order('ordem');
    return { data, error };
  }

  async function criarCategoria(categoria) {
    const { data, error } = await sb.from('categorias').insert({
      nome: categoria.nome, mostrar_na_vitrine: categoria.mostrar_na_vitrine !== false, ordem: categoria.ordem,
    }).select().single();
    return { data, error };
  }

  async function atualizarCategoria(id, dados) {
    const { data, error } = await sb.from('categorias').update(dados).eq('id', id).select().single();
    return { data, error };
  }

  async function excluirCategoria(id) {
    const { error } = await sb.from('categorias').delete().eq('id', id);
    return { data: !error, error };
  }

  /* =================================================================
     PRODUTOS
     Tabela Supabase: produtos (id uuid, nome text, descricao text,
     preco numeric, categoria_id uuid, imagem_url text,
     disponivel boolean, em_oferta boolean, preco_oferta numeric,
     criado_em timestamptz)
     ================================================================= */

  async function getProdutos(filtros = {}) {
    // filtros: { categoriaId, busca, apenasDisponiveis }
    let consulta = sb.from('produtos').select('*, categorias(nome)');
    if (filtros.categoriaId) consulta = consulta.eq('categoria_id', filtros.categoriaId);
    if (filtros.apenasDisponiveis) consulta = consulta.eq('disponivel', true);
    if (filtros.busca) consulta = consulta.ilike('nome', `%${filtros.busca}%`);
    const { data, error } = await consulta.order('nome');
    return { data, error };
  }

  async function getProdutoPorId(id) {
    const { data, error } = await sb.from('produtos').select('*, categorias(nome)').eq('id', id).single();
    return { data, error };
  }

  async function criarProduto(produto) {
    const { data, error } = await sb.from('produtos').insert({
      nome: produto.nome, descricao: produto.descricao, preco: produto.preco,
      categoria_id: produto.categoria_id, imagem_url: produto.imagem_url,
      disponivel: produto.disponivel, em_oferta: produto.em_oferta,
      preco_oferta: produto.em_oferta ? produto.preco_oferta : null,
    }).select().single();
    return { data, error };
  }

  async function atualizarProduto(id, dados) {
    const { data, error } = await sb.from('produtos').update(dados).eq('id', id).select().single();
    return { data, error };
  }

  async function excluirProduto(id) {
    const { error } = await sb.from('produtos').delete().eq('id', id);
    return { data: !error, error };
  }

  /* =================================================================
     MONTE SEU COMBO
     Tabela Supabase: combo_produtos (id uuid, nome text, descricao text,
     preco numeric, imagem_url text, disponivel boolean, criado_em)
     Tabela Supabase: sabores_gelo (id uuid, nome text) — compartilhada
     entre Combo e Copão. O limite de gelos por combo fica em
     loja_config.combo_gelo_max (default 4).
     ================================================================= */

  async function getComboProdutos() {
    const { data, error } = await sb.from('combo_produtos').select('*').order('criado_em');
    return { data, error };
  }

  async function criarComboProduto(produto) {
    const { data, error } = await sb.from('combo_produtos').insert({
      nome: produto.nome, descricao: produto.descricao, preco: produto.preco,
      imagem_url: produto.imagem_url, disponivel: produto.disponivel,
    }).select().single();
    return { data, error };
  }

  async function atualizarComboProduto(id, dados) {
    const { data, error } = await sb.from('combo_produtos').update(dados).eq('id', id).select().single();
    return { data, error };
  }

  async function excluirComboProduto(id) {
    const { error } = await sb.from('combo_produtos').delete().eq('id', id);
    return { data: !error, error };
  }

  /* =================================================================
     MONTE SEU COPÃO
     Tabela Supabase: copao_produtos (mesmo formato de combo_produtos)
     Tabela Supabase: energeticos (id uuid, nome text, preco_adicional numeric)
     ================================================================= */

  async function getCopaoProdutos() {
    const { data, error } = await sb.from('copao_produtos').select('*').order('criado_em');
    return { data, error };
  }

  async function criarCopaoProduto(produto) {
    const { data, error } = await sb.from('copao_produtos').insert({
      nome: produto.nome, descricao: produto.descricao, preco: produto.preco,
      imagem_url: produto.imagem_url, disponivel: produto.disponivel,
    }).select().single();
    return { data, error };
  }

  async function atualizarCopaoProduto(id, dados) {
    const { data, error } = await sb.from('copao_produtos').update(dados).eq('id', id).select().single();
    return { data, error };
  }

  async function excluirCopaoProduto(id) {
    const { error } = await sb.from('copao_produtos').delete().eq('id', id);
    return { data: !error, error };
  }

  /* ---------- Sabores de gelo (compartilhado entre Combo e Copão) ---------- */

  async function getSaboresGelo() {
    const { data, error } = await sb.from('sabores_gelo').select('*').order('nome');
    return { data, error };
  }

  async function criarSaborGelo(nome) {
    const { data, error } = await sb.from('sabores_gelo').insert({ nome }).select().single();
    return { data, error };
  }

  async function excluirSaborGelo(id) {
    const { error } = await sb.from('sabores_gelo').delete().eq('id', id);
    return { data: !error, error };
  }

  /* ---------- Energéticos (exclusivo do Copão, cada um com preço próprio) ---------- */

  async function getEnergeticos() {
    const { data, error } = await sb.from('energeticos').select('*').order('preco_adicional');
    return { data, error };
  }

  async function criarEnergetico({ nome, preco_adicional }) {
    const { data, error } = await sb.from('energeticos').insert({ nome, preco_adicional }).select().single();
    return { data, error };
  }

  async function excluirEnergetico(id) {
    const { error } = await sb.from('energeticos').delete().eq('id', id);
    return { data: !error, error };
  }

  /* =================================================================
     PEDIDOS
     Tabela Supabase: pedidos (id uuid, cliente_nome text, cep text,
     rua text, bairro text, cidade text, estado text, numero text,
     complemento text, itens jsonb, total numeric, status text,
     criado_em timestamptz)

     IMPORTANTE (mesma regra do documento de backend): em produção,
     o total do pedido deve ser RECALCULADO no servidor (Edge
     Function), nunca aceito como veio do carrinho do cliente — isso
     evita que alguém manipule o preço pelo navegador. Na demo local
     isso não se aplica (não há servidor), mas o comentário fica
     registrado para quando o Supabase entrar.
     ================================================================= */

  async function criarPedido(pedido) {
    // pedido: { tipo_entrega, cliente_nome, telefone, cep?, rua?, bairro?, cidade?, estado?,
    //           numero_casa?, complemento?, itens, valor_entrega, forma_pagamento, troco_para? }
    // tipo_entrega: 'retirada' | 'entrega' — os campos de endereço só existem
    // quando é 'entrega'; na retirada eles ficam null.
    // forma_pagamento: 'dinheiro' | 'pix' | 'debito' | 'credito'
    // NOTA DE SEGURANÇA: isso insere direto na tabela, confiando no total
    // que veio do navegador (mesmo comportamento do modo demo). Antes de
    // um lançamento de verdade, o recomendado é recalcular o total no
    // servidor via Edge Function — veja a seção 6 do INSTRUCOES-SUPABASE.md.
    // Pra testes, inserir direto já funciona normalmente.
    const ehEntrega = pedido.tipo_entrega === 'entrega';
    const subtotal = pedido.itens.reduce((soma, item) => soma + item.preco_unit * item.quantidade, 0);
    const taxaEntrega = ehEntrega ? Number(pedido.valor_entrega || 0) : 0;
    const { data, error } = await sb.from('pedidos').insert({
      cliente_nome: pedido.cliente_nome,
      telefone: pedido.telefone,
      tipo_entrega: pedido.tipo_entrega,
      cep: ehEntrega ? pedido.cep : null,
      rua: ehEntrega ? pedido.rua : null,
      bairro: ehEntrega ? pedido.bairro : null,
      cidade: ehEntrega ? pedido.cidade : null,
      estado: ehEntrega ? pedido.estado : null,
      numero_casa: ehEntrega ? pedido.numero_casa : null,
      complemento: ehEntrega ? (pedido.complemento || '') : null,
      itens: pedido.itens,
      subtotal,
      valor_entrega: taxaEntrega,
      total: subtotal + taxaEntrega,
      forma_pagamento: pedido.forma_pagamento || null,
      troco_para: pedido.forma_pagamento === 'dinheiro' ? (Number(pedido.troco_para) || null) : null,
    }).select().single();
    return { data, error };
  }

  async function getEstatisticas({ dataInicio, dataFim } = {}) {
    // Agrega pedidos num intervalo de datas: total de pedidos, valor
    // vendido e ranking de produtos mais vendidos (por quantidade).
    // dataInicio/dataFim: strings 'YYYY-MM-DD' (inclusive), opcionais.
    // Traz os pedidos e agrega no navegador (mesma lógica do modo demo) —
    // funciona bem no volume de uma loja; se o histórico crescer muito,
    // vale migrar pra uma view/RPC do Postgres que já agrega no banco.
    const { data: todosPedidos, error } = await sb.from('pedidos').select('*');
    if (error) return { data: null, error };

    let pedidos = todosPedidos;
    if (dataInicio) pedidos = pedidos.filter((p) => dataLocalDoPedido(p.criado_em) >= dataInicio);
    if (dataFim) pedidos = pedidos.filter((p) => dataLocalDoPedido(p.criado_em) <= dataFim);

    const totalPedidos = pedidos.length;
    const valorVendido = pedidos.reduce((soma, p) => soma + p.total, 0);

    const contagemProdutos = {};
    pedidos.forEach((p) => {
      p.itens.forEach((item) => {
        if (!contagemProdutos[item.nome]) contagemProdutos[item.nome] = { nome: item.nome, quantidade: 0 };
        contagemProdutos[item.nome].quantidade += item.quantidade;
      });
    });
    const produtosMaisVendidos = Object.values(contagemProdutos).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    return { data: { totalPedidos, valorVendido, produtosMaisVendidos }, error: null };
  }

  async function getPedidos() {
    // (rota protegida — só o dono da loja autenticado consegue ler, via RLS)
    const { data, error } = await sb.from('pedidos').select('*').order('criado_em', { ascending: false });
    return { data, error };
  }

  async function getPedidoPorId(id) {
    const { data, error } = await sb.from('pedidos').select('*').eq('id', id).single();
    return { data, error };
  }

  async function atualizarStatusPedido(id, status) {
    const { data, error } = await sb.from('pedidos').update({ status }).eq('id', id).select().single();
    return { data, error };
  }

  /* =================================================================
     CONFIGURAÇÕES DA LOJA
     Tabela Supabase: loja_config (linha única — id fixo, nome_loja,
     whatsapp, endereco, logo_url)
     ================================================================= */

  async function getConfigLoja() {
    const { data, error } = await sb.from('loja_config').select('*').single();
    return { data, error };
  }

  async function salvarConfigLoja(config) {
    const { data, error } = await sb.from('loja_config').update(config).eq('id', 1).select().single();
    return { data, error };
  }

  /* =================================================================
     AUTENTICAÇÃO DO PAINEL (login único do dono da loja)
     ================================================================= */

  async function login(email, senha) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    return { data, error };
  }

  async function logout() {
    await sb.auth.signOut();
  }

  async function getSessao() {
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  /* ---------------------------------------------------------------
     Exposição pública do módulo — só isso é chamado pelas páginas
     --------------------------------------------------------------- */
  return {
    getCategorias, criarCategoria, atualizarCategoria, excluirCategoria,
    getProdutos, getProdutoPorId, criarProduto, atualizarProduto, excluirProduto,
    getComboProdutos, criarComboProduto, atualizarComboProduto, excluirComboProduto,
    getCopaoProdutos, criarCopaoProduto, atualizarCopaoProduto, excluirCopaoProduto,
    getSaboresGelo, criarSaborGelo, excluirSaborGelo,
    getEnergeticos, criarEnergetico, excluirEnergetico,
    criarPedido, getPedidos, getPedidoPorId, atualizarStatusPedido, getEstatisticas,
    getConfigLoja, salvarConfigLoja,
    login, logout, getSessao,
  };
})();
