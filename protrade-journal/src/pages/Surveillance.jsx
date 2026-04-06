import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Surveillance.css';

const DIRECTIONS = ['Buy', 'Sell'];
const PAIRS_FOR_SETUP = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSDT', 'ETHUSDT'];

export default function Surveillance() {
  const { t, surveillances, addSurveillance, deleteSurveillance, updateSurveillance, tags } = useApp();
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pair: 'EURUSD',
    direction: 'Buy',
    notes: '',
    confirmations: []
  });

  const sortedSurveillances = useMemo(() => {
    return [...surveillances].sort((a, b) => {
      const aCompletion = (a.confirmations?.length || 0) / 5 * 100;
      const bCompletion = (b.confirmations?.length || 0) / 5 * 100;
      return bCompletion - aCompletion;
    });
  }, [surveillances]);

  const handleAdd = () => {
    if (!formData.pair) return;
    addSurveillance(formData);
    setFormData({
      pair: 'EURUSD',
      direction: 'Buy',
      notes: '',
      confirmations: []
    });
    setShowForm(false);
  };

  const toggleConfirmation = (id, tagName) => {
    const surveillance = surveillances.find(s => s.id === id);
    if (!surveillance) return;
    
    const confirmations = surveillance.confirmations || [];
    const newConfirmations = confirmations.includes(tagName)
      ? confirmations.filter(c => c !== tagName)
      : [...confirmations, tagName];
    
    updateSurveillance(id, { confirmations: newConfirmations });
  };

  const getCompletion = (surveillance) => {
    const count = surveillance.confirmations?.length || 0;
    return Math.min(100, (count / 5) * 100);
  };

  return (
    <motion.div 
      className="surveillance-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div className="header-left">
          <h2>{t('trade')} {t('surveillance')}</h2>
        </div>
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >▦</button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >☰</button>
          </div>
        </div>
      </div>

      <button className="floating-add-btn" onClick={() => setShowForm(true)}>
        + {t('add')}
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="setup-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div 
              className="setup-form-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>{t('newSurveillance')}</h3>
              
              <div className="form-group">
                <label>{t('pair')}</label>
                <select 
                  value={formData.pair}
                  onChange={(e) => setFormData(f => ({ ...f, pair: e.target.value }))}
                >
                  {PAIRS_FOR_SETUP.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('direction')}</label>
                <div className="direction-selector">
                  {DIRECTIONS.map(dir => (
                    <button
                      key={dir}
                      className={`dir-option ${formData.direction === dir ? 'active' : ''} ${dir.toLowerCase()}`}
                      onClick={() => setFormData(f => ({ ...f, direction: dir }))}
                    >
                      {dir === 'Buy' ? '↑' : '↓'} {dir}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>{t('notes')}</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Notes sur le setup..."
                />
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowForm(false)}>
                  {t('cancel')}
                </button>
                <button className="btn-primary" onClick={handleAdd}>
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`surveillance-grid ${viewMode}`}>
        {sortedSurveillances.length > 0 ? (
          sortedSurveillances.map((surveillance, index) => {
            const completion = getCompletion(surveillance);
            return (
              <motion.div 
                key={surveillance.id}
                className={`surveillance-card ${completion >= 80 ? 'ready' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="card-header">
                  <span className="card-pair">{surveillance.pair}</span>
                  <span className={`card-direction ${surveillance.direction?.toLowerCase()}`}>
                    {surveillance.direction}
                  </span>
                </div>

                <div className="card-progress">
                  <div className="progress-header">
                    <span className="progress-label">{t('completion')}</span>
                    <span className="progress-value">{completion.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${completion < 40 ? 'low' : completion < 80 ? 'medium' : 'high'}`}
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="confirmations-list">
                  {tags.slice(0, 5).map(tag => (
                    <button
                      key={tag.id}
                      className={`confirmation-chip ${surveillance.confirmations?.includes(tag.name) ? 'active' : ''}`}
                      style={{ borderColor: tag.color, color: surveillance.confirmations?.includes(tag.name) ? tag.color : 'var(--text-muted)' }}
                      onClick={() => toggleConfirmation(surveillance.id, tag.name)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>

                <div className="card-footer">
                  <button 
                    className="delete-btn"
                    onClick={() => deleteSurveillance(surveillance.id)}
                  >
                    🗑️
                  </button>
                  {completion >= 80 && (
                    <span className="ready-badge">{t('takeTheTrade')}</span>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>Aucun setup en surveillance</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}