/* =====================================================================
   ADEGA ZÉ BEER — AUTOPREENCHIMENTO DE ENDEREÇO (ViaCEP)
   =====================================================================
   API pública e gratuita do ViaCEP: a partir do CEP, devolve rua,
   bairro, cidade e estado — exatamente como previsto no System
   Design ("CEP com autopreenchimento via ViaCEP"). Número e
   complemento continuam manuais, porque o CEP não sabe o número
   da casa.
   ===================================================================== */

async function buscarEnderecoPorCep(cepDigitado) {
  const cep = cepDigitado.replace(/\D/g, ''); // mantém só os dígitos
  if (cep.length !== 8) {
    return { data: null, error: { message: 'CEP precisa ter 8 dígitos' } };
  }
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const json = await resposta.json();
    if (json.erro) {
      return { data: null, error: { message: 'CEP não encontrado' } };
    }
    return {
      data: {
        rua: json.logradouro,
        bairro: json.bairro,
        cidade: json.localidade,
        estado: json.uf,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: { message: 'Não foi possível consultar o CEP agora. Tente novamente.' } };
  }
}
