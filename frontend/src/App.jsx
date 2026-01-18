import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession.js';
import { NavBar } from './components/NavBar.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage })));
const HouseholdsPage = lazy(() => import('./pages/HouseholdsPage.jsx').then((m) => ({ default: m.HouseholdsPage })));
const HouseholdDetailPage = lazy(() => import('./pages/HouseholdDetailPage.jsx').then((m) => ({ default: m.HouseholdDetailPage })));
const MapPage = lazy(() => import('./pages/MapPage.jsx').then((m) => ({ default: m.MapPage })));

const App = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="page"><p>Carregando...</p></div>;
  }

  return (
    <div className="app">
      {session && <NavBar />}
      <Suspense fallback={<div className="page"><p>Carregando...</p></div>}>
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
      </Suspense>
    </div>
  );
};

export default App;
