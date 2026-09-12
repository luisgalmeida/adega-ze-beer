/* =====================================================================
   PAINEL — CONFIGURAÇÕES DA LOJA (configuracoes.html)
   ===================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const { data: config } = await API.getConfigLoja();
  if (config) {
    document.getElementById('config-whatsapp').value = config.whatsapp || '';
    document.getElementById('config-cidade-regiao').value = config.cidade_regiao || '';
    document.getElementById('config-endereco').value = config.endereco || '';
    document.getElementById('config-instagram').value = config.instagram_url || '';
    document.getElementById('config-facebook').value = config.facebook_url || '';
    document.getElementById('config-chave-pix').value = config.chave_pix || '';
    document.getElementById('config-whatsapp-pix').value = config.whatsapp_pix || '';
    document.getElementById('config-valor-entrega').value = config.valor_entrega ?? '';
    document.getElementById('config-tempo-entrega').value = config.tempo_medio_entrega || '';
    document.getElementById('config-tempo-retirada').value = config.tempo_medio_retirada || '';
    document.getElementById('config-qtd-carrosseis').value = config.quantidade_carrosseis_vitrine ?? '';
  }

  document.getElementById('form-config').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = document.getElementById('btn-salvar-config');
    botao.disabled = true;
    botao.textContent = 'Salvando...';

    const { error } = await API.salvarConfigLoja({
      whatsapp: document.getElementById('config-whatsapp').value.trim(),
      cidade_regiao: document.getElementById('config-cidade-regiao').value.trim(),
      endereco: document.getElementById('config-endereco').value.trim(),
      instagram_url: document.getElementById('config-instagram').value.trim(),
      facebook_url: document.getElementById('config-facebook').value.trim(),
      chave_pix: document.getElementById('config-chave-pix').value.trim(),
      whatsapp_pix: document.getElementById('config-whatsapp-pix').value.trim(),
      valor_entrega: Number(document.getElementById('config-valor-entrega').value) || 0,
      tempo_medio_entrega: document.getElementById('config-tempo-entrega').value.trim(),
      tempo_medio_retirada: document.getElementById('config-tempo-retirada').value.trim(),
      quantidade_carrosseis_vitrine: Number(document.getElementById('config-qtd-carrosseis').value) || 0,
    });

    botao.disabled = false;
    botao.textContent = 'Salvar configurações';

    if (error) { mostrarToast('Não foi possível salvar.', 'erro'); return; }
    mostrarToast('Configurações salvas com sucesso.', 'sucesso');
  });
});
