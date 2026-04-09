import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Surveillance.css';

const DIRECTIONS = ['Buy', 'Sell'];

const IMPORTANCE_STARS = [
  { value: 1, label: '⭐', desc: 'Bas' },
  { value: 2, label: '⭐⭐', desc: 'Moyen' },
  { value: 3, label: '⭐⭐⭐', desc: 'Élevé' }
];

const DEFAULT_CONDITIONS = [
  { id: 1, title: 'Structure du marché', note: '', importance: 3 },
  { id: 2, title: 'Niveau clé identifié', note: '', importance: 3 },
  { id: 3, title: 'FVG identifié', note: '', importance: 2 },
  { id: 4, title: 'Confluence trouvée', note: '', importance: 2 },
  { id: 5, title: 'Risk < 2%', note: '', importance: 3 },
  { id: 6, title: 'RR >= 1:3', note: '', importance: 3 }
];

export default function Surveillance() {
  const navigate = useNavigate();
  const { t, surveillances, addSurveillance, deleteSurveillance, updateSurveillance, tags, SETUP_PAIRS, isLoading } = useApp();
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const [formData, setFormData] = useState({
    pair: 'EURUSD',
    direction: 'Buy',
    note: '',
    conditions: [],
    screenshots: []
  });

  const [newCondition, setNewCondition] = useState({ title: '', note: '', importance: 2 });

  useEffect(() => {
    if (!isLoading) setLoading(false);
  }, [isLoading]);

  const getCompletion = (surveillance) => {
    const allConditions = surveillance.conditions || [];
    if (allConditions.length === 0) return 0;
    const checkedConditions = allConditions.filter(c => c.checked);
    const totalWeight = allConditions.reduce((sum, c) => sum + (c.importance || 1), 0);
    const checkedWeight = checkedConditions.reduce((sum, c) => sum + (c.importance || 1), 0);
    return Math.min(100, (checkedWeight / totalWeight) * 100);
  };

  // Toggle condition from card (inline)
  const toggleConditionFromCard = (surveillanceId, conditionId) => {
    const surveillance = surveillances.find(s => s.id === surveillanceId);
    if (!surveillance) return;
    
    const updatedConditions = surveillance.conditions.map(c =>
      c.id === conditionId ? { ...c, checked: !c.checked } : c
    );
    
    updateSurveillance(surveillanceId, { conditions: updatedConditions });
  };

  const toggleExpandCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sortedSurveillances = useMemo(() => {
    if (!surveillances || surveillances.length === 0) return [];
    return [...surveillances].sort((a, b) => getCompletion(b) - getCompletion(a));
  }, [surveillances]);

  const openEdit = (surveillance) => {
    setEditingId(surveillance.id);
    setFormData({
      pair: surveillance.pair || 'EURUSD',
      direction: surveillance.direction || 'Buy',
      note: surveillance.note || '',
      conditions: surveillance.conditions || [],
      screenshots: surveillance.screenshots || []
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    if (!formData.pair) return;
    if (editingId) {
      updateSurveillance(editingId, formData);
    } else {
      addSurveillance(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      pair: 'EURUSD',
      direction: 'Buy',
      note: '',
      conditions: [...DEFAULT_CONDITIONS],
      screenshots: []
    });
    setNewCondition({ title: '', note: '', importance: 2 });
    setShowForm(false);
    setEditingId(null);
  };

  const addCondition = () => {
    if (!newCondition.title.trim()) return;
    if (formData.conditions.length >= 10) return;
    const condition = {
      id: Date.now(),
      title: newCondition.title.trim(),
      note: newCondition.note || '',
      importance: newCondition.importance,
      checked: false
    };
    setFormData(prev => ({ ...prev, conditions: [...prev.conditions, condition] }));
    setNewCondition({ title: '', note: '', importance: 2 });
  };

  const removeCondition = (conditionId) => {
    setFormData(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== conditionId) }));
  };

  const addTagAsCondition = (tag) => {
    if (formData.conditions.length >= 10) return;
    const exists = formData.conditions.some(c => c.title === tag.name);
    if (exists) return;
    const condition = {
      id: Date.now(),
      title: tag.name,
      note: tag.description || '',
      importance: 2,
      checked: false,
      isTag: true,
      tagColor: tag.color
    };
    setFormData(prev => ({ ...prev, conditions: [...prev.conditions, condition] }));
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file && formData.screenshots.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, screenshots: [...prev.screenshots, reader.result] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = (index) => {
    setFormData(prev => ({ ...prev, screenshots: prev.screenshots.filter((_, i) => i !== index) }));
  };

  const takeTrade = (surveillance) => {
    const tradeData = {
      pair: surveillance.pair,
      tradeType: surveillance.direction,
      note: surveillance.note || '',
      conditions: surveillance.conditions || [],
      source: 'surveillance'
    };
    localStorage.setItem('protrade_temp_trade', JSON.stringify(tradeData));
    navigate('/add-trade?from=surveillance');
  };

  if (loading) {
    return <div className="surveillance-page"><div className="loading-container"><div className="loading-spinner"></div></div></div>;
  }

  return (
    <motion.div className="surveillance-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div className="header-left">
          <h2>{t('trade')} {t('surveillance')}</h2>
          <span className="header-count">{sortedSurveillances.length} setups</span>
        </div>
        <div className="header-controls">
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦</button>
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
          </div>
        </div>
      </div>

      <button className="floating-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ {t('add')}</button>

      <AnimatePresence>
        {showForm && (
          <motion.div className="setup-form-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => resetForm()}>
            <motion.div className="setup-form-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Modifier' : 'Nouvelle'} Surveillance</h3>
                <span className="conditions-count">{formData.conditions.length}/10 conditions</span>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('pair')}</label>
                  <select value={formData.pair} onChange={(e) => setFormData(f => ({ ...f, pair: e.target.value }))}>
                    {SETUP_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('direction')}</label>
                  <div className="direction-selector">
                    {DIRECTIONS.map(dir => (
                      <button key={dir} type="button" className={`dir-option ${formData.direction === dir ? 'active' : ''} ${dir.toLowerCase()}`} onClick={() => setFormData(f => ({ ...f, direction: dir }))}>
                        {dir === 'Buy' ? '↑' : '↓'} {dir}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Note / Idée</label>
                <textarea value={formData.note} onChange={(e) => setFormData(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="Décrivez votre idée..." />
              </div>

              <div className="conditions-section">
                <label>Conditions ({formData.conditions.length}/10)</label>
                <div className="conditions-list">
                  {formData.conditions.map(condition => (
                    <motion.div key={condition.id} className="condition-item" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="condition-checkbox">
                        <input type="checkbox" checked={condition.checked || false} onChange={() => {}} />
                        <span className="checkmark">{condition.checked ? '✓' : ''}</span>
                      </label>
                      <div className="condition-content">
                        <span className="condition-title">{condition.title}</span>
                      </div>
                      <span className="condition-stars">{'⭐'.repeat(condition.importance)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeCondition(condition.id)}>×</button>
                    </motion.div>
                  ))}
                </div>

                {formData.conditions.length < 10 && (
                  <div className="add-condition-section">
                    <input type="text" value={newCondition.title} onChange={(e) => setNewCondition(c => ({ ...c, title: e.target.value }))} placeholder="Nouvelle condition..." onKeyDown={(e) => e.key === 'Enter' && addCondition()} />
                    <select value={newCondition.importance} onChange={(e) => setNewCondition(c => ({ ...c, importance: parseInt(e.target.value) }))}>
                      {IMPORTANCE_STARS.map(star => <option key={star.value} value={star.value}>{star.label}</option>)}
                    </select>
                    <button type="button" className="btn-add-condition" onClick={addCondition}>+</button>
                  </div>
                )}

                {tags && tags.length > 0 && (
                  <div className="tags-section">
                    <label>Ajouter depuis les tags:</label>
                    <div className="tags-list">
                      {tags.map(tag => {
                        const exists = formData.conditions.some(c => c.title === tag.name);
                        return (
                          <button key={tag.id} type="button" className={`tag-chip ${exists ? 'used' : ''}`} style={{ borderColor: tag.color, color: tag.color }} onClick={() => !exists && addTagAsCondition(tag)} disabled={exists}>
                            {tag.name} ⭐⭐
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="screenshots-section">
                <label>{t('screenshots')} ({formData.screenshots.length}/3)</label>
                <div className="screenshot-grid">
                  {formData.screenshots.map((img, i) => (
                    <div key={i} className="screenshot-thumb"><img src={img} alt="" /><button type="button" onClick={() => removeScreenshot(i)}>×</button></div>
                  ))}
                  {formData.screenshots.length < 3 && (
                    <label className="screenshot-add"><input type="file" accept="image/*" onChange={handleScreenshotUpload} />+</label>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>{t('cancel')}</button>
                <button type="button" className="btn-primary" onClick={handleAdd}>{t('save')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`surveillance-grid ${viewMode}`}>
        {sortedSurveillances.length > 0 ? sortedSurveillances.map((surveillance, index) => {
          const completion = getCompletion(surveillance);
          const conditions = surveillance.conditions || [];
          const visibleConditions = conditions.slice(0, 4);
          const hiddenCount = conditions.length - 4;
          
          return (
            <motion.div key={surveillance.id} className={`surveillance-card ${completion >= 85 ? 'ready complete' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <div className="card-header">
                <div className="card-pair">{surveillance.pair}</div>
                <span className={`card-direction ${surveillance.direction?.toLowerCase()}`}>{surveillance.direction}</span>
              </div>

              {surveillance.note && (
                <div className="card-notes-section">
                  <span className="notes-label">📝</span>
                  <p className="notes-text">{surveillance.note}</p>
                </div>
              )}

              {surveillance.screenshots?.length > 0 && (
                <div className="card-screenshots">
                  {surveillance.screenshots.slice(0, 3).map((img, i) => <div key={i} className="screenshot-preview"><img src={img} alt="" /></div>)}
                </div>
              )}

              <div className="card-progress">
                <div className="progress-header">
                  <span className="progress-label">{t('completion')}</span>
                  <span className="progress-value">{completion.toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div className={`progress-fill ${completion < 40 ? 'low' : completion < 85 ? 'medium' : 'high'}`} initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>

              <div className="inline-conditions">
                {(expandedCards[surveillance.id] ? conditions : visibleConditions).map(condition => (
                  <motion.div key={condition.id} className={`inline-condition ${condition.checked ? 'checked' : ''}`} whileTap={{ scale: 0.95 }}>
                    <label className="inline-checkbox">
                      <input type="checkbox" checked={condition.checked || false} onChange={() => toggleConditionFromCard(surveillance.id, condition.id)} />
                      <span className="inline-checkmark">{condition.checked ? '✓' : ''}</span>
                    </label>
                    <span className="inline-title">{condition.title}</span>
                    <span className="inline-stars">{'⭐'.repeat(condition.importance)}</span>
                  </motion.div>
                ))}
                {hiddenCount > 0 && (
                  <button 
                    type="button" 
                    className="expand-conditions-btn"
                    onClick={() => toggleExpandCard(surveillance.id)}
                  >
                    {expandedCards[surveillance.id] ? '− Show less' : `+ Show all (${conditions.length})`}
                  </button>
                )}
              </div>

              <div className="card-actions">
                <button type="button" className="btn-action take-trade" onClick={() => takeTrade(surveillance)} disabled={completion < 85}>🎯 Trade</button>
                <button type="button" className="btn-action edit" onClick={() => openEdit(surveillance)}>✏️</button>
                <button type="button" className="btn-action delete" onClick={() => deleteSurveillance(surveillance.id)}>🗑️</button>
              </div>
            </motion.div>
          );
        }) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>Aucun setup en surveillance</p>
            <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Créer</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}