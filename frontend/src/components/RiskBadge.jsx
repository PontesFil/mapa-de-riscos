import { riskColor, riskLabel } from '../lib/risk.js';

export const RiskBadge = ({ level }) => {
  const color = riskColor(level);
  return (
    <span className="badge" style={{ background: color }}>
      {riskLabel(level)}
    </span>
  );
};
