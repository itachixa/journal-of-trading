import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { FaPalette, FaDesktop, FaServer, FaCircle, FaCheckCircle } from 'react-icons/fa';
import './Settings.css';

export default function Settings() {
  const { t, settings, updateSettings, trades, notes, tags, surveillances, deleteTrade, deleteNote, deleteTag, deleteSurveillance, themeStyle, setThemeStyle } = useApp();
  const [capital, setCapital] = useState(settings.initialCapital || 10000);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [themeStyleState, setThemeStyleState] = useState(themeStyle || 'classic');
  const [defaultRisk, setDefaultRisk] = useState(settings.defaultRisk || 2);
  const [device, setDevice] = useState(settings.device || 'desktop');
  const [currency, setCurrency] = useState(settings.currency || 'EUR');
  const [language, setLanguage] = useState(settings.language || 'fr');
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setCapital(settings.initialCapital || 10000);
    setTheme(settings.theme || 'dark');
    setThemeStyleState(themeStyle || 'classic');
    setDefaultRisk(settings.defaultRisk || 2);
    setDevice(settings.device || 'desktop');
    setCurrency(settings.currency || 'EUR');
    setLanguage(settings.language || 'fr');
  }, [settings.initialCapital, settings.theme, settings.defaultRisk, settings.device, settings.currency, settings.language, themeStyle]);

  const handleSave = async () => {
    await updateSettings({
      initialCapital: capital,
      theme,
      themeStyle: themeStyleState,
      defaultRisk,
      device,
      currency,
      language
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = {
        trades: trades || [],
        settings: settings || {},
        notes: notes || [],
        tags: tags || [],
        surveillance: surveillances || [],
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protrade_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir effacer toutes vos données ? Cette action est irréversible.')) {
      return;
    }
    setClearing(true);
    try {
      await Promise.all([
        ...trades.map(t => deleteTrade(t.id)),
        ...notes.map(n => deleteNote(n.id)),
        ...tags.map(tg => deleteTag(tg.id)),
        ...surveillances.map(s => deleteSurveillance(s.id))
      ]);
      window.location.reload();
    } catch (e) {
      console.error('Clear all data failed:', e);
      setClearing(false);
    }
  };

  return (
    <motion.div 
      className="settings-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{t('settings')}</h2>
        {saved && <span className="save-indicator">✓ Sauvegardé</span>}
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>💰 {t('capitalSettings')}</h3>
          <div className="form-group">
            <label>{t('initialCapital')}</label>
            <div className="input-with-symbol">
              <span className="input-symbol">{currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '€'}</span>
              <input 
                type="number"
                value={capital}
                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
              />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSave}>
            {t('save')}
          </button>
        </div>

        <div className="settings-card">
          <h3>📱 {t('device') || 'Appareil'}</h3>
          <div className="device-options">
            {[
              { id: 'mobile', label: 'Mobile', icon: '📱' },
              { id: 'tablet', label: 'Tablette', icon: '📲' },
              { id: 'desktop', label: 'Desktop', icon: '🖥️' }
            ].map(d => (
              <button
                key={d.id}
                className={`device-btn ${device === d.id ? 'active' : ''}`}
                onClick={() => setDevice(d.id)}
              >
                <span>{d.icon}</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-card">
          <h3>💱 {t('currency') || 'Devise'}</h3>
          <div className="currency-options">
            {[
              { code: 'USD', symbol: '$', label: 'Dollar' },
              { code: 'EUR', symbol: '€', label: 'Euro' },
              { code: 'GBP', symbol: '£', label: 'Livre' },
              { code: 'CHF', symbol: 'Fr', label: 'Franc Suisse' },
              { code: 'CAD', symbol: 'C$', label: 'Dollar CA' },
              { code: 'AUD', symbol: 'A$', label: 'Dollar AU' },
              { code: 'JPY', symbol: '¥', label: 'Yen' }
            ].map(c => (
              <button
                key={c.code}
                className={`currency-btn ${currency === c.code ? 'active' : ''}`}
                onClick={() => setCurrency(c.code)}
              >
                <span className="currency-symbol">{c.symbol}</span>
                <span className="currency-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-card">
          <h3>🌍 {t('language') || 'Langue'}</h3>
          <div className="language-options">
            <button
              className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
              onClick={() => setLanguage('fr')}
            >
              🇫🇷 Français
            </button>
            <button
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3>🎨 {t('darkMode') || 'Apparence'}</h3>
          <div className="theme-options">
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              🌙 Sombre
            </button>
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              ☀️ Clair
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3> ¬† {t('style') || 'Style'}</h3>
          <div className="theme-style-options">
            <button
              className={`theme-style-btn ${themeStyleState === 'classic' ? 'active' : ''}`}
              onClick={() => setThemeStyleState('classic')}
            >
              <div className="style-preview classic-preview">
                <div className="style-swatch" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}></div>
                <div className="style-swatch" style={{ background: 'linear-gradient(135deg, #0d1321, #131c31)' }}></div>
              </div>
              <span className="style-label">Classic</span>
              <span className="style-desc">Current application design</span>
              {themeStyleState === 'classic' && <FaCheckCircle className="style-check" />}
            </button>
            <button
              className={`theme-style-btn ${themeStyleState === 'technological' ? 'active' : ''}`}
              onClick={() => setThemeStyleState('technological')}
            >
              <div className="style-preview tech-preview">
                <div className="style-swatch" style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}></div>
                <div className="style-swatch" style={{ background: 'linear-gradient(135deg, #02060f, #060d1f)' }}></div>
              </div>
              <span className="style-label">Technological</span>
              <span className="style-desc">Futuristic trading interface</span>
              {themeStyleState === 'technological' && <FaCheckCircle className="style-check" />}
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3>⚠️ {t('risk') || 'Risque'}</h3>
          <div className="risk-setting">
            <span className="risk-value">{defaultRisk}%</span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={defaultRisk}
              onChange={(e) => setDefaultRisk(Number(e.target.value))}
            />
            <div className="risk-presets">
              {[0.5, 1, 2, 3, 5].map(r => (
                <button
                  key={r}
                  className={`preset-btn ${defaultRisk === r ? 'active' : ''}`}
                  onClick={() => setDefaultRisk(r)}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3>📥 {t('exportData')}</h3>
          <p className="settings-description">
            Exporter toutes vos données au format JSON
          </p>
          <button className="btn-secondary" onClick={handleExportData} disabled={exporting}>
            {exporting ? 'Exportation...' : t('exportAll')}
          </button>
        </div>

        <div className="settings-card danger">
          <h3>⚠️ {t('dangerZone')}</h3>
          <p className="settings-description">
            Cette action supprimera définitivement toutes vos données
          </p>
          <button className="btn-danger" onClick={handleClearAllData} disabled={clearing}>
            {clearing ? 'Suppression...' : t('clearAllData')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
