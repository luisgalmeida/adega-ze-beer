# Adega Zé Beer — como sair do modo demo e ligar no Supabase

Este projeto funciona sozinho, sem backend, porque `js/api.js` usa o
`localStorage` do navegador como um banco de dados falso. Isso é só
pra você conseguir abrir os arquivos e testar o fluxo inteiro (vitrine
→ combo/copão → cesta → pedido → painel) sem precisar configurar nada
primeiro.

Para virar um sistema de verdade, ligado ao Supabase, siga os passos
abaixo — mesmas tabelas, mesmos nomes de campo e mesma lógica que
`js/api.js` já usa no modo demo, só trocando o "onde" os dados moram.

---

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto (plano Free serve para começar).
2. Em **Project Settings → API Keys**, copie a **Project URL** e a **Publishable key** (em projetos criados até out/2025 esse campo pode aparecer como "anon public" — é a mesma coisa, só mudou o nome). Você vai usar as duas em `js/api.js`.

## 2. Criar as tabelas (SQL Editor do Supabase)

Cole isso no **SQL Editor** e rode:

```sql
create extension if not exists "uuid-ossp";

create table categorias (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  mostrar_na_vitrine boolean not null default true, -- liga/desliga o carrossel dessa categoria na home
  ordem int not null default 0,                      -- posição no menu/carrosséis — menor aparece primeiro
  criado_em timestamptz default now()
);

create table produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null check (preco >= 0),
  categoria_id uuid references categorias(id) on delete set null,
  imagem_url text,
  disponivel boolean default true,
  em_oferta boolean default false,
  preco_oferta numeric(10,2) check (preco_oferta is null or preco_oferta < preco),
  criado_em timestamptz default now()
);

-- "Ofertas do dia" não é uma categoria de verdade — é um carrossel
-- automático com todo produto que tiver em_oferta = true. O botão de
-- liga/desliga desse carrossel mora em loja_config.ofertas_do_dia_ativa.

-- ---------- Monte seu Combo ----------
create table combo_produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null check (preco >= 0),
  imagem_url text,
  disponivel boolean default true,
  criado_em timestamptz default now()
);

-- Sabores de gelo — lista compartilhada entre Combo e Copão
create table sabores_gelo (
  id uuid primary key default uuid_generate_v4(),
  nome text not null
);

-- ---------- Monte seu Copão ----------
create table copao_produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null check (preco >= 0),
  imagem_url text,
  disponivel boolean default true,
  criado_em timestamptz default now()
);

create table energeticos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  preco_adicional numeric(10,2) not null default 0
);

-- ---------- Pedidos ----------
create table pedidos (
  id uuid primary key default uuid_generate_v4(),
  numero serial,
  cliente_nome text not null,
  telefone text not null,
  tipo_entrega text not null check (tipo_entrega in ('retirada','entrega')),
  -- os campos de endereço abaixo ficam NULL quando tipo_entrega = 'retirada'
  cep text,
  rua text,
  bairro text,
  cidade text,
  estado text,
  numero_casa text,
  complemento text,
  -- cada item: { tipo: 'produto'|'combo'|'copao', produto_id, nome,
  --              detalhes, preco_unit, quantidade }
  -- "detalhes" guarda o resumo legível das escolhas (sabores de gelo,
  -- energético) — é o que aparece no painel dentro de cada linha do pedido
  itens jsonb not null,
  subtotal numeric(10,2) not null,
  valor_entrega numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  -- forma_pagamento fica NULL quando tipo_entrega = 'retirada' (o cliente
  -- combina o pagamento direto na loja, sem escolher forma no checkout)
  forma_pagamento text check (forma_pagamento in ('dinheiro','pix','debito','credito')),
  troco_para numeric(10,2), -- só usado quando forma_pagamento = 'dinheiro'
  status text not null default 'novo' check (status in ('novo','andamento','concluido','perdido')),
  -- criado_em grava a data/hora exata (do servidor) em que o pedido caiu no painel
  criado_em timestamptz default now(),
  constraint endereco_obrigatorio_na_entrega check (
    tipo_entrega = 'retirada' or (cep is not null and rua is not null and bairro is not null and cidade is not null and numero_casa is not null)
  )
);

-- ---------- Configurações da loja (linha única) ----------
create table loja_config (
  id int primary key default 1,
  nome_loja text,
  slogan text,
  whatsapp text,
  cidade_regiao text,       -- aparece na barrinha do topo da vitrine
  endereco text,
  logo_url text,
  instagram_url text,
  facebook_url text,
  valor_entrega numeric(10,2) default 0,            -- taxa somada só quando tipo_entrega = 'entrega'
  quantidade_carrosseis_vitrine int default 0,       -- 0 = mostra todas as categorias marcadas "na vitrine"
  ofertas_do_dia_ativa boolean default true,         -- liga/desliga o carrossel de Ofertas do dia
  combo_gelo_max int default 4,                      -- quantos gelos (e copos/canudos) cada combo inclui
  combo_banner_url text,     -- imagem do banner em Monte seu Combo (recomendado 1200x600px, 2:1)
  combo_texto_info text,     -- texto editável abaixo do banner do combo
  copao_banner_url text,     -- imagem do banner em Monte seu Copão (recomendado 1200x600px, 2:1)
  copao_texto_info text,     -- texto editável abaixo do banner do copão
  chave_pix text,
  whatsapp_pix text,        -- se vazio, o front usa o "whatsapp" geral como fallback
  tempo_medio_entrega text, -- texto livre, ex: "30 a 60 minutos"
  tempo_medio_retirada text,
  constraint loja_config_singleton check (id = 1)  -- garante que só existe 1 linha
);

insert into loja_config (
  id, nome_loja, slogan, whatsapp, cidade_regiao, endereco,
  valor_entrega, quantidade_carrosseis_vitrine, ofertas_do_dia_ativa,
  combo_gelo_max, chave_pix, whatsapp_pix, tempo_medio_entrega, tempo_medio_retirada
) values (
  1, 'Adega Zé Beer', 'A melhor adega da cidade', '5519999999999', 'Santa Cruz das Palmeiras - SP',
  'Rua Campos Salles, 400 - Centro, Santa Cruz das Palmeiras - SP',
  8.00, 0, true, 4, 'adegazebeer@pix.com.br', '5519999999999', '30 a 60 minutos', '15 a 25 minutos'
);
```

## 3. Ativar RLS e criar as políticas

Com RLS habilitado, cada tabela fica bloqueada por padrão até você
criar uma política liberando o acesso. Como o design prevê **login
único do dono da loja** (sem cadastro público), a regra geral é:
leitura de catálogo é pública, escrita é só para quem está autenticado
— com uma exceção: qualquer visitante pode **criar** um pedido (senão
ninguém sem login conseguiria finalizar a compra).

```sql
alter table categorias enable row level security;
alter table produtos enable row level security;
alter table combo_produtos enable row level security;
alter table copao_produtos enable row level security;
alter table sabores_gelo enable row level security;
alter table energeticos enable row level security;
alter table pedidos enable row level security;
alter table loja_config enable row level security;

-- Leitura pública em tudo que é catálogo (a vitrine não exige login)
create policy "categorias_leitura_publica" on categorias for select to anon, authenticated using (true);
create policy "produtos_leitura_publica" on produtos for select to anon, authenticated using (true);
create policy "combo_produtos_leitura_publica" on combo_produtos for select to anon, authenticated using (true);
create policy "copao_produtos_leitura_publica" on copao_produtos for select to anon, authenticated using (true);
create policy "sabores_gelo_leitura_publica" on sabores_gelo for select to anon, authenticated using (true);
create policy "energeticos_leitura_publica" on energeticos for select to anon, authenticated using (true);
create policy "config_leitura_publica" on loja_config for select to anon, authenticated using (true);

-- Escrita só pra quem está autenticado (o dono logado no painel)
create policy "categorias_escrita_autenticado" on categorias for all to authenticated using (true) with check (true);
create policy "produtos_escrita_autenticado" on produtos for all to authenticated using (true) with check (true);
create policy "combo_produtos_escrita_autenticado" on combo_produtos for all to authenticated using (true) with check (true);
create policy "copao_produtos_escrita_autenticado" on copao_produtos for all to authenticated using (true) with check (true);
create policy "sabores_gelo_escrita_autenticado" on sabores_gelo for all to authenticated using (true) with check (true);
create policy "energeticos_escrita_autenticado" on energeticos for all to authenticated using (true) with check (true);
create policy "config_escrita_autenticado" on loja_config for update to authenticated using (true) with check (true);

-- Pedidos: qualquer visitante pode CRIAR (finalizar pedido sem login),
-- mas só o dono autenticado pode LER e ATUALIZAR (status do pedido)
create policy "pedidos_criacao_publica" on pedidos for insert to anon, authenticated with check (true);
create policy "pedidos_leitura_autenticado" on pedidos for select to authenticated using (true);
create policy "pedidos_atualizacao_autenticado" on pedidos for update to authenticated using (true) with check (true);
```

> **Nota técnica:** usamos `to authenticated` / `to anon` direto na
> política (em vez de checar `auth.role()` dentro do `using`), porque
> é o jeito mais eficiente e recomendado pelo próprio Supabase — o
> Postgres já filtra a política pelo papel da conexão antes de avaliar
> a condição.

## 4. Criar o usuário único do dono da loja

Não existe cadastro público — o usuário é criado manualmente por você:

1. No painel do Supabase, vá em **Authentication → Users → Add user**.
2. Crie com o e-mail e senha reais da loja (não use os de demonstração).
3. Em `js/api.js`, a função `login()` já está pronta para trocar pelo
   bloco comentado de produção, que usa `supabase.auth.signInWithPassword`.

## 5. Configurar o bucket de imagens (Storage)

Se quiser subir fotos reais dos produtos em vez de usar URLs externas:

1. Em **Storage**, crie um bucket chamado `produtos-fotos` (pode ser público, já que as fotos aparecem na vitrine).
2. Políticas do bucket: leitura pública, e **upload liberado só para autenticado**. Como o Supabase trata upsert de arquivo como INSERT + SELECT + UPDATE juntos, crie as três políticas (não só INSERT) para o papel `authenticated`.
3. Depois de subir uma foto, use a URL pública dela no campo "URL da imagem" ao cadastrar produto, combo ou copão no painel.
4. O mesmo vale pro logo (`img/logo-adega-ze-beer.png`) e pela fonte (`fonts/Vanilla-Whale.otf`) — se for hospedar fora do Hostinger/pasta local, esses dois arquivos também precisam ir junto, ou o logo do rodapé e a fonte do cabeçalho caem em substitutos genéricos.

## 6. Recalcular o total do pedido no servidor (recomendado)

Hoje, em modo demo, `API.criarPedido()` grava o total que veio da
cesta do navegador — incluindo o preço já somado de combos (combo +
gelos) e copões (copão + energético). Em produção isso é um risco:
alguém poderia alterar qualquer um desses valores pelo DevTools antes
de enviar. O jeito correto é usar uma **Edge Function** que recebe só
os ids e escolhas (não os preços), busca cada valor real no banco e
calcula o total ali dentro:

```bash
supabase functions new criar-pedido
```

Dentro da function, para cada item do pedido:
- **produto normal**: buscar em `produtos` e usar `em_oferta ? preco_oferta : preco`.
- **combo**: buscar o preço em `combo_produtos` (os sabores de gelo não alteram o preço, só a composição do item).
- **copão**: somar `copao_produtos.preco + energeticos.preco_adicional` do energético escolhido (o gelo não altera o preço).

Se `tipo_entrega = 'entrega'`, somar o `valor_entrega` de `loja_config`.
Só então fazer o `insert` na tabela `pedidos` com o total calculado no
servidor (`criado_em` fica com o `now()` default do Postgres, que já é
a data/hora exata do servidor). O `js/api.js` já tem, comentado, o
trecho que chama essa function via `supabase.functions.invoke('criar-pedido', { body: {...} })`.

## 7. Ligar o `js/api.js` de verdade

1. Em cada arquivo HTML (vitrine e painel), adicione **antes** de `js/api.js`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
2. No topo de `js/api.js`, descomente e preencha:
   ```js
   const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
   const SUPABASE_PUBLISHABLE_KEY = 'SUA-CHAVE-PUBLISHABLE';
   const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
   ```
3. Em cada função do `API` (getCategorias, getProdutos, criarPedido, getComboProdutos...), apague o bloco `// ---------- DEMO ----------` e descomente o bloco `// ---------- PRODUÇÃO (Supabase) ----------` logo abaixo. A assinatura de cada função continua igual — nenhuma outra página do site precisa mudar.
4. Pode remover a linha `<script src="js/seed.js"></script>` de todas as páginas — ela só existe para popular o localStorage no modo demo.

## 8. Onde hospedar pra testar de graça

O frontend continua sendo só HTML/CSS/JS estático mesmo depois de ligado
ao Supabase — quem muda é só "pra onde" ele manda os dados. Isso
significa que qualquer hospedagem de arquivo estático serve, sem custo:

- **GitHub Pages** — sobe o conteúdo da pasta pra raiz de um repositório e ativa em Settings → Pages. Simples e gratuito, é o que já vínhamos usando pros testes.
- **Netlify**, **Vercel** ou **Cloudflare Pages** — alternativas igualmente gratuitas, com o adicional de deploy automático toda vez que você atualiza o repositório conectado.

A chave Publishable (ou "anon", em projetos mais antigos) foi feita
pra ficar exposta em código público — quem protege os dados é a
política de RLS que você configurou, não o sigilo da chave. Não tem
bloqueio de origem (CORS) nem nada parecido: o Supabase aceita a
chamada de qualquer domínio, incluindo o `.github.io`. A única chave
que realmente precisa ficar em segredo é a **Secret** (a que hoje
seria a `service_role`) — essa nunca entra no `js/api.js` nem em
nenhum arquivo que vá pro navegador.

## 9. Checklist antes de publicar para o cliente

- [ ] Tabelas criadas e RLS ativo em todas elas
- [ ] Usuário único do dono criado (e-mail/senha reais, não os de demo)
- [ ] Categorias reais cadastradas, com ordem e "Na vitrine" ajustados em Categorias
- [ ] Produtos reais cadastrados (com fotos e ofertas, se houver)
- [ ] Produtos de Combo + sabores de gelo + limite de gelos configurados em Combos
- [ ] Produtos de Copão + energéticos configurados em Copão
- [ ] Chave Pix e WhatsApp de recebimento configurados em Configurações
- [ ] Tempos médios de entrega/retirada e taxa de entrega salvos em Configurações
- [ ] A pasta `fonts/` (com o `Vanilla-Whale.otf`) e `img/` (com o logo) foram enviadas junto ao publicar
- [ ] Edge Function de criação de pedido publicada (`supabase functions deploy criar-pedido`)
- [ ] Teste ponta a ponta: um pedido de retirada e um de entrega, um combo e um copão, pagamento em dinheiro (com troco) e por Pix — conferindo se tudo aparece certo em Pedidos recebidos e no Dashboard
