import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaSmile, FaFrown, FaMeh, FaChartBar } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './Psychology.css';

const EMOTIONS = [
  { id: 'confident', label: 'Confident', icon: '😎', color: '#10b981' },
  { id: 'calm', label: 'Calm', icon: '😌', color: '#3b82f6' },
  { id: 'neutral', label: 'Neutral', icon: '😐', color: '#94a3b8' },
  { id: 'anxious', label: 'Anxious', icon: '😰', color: '#f59e0b' },
  { id: 'fearful', label: 'Fearful', icon: '😨', color: '#ef4444' },
  { id: 'greedy', label: 'Greedy', icon: '🤑', color: '#8b5cf6' },
  { id: 'fomo', label: 'FOMO', icon: '😱', color: '#ec4899' },
  { id: 'revenge', label: 'Revenge', icon: '😡', color: '#ef4444' }
];

export default function Psychology() {
  const { t } = useApp();
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [confidence, setConfidence] = useState(5);
  const [discipline, setDiscipline] = useState(5);
  const [notes, setNotes] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [entries, setEntries] = useState([]);

  const emotionStats = useMemo(() => {
    if (!entries.length) return {};
    const stats = {};
    entries.forEach(entry => {
      if (!stats[entry.emotion]) {
        stats[entry.emotion] = { count: 0, wins: 0, losses: 0 };
      }
      stats[entry.emotion].count++;
    });
    return stats;
  }, [entries]);

  const handleSave = () => {
    if (!selectedEmotion) return;
    const entry = {
      id: Date.now(),
      emotion: selectedEmotion,
      confidence,
      discipline,
      notes,
      mistakes,
      date: new Date().toISOString()
    };
    setEntries(p => [entry, ...p]);
    setSelectedEmotion(null);
    setConfidence(5);
    setDiscipline(5);
    setNotes('');
    setMistakes('');
  };

  return (
    <motion.div 
      className="psychology-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>🧠 {t('journal') || 'Journal Psychologique'}</h2>
      </div>

      <div className="psychology-grid">
        <div className="psychology-main">
          <div className="psych-card">
            <h3>Comment vous sentez-vous ?</h3>
            <div className="emotions-grid">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.id}
                  className={`emotion-btn ${selectedEmotion === emotion.id ? 'active' : ''}`}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  style={{ 
                    '--emotion-color': emotion.color,
                    borderColor: selectedEmotion === emotion.id ? emotion.color : undefined
                  }}
                >
                  <span className="emotion-icon">{emotion.icon}</span>
                  <span className="emotion-label">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedEmotion && (
            <motion.div 
              className="psych-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Détails</h3>
              <div className="psych-form">
                <div className="form-group">
                  <label>Confidence ({confidence}/10)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                  />
                  <div className="range-labels">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Discipline ({discipline}/10)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={discipline}
                    onChange={(e) => setDiscipline(Number(e.target.value))}
                  />
                  <div className="range-labels">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Comment vous sentez-vous ? Pourquoi ?"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Erreurs / Leçons</label>
                  <textarea 
                    value={mistakes}
                    onChange={(e) => setMistakes(e.target.value)}
                    placeholder="Quelles erreurs avez-vous commises ? Qu'avez-vous appris ?"
                    rows={3}
                  />
                </div>
                <button className="btn-primary" onClick={handleSave}>
                  Enregistrer
                </button>
              </div>
            </motion.div>
          )}

          {entries.length > 0 && (
            <div className="psych-card">
              <h3>Historique</h3>
              <div className="entries-list">
                {entries.slice(0, 10).map(entry => {
                  const emotion = EMOTIONS.find(e => e.id === entry.emotion);
                  return (
                    <div key={entry.id} className="entry-item">
                      <div className="entry-header">
                        <span className="entry-emotion">{emotion?.icon} {emotion?.label}</span>
                        <span className="entry-date">
                          {new Date(entry.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="entry-meta">
                        <span>Confidence: {entry.confidence}/10</span>
                        <span>Discipline: {entry.discipline}/10</span>
                      </div>
                      {entry.notes && <p className="entry-notes">{entry.notes}</p>}
                      {entry.mistakes && <p className="entry-mistakes">{entry.mistakes}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="psychology-sidebar">
          <div className="psych-card">
            <h3>📊 Statistiques</h3>
            <div className="psych-stats">
              <div className="psych-stat">
                <span className="psych-stat-label">Entrées</span>
                <span className="psych-stat-value">{entries.length}</span>
              </div>
              <div className="psych-stat">
                <span className="psych-stat-label">Émotion la plus fréquente</span>
                <span className="psych-stat-value">
                  {Object.entries(emotionStats).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="psych-card">
            <h3>💡 Insights</h3>
            <div className="insights-list">
              <div className="insight-item">
                <FaBrain className="insight-icon" />
                <p>Suivre vos émotions aide à identifier les patterns qui affectent vos performances.</p>
              </div>
              <div className="insight-item">
                <FaChartBar className="insight-icon" />
                <p>Une discipline élevée est corrélée avec de meilleurs résultats à long terme.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
