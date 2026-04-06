import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaThLarge, FaList, FaEye, FaPlusCircle, FaCalculator, 
  FaChartPie, FaCheckSquare, FaStickyNote, FaTags, FaCog,
  FaSignOutAlt, FaGlobe, FaMoon, FaSun, FaBars, FaTimes,
  FaChartLine
} from 'react-icons/fa';
import './Layout.css';

const navItems = [
  { path: '/', icon: FaThLarge, labelKey: 'dashboard' },
  { path: '/trades', icon: FaList, labelKey: 'trades' },
  { path: '/surveillance', icon: FaEye, labelKey: 'surveillance' },
  { path: '/add-trade', icon: FaPlusCircle, labelKey: 'addTrade' },
  { path: '/calculator', icon: FaCalculator, labelKey: 'calculator' },
  { path: '/stats', icon: FaChartPie, labelKey: 'stats' },
  { path: '/checklist', icon: FaCheckSquare, labelKey: 'checklist' },
  { path: '/notes', icon: FaStickyNote, labelKey: 'notes' },
  { path: '/tags', icon: FaTags, labelKey: 'tags' },
  { path: '/settings', icon: FaCog, labelKey: 'settings' }
];

export default function Layout({ children }) {
  const { t, language, toggleLanguage, toggleTheme, theme, settings } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path) => {
    const item = navItems.find(nav => nav.path === path);
    return item ? t(item.labelKey) : 'ProTrade';
  };

  return (
    <div className="app-layout">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="logo">
          <FaChartLine className="logo-icon" />
          <span>ProTrade</span>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-actions">
            <button className="action-btn" onClick={toggleLanguage} title={language === 'fr' ? 'Switch to English' : 'Passer en français'}>
              <FaGlobe />
              <span>{language.toUpperCase()}</span>
            </button>
            <button className="action-btn" onClick={toggleTheme} title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
              {theme === 'dark' ? <FaMoon /> : <FaSun />}
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className="header-title">
            <h1>{getPageTitle(location.pathname)}</h1>
          </div>

          <div className="header-actions">
            <div className="capital-display">
              <span className="capital-label">{t('capital')}</span>
              <span className="capital-value">${settings.initialCapital?.toLocaleString() || '10,000'}</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}