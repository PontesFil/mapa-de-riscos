export const riskLevelFromCount = (count) => {
  if (count >= 4) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
};

export const riskLabel = (level) => {
  if (level === 'high') return 'Alto';
  if (level === 'medium') return 'Medio';
  return 'Baixo';
};

export const riskColor = (level) => {
  if (level === 'high') return '#d64545';
  if (level === 'medium') return '#f0a431';
  return '#2f9e7f';
};
