import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { FaTrophy, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './Stats.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export default function Stats() {
  const { t, trades, calculateStats, settings } = useApp();

  const stats = useMemo(() => calculateStats(trades), [trades, calculateStats]);

  const equityData = useMemo(() => {
    if (!trades.length) return [];
    
    let cumulative = settings.initialCapital || 10000;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return sorted.map(trade => {
      cumulative += trade.result;
      return {
        date: new Date(trade.date).toLocaleDateString(),
        value: cumulative
      };
    });
  }, [trades, settings.initialCapital]);

  const winLossData = useMemo(() => [
    { name: t('win') || 'Gagnants', value: stats.wins || 0, color: '#10b981' },
    { name: t('loss') || 'Perdants', value: stats.losses || 0, color: '#ef4444' }
  ], [stats, t]);

  const pairData = useMemo(() => {
    const pairs = {};
    trades.forEach(trade => {
      if (!pairs[trade.pair]) {
        pairs[trade.pair] = { trades: 0, profit: 0, wins: 0 };
      }
      pairs[trade.pair].trades++;
      pairs[trade.pair].profit += trade.result;
      if (trade.result > 0) pairs[trade.pair].wins++;
    });
    
    return Object.entries(pairs).map(([name, data]) => ({
      name,
      profit: data.profit,
      winrate: data.trades > 0 ? (data.wins / data.trades * 100).toFixed(1) : 0
    }));
  }, [trades]);

  return (
    <motion.div 
      className="stats-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h2>{t('statistics')}</h2>
      </div>

      <div className="stats-detailed-grid">
        <div className="stat-card large">
          <div className="stat-header">
            <FaTrophy />
            <span>{t('winrate')}</span>
          </div>
          <div className="stat-big-value">{stats.winrate}%</div>
        </div>

        <div className="stat-card large">
          <div className="stat-header">
            <FaArrowUp />
            <span>{t('totalProfit')}</span>
          </div>
          <div className={`stat-big-value ${parseFloat(stats.totalProfit) >= 0 ? 'profit' : 'loss'}`}>
            ${parseFloat(stats.totalProfit).toLocaleString()}
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-header">
            <FaArrowUp />
            <span>{t('bestTrade')}</span>
          </div>
          <div className="stat-big-value profit">${stats.maxWin}</div>
        </div>

        <div className="stat-card large">
          <div className="stat-header">
            <FaArrowDown />
            <span>{t('worstTrade')}</span>
          </div>
          <div className="stat-big-value loss">${stats.maxLoss}</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <div className="chart-header">
            <h2>{t('equityCurve')}</h2>
          </div>
          <div className="chart-wrapper">
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="equityGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a2332', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Capital']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="url(#equityGradient2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>{t('noTrades')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container small">
          <div className="chart-header">
            <h2>{t('winLoss')}</h2>
          </div>
          <div className="chart-wrapper">
            {trades.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a2332', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#f1f5f9'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>{t('noTrades')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {pairData.length > 0 && (
        <div className="chart-container">
          <div className="chart-header">
            <h2>{t('byPair')}</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pairData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a2332', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Profit']}
                />
                <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}