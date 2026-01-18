import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient.js';
import { riskColor, riskLevelFromCount } from '../lib/risk.js';

const makeIcon = (color) => {
  return L.divIcon({
    className: 'risk-marker',
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18]
  });
};

export const MapPage = () => {
  const [households, setHouseholds] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('households')
        .select('id,responsible_name,address,cep,city,micro_area,lat,lng,risk_factors(id)');
      setHouseholds(data || []);
    };
    load();
  }, []);

  const withRisk = useMemo(() => {
    return households.map((item) => {
      const count = item.risk_factors ? item.risk_factors.length : 0;
      const level = riskLevelFromCount(count);
      return { ...item, riskLevel: level, riskCount: count };
    });
  }, [households]);

  const mappable = withRisk.filter((item) => item.lat && item.lng);

  const center = mappable.length
    ? [Number(mappable[0].lat), Number(mappable[0].lng)]
    : [-20.2839, -50.2471];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Mapa</h2>
          <p>Domicilios por nivel de risco.</p>
        </div>
        <div className="legend">
          <span><i style={{ background: riskColor('low') }}></i>Baixo</span>
          <span><i style={{ background: riskColor('medium') }}></i>Medio</span>
          <span><i style={{ background: riskColor('high') }}></i>Alto</span>
        </div>
      </div>

      <div className="card map-card">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="map">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mappable.map((item) => (
            <Marker
              key={item.id}
              position={[Number(item.lat), Number(item.lng)]}
              icon={makeIcon(riskColor(item.riskLevel))}
            >
              <Popup>
                <strong>{item.responsible_name}</strong>
                <div>{item.address}</div>
                <div>CEP: {item.cep || 'N/A'}</div>
                <div>Fatores de risco: {item.riskCount}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
