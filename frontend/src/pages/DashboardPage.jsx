import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { riskLevelFromCount } from '../lib/risk.js';
import { StatCard } from '../components/StatCard.jsx';
import { RiskBadge } from '../components/RiskBadge.jsx';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('households')
        .select('id,responsible_name,address,micro_area,notes,lat,lng,created_at,risk_factors(id)')
        .order('created_at', { ascending: false });

      if (!error) {
        setHouseholds(data || []);
      }
      setLoading(false);
    };

    load();
  }, []);

  const enriched = useMemo(() => {
    return households.map((household) => {
      const count = household.risk_factors ? household.risk_factors.length : 0;
      const level = riskLevelFromCount(count);
      return { ...household, riskCount: count, riskLevel: level };
    });
  }, [households]);

  const totals = useMemo(() => {
    const summary = { total: enriched.length, low: 0, medium: 0, high: 0 };
    enriched.forEach((item) => {
      summary[item.riskLevel] += 1;
    });
    return summary;
  }, [enriched]);

  const priorities = useMemo(() => {
    const high = enriched.filter((item) => item.riskLevel === 'high');
    if (high.length) return high;
    return enriched.filter((item) => item.riskLevel === 'medium');
  }, [enriched]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Painel</h2>
          <p>Visao geral dos domicilios e niveis de risco.</p>
        </div>
      </div>

      {loading ? (
        <div className="card">Carregando dados...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Total de domicilios" value={totals.total} />
            <StatCard label="Risco baixo" value={totals.low} tone="tone-low" />
            <StatCard label="Risco medio" value={totals.medium} tone="tone-medium" />
            <StatCard label="Risco alto" value={totals.high} tone="tone-high" />
          </div>

          <div className="card">
            <h3>Domicilios prioritarios</h3>
            {priorities.length === 0 ? (
              <p>Nenhum domicilio cadastrado.</p>
            ) : (
              <div className="list">
                {priorities.slice(0, 6).map((item) => (
                  <Link to={`/households/${item.id}`} key={item.id} className="list-item">
                    <div>
                      <strong>{item.responsible_name}</strong>
                      <div className="muted">{item.address}</div>
                    </div>
                    <div className="list-meta">
                      <span className="muted">{item.riskCount} fatores</span>
                      <RiskBadge level={item.riskLevel} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
