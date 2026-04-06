import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './Notes.css';

const CATEGORIES = ['analysis', 'journal', 'mistakes'];

export default function Notes() {
  const { t, notes, addNote, updateNote, deleteNote, PAIRS } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ pair: '', category: '' });
  
  const [formData, setFormData] = useState({
    pair: 'EURUSD',
    category: 'analysis',
    content: ''
  });

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      if (filters.pair && note.pair !== filters.pair) return false;
      if (filters.category && note.category !== filters.category) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notes, filters]);

  const handleSubmit = () => {
    if (!formData.content.trim()) return;
    
    if (editingId) {
      updateNote(editingId, formData);
    } else {
      addNote(formData);
    }
    
    setFormData({ pair: 'EURUSD', category: 'analysis', content: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (note) => {
    setFormData({ pair: note.pair, category: note.category, content: note.content });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('delete') + '?')) {
      deleteNote(id);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'analysis': return '#3b82f6';
      case 'journal': return '#10b981';
      case 'mistakes': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <motion.div 
      className="notes-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{t('marketNotes')}</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <FaPlus /> {t('addNote')}
        </button>
      </div>

      <div className="notes-filters">
        <select 
          value={filters.pair}
          onChange={(e) => setFilters(f => ({ ...f, pair: e.target.value }))}
        >
          <option value="">{t('allPairs')}</option>
          {PAIRS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <select 
          value={filters.category}
          onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
        >
          <option value="">{t('allCategories')}</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{t(cat)}</option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="note-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowForm(false); setEditingId(null); }}
          >
            <motion.div 
              className="note-form-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>{editingId ? t('edit') : t('newNote')}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('pair')}</label>
                  <select 
                    value={formData.pair}
                    onChange={(e) => setFormData(f => ({ ...f, pair: e.target.value }))}
                  >
                    {PAIRS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('category')}</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{t(cat)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('content')}</label>
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                  placeholder="Votre note..."
                />
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  {t('cancel')}
                </button>
                <button className="btn-primary" onClick={handleSubmit}>
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="notes-grid">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note, index) => (
            <motion.div 
              key={note.id}
              className="note-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="note-header">
                <span className="note-pair">{note.pair}</span>
                <span 
                  className="note-category"
                  style={{ background: getCategoryColor(note.category) + '20', color: getCategoryColor(note.category) }}
                >
                  {t(note.category)}
                </span>
              </div>
              
              <p className="note-content">{note.content}</p>
              
              <div className="note-footer">
                <span className="note-date">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <div className="note-actions">
                  <button onClick={() => handleEdit(note)}><FaEdit /></button>
                  <button onClick={() => handleDelete(note.id)}><FaTrash /></button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <p>{t('noNotes')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}