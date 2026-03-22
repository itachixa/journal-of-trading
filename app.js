// ========================================
// ProTrade Journal - Main Application
// ========================================

const STORAGE_KEYS = {
    TRADES: 'protrade_trades',
    SETTINGS: 'protrade_settings',
    NOTES: 'protrade_notes',
    CHECKLIST: 'protrade_checklist'
};

const DEFAULT_SETTINGS = {
    initialCapital: 10000,
    theme: 'dark'
};

let state = {
    trades: [],
    settings: { ...DEFAULT_SETTINGS },
    notes: [],
    checklist: {},
    currentSection: 'dashboard',
    editingTradeId: null
};

let charts = {
    equity: null,
    pair: null,
    winrate: null
};

let currentChartRange = 'all';
let currentTimeRange = 'all';
let zoomLevel = 100;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeApp();
    setupEventListeners();
    updateUI();
});

function loadData() {
    try {
        state.trades = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADES)) || [];
        state.settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || { ...DEFAULT_SETTINGS };
        state.notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
        state.checklist = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST)) || {};
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(state.trades));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes));
        localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(state.checklist));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

function initializeApp() {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    
    // Set default date
    document.getElementById('tradeDate').value = new Date().toISOString().slice(0, 16);
    document.getElementById('initialCapital').value = state.settings.initialCapital;
    
    // Update theme button
    updateThemeButton();
    
    // Initialize charts
    initCharts();
    
    // Render checklist and notes
    renderChecklist();
    renderNotes();
    
    // Check for voice support
    initVoiceInput();
}

function updateThemeButton() {
    const themeBtn = document.getElementById('themeToggle');
    if (state.settings.theme === 'dark') {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i><span>Mode Clair</span>';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i><span>Mode Sombre</span>';
    }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Mobile menu
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Trade form
    document.getElementById('tradeForm').addEventListener('submit', handleTradeSubmit);
    document.getElementById('clearForm').addEventListener('click', clearTradeForm);
    
    // RR Calculator
    document.getElementById('stopLoss').addEventListener('input', calculateRR);
    document.getElementById('takeProfit').addEventListener('input', calculateRR);

    // Filters
    document.getElementById('filterPair').addEventListener('change', filterTrades);
    document.getElementById('filterType').addEventListener('change', filterTrades);
    document.getElementById('filterResult').addEventListener('change', filterTrades);
    document.getElementById('filterDate').addEventListener('change', filterTrades);
    document.getElementById('filterTag').addEventListener('change', filterTrades);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Export buttons
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportPDF').addEventListener('click', exportPDF);

    // Chart range buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', handleChartRange);
    });

    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', handleTimeRange);
    });

    // Settings
    document.getElementById('saveCapital').addEventListener('click', saveCapital);
    document.getElementById('exportAllData').addEventListener('click', exportAllData);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);

    // Checklist
    document.getElementById('resetChecklist').addEventListener('click', resetChecklist);
    document.getElementById('saveChecklist').addEventListener('click', saveChecklistState);

    // Notes
    document.getElementById('addNote').addEventListener('click', openNoteModal);
    document.getElementById('cancelNote').addEventListener('click', closeNoteModal);
    document.getElementById('saveNote').addEventListener('click', saveNote);
    document.getElementById('addFirstNote')?.addEventListener('click', openNoteModal);

    // Modals
    document.getElementById('closeModal').addEventListener('click', closeImageModal);
    document.getElementById('closeNoteModal').addEventListener('click', closeNoteModal);
    
    // Image zoom
    document.getElementById('zoomIn').addEventListener('click', () => handleZoom(10));
    document.getElementById('zoomOut').addEventListener('click', () => handleZoom(-10));
    document.getElementById('resetZoom').addEventListener('click', resetZoom);

    // Close modals on backdrop click
    document.getElementById('imageModal').addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') closeImageModal();
    });
    document.getElementById('noteModal').addEventListener('click', (e) => {
        if (e.target.id === 'noteModal') closeNoteModal();
    });

    // See all trades link
    document.querySelector('[data-section="trades"]')?.addEventListener('click', (e) => {
        // Already handled by nav
    });
}

// ========================================
// Navigation
// ========================================

function handleNavigation(e) {
    e.preventDefault();
    const target = e.currentTarget.dataset.section;
    if (!target) return;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // Show target section
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById(target).classList.add('active');

    // Update header title
    const titles = {
        'dashboard': 'Dashboard',
        'add-trade': 'Ajouter un Trade',
        'trades': 'Mes Trades',
        'stats': 'Statistiques',
        'checklist': 'Checklist Avant Trade',
        'notes': 'Notes de Marché',
        'settings': 'Paramètres'
    };
    document.querySelector('.header-title h1').textContent = titles[target] || 'Dashboard';

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('active');

    state.currentSection = target;

    // Section-specific updates
    if (target === 'trades') {
        renderTradesTable();
    } else if (target === 'stats') {
        updateDetailedStats();
    } else if (target === 'dashboard') {
        renderRecentTrades();
        updateCharts();
    }
}

// ========================================
// Theme
// ========================================

function toggleTheme() {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    updateThemeButton();
    saveData();
    updateCharts();
}

// ========================================
// Trade Management
// ========================================

function handleTradeSubmit(e) {
    e.preventDefault();

    const trade = {
        id: state.editingTradeId || Date.now(),
        date: document.getElementById('tradeDate').value,
        pair: document.getElementById('pair').value,
        tradeType: document.getElementById('tradeType').value,
        tradingType: document.getElementById('tradingType').value,
        lotSize: parseFloat(document.getElementById('lotSize').value) || 0,
        riskPercent: parseFloat(document.getElementById('riskPercent').value) || 2,
        stopLoss: parseFloat(document.getElementById('stopLoss').value) || 0,
        takeProfit: parseFloat(document.getElementById('takeProfit').value) || 0,
        rr: calculateRRValue(),
        result: parseFloat(document.getElementById('result').value) || 0,
        resultPercent: parseFloat(document.getElementById('resultPercent').value) || 0,
        tags: getSelectedTags(),
        comment: document.getElementById('comment').value,
        screenshot: null,
        createdAt: state.editingTradeId ? 
            state.trades.find(t => t.id === state.editingTradeId)?.createdAt : 
            new Date().toISOString()
    };

    // Handle screenshot
    const screenshotInput = document.getElementById('screenshot');
    if (screenshotInput.files && screenshotInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            trade.screenshot = event.target.result;
            saveTrade(trade);
        };
        reader.readAsDataURL(screenshotInput.files[0]);
    } else {
        // Keep existing screenshot if editing
        if (state.editingTradeId) {
            const existingTrade = state.trades.find(t => t.id === state.editingTradeId);
            if (existingTrade) trade.screenshot = existingTrade.screenshot;
        }
        saveTrade(trade);
    }
}

function saveTrade(trade) {
    if (state.editingTradeId) {
        // Update existing trade
        const index = state.trades.findIndex(t => t.id === state.editingTradeId);
        if (index !== -1) {
            state.trades[index] = trade;
        }
        state.editingTradeId = null;
        showToast('Trade mis à jour!', 'success');
    } else {
        // Add new trade
        state.trades.push(trade);
        showToast('Trade enregistré!', 'success');
    }

    saveData();
    clearTradeForm();
    updateUI();
    
    // Navigate to trades
    document.querySelector('[data-section="trades"]').click();
}

function calculateRRValue() {
    const sl = parseFloat(document.getElementById('stopLoss').value) || 0;
    const tp = parseFloat(document.getElementById('takeProfit').value) || 0;
    return sl > 0 ? (tp / sl).toFixed(2) : '0.00';
}

function calculateRR() {
    const sl = parseFloat(document.getElementById('stopLoss').value) || 0;
    const tp = parseFloat(document.getElementById('takeProfit').value) || 0;
    if (sl > 0 && tp > 0) {
        document.getElementById('rrDisplay').value = `1:${(tp / sl).toFixed(2)}`;
    } else {
        document.getElementById('rrDisplay').value = '1:0';
    }
}

function getSelectedTags() {
    const checkboxes = document.querySelectorAll('input[name="tags"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function clearTradeForm() {
    document.getElementById('tradeForm').reset();
    document.getElementById('tradeDate').value = new Date().toISOString().slice(0, 16);
    document.getElementById('rrDisplay').value = '';
    document.getElementById('result').value = '';
    document.getElementById('resultPercent').value = '';
    state.editingTradeId = null;
}

function editTrade(tradeId) {
    const trade = state.trades.find(t => t.id === tradeId);
    if (!trade) return;

    state.editingTradeId = tradeId;
    
    document.getElementById('tradeDate').value = trade.date;
    document.getElementById('pair').value = trade.pair;
    document.getElementById('tradeType').value = trade.tradeType;
    document.getElementById('tradingType').value = trade.tradingType;
    document.getElementById('lotSize').value = trade.lotSize;
    document.getElementById('riskPercent').value = trade.riskPercent;
    document.getElementById('stopLoss').value = trade.stopLoss;
    document.getElementById('takeProfit').value = trade.takeProfit;
    document.getElementById('rrDisplay').value = `1:${trade.rr}`;
    document.getElementById('result').value = trade.result;
    document.getElementById('resultPercent').value = trade.resultPercent;
    document.getElementById('comment').value = trade.comment || '';

    // Set tags
    document.querySelectorAll('input[name="tags"]').forEach(cb => {
        cb.checked = trade.tags?.includes(cb.value) || false;
    });

    // Navigate to add trade form
    document.querySelector('[data-section="add-trade"]').click();
    showToast('Mode édition activé', 'success');
}

function deleteTrade(tradeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce trade?')) return;
    
    state.trades = state.trades.filter(t => t.id !== tradeId);
    saveData();
    updateUI();
    renderTradesTable();
    showToast('Trade supprimé', 'success');
}

// ========================================
// Trade View
// ========================================

function viewTradeScreenshot(tradeId) {
    const trade = state.trades.find(t => t.id === tradeId);
    if (trade && trade.screenshot) {
        document.getElementById('modalImage').src = trade.screenshot;
        document.getElementById('imageModal').classList.add('active');
        resetZoom();
    }
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
}

// ========================================
// Image Zoom
// ========================================

function handleZoom(delta) {
    zoomLevel = Math.max(50, Math.min(200, zoomLevel + delta));
    document.getElementById('zoomLevel').textContent = `${zoomLevel}%`;
    document.getElementById('modalImage').style.transform = `scale(${zoomLevel / 100})`;
}

function resetZoom() {
    zoomLevel = 100;
    document.getElementById('zoomLevel').textContent = '100%';
    document.getElementById('modalImage').style.transform = 'scale(1)';
}

// ========================================
// Filters
// ========================================

function filterTrades() {
    renderTradesTable();
}

function clearFilters() {
    document.getElementById('filterPair').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterResult').value = '';
    document.getElementById('filterDate').value = '';
    document.getElementById('filterTag').value = '';
    renderTradesTable();
}

function getFilteredTrades() {
    const pair = document.getElementById('filterPair').value;
    const type = document.getElementById('filterType').value;
    const result = document.getElementById('filterResult').value;
    const date = document.getElementById('filterDate').value;
    const tag = document.getElementById('filterTag').value;

    return state.trades.filter(trade => {
        if (pair && trade.pair !== pair) return false;
        if (type && trade.tradeType !== type) return false;
        if (result === 'win' && trade.result <= 0) return false;
        if (result === 'loss' && trade.result >= 0) return false;
        if (result === 'breakeven' && trade.result !== 0) return false;
        if (date && trade.date.slice(0, 10) !== date) return false;
        if (tag && !trade.tags?.includes(tag)) return false;
        return true;
    });
}

// ========================================
// Statistics
// ========================================

function calculateStats(trades = state.trades) {
    if (trades.length === 0) {
        return {
            totalTrades: 0, wins: 0, losses: 0, winrate: 0,
            totalProfit: 0, grossProfit: 0, grossLoss: 0,
            profitFactor: 0, avgWin: 0, avgLoss: 0,
            maxWin: 0, maxLoss: 0, drawdown: 0, disciplineScore: 0
        };
    }

    const wins = trades.filter(t => t.result > 0);
    const losses = trades.filter(t => t.result < 0);
    
    const grossProfit = wins.reduce((sum, t) => sum + t.result, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.result, 0));
    const totalProfit = trades.reduce((sum, t) => sum + t.result, 0);
    
    const maxWin = Math.max(0, ...trades.map(t => t.result));
    const maxLoss = Math.min(0, ...trades.map(t => t.result));

    // Calculate drawdown
    let peak = state.settings.initialCapital;
    let drawdown = 0;
    let capital = state.settings.initialCapital;
    
    trades.forEach(trade => {
        capital += trade.result;
        if (capital > peak) peak = capital;
        const dd = ((peak - capital) / peak) * 100;
        if (dd > drawdown) drawdown = dd;
    });

    const disciplineScore = calculateDisciplineScore(trades);

    return {
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winrate: trades.length > 0 ? (wins.length / trades.length * 100).toFixed(1) : 0,
        totalProfit: totalProfit.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        grossLoss: grossLoss.toFixed(2),
        profitFactor: grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? 'inf' : '0.00',
        avgWin: wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : 0,
        avgLoss: losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : 0,
        maxWin: maxWin.toFixed(2),
        maxLoss: maxLoss.toFixed(2),
        drawdown: drawdown.toFixed(1),
        disciplineScore
    };
}

function calculateDisciplineScore(trades) {
    if (trades.length === 0) return 0;
    
    let score = 0;
    
    // Good RR (>= 3)
    const goodRR = trades.filter(t => parseFloat(t.rr) >= 3).length;
    score += (goodRR / trades.length) * 40;
    
    // With comments
    const withComments = trades.filter(t => t.comment && t.comment.length > 10).length;
    score += (withComments / trades.length) * 30;
    
    // With tags
    const withTags = trades.filter(t => t.tags && t.tags.length > 0).length;
    score += (withTags / trades.length) * 30;
    
    return Math.round(score);
}

function getTradesByTimeRange() {
    if (currentTimeRange === 'all') return state.trades;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (currentTimeRange) {
        case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
    }
    
    return state.trades.filter(trade => new Date(trade.date) >= startDate);
}

function updateDetailedStats() {
    const stats = calculateStats();
    
    document.getElementById('detailWinrate').textContent = `${stats.winrate}%`;
    document.getElementById('detailProfitFactor').textContent = stats.profitFactor;
    document.getElementById('detailAvgWin').textContent = `$${stats.avgWin}`;
    document.getElementById('detailAvgLoss').textContent = `$${stats.avgLoss}`;
    
    // Average RR
    const avgRR = state.trades.length > 0 
        ? (state.trades.reduce((sum, t) => sum + parseFloat(t.rr || 0), 0) / state.trades.length).toFixed(1)
        : 0;
    document.getElementById('detailAvgRR').textContent = `1:${avgRR}`;
    
    // Consecutive wins/losses
    let consecutiveWins = 0, consecutiveLosses = 0;
    let currentWins = 0, currentLosses = 0;
    
    state.trades.forEach(trade => {
        if (trade.result > 0) {
            currentWins++;
            currentLosses = 0;
            if (currentWins > consecutiveWins) consecutiveWins = currentWins;
        } else if (trade.result < 0) {
            currentLosses++;
            currentWins = 0;
            if (currentLosses > consecutiveLosses) consecutiveLosses = currentLosses;
        } else {
            currentWins = 0;
            currentLosses = 0;
        }
    });
    
    document.getElementById('detailConsecutiveWins').textContent = consecutiveWins;
    document.getElementById('detailConsecutiveLosses').textContent = consecutiveLosses;
    document.getElementById('detailMaxWin').textContent = `$${stats.maxWin}`;
    
    updateStatsByPair();
    updateStatsByType();
    updateStatsByRR();
}

function updateStatsByPair() {
    const container = document.getElementById('statsByPair');
    const pairStats = {};
    
    state.trades.forEach(trade => {
        if (!pairStats[trade.pair]) {
            pairStats[trade.pair] = { trades: 0, wins: 0, profit: 0 };
        }
        pairStats[trade.pair].trades++;
        if (trade.result > 0) pairStats[trade.pair].wins++;
        pairStats[trade.pair].profit += trade.result;
    });
    
    if (Object.keys(pairStats).length === 0) {
        container.innerHTML = '<div class="empty-state small"><p>Aucune donnée</p></div>';
        return;
    }
    
    let html = '';
    for (const pair in pairStats) {
        const stats = pairStats[pair];
        const winrate = ((stats.wins / stats.trades) * 100).toFixed(0);
        const profitClass = stats.profit >= 0 ? 'positive' : 'negative';
        html += `
            <div class="breakdown-item">
                <span class="breakdown-pair">${pair}</span>
                <span class="breakdown-value ${profitClass}">$${stats.profit.toFixed(2)} (${winrate}%)</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

function updateStatsByType() {
    const container = document.getElementById('statsByType');
    const typeStats = {};
    
    state.trades.forEach(trade => {
        if (!typeStats[trade.tradingType]) {
            typeStats[trade.tradingType] = { trades: 0, wins: 0, profit: 0 };
        }
        typeStats[trade.tradingType].trades++;
        if (trade.result > 0) typeStats[trade.tradingType].wins++;
        typeStats[trade.tradingType].profit += trade.result;
    });
    
    if (Object.keys(typeStats).length === 0) {
        container.innerHTML = '<div class="empty-state small"><p>Aucune donnée</p></div>';
        return;
    }
    
    let html = '';
    for (const type in typeStats) {
        const stats = typeStats[type];
        const winrate = ((stats.wins / stats.trades) * 100).toFixed(0);
        const profitClass = stats.profit >= 0 ? 'positive' : 'negative';
        html += `
            <div class="breakdown-item">
                <span class="breakdown-pair">${type}</span>
                <span class="breakdown-value ${profitClass}">$${stats.profit.toFixed(2)} (${winrate}%)</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

function updateStatsByRR() {
    const container = document.getElementById('statsByRR');
    const rrStats = {
        '<1:1': { trades: 0, wins: 0, profit: 0 },
        '1:1-1:2': { trades: 0, wins: 0, profit: 0 },
        '1:2-1:3': { trades: 0, wins: 0, profit: 0 },
        '>1:3': { trades: 0, wins: 0, profit: 0 }
    };
    
    state.trades.forEach(trade => {
        const rr = parseFloat(trade.rr) || 0;
        let category;
        if (rr < 1) category = '<1:1';
        else if (rr < 2) category = '1:1-1:2';
        else if (rr < 3) category = '1:2-1:3';
        else category = '>1:3';
        
        rrStats[category].trades++;
        if (trade.result > 0) rrStats[category].wins++;
        rrStats[category].profit += trade.result;
    });
    
    const hasData = Object.values(rrStats).some(s => s.trades > 0);
    if (!hasData) {
        container.innerHTML = '<div class="empty-state small"><p>Aucune donnée</p></div>';
        return;
    }
    
    let html = '';
    for (const rr in rrStats) {
        const stats = rrStats[rr];
        const winrate = stats.trades > 0 ? ((stats.wins / stats.trades) * 100).toFixed(0) : 0;
        const profitClass = stats.profit >= 0 ? 'positive' : 'negative';
        html += `
            <div class="breakdown-item">
                <span class="breakdown-pair">${rr}</span>
                <span class="breakdown-value ${profitClass}">$${stats.profit.toFixed(2)} (${winrate}%)</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ========================================
// Time Range
// ========================================

function handleTimeRange(e) {
    const range = e.target.dataset.time;
    if (!range) return;
    
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentTimeRange = range;
    updateUI();
}

function handleChartRange(e) {
    const range = e.target.dataset.range;
    if (!range) return;
    
    document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentChartRange = range;
    updateCharts();
}

// ========================================
// Charts
// ========================================

function initCharts() {
    initEquityChart();
    initPairChart();
    initWinrateChart();
    updateCharts();
}

function initEquityChart() {
    const ctx = document.getElementById('equityChart');
    if (!ctx) return;
    
    charts.equity = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Capital',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => `$${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { callback: (value) => `$${value.toFixed(0)}` }
                }
            }
        }
    });
}

function initPairChart() {
    const ctx = document.getElementById('pairChart');
    if (!ctx) return;
    
    charts.pair = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { usePointStyle: true, padding: 20 }
                }
            }
        }
    });
}

function initWinrateChart() {
    const ctx = document.getElementById('winrateChart');
    if (!ctx) return;
    
    charts.winrate = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '70%'
        }
    });
}

function updateCharts() {
    updateEquityChart();
    updatePairChart();
    updateWinrateChart();
}

function getTradesByChartRange() {
    if (currentChartRange === 'all') return state.trades;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (currentChartRange) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
    }
    
    return state.trades.filter(trade => new Date(trade.date) >= startDate);
}

function updateEquityChart() {
    const trades = getTradesByChartRange();
    const initialCapital = state.settings.initialCapital;
    
    const labels = [];
    const data = [];
    let capital = initialCapital;
    
    // Sort by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTrades.forEach(trade => {
        capital += trade.result;
        labels.push(new Date(trade.date).toLocaleDateString('fr-FR'));
        data.push(capital);
    });
    
    if (charts.equity) {
        charts.equity.data.labels = labels;
        charts.equity.data.datasets[0].data = data;
        charts.equity.update();
    }
}

function updatePairChart() {
    const pairCounts = {};
    
    state.trades.forEach(trade => {
        if (!pairCounts[trade.pair]) pairCounts[trade.pair] = 0;
        pairCounts[trade.pair]++;
    });
    
    const labels = Object.keys(pairCounts);
    const data = Object.values(pairCounts);
    
    if (charts.pair) {
        charts.pair.data.labels = labels;
        charts.pair.data.datasets[0].data = data;
        charts.pair.update();
    }
}

function updateWinrateChart() {
    const stats = calculateStats();
    
    if (charts.winrate) {
        charts.winrate.data.datasets[0].data = [stats.wins, stats.losses];
        charts.winrate.update();
    }
}

// ========================================
// UI Updates
// ========================================

function updateUI() {
    const filteredTrades = getTradesByTimeRange();
    const stats = calculateStats(filteredTrades);
    
    // Dashboard stats
    document.getElementById('statWinrate').textContent = `${stats.winrate}%`;
    document.getElementById('statTotalTrades').textContent = stats.totalTrades;
    
    const profitEl = document.getElementById('statProfit');
    profitEl.textContent = `${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit}`;
    profitEl.className = `stat-value ${stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}`;
    
    document.getElementById('statProfitFactor').textContent = stats.profitFactor;
    document.getElementById('statDiscipline').textContent = `${stats.disciplineScore}/100`;
    document.getElementById('statDrawdown').textContent = `${stats.drawdown}%`;
    
    // Capital display
    const currentCapital = state.settings.initialCapital + parseFloat(stats.totalProfit);
    document.getElementById('displayCapital').textContent = `$${currentCapital.toFixed(2)}`;
    
    renderRecentTrades();
    updateCharts();
}

function renderTradesTable() {
    const trades = getFilteredTrades();
    const tbody = document.getElementById('tradesTableBody');
    const emptyState = document.getElementById('emptyTrades');
    
    if (trades.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Sort by date descending
    trades.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    trades.forEach(trade => {
        const resultClass = trade.result > 0 ? 'win' : (trade.result < 0 ? 'loss' : '');
        const resultPrefix = trade.result > 0 ? '+' : '';
        
        html += `
            <tr>
                <td>${new Date(trade.date).toLocaleDateString('fr-FR')}</td>
                <td><span class="pair-badge">${trade.pair}</span></td>
                <td><span class="trade-type ${trade.tradeType.toLowerCase()}">${trade.tradeType}</span></td>
                <td>${trade.tradingType}</td>
                <td>${trade.lotSize}</td>
                <td>${trade.stopLoss}</td>
                <td>${trade.takeProfit}</td>
                <td>1:${trade.rr}</td>
                <td class="result-cell ${resultClass}">${resultPrefix}$${trade.result.toFixed(2)}</td>
                <td class="actions-cell">
                    ${trade.screenshot ? `<button class="btn-icon" onclick="viewTradeScreenshot(${trade.id})" title="Voir capture"><i class="fas fa-image"></i></button>` : ''}
                    <button class="btn-icon" onclick="editTrade(${trade.id})" title="Éditer"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" onclick="deleteTrade(${trade.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function renderRecentTrades() {
    const recentTrades = state.trades.slice(-5).reverse();
    const container = document.getElementById('recentTrades');
    
    if (recentTrades.length === 0) {
        container.innerHTML = `
            <div class="empty-state small">
                <i class="fas fa-inbox"></i>
                <p>Aucun trade récent</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    recentTrades.forEach(trade => {
        const resultClass = trade.result > 0 ? 'win' : (trade.result < 0 ? 'loss' : '');
        html += `
            <div class="trade-item">
                <div class="trade-info">
                    <span class="trade-pair">${trade.pair}</span>
                    <span class="trade-type ${trade.tradeType.toLowerCase()}">${trade.tradeType}</span>
                </div>
                <span class="trade-result ${resultClass}">${trade.result > 0 ? '+' : ''}$${trade.result.toFixed(2)}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========================================
// Checklist
// ========================================

function renderChecklist() {
    const checklistItems = document.querySelectorAll('.checklist-item input');
    const savedState = state.checklist || {};
    
    checklistItems.forEach(item => {
        item.checked = savedState[item.id] || false;
    });
}

function saveChecklistState() {
    const checklistItems = document.querySelectorAll('.checklist-item input');
    const savedState = {};
    
    checklistItems.forEach(item => {
        savedState[item.id] = item.checked;
    });
    
    state.checklist = savedState;
    saveData();
    showToast('Checklist sauvegardée!', 'success');
}

function resetChecklist() {
    const checklistItems = document.querySelectorAll('.checklist-item input');
    checklistItems.forEach(item => item.checked = false);
    state.checklist = {};
    saveData();
    showToast('Checklist réinitialisée', 'success');
}

// ========================================
// Notes
// ========================================

function renderNotes() {
    const container = document.getElementById('notesContainer');
    const emptyState = document.getElementById('emptyNotes');
    
    if (state.notes.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        container.innerHTML = '';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Sort by date descending
    const sortedNotes = [...state.notes].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    sortedNotes.forEach(note => {
        html += `
            <div class="note-card">
                <div class="note-header">
                    <div>
                        <h4 class="note-title">${note.title || 'Note'}</h4>
                        <span class="note-date">${new Date(note.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div class="note-actions">
                        <button class="note-btn" onclick="editNote(${note.id})" title="Éditer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-btn delete" onclick="deleteNote(${note.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="note-content">${note.content}</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function openNoteModal(noteId = null) {
    const modal = document.getElementById('noteModal');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (noteId) {
        const note = state.notes.find(n => n.id === noteId);
        if (note) {
            titleInput.value = note.title || '';
            contentInput.value = note.content || '';
            modal.dataset.editingId = noteId;
        }
    } else {
        titleInput.value = '';
        contentInput.value = '';
        modal.dataset.editingId = '';
    }
    
    modal.classList.add('active');
    contentInput.focus();
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const modal = document.getElementById('noteModal');
    const editingId = modal.dataset.editingId;
    
    if (!content) {
        showToast('Veuillez entrer du contenu', 'error');
        return;
    }
    
    if (editingId) {
        // Update existing note
        const note = state.notes.find(n => n.id === parseInt(editingId));
        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toISOString();
        }
        showToast('Note mise à jour!', 'success');
    } else {
        // Create new note
        const note = {
            id: Date.now(),
            date: new Date().toISOString(),
            title,
            content
        };
        state.notes.push(note);
        showToast('Note sauvegardée!', 'success');
    }
    
    saveData();
    closeNoteModal();
    renderNotes();
}

function editNote(noteId) {
    openNoteModal(noteId);
}

function deleteNote(noteId) {
    if (!confirm('Êtes-vous sûr?')) return;
    
    state.notes = state.notes.filter(n => n.id !== noteId);
    saveData();
    renderNotes();
    showToast('Note supprimée', 'success');
}

// ========================================
// Settings
// ========================================

function saveCapital() {
    const capital = parseFloat(document.getElementById('initialCapital').value);
    
    if (isNaN(capital) || capital <= 0) {
        showToast('Veuillez entrer un capital valide', 'error');
        return;
    }
    
    state.settings.initialCapital = capital;
    saveData();
    updateUI();
    showToast('Capital mis à jour!', 'success');
}

function exportAllData() {
    const data = {
        trades: state.trades,
        settings: state.settings,
        notes: state.notes,
        checklist: state.checklist,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protrade_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Données exportées!', 'success');
}

function clearAllData() {
    if (!confirm('Êtes-vous sûr de vouloir effacer TOUTES les données? Cette action est irréversible!')) return;
    
    state.trades = [];
    state.notes = [];
    state.checklist = {};
    saveData();
    updateUI();
    showToast('Données effacées', 'success');
}

// ========================================
// Export
// ========================================

function exportCSV() {
    const trades = getFilteredTrades();
    
    if (trades.length === 0) {
        showToast('Aucune donnée à exporter', 'error');
        return;
    }
    
    const headers = ['Date', 'Paire', 'Type', 'Style', 'Lot', 'SL', 'TP', 'RR', 'Résultat', 'Tags', 'Commentaire'];
    const rows = trades.map(trade => [
        trade.date,
        trade.pair,
        trade.tradeType,
        trade.tradingType,
        trade.lotSize,
        trade.stopLoss,
        trade.takeProfit,
        trade.rr,
        trade.result,
        (trade.tags || []).join(', '),
        (trade.comment || '').replace(/"/g, '""')
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protrade_trades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Export CSV terminé!', 'success');
}

function exportPDF() {
    const trades = getFilteredTrades();
    
    if (trades.length === 0) {
        showToast('Aucune donnée à exporter', 'error');
        return;
    }
    
    const stats = calculateStats(trades);
    
    let content = `PROTRADE JOURNAL - RAPPORT
=====================================

Date: ${new Date().toLocaleDateString('fr-FR')}

STATISTIQUES GLOBALES
---------------------------------------
Total Trades: ${stats.totalTrades}
Winrate: ${stats.winrate}%
Profit Total: $${stats.totalProfit}
Profit Factor: ${stats.profitFactor}
Score Discipline: ${stats.disciplineScore}/100

DERNIERS TRADES
---------------------------------------
`;
    
    trades.slice(0, 20).forEach((trade, index) => {
        content += `
${index + 1}. ${trade.pair} - ${trade.tradeType} - ${trade.result >= 0 ? '+' : ''}$${trade.result.toFixed(2)}
   Date: ${new Date(trade.date).toLocaleDateString('fr-FR')}
   RR: 1:${trade.rr}
   ${trade.comment ? `Commentaire: ${trade.comment}` : ''}
`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protrade_rapport_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Export terminé!', 'success');
}

// ========================================
// Toast Notifications
// ========================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// Voice Input (Bonus Feature)
// ========================================

function initVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Voice input not supported');
        return;
    }
    
    const noteContent = document.getElementById('noteContent');
    if (!noteContent) return;
    
    // Add voice button to note modal
    const noteModalContent = document.querySelector('.note-modal-content');
    if (!noteModalContent) return;
    
    // Create voice button
    const voiceBtn = document.createElement('button');
    voiceBtn.type = 'button';
    voiceBtn.className = 'btn-icon voice-btn';
    voiceBtn.title = 'Dictée vocale';
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.style.marginTop = '10px';
    
    voiceBtn.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'fr-FR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        voiceBtn.innerHTML = '<i class="fas fa-microphone fa-spin"></i>';
        voiceBtn.classList.add('recording');
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            noteContent.value += (noteContent.value ? ' ' : '') + transcript;
            showToast('Texte dicté ajouté', 'success');
        };
        
        recognition.onerror = (event) => {
            showToast('Erreur de reconnaissance vocale', 'error');
        };
        
        recognition.onend = () => {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.classList.remove('recording');
        };
        
        recognition.start();
    });
    
    // Add voice button after note content textarea
    const formGroup = noteContent.closest('.form-group');
    if (formGroup && !formGroup.querySelector('.voice-btn')) {
        formGroup.appendChild(voiceBtn);
    }
}

// ========================================
// AI Trading Coach (Core Feature)
// ========================================

function analyzeTradingPerformance() {
    const stats = calculateStats();
    const trades = state.trades;
    
    if (trades.length < 3) {
        return {
            score: 0,
            feedback: ['Ajoutez au moins 3 trades pour obtenir une analyse complète.'],
            suggestions: ['Commencez par enregistrer vos trades régulièrement.']
        };
    }
    
    const feedback = [];
    const suggestions = [];
    let score = 50; // Base score
    
    // Analyze win rate
    const winrate = parseFloat(stats.winrate);
    if (winrate < 40) {
        feedback.push('⚠️ Votre winrate est faible (< 40%). Travaillez votre stratégie.');
        suggestions.push('Concentrez-vous sur des setups à plus forte probabilité.');
    } else if (winrate >= 50 && winrate < 60) {
        feedback.push('✅ Winrate correct (50-60%). Continuez!');
        score += 10;
    } else if (winrate >= 60) {
        feedback.push('🎯 Excellent winrate (> 60%)!');
        score += 20;
    }
    
    // Analyze profit factor
    const pf = parseFloat(stats.profitFactor);
    if (pf < 1) {
        feedback.push('⚠️ Profit Factor < 1: Vous perdez de l\'argent.');
        suggestions.push('Réduisez votre risque par trade à 1% temporairement.');
    } else if (pf >= 1 && pf < 1.5) {
        feedback.push('⚠️ Profit Factor faible. Améliorez votre RR.');
        suggestions.push('Visez un RR minimum de 1:2.');
        score += 5;
    } else if (pf >= 1.5 && pf < 2) {
        feedback.push('✅ Profit Factor correct. Bien joué!');
        score += 15;
    } else if (pf >= 2) {
        feedback.push('🔥 Excellent Profit Factor (> 2)!');
        score += 25;
    }
    
    // Analyze overtrading
    const recentTrades = trades.slice(-20);
    const thisWeek = recentTrades.filter(t => {
        const tradeDate = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tradeDate >= weekAgo;
    });
    
    if (thisWeek.length > 15) {
        feedback.push('⚠️ Vous surtradez cette semaine!');
        suggestions.push('Attendez des opportunités claires. La patience est clé.');
        score -= 10;
    } else if (thisWeek.length <= 10 && thisWeek.length >= 5) {
        feedback.push('📊 Bon nombre de trades cette semaine.');
        score += 5;
    }
    
    // Analyze losses
    const avgLoss = parseFloat(stats.avgLoss);
    const avgWin = parseFloat(stats.avgWin);
    
    if (avgWin > 0 && avgLoss > 0) {
        const actualRR = avgWin / avgLoss;
        if (actualRR < 1.5) {
            feedback.push('⚠️ Vos pertes sont trop grandes par rapport à vos gains.');
            suggestions.push('Elargissez votre Stop Loss ou réduisez la taille de position.');
            score -= 10;
        } else if (actualRR >= 2) {
            feedback.push('💪 Bon Risk/Reward moyen!');
            score += 15;
        }
    }
    
    // Analyze discipline
    const discipline = stats.disciplineScore;
    if (discipline >= 80) {
        feedback.push('⭐ Très bonne discipline!');


        score += 10;
    } else if (discipline < 50) {
        feedback.push('📝 Travaillez votre discipline.');
        suggestions.push('Ajoutez des commentaires et des tags à vos trades.');
        score -= 5;
    }
    
    // Analyze by pair
    const pairPerformance = {};
    trades.forEach(t => {
        if (!pairPerformance[t.pair]) pairPerformance[t.pair] = { wins: 0, losses: 0 };
        if (t.result > 0) pairPerformance[t.pair].wins++;
        else if (t.result < 0) pairPerformance[t.pair].losses++;
    });
    
    const losingPairs = Object.entries(pairPerformance)
        .filter(([_, data]) => data.losses > data.wins * 2)
        .map(([pair]) => pair);
    
    if (losingPairs.length > 0) {
        feedback.push(`⚠️ Difficultés avec: ${losingPairs.join(', ')}`);
        suggestions.push(`Évitez temporairement ${losingPairs.join(', ')} ou travaillez ces paires.`);
        score -= 10;
    }
    
    // Cap score
    score = Math.max(0, Math.min(100, score));
    
    return {
        score,
        feedback,
        suggestions
    };
}

// Expose AI analysis globally
window.getAIAnalysis = analyzeTradingPerformance;

// ========================================
// Make functions globally available
// ========================================

window.editTrade = editTrade;
window.deleteTrade = deleteTrade;
window.viewTradeScreenshot = viewTradeScreenshot;
window.deleteNote = deleteNote;
window.editNote = editNote;
