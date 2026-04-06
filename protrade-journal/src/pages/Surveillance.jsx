import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Surveillance.css';

const DIRECTIONS = ['Buy', 'Sell'];

const DEFAULT_CONFIRMATIONS = [
  { id: '1', title: 'Trend confirmed', stars: 3 },
  { id: '2', title: 'Key levels', stars: 2 },
  { id: '3', title: 'Confluence', stars: 3 },
  { id: '4', title: 'Risk < 2%', stars: 3 },
  { id: '5', title: 'RR >= 1:3', stars: 2 }
];

export default function Surveillance() {
  const { t, surveillances, addSurveillance, deleteSurveillance, updateSurveillance, tags, SETUP_PAIRS, isLoading } = useApp();
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screenshots, setScreenshots] = useState([]);
  const [formData, setFormData] = useState({
    pair: 'EURUSD',
    direction: 'Buy',
    notes: '',
    confirmations: [],
    customConfirmations: []
  });

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  const getCompletion = (surveillance) => {
    const allItems = [...DEFAULT_CONFIRMATIONS, ...tags];
    const completed = surveillance.confirmations?.length || 0;
    const customCompleted = surveillance.customConfirmations?.length || 0;
    if (allItems.length === 0) return 0;
    return Math.min(100, ((completed + customCompleted) / allItems.length) * 100);
  };

  const sortedSurveillances = useMemo(() => {
    if (!surveillances || surveillances.length === 0) return [];
    return [...surveillances].sort((a, b) => {
      const aCompletion = getCompletion(a);
      const bCompletion = getCompletion(b);
      return bCompletion - aCompletion;
    });
  }, [surveillances]);

  const handleAdd = () => {
    if (!formData.pair) return;
    addSurveillance({
      ...formData,
      screenshots
    });
    setFormData({
      pair: 'EURUSD',
      direction: 'Buy',
      notes: '',
      confirmations: [],
      customConfirmations: []
    });
    setScreenshots([]);
    setShowForm(false);
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file && screenshots.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshots(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const toggleConfirmation = (id, item) => {
    const surveillance = surveillances.find(s => s.id === id);
    if (!surveillance) return;
    
    const isTag = typeof item === 'string';
    const key = isTag ? 'confirmations' : 'customConfirmations';
    const currentItems = surveillance[key] || [];
    const itemKey = isTag ? item : item.id;
    
    const newItems = currentItems.includes(itemKey)
      ? currentItems.filter(c => c !== itemKey)
      : [...currentItems, itemKey];
    
    updateSurveillance(id, { [key]: newItems });
  };

  const isConfirmed = (surveillance, item) => {
    const isTag = typeof item === 'string';
    const list = isTag ? surveillance.confirmations : surveillance.customConfirmations;
    return list?.includes(isTag ? item : item.id);
  };

  if (loading) {
    return (
      <div className="surveillance-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="surveillance-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div className="header-left">
          <h2>{t('trade')} {t('surveillance')}</h2>
          <span className="header-count">{sortedSurveillances.length} setups</span>
        </div>
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ▦
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
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
                  {SETUP_PAIRS.map(p => (
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
                      type="button"
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

              <div className="form-group">
                <label>{t('screenshots')} ({screenshots.length}/3)</label>
                <div className="screenshot-upload-grid">
                  {screenshots.map((img, i) => (
                    <div key={i} className="screenshot-thumb">
                      <img src={img} alt="" />
                      <button type="button" onClick={() => removeScreenshot(i)}>×</button>
                    </div>
                  ))}
                  {screenshots.length < 3 && (
                    <label className="screenshot-add">
                      <input type="file" accept="image/*" onChange={handleScreenshotUpload} />
                      + {t('addScreenshot')}
                    </label>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  {t('cancel')}
                </button>
                <button type="button" className="btn-primary" onClick={handleAdd}>
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

                {surveillance.screenshots?.length > 0 && (
                  <div className="card-screenshots">
                    {surveillance.screenshots.slice(0, 3).map((img, i) => (
                      <div key={i} className="screenshot-preview">
                        <img src={img} alt="" />
                      </div>
                    ))}
                  </div>
                )}

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

                <div className="confirmations-section">
                  <div className="conf-section-title">{t('confirmations')}</div>
                  <div className="confirmations-list">
                    {DEFAULT_CONFIRMATIONS.map((conf, i) => (
                      <button
                        key={conf.id}
                        type="button"
                        className={`conf-chip ${isConfirmed(surveillance, conf) ? 'active' : ''}`}
                        onClick={() => toggleConfirmation(surveillance.id, conf)}
                      >
                        <span className="stars">{'⭐'.repeat(conf.stars)}</span>
                        {conf.title}
                      </button>
                    ))}
                    {tags && tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`conf-chip ${isConfirmed(surveillance, tag.name) ? 'active' : ''}`}
                        style={{ borderColor: tag.color, color: isConfirmed(surveillance, tag.name) ? tag.color : 'var(--text-muted)' }}
                        onClick={() => toggleConfirmation(surveillance.id, tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card-footer">
                  <button 
                    type="button"
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
            <div className="empty-icon">📊</div>
            <p>Aucun setup en surveillance</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + {t('add')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}