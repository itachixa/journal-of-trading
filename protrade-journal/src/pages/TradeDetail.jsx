import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaTrash, FaCopy, FaExternalLinkAlt, FaBalanceScale } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, toNumber } from '../utils/formatters';
import './TradeDetail.css';

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, trades, deleteTrade, settings, accountBalance } = useApp();

  const trade = useMemo(() => trades.find(t => t.id === id), [trades, id]);

  if (!trade) {
    return (
      <motion.div 
        className="trade-detail-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Trade non trouvé</h3>
          <p>Ce trade n'existe pas ou a été supprimé.</p>
          <Link to="/trades" className="btn-primary">
            <FaArrowLeft /> Retour aux trades
          </Link>
        </div>
      </motion.div>
    );
  }

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'GBP' ? '£' : settings.currency === 'JPY' ? '¥' : settings.currency === 'CHF' ? 'Fr' : settings.currency === 'CAD' ? 'C$' : settings.currency === 'AUD' ? 'A$' : '€';

  const handleDelete = async () => {
    if (window.confirm('Supprimer ce trade ?')) {
      await deleteTrade(trade.id);
      navigate('/trades');
    }
  };

  const handleDuplicate = () => {
    navigate(`/add-trade?id=${trade.id}`);
  };

  const rr = toNumber(trade.stopLoss) > 0 && toNumber(trade.takeProfit) > 0 
    ? (toNumber(trade.takeProfit) / toNumber(trade.stopLoss)).toFixed(2) 
    : '0.00';

  return (
    <motion.div 
      className="trade-detail-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="page-header">
        <div className="header-left">
          <button className="btn-link" onClick={() => navigate('/trades')}>
            <FaArrowLeft /> {t('trades')}
          </button>
          <h2>{t('edit') || 'Détail du Trade'}</h2>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleDuplicate}>
            <FaCopy /> Dupliquer
          </button>
          <button className="btn-secondary" onClick={() => navigate(`/add-trade?id=${trade.id}`)}>
            <FaEdit /> {t('edit')}
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            <FaTrash /> {t('delete')}
          </button>
        </div>
      </div>

      <div className="trade-detail-grid">
        <div className="trade-detail-main">
          <div className="detail-card">
            <h3>📊 {t('trade') || 'Trade'}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">{t('pair')}</span>
                <span className="detail-value pair">{trade.pair}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('direction')}</span>
                <span className={`detail-value direction ${trade.tradeType?.toLowerCase()}`}>
                  {trade.tradeType}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('dateTime')}</span>
                <span className="detail-value">
                  {formatDateTime(trade.date)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('style') || 'Style'}</span>
                <span className="detail-value">{trade.tradingType || '-'}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3>💰 {t('lotSize')}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Position Size</span>
                <span className="detail-value">{trade.lotSize} lots</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('stopLoss')}</span>
                <span className="detail-value">{trade.stopLoss} pips</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('takeProfit')}</span>
                <span className="detail-value">{trade.takeProfit} pips</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">R/R</span>
                <span className={`detail-value ${parseFloat(rr) >= 2 ? 'positive' : 'negative'}`}>
                  1:{rr}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-card result-card">
            <h3>📈 {t('result')}</h3>
            <div className="result-display">
              <div className={`result-big ${trade.result >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(trade.result, settings.currency)}
              </div>
              <div className="result-meta">
                <span>Risk: {trade.lotSize ? ((accountBalance * 0.02) / (toNumber(trade.stopLoss) * 10)).toFixed(2) : '-'} lots</span>
                <span>P&L: {trade.result >= 0 ? 'Gagnant' : 'Perdant'}</span>
              </div>
            </div>
          </div>

          {trade.comment && (
            <div className="detail-card">
              <h3>📝 {t('comment')}</h3>
              <p className="detail-comment">{trade.comment}</p>
            </div>
          )}

          {trade.tags && trade.tags.length > 0 && (
            <div className="detail-card">
              <h3>🏷️ {t('tags')}</h3>
              <div className="detail-tags">
                {trade.tags.map(tag => (
                  <span key={tag} className="tag-pill" style={{ background: '#3b82f6' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="trade-detail-sidebar">
          <div className="detail-card">
            <h3>📸 {t('screenshot')}</h3>
            {trade.screenshot ? (
              <div className="screenshot-container">
                <img src={trade.screenshot} alt="Trade screenshot" />
              </div>
            ) : (
              <p className="no-screenshot">Aucune capture d'écran</p>
            )}
          </div>

          <div className="detail-card">
            <h3>📊 Statistiques</h3>
            <div className="stats-list">
              <div className="stat-row">
                <span>Balance</span>
                <span className="font-mono">{formatCurrency(accountBalance, settings.currency)}</span>
              </div>
              <div className="stat-row">
                <span>Capital Initial</span>
                <span className="font-mono">{formatCurrency(settings.initialCapital, settings.currency)}</span>
              </div>
              <div className="stat-row">
                <span>P&L Total</span>
                <span className={`font-mono ${accountBalance >= settings.initialCapital ? 'positive' : 'negative'}`}>
                  {formatCurrency(accountBalance - settings.initialCapital, settings.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
