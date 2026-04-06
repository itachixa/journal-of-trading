import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './AddTrade.css';

export default function AddTrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, addTrade, updateTrade, trades, tags, PAIRS, calculateLotSize, settings } = useApp();
  
  const editId = searchParams.get('id');
  const existingTrade = editId ? trades.find(t => t.id === parseInt(editId)) : null;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    pair: '',
    tradeType: '',
    tradingType: '',
    lotSize: '',
    stopLoss: '',
    takeProfit: '',
    result: '',
    comment: '',
    tags: []
  });

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  useEffect(() => {
    if (existingTrade) {
      setFormData({
        ...existingTrade,
        date: existingTrade.date?.slice(0, 16) || '',
        tags: existingTrade.tags || []
      });
      if (existingTrade.screenshot) {
        setScreenshotPreview(existingTrade.screenshot);
      }
    }
  }, [existingTrade]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagName) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tradeData = {
      ...formData,
      lotSize: parseFloat(formData.lotSize) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      takeProfit: parseFloat(formData.takeProfit) || 0,
      result: parseFloat(formData.result) || 0,
      screenshot: screenshot || existingTrade?.screenshot
    };

    if (editId) {
      updateTrade(parseInt(editId), tradeData);
    } else {
      addTrade(tradeData);
    }

    navigate('/trades');
  };

  const handleClear = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 16),
      pair: '',
      tradeType: '',
      tradingType: '',
      lotSize: '',
      stopLoss: '',
      takeProfit: '',
      result: '',
      comment: '',
      tags: []
    });
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const rr = formData.stopLoss && formData.takeProfit 
    ? (formData.takeProfit / formData.stopLoss).toFixed(2)
    : '0.00';

  return (
    <motion.div 
      className="add-trade-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{editId ? t('edit') : t('newTrade')}</h2>
      </div>

      <form className="trade-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>{t('dateTime')}</label>
            <input 
              type="datetime-local" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('pair')}</label>
            <select 
              name="pair"
              value={formData.pair}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner...</option>
              {PAIRS.map(pair => (
                <option key={pair.value} value={pair.value}>{pair.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('direction')}</label>
            <select 
              name="tradeType"
              value={formData.tradeType}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner...</option>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('style')}</label>
            <select 
              name="tradingType"
              value={formData.tradingType}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner...</option>
              <option value="Scalping">Scalping</option>
              <option value="Intraday">Intraday</option>
              <option value="Swing">Swing</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('lotSize')}</label>
            <input 
              type="number" 
              name="lotSize"
              value={formData.lotSize}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('stopLoss')} (pips)</label>
            <input 
              type="number" 
              name="stopLoss"
              value={formData.stopLoss}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('takeProfit')} (pips)</label>
            <input 
              type="number" 
              name="takeProfit"
              value={formData.takeProfit}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('result')} ($)</label>
            <input 
              type="number" 
              name="result"
              value={formData.result}
              onChange={handleChange}
              step="0.01"
            />
          </div>
        </div>

        <div className="rr-display">
          <span className="rr-label">Risk/Reward:</span>
          <span className={`rr-value ${rr >= 3 ? 'good' : rr >= 1 ? 'neutral' : 'bad'}`}>
            1:{rr}
          </span>
        </div>

        <div className="form-group">
          <label>{t('tags')}</label>
          <div className="tags-container">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                className={`tag-toggle ${formData.tags.includes(tag.name) ? 'selected' : ''}`}
                style={{ 
                  '--tag-color': tag.color,
                  background: formData.tags.includes(tag.name) ? tag.color : 'transparent',
                  borderColor: tag.color,
                  color: formData.tags.includes(tag.name) ? 'white' : tag.color
                }}
                onClick={() => handleTagToggle(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t('comment')}</label>
          <textarea 
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            rows={3}
            placeholder="Commentaire sur le trade..."
          />
        </div>

        <div className="form-group">
          <label>{t('screenshot')}</label>
          <div className="file-upload">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleScreenshotChange}
              id="screenshot"
            />
            <label htmlFor="screenshot" className="file-upload-label">
              <span className="upload-icon">📁</span>
              <span>{t('uploadImage')}</span>
            </label>
            {screenshotPreview && (
              <div className="screenshot-preview">
                <img src={screenshotPreview} alt="Preview" />
                <button 
                  type="button" 
                  className="remove-preview"
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleClear}>
            {t('clear')}
          </button>
          <button type="submit" className="btn-primary">
            {t('saveTrade')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}