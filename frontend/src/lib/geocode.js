const VIA_CEP_BASE = 'https://viacep.com.br/ws';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

export const sanitizeCep = (value) => (value || '').replace(/\D/g, '');

export const geocodeCepToLatLng = async (cep) => {
  const cleanCep = sanitizeCep(cep);
  if (cleanCep.length !== 8) {
    return { lat: null, lng: null, error: 'CEP invalido' };
  }

  try {
    const viaCepResponse = await fetch(`${VIA_CEP_BASE}/${cleanCep}/json/`);
    if (!viaCepResponse.ok) {
      return { lat: null, lng: null, error: 'Falha ao consultar CEP' };
    }

    const viaCepData = await viaCepResponse.json();
    if (viaCepData.erro) {
      return { lat: null, lng: null, error: 'CEP nao encontrado' };
    }

    const street = viaCepData.logradouro || '';
    const neighborhood = viaCepData.bairro || '';
    const city = viaCepData.localidade || 'Fernandopolis';
    const state = viaCepData.uf || 'SP';
    const query = [street, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ');

    const nominatimUrl = `${NOMINATIM_BASE}?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const nominatimResponse = await fetch(nominatimUrl);
    if (!nominatimResponse.ok) {
      return { lat: null, lng: null, error: 'Falha ao geocodificar o CEP' };
    }

    const nominatimData = await nominatimResponse.json();
    if (!Array.isArray(nominatimData) || nominatimData.length === 0) {
      return { lat: null, lng: null, error: 'Coordenadas nao encontradas' };
    }

    return {
      lat: Number(nominatimData[0].lat),
      lng: Number(nominatimData[0].lon),
      error: null
    };
  } catch (err) {
    return { lat: null, lng: null, error: 'Erro ao consultar CEP' };
  }
};

export const lookupCepAddress = async (cep) => {
  const cleanCep = sanitizeCep(cep);
  if (cleanCep.length !== 8) {
    return { address: '', neighborhood: '', error: 'CEP invalido' };
  }

  try {
    const response = await fetch(`${VIA_CEP_BASE}/${cleanCep}/json/`);
    if (!response.ok) {
      return { address: '', neighborhood: '', error: 'Falha ao consultar CEP' };
    }
    const data = await response.json();
    if (data.erro) {
      return { address: '', neighborhood: '', error: 'CEP nao encontrado' };
    }
    return {
      address: data.logradouro || '',
      neighborhood: data.bairro || '',
      error: null
    };
  } catch (err) {
    return { address: '', neighborhood: '', error: 'Erro ao consultar CEP' };
  }
};
