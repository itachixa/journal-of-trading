import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './AddTrade.css';

const TEMP_TRADE_KEY = 'protrade_temp_trade';

export default function AddTrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, addTrade, updateTrade, trades, tags, PAIRS, calculateLotSize, settings } = useApp();
  
  const editId = searchParams.get('id');
  const fromSource = searchParams.get('from');
  
  const existingTrade = editId ? trades.find(t => t.id === parseInt(editId)) : null;

  const [step, setStep] = useState(1);
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

  const [calculatorData, setCalculatorData] = useState({
    balance: settings.initialCapital || 10000,
    risk: 2,
    pair: 'EURUSD'
  });

  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [prefillSource, setPrefillSource] = useState(null);

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
      return;
    }

    if (fromSource) {
      const tempData = localStorage.getItem(TEMP_TRADE_KEY);
      if (tempData) {
        try {
          const parsed = JSON.parse(tempData);
          
          if (parsed.source === 'calculator') {
            setFormData(prev => ({
              ...prev,
              pair: parsed.pair || '',
              lotSize: parsed.lotSize || '',
              stopLoss: parsed.stopLoss || '',
              takeProfit: parsed.takeProfit || '',
              comment: `Risk: ${parsed.risk}% | Balance: $${parsed.balance} | From Calculator`
            }));
            setCalculatorData(prev => ({
              ...prev,
              balance: parsed.balance || prev.balance,
              risk: parsed.risk || prev.risk,
              pair: parsed.pair || prev.pair
            }));
            setPrefillSource('calculator');
          } 
          else if (parsed.source === 'surveillance') {
            const conditionsSummary = parsed.conditions 
              ? parsed.conditions.filter(c => c.checked).map(c => c.title).join(', ')
              : '';
            setFormData(prev => ({
              ...prev,
              pair: parsed.pair || '',
              tradeType: parsed.tradeType || '',
              comment: parsed.note 
                ? `${parsed.note}${conditionsSummary ? '\n\nConditions: ' + conditionsSummary : ''}\n\nFrom Surveillance`
                : (conditionsSummary ? `Conditions: ${conditionsSummary}\n\nFrom Surveillance` : 'From Surveillance')
            }));
            setPrefillSource('surveillance');
          }
          
          localStorage.removeItem(TEMP_TRADE_KEY);
        } catch (e) {
          console.error('Error parsing temp trade data:', e);
        }
      }
    }
  }, [existingTrade, fromSource]);

  useEffect(() => {
    const calcResult = calculateLotSize(calculatorData.balance, calculatorData.risk, parseFloat(formData.stopLoss) || 0, calculatorData.pair);
    if (formData.stopLoss && parseFloat(formData.stopLoss) > 0) {
      setFormData(prev => ({ ...prev, lotSize: calcResult.lotSize || '' }));
    }
  }, [calculatorData.balance, calculatorData.risk, calculatorData.pair, formData.stopLoss]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculatorChange = (e) => {
    const { name, value } = e.target.value;
    setCalculatorData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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

  const calculatedRR = useMemo(() => {
    if (formData.stopLoss && formData.takeProfit && parseFloat(formData.stopLoss) > 0) {
      return (parseFloat(formData.takeProfit) / parseFloat(formData.stopLoss)).toFixed(2);
    }
    return '0.00';
  }, [formData.stopLoss, formData.takeProfit]);

  const calcResult = useMemo(() => {
    return calculateLotSize(calculatorData.balance, calculatorData.risk, parseFloat(formData.stopLoss) || 10, calculatorData.pair);
  }, [calculatorData.balance, calculatorData.risk, calculatorData.pair, formData.stopLoss, calculateLotSize]);

  return (
    <motion.div 
      className="add-trade-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{editId ? t('edit') : t('newTrade')}</h2>
        {prefillSource && (
          <span className={`prefill-badge ${prefillSource}`}>
            {prefillSource === 'calculator' ? '🧮 Pre-filled from Calculator' : '📊 From Surveillance'}
          </span>
        )}
      </div>

      <div className="step-indicator">
        <button 
          className={`step-btn ${step === 1 ? 'active' : ''}`}
          onClick={() => setStep(1)}
        >
          1. Calculateur
        </button>
        <button 
          className={`step-btn ${step === 2 ? 'active' : ''}`}
          onClick={() => setStep(2)}
        >
          2. Détails du Trade
        </button>
      </div>

      {step === 1 && (
        <motion.div className="calculator-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="calc-card">
            <h3>Paramètres du Calculateur</h3>
            <div className="calc-grid">
              <div className="form-group">
                <label>Balance ($)</label>
                <input 
                  type="number"
                  name="balance"
                  value={calculatorData.balance}
                  onChange={handleCalculatorChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Risk (%)</label>
                <input 
                  type="number"
                  name="risk"
                  value={calculatorData.risk}
                  onChange={handleCalculatorChange}
                  min="0.1"
                  max="10"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Paire</label>
                <select 
                  name="pair"
                  value={calculatorData.pair}
                  onChange={handleCalculatorChange}
                >
                  {PAIRS.map(pair => (
                    <option key={pair.value} value={pair.value}>{pair.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Stop Loss (pips)</label>
                <input 
                  type="number"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleChange}
                  step="0.1"
                  min="0.1"
                  placeholder="20"
                />
              </div>
            </div>
            
            <div className="calc-result">
              <div className="result-item">
                <span className="result-label">Taille du Lot recommandée</span>
                <span className="result-value">{calcResult.lotSize.toFixed(2)} lots</span>
              </div>
              <div className="result-item">
                <span className="result-label">Montant risqué</span>
                <span className="result-value risk">${calcResult.riskAmount.toFixed(2)}</span>
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={() => setStep(2)}>
              Passer aux détails →
            </button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <form className="trade-form" onSubmit={handleSubmit}>
            {!formData.pair && (
              <div className="pair-warning">
                ⚠️ Pair is required - please select a trading pair
              </div>
            )}
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
                <label>{t('lotSize')} (calculé)</label>
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
              <span className={`rr-value ${parseFloat(calculatedRR) >= 3 ? 'good' : parseFloat(calculatedRR) >= 1 ? 'neutral' : 'bad'}`}>
                1:{calculatedRR}
              </span>
              <button type="button" className="btn-calc" onClick={() => setStep(1)}>
                Recalculer
              </button>
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
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                ← Calculateur
              </button>
              <button type="button" className="btn-secondary" onClick={handleClear}>
                {t('clear')}
              </button>
              <button type="submit" className="btn-primary">
                {t('saveTrade')}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}