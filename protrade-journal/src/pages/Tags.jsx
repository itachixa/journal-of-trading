import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './Tags.css';

const TAG_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'
];

export default function Tags() {
  const { t, tags, addTag, deleteTag } = useApp();
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    addTag(formData);
    setFormData({ name: '', description: '', color: '#3b82f6' });
  };

  const handleDelete = (id) => {
    if (window.confirm(t('delete') + '?')) {
      deleteTag(id);
    }
  };

  return (
    <motion.div 
      className="tags-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{t('tagManager')}</h2>
      </div>

      <div className="tag-create-card">
        <h3><FaPlus /> {t('createTag')}</h3>
        
        <div className="tag-form-grid">
          <div className="form-group">
            <label>{t('tagName')}</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Breakout"
            />
          </div>

          <div className="form-group">
            <label>{t('description')}</label>
            <input 
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Signification"
            />
          </div>

          <div className="form-group">
            <label>{t('color')}</label>
            <div className="color-picker">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  className={`color-btn ${formData.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setFormData(f => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tag-preview">
          <span className="preview-label">Preview:</span>
          <span 
            className="preview-badge"
            style={{ background: formData.color }}
          >
            {formData.name || 'Nouveau Tag'}
          </span>
        </div>

        <button className="btn-primary" onClick={handleSubmit}>
          <FaPlus /> {t('create')}
        </button>
      </div>

      <div className="tags-list-container">
        <h3>{t('existingTags')}</h3>
        
        <div className="tags-grid">
          {tags.map((tag, index) => (
            <motion.div 
              key={tag.id}
              className="tag-item"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="tag-info">
                <span 
                  className="tag-badge"
                  style={{ background: tag.color }}
                >
                  {tag.name}
                </span>
                {tag.description && (
                  <span className="tag-desc">{tag.description}</span>
                )}
              </div>
              <button 
                className="tag-delete"
                onClick={() => handleDelete(tag.id)}
              >
                <FaTrash />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}