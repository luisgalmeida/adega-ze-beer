# Como mexer no design sem quebrar o sistema

Você entende de HTML/CSS, então o problema não é falta de conhecimento —
é que esse projeto mistura duas coisas que *parecem* a mesma coisa mas
não são: **como algo se parece** (CSS) e **como o JavaScript encontra
esse algo pra fazer funcionar** (`id`, `class` e `data-*` usados como
"ganchos"). Quando você renomeia um `id` ou apaga uma `<div>` que achou
que era só decorativa, o JavaScript que dependia dela para de achar o
elemento, dá erro, e — pior — um erro de JavaScript pode travar o
**arquivo inteiro**, não só a parte que você mexeu.

## O modelo mental: 3 níveis de risco

**Nível 1 — 100% seguro, pode mexer à vontade:**
Tudo dentro de `css/style.css` e `css/admin.css`. Cores, fontes,
espaçamento, bordas, sombras, tamanhos, layout com flex/grid dentro de
uma regra CSS. O JavaScript nunca lê CSS — só lê `id`, `class` e
`data-*` no HTML. Editar `:root { --cor-primaria: ... }` no topo do
`style.css`, por exemplo, muda a cor em tudo, sem nenhum risco.

**Nível 2 — seguro com atenção:**
Texto e conteúdo dentro do HTML estático — trocar uma frase, adicionar
uma `<div>` nova só pra estilizar, reordenar blocos que não têm
`id`/`data-*`. Só tome cuidado pra não apagar sem querer uma tag que
tem `id="..."` ou `data-...="..."` junto.

**Nível 3 — risco real, peça ajuda ou teste com calma:**
Qualquer arquivo `.js` (tanto em `js/` quanto em `admin/js/`), e
qualquer `id`/`data-*` dentro dos arquivos HTML. Isso é o "esqueleto"
funcional — cesta, carrosséis, combo/copão, modais, formulários,
login. Uma vírgula ou aspas fora do lugar dentro de um `.js` já quebra
o arquivo inteiro.

## Fluxo recomendado

1. **Comece só pelo CSS.** Abra `css/style.css`, ache o bloco `:root`
   (bem no topo) e troque as variáveis de cor/fonte/espaçamento. Salve,
   dê F5. Isso já muda a cara do site inteiro sem tocar em HTML ou JS.
2. **Depois vá pros componentes.** O `style.css` está organizado em
   seções numeradas com comentário (ex: `/* ---------- 7. CARTÃO DE
   PRODUTO ---------- */`). Ache a seção do que você quer mudar
   visualmente e edite as propriedades ali — ainda é 100% CSS.
3. **Se quiser mudar estrutura** numa página estática, abra o DevTools
   do navegador (F12) **antes** de editar e confira se o elemento tem
   algum `id="..."` ou `data-...`. Se tiver, ele provavelmente está na
   tabela abaixo — deixe esse atributo específico intacto.
4. **Se quebrar algo,** abra o Console do DevTools (F12 → aba
   Console). A primeira pergunta útil é: "o site inteiro sumiu, ou só
   um pedaço específico não aparece?" — isso já indica se é um erro de
   sintaxe (arquivo inteiro) ou um `id`/`data-*` específico que sumiu.
5. **Se o que você quer é uma reforma grande**, me descreve o que você
   quer (ou manda uma imagem de referência) e eu faço a alteração
   garantindo que os ganchos do JS continuem batendo.

## Referência: o que cada arquivo JS depende (não renomeie isso)

*Nota: `data-algo-assim="valor"` no HTML e `dataset.algoAssim` no
JavaScript são a mesma coisa — o JS converte automaticamente o
formato com hífen pro formato camelCase.*

### `admin/js/categorias.js`
IDs: `btn-nova-categoria`, `cancelar-modal-categoria`, `categoria-id`, `categoria-mostrar-vitrine`, `categoria-nome`, `categorias-vazio`, `fechar-modal-categoria`, `form-categoria`, `modal-categoria`, `modal-categoria-titulo`, `tabela-categorias`, `toggle-ofertas-dia`
data-*: `acao`, `ativo`, `id`, `mover`, `nome`, `qtd`

### `admin/js/combos.js`
IDs: `btn-novo-combo`, `btn-salvar-gelo-max`, `cancelar-modal-combo`, `combo-banner-url`, `combo-descricao`, `combo-disponivel`, `combo-gelo-max`, `combo-id`, `combo-imagem`, `combo-nome`, `combo-preco`, `combos-vazio`, `fechar-modal-combo`, `form-combo`, `form-sabor`, `lista-sabores`, `modal-combo`, `modal-combo-titulo`, `novo-sabor-nome`, `tabela-combos`
data-*: `acao`, `id`, `nome`

### `admin/js/configuracoes.js`
IDs: `btn-salvar-config`, `config-chave-pix`, `config-cidade-regiao`, `config-endereco`, `config-facebook`, `config-instagram`, `config-logo`, `config-nome`, `config-qtd-carrosseis`, `config-slogan`, `config-tempo-entrega`, `config-tempo-retirada`, `config-valor-entrega`, `config-whatsapp`, `config-whatsapp-pix`, `form-config`

### `admin/js/copao.js`
IDs: `btn-novo-copao`, `btn-salvar-banner-copao`, `cancelar-modal-copao`, `copao-banner-url`, `copao-descricao`, `copao-disponivel`, `copao-id`, `copao-imagem`, `copao-nome`, `copao-preco`, `copoes-vazio`, `fechar-modal-copao`, `form-copao`, `form-energetico`, `lista-energeticos`, `lista-sabores-leitura`, `modal-copao`, `modal-copao-titulo`, `novo-energetico-nome`, `novo-energetico-preco`, `tabela-copoes`
data-*: `acao`, `id`, `nome`

### `admin/js/dashboard.js`
IDs: `ind-pedidos-periodo`, `ind-produtos-ativos`, `ind-ticket-medio`, `ind-valor-vendido`, `lista-ranking-produtos`, `lista-status-pedidos`, `periodo-fim`, `periodo-inicio`, `ranking-vazio`
data-*: `preset`

### `admin/js/login.js`
IDs: `btn-entrar`, `campo-email`, `campo-senha`, `form-login`, `mensagem-erro`

### `admin/js/painel-comum.js`
IDs: `btn-sair`, `painel-usuario`

### `admin/js/pedidos.js`
IDs: `detalhe-endereco-pedido`, `detalhe-entrega-linha`, `detalhe-entrega-pedido`, `detalhe-itens-pedido`, `detalhe-meta-pedido`, `detalhe-subtotal-pedido`, `detalhe-total-pedido`, `fechar-modal-pedido`, `fechar-modal-pedido-2`, `filtro-data-pedidos`, `limpar-filtro-data`, `modal-pedido`, `modal-pedido-titulo`, `pedidos-vazio`, `salvar-status-pedido`, `select-status-pedido`, `tabela-pedidos`
data-*: `filtroStatus`, `id`

### `admin/js/produtos.js`
IDs: `bloco-promocao`, `btn-novo-produto`, `busca-produtos`, `cancelar-modal-produto`, `fechar-modal-produto`, `form-produto`, `modal-produto`, `modal-produto-titulo`, `produto-categoria`, `produto-descricao`, `produto-disponivel`, `produto-em-oferta`, `produto-id`, `produto-imagem`, `produto-nome`, `produto-preco`, `produto-preco-oferta`, `produtos-vazio`, `salvar-produto`, `tabela-produtos`
data-*: `acao`, `id`

### `js/carrinho.js`
IDs: `carrinho-vazio`, `lista-itens-carrinho`, `miolo-carrinho`, `resumo-subtotal`, `resumo-total`, `rodape-endereco`, `rodape-instagram-link`, `rodape-whatsapp-link`, `rodape-whatsapp-texto`, `topbar-cidade`
data-*: `acao`, `linha-id`

### `js/carrossel.js`
data-*: `carrossel-seta`

### `js/cart.js`
IDs: `btn-flutuante-cesta`

### `js/catalogo.js`
IDs: `banner-combo-home`, `banner-copao-home`, `btn-limpar-busca`, `campo-busca-input`, `carrosseis-lista`, `carrosseis-skeleton`, `carrosseis-vazio`, `pista-ofertas`, `rodape-endereco`, `rodape-instagram-link`, `rodape-instagram-texto`, `rodape-whatsapp-link`, `rodape-whatsapp-texto`, `secao-combo`, `secao-copao`, `secao-ofertas`, `topbar-cidade`
data-*: `adicionar-id`, `adicionarId`, `carrossel-seta`

### `js/finalizar.js`
IDs: `aviso-pagamento`, `bloco-endereco`, `bloco-pix`, `btn-confirmar-pedido`, `campo-bairro`, `campo-cep`, `campo-complemento`, `campo-nome`, `campo-numero`, `campo-rua`, `campo-telefone`, `campo-troco`, `campo-troco-calculo`, `campo-troco-para`, `erro-pagamento`, `finalizar-vazio`, `form-pedido`, `miolo-finalizar`, `pix-chave`, `pix-whatsapp-link`, `resumo-itens-finalizar`, `resumo-linha-entrega`, `resumo-subtotal-finalizar`, `resumo-taxa-entrega`, `resumo-total-finalizar`, `rodape-endereco`, `rodape-instagram-link`, `rodape-whatsapp-link`, `rodape-whatsapp-texto`, `texto-taxa-entrega`, `topbar-cidade`
data-*: `cidade`, `estado`, `opcao`

### `js/icons.js`
data-*: `icone`

### `js/montar-combo.js`
IDs: `btn-continuar-comprando`, `btn-finalizar-pedido`, `caixa-info-combo`, `carregando-combo`, `combo-vazio`, `contador-sabores`, `conteudo-combo`, `lista-sabores`, `pista-combos`, `titulo-sabores`, `topbar-cidade`
data-*: `acao`, `combo-id`, `comboId`, `sabor-id`, `saborId`

### `js/montar-copao.js`
IDs: `btn-continuar-comprando`, `btn-finalizar-pedido`, `carregando-copao`, `conteudo-copao`, `copao-vazio`, `lista-energeticos`, `lista-gelos-copao`, `pista-copoes`, `topbar-cidade`
data-*: `copao-id`, `copaoId`

## Qual JS pertence a qual página

| Página | Scripts que ela carrega |
|---|---|
| `index.html` | `icons.js`, `api.js`, `seed.js`, `cart.js`, `toast.js`, `carrossel.js`, `catalogo.js` |
| `carrinho.html` | `icons.js`, `api.js`, `cart.js`, `toast.js`, `carrinho.js` |
| `montar-combo.html` | `icons.js`, `api.js`, `seed.js`, `cart.js`, `toast.js`, `montar-combo.js` |
| `montar-copao.html` | `icons.js`, `api.js`, `seed.js`, `cart.js`, `toast.js`, `montar-copao.js` |
| `finalizar-pedido.html` | `icons.js`, `api.js`, `cart.js`, `toast.js`, `viacep.js`, `finalizar.js` |
| `pedido-confirmado.html` | `icons.js`, `api.js` (script inline no próprio HTML) |
| `admin/login.html` | `icons.js`, `api.js`, `login.js` |
| `admin/pedidos.html` | `icons.js`, `api.js`, `seed.js`, `auth-guard.js`, `painel-comum.js`, `pedidos.js` |
| `admin/dashboard.html` | idem acima (auth-guard/painel-comum) + `dashboard.js` |
| `admin/produtos.html` | idem acima + `produtos.js` |
| `admin/categorias.html` | idem acima + `categorias.js` |
| `admin/combos.html` | idem acima + `combos.js` |
| `admin/copao.html` | idem acima + `copao.js` |
| `admin/configuracoes.html` | idem acima + `configuracoes.js` (inclui os campos de Recebimentos) |

`auth-guard.js` e `painel-comum.js` (menu, botão Sair) se repetem em
toda página do painel — os `id`s `btn-sair` e `painel-usuario` existem
em todas elas. Não existe mais `admin/recebimentos.html` — esses campos
(chave Pix, WhatsApp) agora vivem dentro de `admin/configuracoes.html`.
