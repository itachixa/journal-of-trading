import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './RiskManagement.css';

export default function RiskManagement() {
  const { trades, settings, accountBalance } = useApp();
  const [dailyLimit, setDailyLimit] = useState(5);
  const [weeklyLimit, setWeeklyLimit] = useState(15);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(3);

  const today = new Date().toDateString();
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, []);

  const todayTrades = useMemo(() => trades.filter(t => new Date(t.date).toDateString() === today), [trades, today]);
  const weekTrades = useMemo(() => trades.filter(t => new Date(t.date) >= weekStart), [trades, weekStart]);

  const todayLoss = useMemo(() => todayTrades.filter(t => t.result < 0).reduce((s, t) => s + Math.abs(t.result), 0), [todayTrades]);
  const weekLoss = useMemo(() => weekTrades.filter(t => t.result < 0).reduce((s, t) => s + Math.abs(t.result), 0), [weekTrades]);

  const todayRiskPct = accountBalance > 0 ? (todayLoss / accountBalance) * 100 : 0;
  const weekRiskPct = accountBalance > 0 ? (weekLoss / accountBalance) * 100 : 0;

  const consecutiveLosses = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    let count = 0;
    for (const trade of sorted) {
      if (trade.result < 0) count++;
      else break;
    }
    return count;
  }, [trades]);

  const maxDrawdown = useMemo(() => {
    if (!trades.length) return 0;
    let peak = settings.initialCapital || 10000;
    let maxDD = 0;
    let cumulative = settings.initialCapital || 10000;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const trade of sorted) {
      cumulative += trade.result;
      if (cumulative > peak) peak = cumulative;
      const dd = ((peak - cumulative) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }, [trades, settings.initialCapital]);

  const rules = [
    { label: 'Limite journalière', current: todayRiskPct, limit: dailyLimit, unit: '%', trades: todayTrades.length },
    { label: 'Limite hebdomadaire', current: weekRiskPct, limit: weeklyLimit, unit: '%', trades: weekTrades.length },
    { label: 'Pertes consécutives', current: consecutiveLosses, limit: maxConsecutiveLosses, unit: '', trades: consecutiveLosses }
  ];

  const getStatus = (current, limit) => {
    if (current >= limit) return 'danger';
    if (current >= limit * 0.8) return 'warning';
    return 'success';
  };

  return (
    <motion.div 
      className="risk-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>🛡️ Risk Management</h2>
      </div>

      <div className="risk-grid">
        <div className="risk-card main-card">
          <h3>Account Overview</h3>
          <div className="risk-stats">
            <div className="risk-stat">
              <span className="risk-stat-label">Balance</span>
              <span className="risk-stat-value">${accountBalance.toLocaleString()}</span>
            </div>
            <div className="risk-stat">
              <span className="risk-stat-label">Capital Initial</span>
              <span className="risk-stat-value">${(settings.initialCapital || 10000).toLocaleString()}</span>
            </div>
            <div className="risk-stat">
              <span className="risk-stat-label">Max Drawdown</span>
              <span className={`risk-stat-value ${maxDrawdown > 20 ? 'danger' : maxDrawdown > 10 ? 'warning' : 'success'}`}>
                {maxDrawdown.toFixed(2)}%
              </span>
            </div>
            <div className="risk-stat">
              <span className="risk-stat-label">Pertes Consécutives</span>
              <span className={`risk-stat-value ${consecutiveLosses >= maxConsecutiveLosses ? 'danger' : 'success'}`}>
                {consecutiveLosses} / {maxConsecutiveLosses}
              </span>
            </div>
          </div>
        </div>

        <div className="risk-card settings-card">
          <h3>Risk Limits</h3>
          <div className="risk-settings">
            <div className="risk-setting">
              <label>Limite journalière (%)</label>
              <input 
                type="number" 
                value={dailyLimit} 
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                min="0.5"
                max="20"
                step="0.5"
              />
            </div>
            <div className="risk-setting">
              <label>Limite hebdomadaire (%)</label>
              <input 
                type="number" 
                value={weeklyLimit} 
                onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                min="1"
                max="50"
                step="1"
              />
            </div>
            <div className="risk-setting">
              <label>Pertes consécutives max</label>
              <input 
                type="number" 
                value={maxConsecutiveLosses} 
                onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))}
                min="1"
                max="10"
                step="1"
              />
            </div>
          </div>
        </div>

        <div className="risk-card rules-card">
          <h3>Risk Rules Status</h3>
          <div className="rules-list">
            {rules.map((rule, idx) => {
              const status = getStatus(rule.current, rule.limit);
              return (
                <div key={idx} className={`rule-item ${status}`}>
                  <div className="rule-header">
                    <span className="rule-label">{rule.label}</span>
                    <span className={`rule-badge ${status}`}>
                      {status === 'danger' && <FaExclamationTriangle />}
                      {status === 'warning' && <FaExclamationTriangle />}
                      {status === 'success' && <FaCheckCircle />}
                      {status === 'danger' ? 'BREACH' : status === 'warning' ? 'WARNING' : 'OK'}
                    </span>
                  </div>
                  <div className="rule-progress">
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${status}`} 
                        style={{ width: `${Math.min(100, (rule.current / rule.limit) * 100)}%` }}
                      />
                    </div>
                    <div className="rule-values">
                      <span>{rule.current.toFixed(1)}{rule.unit}</span>
                      <span>Limit: {rule.limit}{rule.unit}</span>
                    </div>
                  </div>
                  {rule.trades > 0 && (
                    <div className="rule-trades">
                      {rule.trades} trade(s) today
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="risk-card tips-card">
          <h3>💡 Risk Tips</h3>
          <div className="tips-list">
            <div className="tip-item">
              <FaCheckCircle className="tip-icon success" />
              <span>Ne risk pas plus de 1-2% par trade</span>
            </div>
            <div className="tip-item">
              <FaCheckCircle className="tip-icon success" />
              <span>Arrête de trader après 2 pertes consécutives</span>
            </div>
            <div className="tip-item">
              <FaCheckCircle className="tip-icon success" />
              <span>Vérifie le ratio risque/récompense avant chaque trade</span>
            </div>
            <div className="tip-item">
              <FaShieldAlt className="tip-icon info" />
              <span>Drawdown max recommandé: 20%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
