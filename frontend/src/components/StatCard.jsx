export const StatCard = ({ label, value, tone }) => (
  <div className={`card stat ${tone || ''}`.trim()}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);
