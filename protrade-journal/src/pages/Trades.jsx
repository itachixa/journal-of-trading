import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaThLarge, FaList, FaDownload, FaTrash, FaEdit, FaSearch, FaFilter } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import './Trades.css';

export default function Trades() {
  const { t, trades, deleteTrade, tags, PAIRS } = useApp();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    pair: '',
    type: '',
    result: '',
    date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (filters.pair && trade.pair !== filters.pair) return false;
      if (filters.type && trade.tradeType !== filters.type) return false;
      if (filters.result === 'win' && trade.result <= 0) return false;
      if (filters.result === 'loss' && trade.result >= 0) return false;
      if (filters.date && !trade.date?.startsWith(filters.date)) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!trade.pair?.toLowerCase().includes(searchLower) && 
            !trade.comment?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [trades, filters, searchTerm]);

  const handleClearFilters = () => {
    setFilters({ pair: '', type: '', result: '', date: '' });
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    if (window.confirm(t('delete') + '?')) {
      deleteTrade(id);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Pair', 'Type', 'Style', 'Lot', 'SL', 'TP', 'Result', 'Tags', 'Comment'];
    const rows = filteredTrades.map(trade => [
      trade.date,
      trade.pair,
      trade.tradeType,
      trade.tradingType,
      trade.lotSize,
      trade.stopLoss,
      trade.takeProfit,
      trade.result,
      (trade.tags || []).join('; '),
      trade.comment || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <motion.div 
      className="trades-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="trades-header">
        <div className="header-left">
          <h2>{t('my')} {t('trades')}</h2>
        </div>
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
          </div>
          <button className="btn-secondary" onClick={exportCSV}>
            <FaDownload /> CSV
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder={t('pair') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          value={filters.pair}
          onChange={(e) => setFilters(f => ({ ...f, pair: e.target.value }))}
        >
          <option value="">{t('allPairs')}</option>
          {PAIRS.map(pair => (
            <option key={pair.value} value={pair.value}>{pair.label}</option>
          ))}
        </select>

        <select 
          value={filters.type}
          onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
        >
          <option value="">{t('allTypes')}</option>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>

        <select 
          value={filters.result}
          onChange={(e) => setFilters(f => ({ ...f, result: e.target.value }))}
        >
          <option value="">{t('allResults')}</option>
          <option value="win">{t('win') || 'Gagnants'}</option>
          <option value="loss">{t('loss') || 'Perdants'}</option>
        </select>

        <input 
          type="date"
          value={filters.date}
          onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
        />

        {(filters.pair || filters.type || filters.result || filters.date || searchTerm) && (
          <button className="btn-link" onClick={handleClearFilters}>
            {t('clear')}
          </button>
        )}
      </div>

      <AnimatePresence>
        {viewMode === 'grid' ? (
          <motion.div 
            className="trades-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filteredTrades.length > 0 ? (
              filteredTrades.map((trade, index) => (
                <motion.div 
                  key={trade.id}
                  className="trade-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="trade-card-header">
                    <span className="trade-pair">{trade.pair}</span>
                    <span className={`trade-direction ${trade.tradeType?.toLowerCase()}`}>
                      {trade.tradeType}
                    </span>
                  </div>

                  <div className="trade-card-body">
                    <div className="trade-details">
                      <div className="detail-row">
                        <span className="detail-label">{t('style')}</span>
                        <span className="detail-value">{trade.tradingType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('lotSize')}</span>
                        <span className="detail-value">{trade.lotSize}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('stopLoss')}</span>
                        <span className="detail-value">{trade.stopLoss}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">{t('takeProfit')}</span>
                        <span className="detail-value">{trade.takeProfit}</span>
                      </div>
                    </div>

                    <div className={`trade-result-badge ${trade.result >= 0 ? 'win' : 'loss'}`}>
                      {trade.result >= 0 ? '+' : ''}{trade.result?.toFixed(2)} $
                    </div>
                  </div>

                  {trade.tags?.length > 0 && (
                    <div className="trade-tags">
                      {trade.tags.map((tag, i) => {
                        const tagObj = tags.find(t => t.name === tag);
                        return (
                          <span 
                            key={i} 
                            className="tag-badge"
                            style={{ background: tagObj?.color || '#3b82f6' }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="trade-card-footer">
                    <span className="trade-date">
                      {new Date(trade.date).toLocaleDateString()}
                    </span>
                    <div className="trade-actions">
                      <button className="action-icon" onClick={() => navigate(`/add-trade?id=${trade.id}`)}>
                        <FaEdit />
                      </button>
                      <button className="action-icon danger" onClick={() => handleDelete(trade.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state">
                <p>{t('noTrades')}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="trades-list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <table className="trades-table">
              <thead>
                <tr>
                  <th>{t('dateTime')}</th>
                  <th>{t('pair')}</th>
                  <th>{t('direction')}</th>
                  <th>{t('style')}</th>
                  <th>{t('lotSize')}</th>
                  <th>{t('stopLoss')}</th>
                  <th>{t('takeProfit')}</th>
                  <th>{t('result')}</th>
                  <th>{t('tags')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(trade => (
                  <tr key={trade.id}>
                    <td>{new Date(trade.date).toLocaleDateString()}</td>
                    <td>{trade.pair}</td>
                    <td>
                      <span className={`type-badge ${trade.tradeType?.toLowerCase()}`}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td>{trade.tradingType}</td>
                    <td>{trade.lotSize}</td>
                    <td>{trade.stopLoss}</td>
                    <td>{trade.takeProfit}</td>
                    <td className={trade.result >= 0 ? 'positive' : 'negative'}>
                      {trade.result >= 0 ? '+' : ''}{trade.result?.toFixed(2)}
                    </td>
                    <td>
                      <div className="tags-cell">
                        {trade.tags?.map((tag, i) => (
                          <span key={i} className="tag-small">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => navigate(`/add-trade?id=${trade.id}`)}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(trade.id)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}