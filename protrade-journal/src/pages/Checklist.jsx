import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Checklist.css';

const DEFAULT_CHECKLIST = [
  { id: 1, category: 'analysis', text: 'Identify market structure (trend/range)', checked: false },
  { id: 2, category: 'analysis', text: 'Find key support/resistance levels', checked: false },
  { id: 3, category: 'analysis', text: 'Look for fair value gaps (FVG)', checked: false },
  { id: 4, category: 'analysis', text: 'Check for order block zones', checked: false },
  { id: 5, category: 'risk', text: 'Risk < 2% per trade', checked: false },
  { id: 6, category: 'risk', text: 'RR ratio >= 1:3', checked: false },
  { id: 7, category: 'risk', text: 'Defined stop loss level', checked: false },
  { id: 8, category: 'risk', text: 'Calculate position size', checked: false },
  { id: 9, category: 'psychology', text: 'Emotionally stable', checked: false },
  { id: 10, category: 'psychology', text: 'Following trading plan', checked: false },
  { id: 11, category: 'psychology', text: 'Not revenge trading', checked: false },
  { id: 12, category: 'psychology', text: 'Patient for setup', checked: false }
];

const CATEGORIES = [
  { key: 'analysis', icon: '📊', label: 'Analyse' },
  { key: 'risk', icon: '🛡️', label: 'Risk Management' },
  { key: 'psychology', icon: '🧠', label: 'Psychologie' }
];

export default function Checklist() {
  const { t } = useApp();
  const [items, setItems] = useState(DEFAULT_CHECKLIST);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('analysis');
  const [editItemId, setEditItemId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleItem = (id) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem = {
      id: Date.now(),
      category: selectedCategory,
      text: newItemText.trim(),
      checked: false
    };
    
    setItems(prev => [...prev, newItem]);
    setNewItemText('');
    setShowAddForm(false);
  };

  const startEdit = (item) => {
    setEditItemId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    
    setItems(prev => prev.map(item => 
      item.id === editItemId ? { ...item, text: editText.trim() } : item
    ));
    setEditItemId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditItemId(null);
    setEditText('');
  };

  const resetChecklist = () => {
    setItems(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const resetToDefault = () => {
    setItems(DEFAULT_CHECKLIST);
  };

  const getCategoryItems = (categoryKey) => {
    return items.filter(item => item.category === categoryKey);
  };

  const getCategoryProgress = (categoryKey) => {
    const categoryItems = getCategoryItems(categoryKey);
    if (categoryItems.length === 0) return 0;
    const checked = categoryItems.filter(item => item.checked).length;
    return Math.round((checked / categoryItems.length) * 100);
  };

  const totalProgress = useMemo(() => {
    if (items.length === 0) return 0;
    const checked = items.filter(item => item.checked).length;
    return Math.round((checked / items.length) * 100);
  }, [items]);

  return (
    <motion.div 
      className="checklist-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h2>Checklist Avant Trade</h2>
          <div className="overall-progress">
            <div className="progress-info">
              <span className="progress-label">Progression globale</span>
              <span className="progress-value">{totalProgress}%</span>
            </div>
            <div className="progress-bar-container">
              <motion.div 
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={resetChecklist}>
            ↺ Réinitialiser
          </button>
        </div>
      </div>

      <div className="checklist-grid">
        {CATEGORIES.map((category, catIndex) => {
          const categoryItems = getCategoryItems(category.key);
          const progress = getCategoryProgress(category.key);
          
          return (
            <motion.div 
              key={category.key}
              className="checklist-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <div className="card-header">
                <div className="card-title">
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.label}</h3>
                </div>
                <span className={`category-badge ${progress === 100 ? 'complete' : ''}`}>
                  {progress}%
                </span>
              </div>

              <div className="checklist-items">
                <AnimatePresence>
                  {categoryItems.map(item => (
                    <motion.div
                      key={item.id}
                      className={`checklist-item ${item.checked ? 'checked' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                    >
                      <label className="item-checkbox">
                        <input 
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="checkmark">
                          {item.checked && '✓'}
                        </span>
                      </label>
                      
                      {editItemId === item.id ? (
                        <div className="item-edit">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button className="btn-save" onClick={saveEdit}>✓</button>
                            <button className="btn-cancel" onClick={cancelEdit}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="item-text">{item.text}</span>
                          <div className="item-actions">
                            <button 
                              className="btn-edit"
                              onClick={() => startEdit(item)}
                              title="Modifier"
                            >
                              ✎
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => deleteItem(item.id)}
                              title="Supprimer"
                            >
                              🗑
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button 
                className="add-item-btn"
                onClick={() => {
                  setSelectedCategory(category.key);
                  setShowAddForm(true);
                }}
              >
                + Ajouter
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            className="add-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div 
              className="add-form-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Ajouter un élément</h3>
              
              <div className="form-group">
                <label>Catégorie</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tâche</label>
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Entrez la tâche..."
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={addItem}>
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}