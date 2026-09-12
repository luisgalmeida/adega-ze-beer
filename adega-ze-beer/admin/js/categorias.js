/* =====================================================================
   PAINEL — CRUD DE CATEGORIAS (categorias.html)
   ===================================================================== */

let todasCategorias = [];

document.addEventListener('DOMContentLoaded', async () => {
  await carregarToggleOfertas();
  await carregarTabela();
  ligarModal();
});

/* ---------- Toggle "Ofertas do dia" ---------- */
async function carregarToggleOfertas() {
  const { data: config } = await API.getConfigLoja();
  renderizarToggleOfertas(config?.ofertas_do_dia_ativa !== false);
  document.getElementById('toggle-ofertas-dia').addEventListener('click', async () => {
    const ativoAtual = document.getElementById('toggle-ofertas-dia').dataset.ativo === 'true';
    const { error } = await API.salvarConfigLoja({ ofertas_do_dia_ativa: !ativoAtual });
    if (error) { mostrarToast('Não foi possível atualizar.', 'erro'); return; }
    renderizarToggleOfertas(!ativoAtual);
    mostrarToast(!ativoAtual ? 'Ofertas do dia ativadas na vitrine.' : 'Ofertas do dia escondidas da vitrine.', 'sucesso');
  });
}

function renderizarToggleOfertas(ativo) {
  const botao = document.getElementById('toggle-ofertas-dia');
  botao.dataset.ativo = ativo;
  botao.querySelector('.switch__trilho').classList.toggle('ligado', ativo);
  const rotulo = botao.querySelector('.switch__rotulo');
  rotulo.textContent = ativo ? 'Ativada' : 'Desativada';
  rotulo.classList.toggle('ligado', ativo);
  rotulo.classList.toggle('desligado', !ativo);
}

/* ---------- Tabela de categorias ---------- */
async function carregarTabela() {
  const [{ data: categorias }, { data: produtos }] = await Promise.all([API.getCategorias(), API.getProdutos({})]);
  todasCategorias = categorias;

  const corpo = document.getElementById('tabela-categorias');
  const vazio = document.getElementById('categorias-vazio');

  if (categorias.length === 0) {
    document.querySelector('.tabela-wrap').hidden = true;
    vazio.hidden = false;
    return;
  }
  document.querySelector('.tabela-wrap').hidden = false;
  vazio.hidden = true;

  corpo.innerHTML = categorias.map((c, indice) => {
    const quantidade = produtos.filter((p) => p.categoria_id === c.id).length;
    const visivel = c.mostrar_na_vitrine !== false;
    return `
      <tr class="linha-categoria" draggable="true" data-id="${c.id}">
        <td><span class="alca-arrastar" title="Arraste para reordenar"><span class="icone">${ICONS.grip}</span></span></td>
        <td>
          <div class="botoes-ordem">
            <button type="button" class="botao-ordem" data-mover="cima" data-id="${c.id}" ${indice === 0 ? 'disabled' : ''} aria-label="Mover para cima"><span class="icone">${ICONS.chevronLeft}</span></button>
            <button type="button" class="botao-ordem" data-mover="baixo" data-id="${c.id}" ${indice === categorias.length - 1 ? 'disabled' : ''} aria-label="Mover para baixo"><span class="icone">${ICONS.chevronRight}</span></button>
          </div>
        </td>
        <td>${c.nome}</td>
        <td>${quantidade} produto${quantidade === 1 ? '' : 's'}</td>
        <td>
          <button type="button" class="selo-status selo-status--${visivel ? 'disponivel' : 'indisponivel'}" data-acao="alternar-vitrine" data-id="${c.id}" style="border:none;cursor:pointer;" title="Clique para ${visivel ? 'esconder da' : 'mostrar na'} vitrine">
            ${visivel ? 'Sim' : 'Não'}
          </button>
        </td>
        <td class="tabela__acoes"><div class="tabela__acoes-grupo">
          <button class="tabela__link-acao" data-acao="editar" data-id="${c.id}">Editar</button>
          <button class="tabela__link-acao tabela__link-acao--excluir" data-acao="excluir" data-id="${c.id}" data-nome="${c.nome}" data-qtd="${quantidade}">Excluir</button>
        </div></td>
      </tr>
    `;
  }).join('');

  corpo.querySelectorAll('[data-acao="editar"]').forEach((b) => b.addEventListener('click', () => abrirModalEdicao(b.dataset.id)));
  corpo.querySelectorAll('[data-acao="excluir"]').forEach((b) => b.addEventListener('click', () => excluirCategoria(b.dataset.id, b.dataset.nome, Number(b.dataset.qtd))));
  corpo.querySelectorAll('[data-acao="alternar-vitrine"]').forEach((b) => b.addEventListener('click', () => alternarVisibilidade(b.dataset.id)));
  corpo.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => moverCategoria(b.dataset.id, b.dataset.mover)));

  // as setas usam os ícones de seta esquerda/direita rotacionados 90° pra apontar pra cima/baixo
  corpo.querySelectorAll('.botao-ordem .icone').forEach((el) => (el.style.transform = 'rotate(90deg)'));

  ligarArrastarSoltar(corpo);
}

/* ---------- Arrastar e soltar (reordenar) ---------- */
function ligarArrastarSoltar(corpo) {
  let linhaArrastada = null;

  corpo.querySelectorAll('tr.linha-categoria').forEach((linha) => {
    linha.addEventListener('dragstart', () => {
      linhaArrastada = linha;
      // pequeno atraso pra classe não sumir o "ghost" que o navegador tira antes de arrastar
      setTimeout(() => linha.classList.add('arrastando'), 0);
    });

    linha.addEventListener('dragend', () => {
      linha.classList.remove('arrastando');
      corpo.querySelectorAll('tr').forEach((l) => l.classList.remove('sobre-linha'));
    });

    linha.addEventListener('dragover', (evento) => {
      evento.preventDefault();
      if (linha !== linhaArrastada) linha.classList.add('sobre-linha');
    });

    linha.addEventListener('dragleave', () => linha.classList.remove('sobre-linha'));

    linha.addEventListener('drop', async (evento) => {
      evento.preventDefault();
      linha.classList.remove('sobre-linha');
      if (!linhaArrastada || linha === linhaArrastada) return;

      const idArrastado = linhaArrastada.dataset.id;
      const idAlvo = linha.dataset.id;
      await reordenarPorArraste(idArrastado, idAlvo);
    });
  });
}

// Move a categoria arrastada pra posição imediatamente antes da categoria-alvo
// (onde a linha foi solta) e regrava a "ordem" de todo mundo, em sequência.
async function reordenarPorArraste(idArrastado, idAlvo) {
  const lista = [...todasCategorias];
  const indiceOrigem = lista.findIndex((c) => c.id === idArrastado);
  const indiceDestino = lista.findIndex((c) => c.id === idAlvo);
  if (indiceOrigem === -1 || indiceDestino === -1) return;

  const [item] = lista.splice(indiceOrigem, 1);
  lista.splice(indiceDestino, 0, item);

  await Promise.all(lista.map((categoria, indice) => API.atualizarCategoria(categoria.id, { ordem: indice })));
  carregarTabela();
}

// Troca a "ordem" desta categoria com a vizinha (cima = com a anterior, baixo = com a próxima)
async function moverCategoria(id, direcao) {
  const indice = todasCategorias.findIndex((c) => c.id === id);
  const indiceVizinho = direcao === 'cima' ? indice - 1 : indice + 1;
  if (indiceVizinho < 0 || indiceVizinho >= todasCategorias.length) return;

  const atual = todasCategorias[indice];
  const vizinho = todasCategorias[indiceVizinho];
  const ordemAtual = atual.ordem ?? indice;
  const ordemVizinho = vizinho.ordem ?? indiceVizinho;

  await Promise.all([
    API.atualizarCategoria(atual.id, { ordem: ordemVizinho }),
    API.atualizarCategoria(vizinho.id, { ordem: ordemAtual }),
  ]);
  carregarTabela();
}

async function alternarVisibilidade(id) {
  const categoria = todasCategorias.find((c) => c.id === id);
  if (!categoria) return;
  const novoValor = !(categoria.mostrar_na_vitrine !== false);
  const { error } = await API.atualizarCategoria(id, { mostrar_na_vitrine: novoValor });
  if (error) { mostrarToast('Não foi possível atualizar.', 'erro'); return; }
  mostrarToast(novoValor ? `"${categoria.nome}" agora aparece na vitrine.` : `"${categoria.nome}" foi escondida da vitrine.`, 'sucesso');
  carregarTabela();
}

function ligarModal() {
  const modal = document.getElementById('modal-categoria');
  document.getElementById('btn-nova-categoria').addEventListener('click', abrirModalNova);
  document.getElementById('fechar-modal-categoria').addEventListener('click', fecharModal);
  document.getElementById('cancelar-modal-categoria').addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => { if (evento.target === modal) fecharModal(); });
  document.getElementById('form-categoria').addEventListener('submit', salvarCategoria);
}

function abrirModalNova() {
  document.getElementById('modal-categoria-titulo').textContent = 'Nova categoria';
  document.getElementById('categoria-id').value = '';
  document.getElementById('categoria-nome').value = '';
  document.getElementById('categoria-mostrar-vitrine').checked = true;
  document.getElementById('modal-categoria').classList.add('aberto');
}

function abrirModalEdicao(id) {
  const categoria = todasCategorias.find((c) => c.id === id);
  if (!categoria) return;
  document.getElementById('modal-categoria-titulo').textContent = 'Editar categoria';
  document.getElementById('categoria-id').value = categoria.id;
  document.getElementById('categoria-nome').value = categoria.nome;
  document.getElementById('categoria-mostrar-vitrine').checked = categoria.mostrar_na_vitrine !== false;
  document.getElementById('modal-categoria').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal-categoria').classList.remove('aberto');
}

async function salvarCategoria(evento) {
  evento.preventDefault();
  const id = document.getElementById('categoria-id').value;
  const nome = document.getElementById('categoria-nome').value.trim();
  const mostrarNaVitrine = document.getElementById('categoria-mostrar-vitrine').checked;

  const { error } = id
    ? await API.atualizarCategoria(id, { nome, mostrar_na_vitrine: mostrarNaVitrine })
    : await API.criarCategoria({ nome, mostrar_na_vitrine: mostrarNaVitrine });

  if (error) { mostrarToast('Não foi possível salvar a categoria.', 'erro'); return; }
  mostrarToast('Categoria salva com sucesso.', 'sucesso');
  fecharModal();
  carregarTabela();
}

async function excluirCategoria(id, nome, quantidadeProdutos) {
  if (quantidadeProdutos > 0) {
    mostrarToast(`"${nome}" tem ${quantidadeProdutos} produto(s). Mova-os para outra categoria antes de excluir.`, 'erro');
    return;
  }
  if (!confirm(`Excluir a categoria "${nome}"?`)) return;
  const { error } = await API.excluirCategoria(id);
  if (error) { mostrarToast('Não foi possível excluir a categoria.', 'erro'); return; }
  mostrarToast('Categoria excluída.', 'sucesso');
  carregarTabela();
}
