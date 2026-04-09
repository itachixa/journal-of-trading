import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Calculator.css';

const PAIRS_FOR_CALC = [
  { value: 'XAUUSD', label: 'XAUUSD' },
  { value: 'EURUSD', label: 'EURUSD' },
  { value: 'GBPUSD', label: 'GBPUSD' },
  { value: 'USDJPY', label: 'USDJPY' },
  { value: 'BTCUSD', label: 'BTCUSD' },
  { value: 'ETHUSD', label: 'ETHUSD' }
];

export default function Calculator() {
  const { t, settings, calculateLotSize } = useApp();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(settings.initialCapital || 10000);
  const [risk, setRisk] = useState(2);
  const [pair, setPair] = useState('XAUUSD');
  const [slPips, setSlPips] = useState('');
  const [tpPips, setTpPips] = useState('');

  const [result, setResult] = useState({ lotSize: 0, riskAmount: 0, pipValue: 0 });

  useEffect(() => {
    const calcResult = calculateLotSize(balance, risk, parseFloat(slPips) || 0, pair);
    setResult(calcResult);
  }, [balance, risk, slPips, pair, calculateLotSize]);

  const riskAmount = balance * (risk / 100);
  const rr = slPips && tpPips ? (tpPips / slPips).toFixed(2) : '0.00';
  const potentialProfit = riskAmount * parseFloat(rr);

  const saveToTrade = () => {
    const tradeData = {
      lotSize: result.lotSize,
      stopLoss: parseFloat(slPips) || 0,
      takeProfit: parseFloat(tpPips) || 0,
      pair: pair,
      balance: balance,
      risk: risk
    };
    localStorage.setItem('protrade_calculator_data', JSON.stringify(tradeData));
    navigate('/add-trade?fromCalculator=true');
  };

  return (
    <motion.div 
      className="calculator-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{t('lotCalculator')}</h2>
      </div>

      <div className="formula-banner">
        <div className="formula-icon">fx</div>
        <div className="formula-text">
          <span className="formula-label">{t('formula')}</span>
          <span className="formula-code">Lot = (Balance x Risk%) / (SL pips x Pip Value)</span>
        </div>
      </div>

      <div className="calculator-layout">
        <div className="calculator-inputs">
          <div className="calc-card">
            <h3><span className="card-icon">💰</span> {t('accountParams')}</h3>
            
            <div className="form-group">
              <label>{t('balance')}</label>
              <input 
                type="number" 
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label>{t('risk')}</label>
              <div className="risk-presets">
                {[0.5, 1, 2, 3].map(r => (
                  <button
                    key={r}
                    className={`risk-preset ${risk === r ? 'active' : ''}`}
                    onClick={() => setRisk(r)}
                  >
                    {r}%
                  </button>
                ))}
              </div>
              <input 
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={risk}
                onChange={(e) => setRisk(parseFloat(e.target.value))}
                className="risk-slider"
              />
            </div>

            <div className="risk-amount-display">
              <span className="risk-label">
                <span className="warning-icon">⚠️</span> {t('riskAmount')}
              </span>
              <span className="risk-value">${riskAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="calc-card">
            <h3><span className="card-icon">📈</span> {t('tradeParams')}</h3>
            
            <div className="form-group">
              <label>{t('pair')}</label>
              <select value={pair} onChange={(e) => setPair(e.target.value)}>
                {PAIRS_FOR_CALC.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('stopLoss')}</label>
                <input 
                  type="number"
                  value={slPips}
                  onChange={(e) => setSlPips(e.target.value)}
                  placeholder="20"
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>{t('takeProfit')}</label>
                <input 
                  type="number"
                  value={tpPips}
                  onChange={(e) => setTpPips(e.target.value)}
                  placeholder="60"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="calculator-results">
          <div className="result-card main-result">
            <div className="result-icon">🎯</div>
            <h3>{t('recommendedLot')}</h3>
            <div className="result-value">{result.lotSize.toFixed(2)}</div>
            <div className="result-label">lots</div>
          </div>

          <div className="result-grid">
            <div className="result-card">
              <h4>{t('riskAmount')}</h4>
              <div className="result-value small">${result.riskAmount.toFixed(2)}</div>
            </div>

            <div className="result-card">
              <h4>{t('pipValue')}</h4>
              <div className="result-value small">${result.pipValue.toFixed(2)}</div>
            </div>

            <div className="result-card">
              <h4>{t('riskReward')}</h4>
              <div className={`result-value small ${rr >= 3 ? 'good' : rr >= 1 ? 'neutral' : 'bad'}`}>
                1:{rr}
              </div>
            </div>

            <div className="result-card">
              <h4>{t('potentialProfit')}</h4>
              <div className="result-value small positive">${potentialProfit.toFixed(2)}</div>
            </div>
          </div>

          <button className="btn-take-trade" onClick={saveToTrade}>
            🎯 {t('takeTheTrade') || 'Take Trade'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}