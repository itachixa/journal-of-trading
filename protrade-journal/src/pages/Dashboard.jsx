import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, LineChart, Line, CartesianGrid,
  Legend
} from 'recharts';
import { 
  FaTrophy, FaExchangeAlt, FaArrowUp, FaArrowDown, 
  FaBalanceScale, FaExternalLinkAlt, FaPercent, FaChartLine,
  FaCalendarAlt, FaShieldAlt, FaExclamationTriangle,
  FaCheckCircle, FaChevronLeft, FaChevronRight, FaPlus
} from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber, toNumber } from '../utils/formatters';
import './Dashboard.css';

const CHART_COLORS = {
  cyan: '#22d3ee',
  cyanGlow: 'rgba(34, 211, 238, 0.15)',
  blue: '#3b82f6',
  purple: '#a78bfa',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  pink: '#f472b6',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const { t, trades, calculateStats, settings, accountBalance } = useApp();
  const navigate = useNavigate();
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => calculateStats(trades), [trades, calculateStats]);

  const equityData = useMemo(() => {
    if (!trades.length) return [];
    let cumulative = settings.initialCapital || 10000;
    const sorted = [...trades].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      const ta = Number.isNaN(da.getTime()) ? 0 : da.getTime();
      const tb = Number.isNaN(db.getTime()) ? 0 : db.getTime();
      return ta - tb;
    });
    return sorted.map(trade => {
      cumulative += toNumber(trade.result);
      return { date: formatDate(trade.date), value: cumulative, rawDate: trade.date };
    });
  }, [trades, settings.initialCapital]);

  const monthlyData = useMemo(() => {
    const months = {};
    const currentYear = new Date().getFullYear();
    trades.forEach(trade => {
      const date = new Date(trade.date);
      if (date.getFullYear() === currentYear) {
        const monthKey = MONTHS[date.getMonth()];
        if (!months[monthKey]) months[monthKey] = { profit: 0, trades: 0, wins: 0 };
        months[monthKey].profit += toNumber(trade.result);
        months[monthKey].trades++;
        if (toNumber(trade.result) > 0) months[monthKey].wins++;
      }
    });
    return MONTHS.slice(0, new Date().getMonth() + 1).map(m => ({
      month: m,
      profit: months[m]?.profit || 0,
      trades: months[m]?.trades || 0,
      winrate: months[m]?.trades ? ((months[m].wins / months[m].trades) * 100).toFixed(1) : 0
    }));
  }, [trades]);

  const riskMetrics = useMemo(() => {
    if (!trades.length) return {
      maxDrawdown: 0, currentDrawdown: 0, riskOfRuin: 0,
      avgR: 0, expectancy: 0, kellyCriterion: 0,
      consecutiveWins: 0, consecutiveLosses: 0,
      maxConsecutiveWins: 0, maxConsecutiveLosses: 0,
      profitFactor: 0, sharpeRatio: 0
    };

    const sorted = [...trades].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      const ta = Number.isNaN(da.getTime()) ? 0 : da.getTime();
      const tb = Number.isNaN(db.getTime()) ? 0 : db.getTime();
      return ta - tb;
    });

    let peak = settings.initialCapital || 10000;
    let cumulative = settings.initialCapital || 10000;
    let maxDD = 0;
    const returns = [];
    const rMultiples = [];

    sorted.forEach(trade => {
      const result = toNumber(trade.result);
      const sl = toNumber(trade.stopLoss);
      cumulative += result;
      if (cumulative > peak) peak = cumulative;
      const dd = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
      if (sl > 0) rMultiples.push(result / (sl * 10));
      returns.push(result);
    });

    const currentDD = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    const avgR = rMultiples.length ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : 0;
    const expectancy = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const winRate = stats.wins / stats.totalTrades || 0;
    const avgWin = stats.avgWin || 1;
    const avgLoss = Math.abs(stats.avgLoss) || 1;
    const kelly = winRate - ((1 - winRate) / (avgWin / avgLoss));

    let consecWins = 0, consecLosses = 0, maxConsecWins = 0, maxConsecLosses = 0;
    sorted.forEach(t => {
      if (toNumber(t.result) > 0) {
        consecWins++; consecLosses = 0;
        if (consecWins > maxConsecWins) maxConsecWins = consecWins;
      } else if (toNumber(t.result) < 0) {
        consecLosses++; consecWins = 0;
        if (consecLosses > maxConsecLosses) maxConsecLosses = consecLosses;
      }
    });

    const dailyReturns = {};
    sorted.forEach(t => {
      const day = new Date(t.date).toDateString();
      if (!dailyReturns[day]) dailyReturns[day] = 0;
      dailyReturns[day] += toNumber(t.result);
    });
    const dailyVals = Object.values(dailyReturns);
    const dailyAvg = dailyVals.length ? dailyVals.reduce((a, b) => a + b, 0) / dailyVals.length : 0;
    const dailyStd = dailyVals.length ? Math.sqrt(dailyVals.reduce((s, v) => s + Math.pow(v - dailyAvg, 2), 0) / dailyVals.length) : 0;
    const sharpe = dailyStd > 0 ? (dailyAvg / dailyStd) * Math.sqrt(252) : 0;

    return {
      maxDrawdown: maxDD,
      currentDrawdown: currentDD,
      riskOfRuin: winRate < 0.5 ? Math.pow((1 - winRate) / winRate, (settings.initialCapital || 10000) / Math.abs(avgLoss)) * 100 : 0,
      avgR, expectancy, kellyCriterion: Math.max(0, kelly),
      consecutiveWins: consecWins, consecutiveLosses: consecLosses,
      maxConsecutiveWins: maxConsecWins, maxConsecutiveLosses: maxConsecLosses,
      profitFactor: stats.profitFactor, sharpeRatio: sharpe
    };
  }, [trades, stats, settings.initialCapital]);

  const calendarData = useMemo(() => {
    const year = calYear;
    const month = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const tradesByDay = {};
    trades.forEach(trade => {
      const date = new Date(trade.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!tradesByDay[day]) tradesByDay[day] = { profit: 0, trades: 0 };
        tradesByDay[day].profit += toNumber(trade.result);
        tradesByDay[day].trades++;
      }
    });
    const weeks = [];
    let week = [];
    for (let i = 0; i < firstDay; i++) {
      const day = prevMonthDays - firstDay + i + 1;
      week.push({ day, currentMonth: false, profit: 0, trades: 0 });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const data = tradesByDay[day] || { profit: 0, trades: 0 };
      week.push({ day, currentMonth: true, ...data });
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    let nextDay = 1;
    while (week.length < 7 && week.length > 0) {
      week.push({ day: nextDay++, currentMonth: false, profit: 0, trades: 0 });
    }
    if (week.length) weeks.push(week);
    return { weeks, monthName: MONTHS[month], year };
  }, [trades, calMonth, calYear]);

  const performanceInsight = useMemo(() => {
    if (!trades.length) return { label: t('noTrades') || 'No trades yet', value: '—', type: 'neutral' };
    const weeklyR = [];
    const weekMap = {};
    [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(trade => {
      const date = new Date(trade.date);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      if (!weekMap[weekKey]) weekMap[weekKey] = 0;
      weekMap[weekKey] += toNumber(trade.result);
    });
    Object.values(weekMap).forEach(p => weeklyR.push(p));
    const lastWeek = weeklyR[weeklyR.length - 1] || 0;
    const avgWeek = weeklyR.length ? weeklyR.reduce((a, b) => a + b, 0) / weeklyR.length : 0;
    if (lastWeek > avgWeek * 1.2) return { label: 'Strong Week', value: `+${lastWeek.toFixed(1)}R`, type: 'positive' };
    if (lastWeek < avgWeek * 0.8) return { label: 'Weak Week', value: `${lastWeek.toFixed(1)}R`, type: 'negative' };
    return { label: 'Steady Week', value: `${lastWeek >= 0 ? '+' : ''}${lastWeek.toFixed(1)}R`, type: 'neutral' };
  }, [trades, t]);

  const recentTrades = useMemo(() => [...trades].sort((a, b) => {
    const da = new Date(a.date); const db = new Date(b.date);
    const ta = Number.isNaN(da.getTime()) ? 0 : da.getTime();
    const tb = Number.isNaN(db.getTime()) ? 0 : db.getTime();
    return tb - ta;
  }).slice(0, 5), [trades]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <motion.div className="dashboard-page" variants={containerVariants} initial="hidden" animate="visible">
      <header className="dashboard-header">
        <div className="header-greeting">
          <h1>Dashboard</h1>
          <p className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="header-actions">
          <div className="balance-pill">
            <span className="pill-label">Balance</span>
            <span className={`pill-value ${accountBalance >= (settings.initialCapital || 10000) ? 'positive' : 'negative'}`}>
              {formatCurrency(accountBalance, settings.currency)}
            </span>
          </div>
        </div>
      </header>

      <section className="performance-overview" aria-label="Performance Overview">
        <motion.div className="metrics-grid" variants={itemVariants}>
          <MetricCard
            icon={<FaTrophy />}
            label={t('winrate') || 'Win Rate'}
            value={`${formatNumber(stats.winrate, 1)}%`}
            trend={stats.winrate >= 55 ? 'positive' : stats.winrate >= 45 ? 'neutral' : 'negative'}
            trendLabel={stats.winrate >= 55 ? 'Above 55%' : stats.winrate >= 45 ? 'Near breakeven' : 'Below 45%'}
            accent="green"
          />
          <MetricCard
            icon={<FaExchangeAlt />}
            label={t('totalTrades') || 'Total Trades'}
            value={stats.totalTrades}
            accent="blue"
          />
          <MetricCard
            icon={<FaArrowUp />}
            label={t('totalProfit') || 'Total P&L'}
            value={formatCurrency(stats.totalProfit, settings.currency)}
            type={stats.totalProfit >= 0 ? 'positive' : 'negative'}
            accent="green"
          />
          <MetricCard
            icon={<FaBalanceScale />}
            label={t('profitFactor') || 'Profit Factor'}
            value={stats.profitFactor === Infinity ? '∞' : formatNumber(stats.profitFactor)}
            trend={stats.profitFactor > 2 ? 'positive' : stats.profitFactor > 1 ? 'neutral' : 'negative'}
            trendLabel={stats.profitFactor > 2 ? 'Excellent' : stats.profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
            accent="purple"
          />
          <MetricCard
            icon={<FaArrowDown />}
            label="Max Drawdown"
            value={`${formatNumber(riskMetrics.maxDrawdown, 1)}%`}
            type={riskMetrics.maxDrawdown <= 10 ? 'positive' : riskMetrics.maxDrawdown <= 20 ? 'neutral' : 'negative'}
            accent="red"
          />
          <MetricCard
            icon={<FaChartLine />}
            label="Avg R-Multiple"
            value={formatNumber(riskMetrics.avgR, 2)}
            trend={riskMetrics.avgR >= 1 ? 'positive' : riskMetrics.avgR >= 0 ? 'neutral' : 'negative'}
            trendLabel={riskMetrics.avgR >= 1 ? 'Positive expectancy' : riskMetrics.avgR >= 0 ? 'Breakeven' : 'Negative expectancy'}
            accent="cyan"
          />
        </motion.div>
      </section>

      <section className="insight-banner" aria-label="Performance Insight">
        <motion.div className={`insight-card ${performanceInsight.type}`} variants={itemVariants}>
          <div className="insight-icon">
            {performanceInsight.type === 'positive' && <FaCheckCircle />}
            {performanceInsight.type === 'negative' && <FaExclamationTriangle />}
            {performanceInsight.type === 'neutral' && <FaChartLine />}
          </div>
          <div className="insight-content">
            <span className="insight-label">{performanceInsight.label}</span>
            <span className="insight-value">{performanceInsight.value}</span>
          </div>
        </motion.div>
      </section>

      <div className="dashboard-main-grid">
        <div className="main-column">
          <section className="chart-section equity-curve-section" aria-label="Equity Curve">
            <div className="chart-header">
              <h2>Equity Curve</h2>
              <div className="chart-period">
                <span className="period-label">{equityData.length > 0 ? formatDate(equityData[0].rawDate) : '—'}</span>
                <span className="period-sep">→</span>
                <span className="period-label">{equityData.length > 0 ? formatDate(equityData[equityData.length - 1].rawDate) : '—'}</span>
              </div>
            </div>
            <div className="chart-wrapper equity-curve">
              {equityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={equityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.cyan} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.red} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={CHART_COLORS.red} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(100, 116, 139, 0.5)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="rgba(100, 116, 139, 0.5)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v, settings.currency).replace(/[€$£¥]/, '').trim()}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0a101f',
                        border: '1px solid rgba(34, 211, 238, 0.2)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }}
                      formatter={(value) => [formatCurrency(value, settings.currency), 'Equity']}
                      labelFormatter={(date) => date}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_COLORS.cyan}
                      strokeWidth={2}
                      fill="url(#equityGradient)"
                      animationDuration={800}
                      animationEasing="easeOut"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <FaChartLine className="empty-icon" />
                  <p>{t('noTrades') || 'No trades recorded yet'}</p>
                  <button className="btn-primary" onClick={() => navigate('/add-trade')}>
                    <FaPlus /> {t('addTrade') || 'Add First Trade'}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="chart-section monthly-performance" aria-label="Monthly Performance">
            <div className="chart-header">
              <h2>Monthly Performance <span className="year-badge">{new Date().getFullYear()}</span></h2>
            </div>
            <div className="chart-wrapper monthly-bars">
              {monthlyData.some(m => m.trades > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="rgba(100, 116, 139, 0.5)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    />
                    <YAxis
                      stroke="rgba(100, 116, 139, 0.5)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v, settings.currency).replace(/[€$£¥]/, '').trim()}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0a101f',
                        border: '1px solid rgba(34, 211, 238, 0.2)',
                        borderRadius: '12px',
                        color: '#f8fafc'
                      }}
                      formatter={(value, name) => [name === 'profit' ? formatCurrency(value, settings.currency) : value, name === 'profit' ? 'P&L' : 'Trades']}
                      labelFormatter={(month) => month}
                    />
                    <Legend />
                    <Bar
                      dataKey="profit"
                      name="P&L"
                      fill={CHART_COLORS.cyan}
                      radius={[6, 6, 0, 0]}
                      maxBarWidth={40}
                    />
                    <Bar
                      dataKey="trades"
                      name="Trades"
                      fill={CHART_COLORS.purple}
                      radius={[6, 6, 0, 0]}
                      maxBarWidth={40}
                      yAxisId="right"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <FaChartLine className="empty-icon" />
                  <p>No monthly data yet</p>
                </div>
              )}
            </div>
          </section>

          <section className="chart-section trading-calendar" aria-label="Trading Calendar">
            <div className="chart-header">
              <div>
                <h2>Trading Calendar</h2>
                <p className="calendar-month">{calendarData.monthName} {calendarData.year}</p>
              </div>
              <div className="calendar-nav">
                <button className="nav-btn" aria-label="Previous month" onClick={() => {
                  setCalMonth(prev => {
                    if (prev === 0) {
                      setCalYear(y => y - 1);
                      return 11;
                    }
                    return prev - 1;
                  });
                }}><FaChevronLeft /></button>
                <button className="nav-btn" aria-label="Next month" onClick={() => {
                  setCalMonth(prev => {
                    if (prev === 11) {
                      setCalYear(y => y + 1);
                      return 0;
                    }
                    return prev + 1;
                  });
                }}><FaChevronRight /></button>
              </div>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="weekday">{d}</div>
                ))}
              </div>
              <div className="calendar-weeks">
                {calendarData.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="calendar-week">
                    {week.map((day, dIdx) => (
                      <motion.div
                        key={dIdx}
                        className={`calendar-day ${!day.currentMonth ? 'other-month' : ''} ${day.trades > 0 ? day.profit >= 0 ? 'profit' : 'loss' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span className="day-number">{day.day}</span>
                        {day.trades > 0 && (
                          <>
                            <span className="day-trades">{day.trades}T</span>
                            <span className={`day-pnl ${day.profit >= 0 ? 'positive' : 'negative'}`}>
                              {day.profit >= 0 ? '+' : ''}{formatNumber(day.profit, 0)}
                            </span>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="calendar-legend">
              <span className="legend-item"><span className="legend-dot profit"></span> Profitable</span>
              <span className="legend-item"><span className="legend-dot loss"></span> Loss</span>
              <span className="legend-item"><span className="legend-dot neutral"></span> No trades</span>
            </div>
          </section>
        </div>

        <aside className="sidebar-column">
          <section className="card risk-overview" aria-label="Risk Overview">
            <div className="card-header">
              <div className="card-icon risk"><FaShieldAlt /></div>
              <h3>Risk Overview</h3>
            </div>
            <div className="risk-metrics">
              <RiskMetric
                label="Current DD"
                value={`${formatNumber(riskMetrics.currentDrawdown, 1)}%`}
                threshold={riskMetrics.currentDrawdown > 15 ? 'danger' : riskMetrics.currentDrawdown > 8 ? 'warning' : 'safe'}
                max="20%"
              />
              <RiskMetric
                label="Max DD"
                value={`${formatNumber(riskMetrics.maxDrawdown, 1)}%`}
                threshold={riskMetrics.maxDrawdown > 15 ? 'danger' : riskMetrics.maxDrawdown > 8 ? 'warning' : 'safe'}
                max="20%"
              />
              <RiskMetric
                label="Avg R"
                value={formatNumber(riskMetrics.avgR, 2)}
                threshold={riskMetrics.avgR >= 1 ? 'safe' : riskMetrics.avgR >= 0 ? 'warning' : 'danger'}
                max=">1.0"
              />
              <RiskMetric
                label="Win Streak"
                value={riskMetrics.consecutiveWins}
                max={`Max: ${riskMetrics.maxConsecutiveWins}`}
                threshold="neutral"
              />
              <RiskMetric
                label="Loss Streak"
                value={riskMetrics.consecutiveLosses}
                max={`Max: ${riskMetrics.maxConsecutiveLosses}`}
                threshold={riskMetrics.consecutiveLosses >= 3 ? 'danger' : riskMetrics.consecutiveLosses >= 2 ? 'warning' : 'safe'}
              />
              <RiskMetric
                label="Kelly %"
                value={`${formatNumber(riskMetrics.kellyCriterion * 100, 1)}%`}
                threshold={riskMetrics.kellyCriterion > 0.2 ? 'safe' : riskMetrics.kellyCriterion > 0 ? 'warning' : 'danger'}
                max="< 25%"
              />
            </div>
          </section>

          <section className="card recent-trades-card" aria-label="Recent Trades">
            <div className="card-header">
              <div className="card-icon trades"><FaExchangeAlt /></div>
              <h3>Recent Trades</h3>
              <button className="btn-link" onClick={() => navigate('/trades')}>
                {t('seeAll') || 'See all'} <FaExternalLinkAlt />
              </button>
            </div>
            <div className="trades-list">
              {recentTrades.length > 0 ? (
                recentTrades.map((trade, idx) => (
                  <motion.div
                    key={trade.id}
                    className="trade-row"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => navigate(`/trades/${trade.id}`)}
                  >
                    <div className="trade-main">
                      <span className="trade-pair">{trade.pair}</span>
                      <span className={`trade-direction ${trade.tradeType?.toLowerCase()}`}>
                        {trade.tradeType}
                      </span>
                      <span className="trade-time">{formatDate(trade.date)}</span>
                    </div>
                    <span className={`trade-pnl ${toNumber(trade.result) >= 0 ? 'positive' : 'negative'}`}>
                      {toNumber(trade.result) >= 0 ? '+' : ''}{formatCurrency(toNumber(trade.result), settings.currency)}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <FaExchangeAlt className="empty-icon" />
                  <p>{t('noTrades') || 'No trades yet'}</p>
                  <button className="btn-primary" onClick={() => navigate('/add-trade')}>
                    <FaPlus /> {t('addTrade') || 'Add Trade'}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="card quick-stats" aria-label="Quick Stats">
            <div className="card-header">
              <div className="card-icon stats"><FaPercent /></div>
              <h3>Quick Stats</h3>
            </div>
            <div className="quick-stats-grid">
              <QuickStat label="Expectancy" value={formatCurrency(riskMetrics.expectancy, settings.currency)} />
              <QuickStat label="Sharpe" value={formatNumber(riskMetrics.sharpeRatio, 2)} />
              <QuickStat label="Risk of Ruin" value={`${formatNumber(riskMetrics.riskOfRuin, 2)}%`} type={riskMetrics.riskOfRuin > 10 ? 'negative' : 'positive'} />
              <QuickStat label="Max Consec Wins" value={riskMetrics.maxConsecutiveWins} />
              <QuickStat label="Max Consec Losses" value={riskMetrics.maxConsecutiveLosses} type={riskMetrics.maxConsecutiveLosses > 4 ? 'negative' : 'neutral'} />
              <QuickStat label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : formatNumber(stats.profitFactor)} />
            </div>
          </section>
        </aside>
      </div>

      <button className="fab-add-trade" onClick={() => navigate('/add-trade')} aria-label="Add Trade">
        <FaPlus />
      </button>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, type = 'neutral', trend, trendLabel, accent }) {
  const accentColors = {
    green: CHART_COLORS.green,
    red: CHART_COLORS.red,
    blue: CHART_COLORS.blue,
    purple: CHART_COLORS.purple,
    cyan: CHART_COLORS.cyan,
    amber: CHART_COLORS.amber,
  };
  const color = accentColors[accent] || CHART_COLORS.cyan;
  return (
    <div className="metric-card" style={{ '--accent-color': color }}>
      <div className="metric-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
        {icon}
      </div>
      <div className="metric-info">
        <span className="metric-label">{label}</span>
        <span className={`metric-value ${type}`}>{value}</span>
        {trend && (
          <span className={`metric-trend ${trend}`}>
            <span className="trend-dot" />
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function RiskMetric({ label, value, threshold, max }) {
  const thresholdColors = {
    safe: CHART_COLORS.green,
    warning: CHART_COLORS.amber,
    danger: CHART_COLORS.red,
    neutral: CHART_COLORS.cyan,
  };
  return (
    <div className="risk-metric">
      <div className="risk-label">
        <span>{label}</span>
        <span className="risk-value" style={{ color: thresholdColors[threshold] }}>{value}</span>
      </div>
      <div className="risk-bar">
        <div className="risk-bar-track" />
        {max && <span className="risk-max">{max}</span>}
      </div>
    </div>
  );
}

function QuickStat({ label, value, type = 'neutral' }) {
  const typeColors = { positive: CHART_COLORS.green, negative: CHART_COLORS.red, neutral: CHART_COLORS.cyan };
  return (
    <div className="quick-stat">
      <span className="quick-label">{label}</span>
      <span className="quick-value" style={{ color: typeColors[type] }}>{value}</span>
    </div>
  );
}