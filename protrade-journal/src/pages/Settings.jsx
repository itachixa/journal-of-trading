import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Settings.css';

export default function Settings() {
  const { t, settings, updateSettings } = useApp();
  const [capital, setCapital] = useState(settings.initialCapital || 10000);

  const handleSaveCapital = () => {
    updateSettings({ initialCapital: capital });
    alert(t('save') + '!');
  };

  const handleExportData = () => {
    const data = {
      trades: JSON.parse(localStorage.getItem('protrade_trades') || '[]'),
      settings: JSON.parse(localStorage.getItem('protrade_settings') || '{}'),
      notes: JSON.parse(localStorage.getItem('protrade_notes') || '[]'),
      tags: JSON.parse(localStorage.getItem('protrade_tags') || '[]'),
      surveillance: JSON.parse(localStorage.getItem('protrade_surveillance') || '[]')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protrade_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleClearAllData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les données? Cette action est irréversible.')) {
      localStorage.clear();
      window.location.reload();
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
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>💰 {t('capitalSettings')}</h3>
          <div className="form-group">
            <label>{t('initialCapital')}</label>
            <input 
              type="number"
              value={capital}
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
            />
          </div>
          <button className="btn-primary" onClick={handleSaveCapital}>
            {t('save')}
          </button>
        </div>

        <div className="settings-card">
          <h3>📥 {t('exportData')}</h3>
          <p className="settings-description">
            Exporter toutes vos données au format JSON
          </p>
          <button className="btn-secondary" onClick={handleExportData}>
            {t('exportAll')}
          </button>
        </div>

        <div className="settings-card danger">
          <h3>⚠️ {t('dangerZone')}</h3>
          <p className="settings-description">
            Cette action supprimera définitivement toutes vos données
          </p>
          <button className="btn-danger" onClick={handleClearAllData}>
            {t('clearAllData')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}