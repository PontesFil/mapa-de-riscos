import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { riskLevelFromCount } from '../lib/risk.js';
import { RiskBadge } from '../components/RiskBadge.jsx';

const factorOptions = [
  'Agua parada',
  'Presenca de animais',
  'Falta de saneamento',
  'Lixo acumulado',
  'Outro'
];

export const HouseholdDetailPage = () => {
  const { id } = useParams();
  const [household, setHousehold] = useState(null);
  const [factors, setFactors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [factorForm, setFactorForm] = useState({ factor_type: factorOptions[0], notes: '', recorded_at: '' });
  const [visitForm, setVisitForm] = useState({ visit_date: '', notes: '' });
  const [residentForm, setResidentForm] = useState({ full_name: '', age: '', notes: '' });

  const loadData = async () => {
    const { data: householdData } = await supabase
      .from('households')
      .select('id,responsible_name,address,cep,city,address_number,address_complement,contact_phone,micro_area,notes,lat,lng,created_at')
      .eq('id', id)
      .single();

    const { data: factorData } = await supabase
      .from('risk_factors')
      .select('id,factor_type,notes,recorded_at,created_at')
      .eq('household_id', id)
      .order('recorded_at', { ascending: false });

    const { data: visitData } = await supabase
      .from('visits')
      .select('id,visit_date,notes,created_at')
      .eq('household_id', id)
      .order('visit_date', { ascending: false });

    const { data: residentData } = await supabase
      .from('residents')
      .select('id,full_name,age,notes,created_at')
      .eq('household_id', id)
      .order('created_at', { ascending: false });

    setHousehold(householdData || null);
    setFactors(factorData || []);
    setVisits(visitData || []);
    setResidents(residentData || []);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const riskLevel = useMemo(() => {
    return riskLevelFromCount(factors.length);
  }, [factors]);

  const handleAddFactor = async (event) => {
    event.preventDefault();
    const payload = {
      household_id: id,
      factor_type: factorForm.factor_type,
      notes: factorForm.notes || null,
      recorded_at: factorForm.recorded_at || null
    };
    await supabase.from('risk_factors').insert(payload);
    setFactorForm({ factor_type: factorOptions[0], notes: '', recorded_at: '' });
    loadData();
  };

  const handleDeleteFactor = async (factorId) => {
    await supabase.from('risk_factors').delete().eq('id', factorId);
    loadData();
  };

  const handleAddVisit = async (event) => {
    event.preventDefault();
    const payload = {
      household_id: id,
      visit_date: visitForm.visit_date || null,
      notes: visitForm.notes || null
    };
    await supabase.from('visits').insert(payload);
    setVisitForm({ visit_date: '', notes: '' });
    loadData();
  };

  const handleDeleteVisit = async (visitId) => {
    await supabase.from('visits').delete().eq('id', visitId);
    loadData();
  };

  const handleAddResident = async (event) => {
    event.preventDefault();
    const payload = {
      household_id: id,
      full_name: residentForm.full_name,
      age: residentForm.age ? Number(residentForm.age) : null,
      notes: residentForm.notes || null
    };
    await supabase.from('residents').insert(payload);
    setResidentForm({ full_name: '', age: '', notes: '' });
    loadData();
  };

  const handleDeleteResident = async (residentId) => {
    await supabase.from('residents').delete().eq('id', residentId);
    loadData();
  };

  if (!household) {
    return (
      <div className="page">
        <div className="card">Carregando domicilio...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{household.responsible_name}</h2>
          <p>
            {household.address}
            {household.address_number ? `, ${household.address_number}` : ''}
            {household.address_complement ? ` - ${household.address_complement}` : ''}
          </p>
          <p className="muted">CEP: {household.cep || 'N/A'} | {household.city || 'Fernandopolis - SP'}</p>
          <p className="muted">Contato: {household.contact_phone || 'N/A'}</p>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Fatores de risco</h3>
          <form onSubmit={handleAddFactor} className="form">
            <label>
              Tipo de fator
              <select value={factorForm.factor_type} onChange={(e) => setFactorForm({ ...factorForm, factor_type: e.target.value })}>
                {factorOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Data do registro
              <input type="date" value={factorForm.recorded_at} onChange={(e) => setFactorForm({ ...factorForm, recorded_at: e.target.value })} />
            </label>
            <label>
              Observacoes
              <textarea rows={3} value={factorForm.notes} onChange={(e) => setFactorForm({ ...factorForm, notes: e.target.value })} />
            </label>
            <button className="button primary" type="submit">Adicionar fator</button>
          </form>

          {factors.length === 0 ? (
            <p>Nenhum fator registrado.</p>
          ) : (
            <div className="list">
              {factors.map((factor) => (
                <div key={factor.id} className="list-item">
                  <div>
                    <strong>{factor.factor_type}</strong>
                    <div className="muted">{factor.notes || 'Sem observacoes'}</div>
                    <div className="muted">Data: {factor.recorded_at}</div>
                  </div>
                  <button className="button ghost small" onClick={() => handleDeleteFactor(factor.id)}>Excluir</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Historico de visitas</h3>
          <form onSubmit={handleAddVisit} className="form">
            <label>
              Data da visita
              <input type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} />
            </label>
            <label>
              Observacoes
              <textarea rows={3} value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} />
            </label>
            <button className="button primary" type="submit">Adicionar visita</button>
          </form>

          {visits.length === 0 ? (
            <p>Nenhuma visita registrada.</p>
          ) : (
            <div className="list">
              {visits.map((visit) => (
                <div key={visit.id} className="list-item">
                  <div>
                    <strong>{visit.visit_date}</strong>
                    <div className="muted">{visit.notes || 'Sem observacoes'}</div>
                  </div>
                  <button className="button ghost small" onClick={() => handleDeleteVisit(visit.id)}>Excluir</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Moradores</h3>
          <form onSubmit={handleAddResident} className="form">
            <label>
              Nome completo
              <input
                value={residentForm.full_name}
                onChange={(e) => setResidentForm({ ...residentForm, full_name: e.target.value })}
                required
              />
            </label>
            <label>
              Idade
              <input
                type="number"
                min="0"
                value={residentForm.age}
                onChange={(e) => setResidentForm({ ...residentForm, age: e.target.value })}
              />
            </label>
            <label>
              Observacoes
              <textarea
                rows={3}
                value={residentForm.notes}
                onChange={(e) => setResidentForm({ ...residentForm, notes: e.target.value })}
              />
            </label>
            <button className="button primary" type="submit">Adicionar morador</button>
          </form>

          {residents.length === 0 ? (
            <p>Nenhum morador cadastrado.</p>
          ) : (
            <div className="list">
              {residents.map((resident) => (
                <div key={resident.id} className="list-item">
                  <div>
                    <strong>{resident.full_name}</strong>
                    <div className="muted">Idade: {resident.age ?? 'N/A'}</div>
                    <div className="muted">{resident.notes || 'Sem observacoes'}</div>
                  </div>
                  <button className="button ghost small" onClick={() => handleDeleteResident(resident.id)}>Excluir</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
