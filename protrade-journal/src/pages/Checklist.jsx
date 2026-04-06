import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Checklist.css';

const DEFAULT_CHECKLIST = [
  { id: '1', category: 'analysis', textKey: 'check1', checked: false },
  { id: '2', category: 'analysis', textKey: 'check2', checked: false },
  { id: '3', category: 'analysis', textKey: 'check3', checked: false },
  { id: '4', category: 'risk', textKey: 'check4', checked: false },
  { id: '5', category: 'risk', textKey: 'check5', checked: false },
  { id: '6', category: 'risk', textKey: 'check6', checked: false },
  { id: '7', category: 'psychology', textKey: 'check7', checked: false },
  { id: '8', category: 'psychology', textKey: 'check8', checked: false },
  { id: '9', category: 'psychology', textKey: 'check9', checked: false }
];

export default function Checklist() {
  const { t } = useApp();
  const [items, setItems] = useState(DEFAULT_CHECKLIST);

  const toggleItem = (id) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const resetChecklist = () => {
    setItems(prev => prev.map(item => ({ ...item, checked: false })));
  };

  const categories = [
    { key: 'analysis', icon: '📊', labelKey: 'analysis' },
    { key: 'risk', icon: '🛡️', labelKey: 'riskManagement' },
    { key: 'psychology', icon: '🧠', labelKey: 'psychology' }
  ];

  const getProgress = (categoryKey) => {
    const categoryItems = items.filter(item => item.category === categoryKey);
    const checked = categoryItems.filter(item => item.checked).length;
    return Math.round((checked / categoryItems.length) * 100);
  };

  const totalProgress = Math.round((items.filter(item => item.checked).length / items.length) * 100);

  return (
    <motion.div 
      className="checklist-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h2>{t('preTradeChecklist') || 'Checklist Avant Trade'}</h2>
          <div className="overall-progress">
            <span>Progression globale: {totalProgress}%</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
            </div>
          </div>
        </div>
        <button className="btn-secondary" onClick={resetChecklist}>
          Réinitialiser
        </button>
      </div>

      <div className="checklist-grid">
        {categories.map((category, catIndex) => (
          <motion.div 
            key={category.key}
            className="checklist-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            <div className="card-header">
              <span className="category-icon">{category.icon}</span>
              <h3>{t(category.labelKey)}</h3>
              <span className="category-progress">{getProgress(category.key)}%</span>
            </div>

            <div className="checklist-items">
              {items
                .filter(item => item.category === category.key)
                .map(item => (
                  <label 
                    key={item.id} 
                    className={`checklist-item ${item.checked ? 'checked' : ''}`}
                  >
                    <input 
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="checkmark">
                      {item.checked && '✓'}
                    </span>
                    <span className="checklist-text">{t(item.textKey)}</span>
                  </label>
                ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}