import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { riskLevelFromCount } from '../lib/risk.js';
import { RiskBadge } from '../components/RiskBadge.jsx';
import { downloadJson } from '../lib/utils.js';
import { geocodeCepToLatLng, lookupCepAddress, sanitizeCep } from '../lib/geocode.js';

const emptyForm = {
  responsible_name: '',
  address: '',
  cep: '',
  address_number: '',
  address_complement: '',
  contact_phone: '',
  micro_area: '',
  notes: '',
  city: 'Fernandopolis - SP'
};

export const HouseholdsPage = () => {
  const [households, setHouseholds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  const loadHouseholds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('households')
      .select('id,responsible_name,address,cep,city,address_number,address_complement,contact_phone,micro_area,notes,lat,lng,created_at,risk_factors(id)')
      .order('created_at', { ascending: false });

    if (!error) {
      setHouseholds(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHouseholds();
  }, []);

  const enriched = useMemo(() => {
    return households.map((household) => {
      const count = household.risk_factors ? household.risk_factors.length : 0;
      const level = riskLevelFromCount(count);
      return { ...household, riskCount: count, riskLevel: level };
    });
  }, [households]);

  const filtered = useMemo(() => {
    return enriched.filter((item) => {
      if (filterArea && item.micro_area !== filterArea) return false;
      if (filterRisk && item.riskLevel !== filterRisk) return false;
      return true;
    });
  }, [enriched, filterArea, filterRisk]);

  const microAreas = useMemo(() => {
    return Array.from(new Set(enriched.map((item) => item.micro_area).filter(Boolean)));
  }, [enriched]);

  const handleCepBlur = async () => {
    const cep = sanitizeCep(form.cep);
    if (cep.length !== 8) return;

    const result = await lookupCepAddress(cep);
    if (result.error) {
      setStatus(result.error);
      return;
    }

    if (result.address) {
      setForm((prev) => ({ ...prev, address: result.address }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    const cep = sanitizeCep(form.cep);
    if (cep.length !== 8) {
      setStatus('CEP deve ter 8 numeros.');
      setSaving(false);
      return;
    }

    const geoResult = await geocodeCepToLatLng(cep);
    if (geoResult.error) {
      setStatus(`${geoResult.error}. Domicilio sera salvo sem coordenadas.`);
    }

    const payload = {
      responsible_name: form.responsible_name,
      address: form.address,
      cep,
      city: 'Fernandopolis - SP',
      address_number: form.address_number || null,
      address_complement: form.address_complement || null,
      contact_phone: form.contact_phone || null,
      micro_area: form.micro_area || null,
      notes: form.notes || null,
      lat: geoResult.lat,
      lng: geoResult.lng
    };

    if (editingId) {
      await supabase.from('households').update(payload).eq('id', editingId);
    } else {
      await supabase.from('households').insert(payload);
    }

    setForm(emptyForm);
    setEditingId(null);
    loadHouseholds();
    setSaving(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      responsible_name: item.responsible_name,
      address: item.address,
      cep: item.cep || '',
      address_number: item.address_number || '',
      address_complement: item.address_complement || '',
      contact_phone: item.contact_phone || '',
      city: item.city || 'Fernandopolis - SP',
      micro_area: item.micro_area || '',
      notes: item.notes || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este domicilio?')) return;
    await supabase.from('households').delete().eq('id', id);
    loadHouseholds();
  };

  const handleExport = () => {
    downloadJson('domicilios.json', filtered);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Domicilios</h2>
          <p>Cadastre, edite e gerencie domicilios.</p>
        </div>
        <button className="button ghost" onClick={handleExport}>Exportar JSON</button>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>{editingId ? 'Editar domicilio' : 'Novo domicilio'}</h3>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Nome do responsavel
              <input value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} required />
            </label>
            <label>
              Endereco
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </label>
            <label>
              CEP (somente numeros)
              <input
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: sanitizeCep(e.target.value) })}
                onBlur={handleCepBlur}
                maxLength={8}
                required
              />
            </label>
            <label>
              Numero
              <input value={form.address_number} onChange={(e) => setForm({ ...form, address_number: e.target.value })} />
            </label>
            <label>
              Complemento
              <input value={form.address_complement} onChange={(e) => setForm({ ...form, address_complement: e.target.value })} />
            </label>
            <label>
              Numero de contato
              <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </label>
            <div className="muted">Cidade fixa: Fernandopolis - SP</div>
            <label>
              Microarea
              <input value={form.micro_area} onChange={(e) => setForm({ ...form, micro_area: e.target.value })} />
            </label>
            <label>
              Observacoes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </label>
            {status && <div className="alert">{status}</div>}
            <div className="button-row">
              <button className="button primary" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
              </button>
              {editingId && (
                <button className="button ghost" type="button" onClick={() => {
                  setForm(emptyForm);
                  setEditingId(null);
                }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="filters">
            <label>
              Microarea
              <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                <option value="">Todos</option>
                {microAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </label>
            <label>
              Nivel de risco
              <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                <option value="">Todos</option>
                <option value="low">Baixo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p>Carregando domicilios...</p>
          ) : filtered.length === 0 ? (
            <p>Nenhum domicilio encontrado.</p>
          ) : (
            <div className="list">
              {filtered.map((item) => (
                <div key={item.id} className="list-item">
                  <div>
                    <strong>{item.responsible_name}</strong>
                    <div className="muted">{item.address}{item.address_number ? `, ${item.address_number}` : ''}</div>
                    <div className="muted">CEP: {item.cep || 'N/A'}</div>
                    <div className="muted">Contato: {item.contact_phone || 'N/A'}</div>
                    <div className="muted">Microarea: {item.micro_area || 'N/A'}</div>
                  </div>
                  <div className="list-meta">
                    <span className="muted">{item.riskCount} fatores</span>
                    <RiskBadge level={item.riskLevel} />
                    <div className="button-row">
                      <Link to={`/households/${item.id}`} className="button ghost small">Detalhes</Link>
                      <button className="button ghost small" onClick={() => handleEdit(item)}>Editar</button>
                      <button className="button ghost small" onClick={() => handleDelete(item.id)}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
