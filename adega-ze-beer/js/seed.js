/* =====================================================================
   ADEGA ZÉ BEER — DADOS DE EXEMPLO (SEED)
   =====================================================================
   Só serve pra este DEMO funcionar sem precisar de um banco real: na
   primeira vez que a página abre, se o localStorage ainda está vazio,
   este arquivo cria categorias, produtos e a configuração da loja de
   exemplo. Quando você conectar no Supabase de verdade (ver
   INSTRUCOES-SUPABASE.md), pode simplesmente parar de incluir este
   arquivo — os dados passam a vir do banco.
   ===================================================================== */

const Seed = (() => {

  const IMG = (texto) =>
    `https://placehold.co/600x600/B30A08/B30A08?text=${encodeURIComponent(' ')}`;

  // Valores padrão de loja_config — usados tanto na primeira carga quanto
  // pra "curar" navegadores que testaram uma versão anterior do sistema e
  // ficaram com a configuração faltando campos novos (ex: cidade_regiao
  // sumindo do topo da vitrine porque esse campo não existia ainda quando
  // a config foi salva da primeira vez).
  const CONFIG_PADRAO = {
    nome_loja: 'Adega Zé Beer',
    whatsapp: '5519999999999',
    endereco: 'Rua Campos Salles, 400 - Centro, Santa Cruz das Palmeiras - SP',
    cidade_regiao: 'Santa Cruz das Palmeiras - SP',
    instagram_url: 'https://instagram.com/adega_zebeer',
    facebook_url: '',
    valor_entrega: 8.00,
    quantidade_carrosseis_vitrine: 0, // 0 = mostra todas as categorias marcadas
    ofertas_do_dia_ativa: true,
    combo_gelo_max: 4,
    combo_banner_url: '',
    combo_texto_info: '',
    copao_banner_url: '',
    copao_texto_info: '',
    chave_pix: 'adegazebeer@pix.com.br',
    whatsapp_pix: '5519999999999',
    tempo_medio_entrega: '30 a 60 minutos',
    tempo_medio_retirada: '15 a 25 minutos',
  };

  // Preenche só os campos que ainda não existem na config salva — nunca
  // sobrescreve o que o dono já configurou de propósito (inclusive um
  // campo deixado em branco de propósito, tipo facebook_url).
  async function garantirConfigCompleta() {
    const { data: configAtual } = await API.getConfigLoja();
    const faltando = {};
    for (const chave in CONFIG_PADRAO) {
      if (!configAtual || !(chave in configAtual)) faltando[chave] = CONFIG_PADRAO[chave];
    }
    if (Object.keys(faltando).length > 0) await API.salvarConfigLoja(faltando);
  }

  async function garantirDadosIniciais() {
    await garantirConfigCompleta();

    const { data: categoriasExistentes } = await API.getCategorias();
    if (categoriasExistentes.length > 0) return; // catálogo já existe, não recria

    // ---------- Categorias ----------
    // Categorias mais específicas (por embalagem), como no material de
    // referência — o dono pode criar/editar do jeito que quiser depois
    const nomesCategorias = ['Cerveja Lata', 'Cerveja Long Neck', 'Cerveja 1L', 'Vinhos', 'Destilados', 'Não alcoólicos', 'Gelo & acessórios'];
    const categorias = {};
    for (const nome of nomesCategorias) {
      const { data } = await API.criarCategoria({ nome });
      categorias[nome] = data.id;
    }

    // ---------- Produtos ----------
    // "oferta" (opcional): marca o produto pra aparecer também no
    // carrossel "Ofertas do dia", com o preço antigo riscado
    const produtos = [
      // Cerveja Lata
      { nome: 'Budweiser Lata 350ml', preco: 4.50, categoria: 'Cerveja Lata', descricao: 'Lata gelada 350ml, leve e refrescante.' },
      { nome: 'Stella Artois Lata 350ml', preco: 5.90, categoria: 'Cerveja Lata', descricao: 'Cerveja premium, puro malte, lata 350ml.', oferta: 4.90 },
      { nome: 'Skol Lata 350ml', preco: 3.90, categoria: 'Cerveja Lata', descricao: 'Pilsen leve, lata 350ml.' },
      // Cerveja Long Neck
      { nome: 'Heineken Long Neck 330ml', preco: 6.90, categoria: 'Cerveja Long Neck', descricao: 'Cerveja puro malte, long neck 330ml.', oferta: 5.50 },
      { nome: 'Colorado Appia 355ml', preco: 9.90, categoria: 'Cerveja Long Neck', descricao: 'Artesanal estilo Golden Ale, notas cítricas.' },
      { nome: 'Budweiser Long Neck 330ml', preco: 5.90, categoria: 'Cerveja Long Neck', descricao: 'Long neck 330ml, sempre geladinha.' },
      // Cerveja 1L
      { nome: 'Original 1L', preco: 13.50, categoria: 'Cerveja 1L', descricao: 'Garrafa 1 litro, ótima pra dividir.' },
      { nome: 'Brahma 1L', preco: 11.90, categoria: 'Cerveja 1L', descricao: 'Garrafa retornável 1 litro.', oferta: 9.90 },
      // Vinhos
      { nome: 'Tinto Seco Reservado 750ml', preco: 34.90, categoria: 'Vinhos', descricao: 'Corpo encorpado, ideal com carnes e queijos.' },
      { nome: 'Branco Suave 750ml', preco: 28.90, categoria: 'Vinhos', descricao: 'Leve e frutado, ótimo bem gelado.' },
      { nome: 'Espumante Brut 750ml', preco: 39.90, categoria: 'Vinhos', descricao: 'Borbulhas finas, perfeito pra brindar.' },
      // Destilados
      { nome: 'Vodka Absolut 1L', preco: 69.90, categoria: 'Destilados', descricao: 'Vodka sueca tradicional, garrafa 1 litro.' },
      { nome: 'Whisky Red Label 1L', preco: 89.90, categoria: 'Destilados', descricao: 'Blended scotch whisky, garrafa 1 litro.' },
      { nome: 'Cachaça 51 965ml', preco: 14.90, categoria: 'Destilados', descricao: 'Clássica pra caipirinha de fim de semana.' },
      // Não alcoólicos
      { nome: 'Coca-Cola 2L', preco: 10.90, categoria: 'Não alcoólicos', descricao: 'Refrigerante 2 litros, garrafa retornável.' },
      { nome: 'Água Tônica 350ml', preco: 5.90, categoria: 'Não alcoólicos', descricao: 'Lata 350ml, companheira ideal do gin.' },
      // Gelo & acessórios
      { nome: 'Saco de Gelo 5kg', preco: 15.00, categoria: 'Gelo & acessórios', descricao: 'Gelo em cubos, saco de 5kg.' },
      { nome: 'Copo Americano (10un)', preco: 8.50, categoria: 'Gelo & acessórios', descricao: 'Pacote com 10 copos americanos 190ml.' },
    ];

    for (const p of produtos) {
      await API.criarProduto({
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        categoria_id: categorias[p.categoria],
        imagem_url: IMG(p.nome),
        disponivel: true,
        em_oferta: p.oferta !== undefined,
        preco_oferta: p.oferta !== undefined ? p.oferta : null,
      });
    }

    // ---------- Sabores de gelo (compartilhado entre Combo e Copão) ----------
    const nomesSabores = ['Melancia', 'Morango', 'Coco', 'Maçã Verde'];
    for (const nome of nomesSabores) {
      await API.criarSaborGelo(nome);
    }

    // ---------- Energéticos (exclusivo do Copão) ----------
    const energeticos = [
      { nome: 'Melancia', preco_adicional: 0 },
      { nome: 'Morango', preco_adicional: 10 },
      { nome: 'Coco', preco_adicional: 10 },
      { nome: 'Maçã Verde', preco_adicional: 10 },
    ];
    for (const e of energeticos) {
      await API.criarEnergetico(e);
    }

    // ---------- Produtos de Combo ----------
    // Nomeie só o conteúdo do combo (ex: "Cerveja + Whisky") — o sistema já
    // escreve "Combo de..." sozinho na frente, na cesta e no pedido
    const combos = [
      { nome: 'Cerveja + Whisky', preco: 89.90, descricao: '6 cervejas long neck + 1 whisky 1L.' },
      { nome: 'Vodka + Energético', preco: 79.90, descricao: '1 vodka 1L + 4 energéticos.' },
      { nome: 'Amigos', preco: 59.90, descricao: '12 cervejas lata + 1 saco de gelo.' },
    ];
    for (const c of combos) {
      await API.criarComboProduto({ nome: c.nome, descricao: c.descricao, preco: c.preco, imagem_url: IMG(c.nome), disponivel: true });
    }

    // ---------- Produtos de Copão ----------
    // Mesma ideia: nomeie só a bebida-base (ex: "Gin") — o sistema escreve
    // "Copão de..." sozinho na cesta e no pedido
    const copoes = [
      { nome: 'Vodka', preco: 24.90, descricao: 'Vodka + energético + gelo, no copo 770ml.' },
      { nome: 'Gin', preco: 27.90, descricao: 'Gin + energético + gelo, no copo 770ml.' },
      { nome: 'Whisky', preco: 26.90, descricao: 'Whisky + energético + gelo, no copo 770ml.' },
    ];
    for (const c of copoes) {
      await API.criarCopaoProduto({ nome: c.nome, descricao: c.descricao, preco: c.preco, imagem_url: IMG(c.nome), disponivel: true });
    }
  }

  return { garantirDadosIniciais };
})();
