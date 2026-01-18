import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession.js';
import { NavBar } from './components/NavBar.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { HouseholdsPage } from './pages/HouseholdsPage.jsx';
import { HouseholdDetailPage } from './pages/HouseholdDetailPage.jsx';
import { MapPage } from './pages/MapPage.jsx';

const App = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="page"><p>Carregando...</p></div>;
  }

  return (
    <div className="app">
      {session && <NavBar />}
      <Routes>
        <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/households"
          element={
            <RequireAuth>
              <HouseholdsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/households/:id"
          element={
            <RequireAuth>
              <HouseholdDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/map"
          element={
            <RequireAuth>
              <MapPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
