import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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
import './styles/global.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AppProvider>
  );
}