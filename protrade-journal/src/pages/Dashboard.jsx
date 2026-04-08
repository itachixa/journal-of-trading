import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaTrophy, FaExchangeAlt, FaArrowUp, FaBalanceScale, FaExternalLinkAlt, FaPlus } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export default function Dashboard() {
  const { t, trades, calculateStats, settings } = useApp();
  const navigate = useNavigate();

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

  const pairData = useMemo(() => {
    const pairs = {};
    trades.forEach(trade => {
      if (!pairs[trade.pair]) {
        pairs[trade.pair] = { trades: 0, profit: 0 };
      }
      pairs[trade.pair].trades++;
      pairs[trade.pair].profit += trade.result;
    });
    
    return Object.entries(pairs).map(([name, data]) => ({
      name,
      value: Math.abs(data.profit),
      profit: data.profit
    }));
  }, [trades]);

  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [trades]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="dashboard-header">
        <button className="btn-primary add-trade-btn" onClick={() => navigate('/add-trade')}>
          <FaPlus /> {t('addTrade')}
        </button>
      </div>

      <motion.div className="stats-grid" variants={itemVariants}>
        <div className="stat-card">
          <div className="stat-icon win">
            <FaTrophy />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('winrate')}</span>
            <span className="stat-value">{stats.winrate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon trades">
            <FaExchangeAlt />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('totalTrades')}</span>
            <span className="stat-value">{stats.totalTrades}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon profit">
            <FaArrowUp />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('totalProfit')}</span>
            <span className={`stat-value ${parseFloat(stats.totalProfit) >= 0 ? 'positive' : 'negative'}`}>
              ${parseFloat(stats.totalProfit).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon factor">
            <FaBalanceScale />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('profitFactor')}</span>
            <span className="stat-value">{stats.profitFactor}</span>
          </div>
        </div>
      </motion.div>

      <motion.div className="chart-container" variants={itemVariants}>
        <div className="chart-header">
          <h2>{t('equityCurve')}</h2>
        </div>
        <div className="chart-wrapper">
          {equityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#equityGradient)"
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
      </motion.div>

      <motion.div className="dashboard-grid" variants={itemVariants}>
        <div className="dashboard-card recent-trades">
          <div className="section-header">
            <h2>{t('recentTrades')}</h2>
            <button className="btn-link" onClick={() => navigate('/trades')}>
              {t('seeAll')} <FaExternalLinkAlt />
            </button>
          </div>
          <div className="trades-list">
            {recentTrades.length > 0 ? (
              recentTrades.map(trade => (
                <div key={trade.id} className="trade-item">
                  <div className="trade-info">
                    <span className="trade-pair">{trade.pair}</span>
                    <span className={`trade-type ${trade.tradeType?.toLowerCase()}`}>
                      {trade.tradeType}
                    </span>
                  </div>
                  <span className={`trade-result ${trade.result >= 0 ? 'positive' : 'negative'}`}>
                    {trade.result >= 0 ? '+' : ''}${trade.result?.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>{t('noTrades')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card performance-breakdown">
          <div className="section-header">
            <h2>{t('byPair')}</h2>
          </div>
          <div className="performance-chart">
            {pairData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pairData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pairData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a2332', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
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
      </motion.div>
    </motion.div>
  );
}