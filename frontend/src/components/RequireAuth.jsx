import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession.js';

export const RequireAuth = ({ children }) => {
  const { session, loading } = useSession();

  if (loading) return <div className="page"><p>Carregando...</p></div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};
