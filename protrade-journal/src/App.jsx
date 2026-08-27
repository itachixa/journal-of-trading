import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import AddTrade from './pages/AddTrade';
import Surveillance from './pages/Surveillance';
import Calculator from './pages/Calculator';
import Stats from './pages/Stats';
import Checklist from './pages/Checklist';
import Notes from './pages/Notes';
import Tags from './pages/Tags';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/auth/reset-password" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppProvider>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/trades" element={<Trades />} />
                      <Route path="/add-trade" element={<AddTrade />} />
                      <Route path="/surveillance" element={<Surveillance />} />
                      <Route path="/calculator" element={<Calculator />} />
                      <Route path="/stats" element={<Stats />} />
                      <Route path="/checklist" element={<Checklist />} />
                      <Route path="/notes" element={<Notes />} />
                      <Route path="/tags" element={<Tags />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                </AppProvider>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AuthCallback() {
  const { setMessage } = useAuth();
  useEffect(() => {
    setMessage('Connexion réussie !');
  }, [setMessage]);
  return <Navigate to="/" replace />;
}
