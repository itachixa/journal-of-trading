// ProTrading Journal - Complete JavaScript

var STORAGE_KEYS = {
    TRADES: "protrade_trades",
    SETTINGS: "protrade_settings",
    NOTES: "protrade_notes",
    CHECKLIST: "protrade_checklist",
    CUSTOM_TAGS: "protrade_custom_tags"
};

var DEFAULT_TAGS = [
    { name: "BOS", description: "Break of Structure", color: "#3b82f6" },
    { name: "FVG", description: "Fair Value Gap", color: "#8b5cf6" },
    { name: "Liquidity Grab", description: "Chasse aux liquidites", color: "#ef4444" },
    { name: "Trendline", description: "Cassure de tendance", color: "#10b981" },
    { name: "Fibo", description: "Fibonacci", color: "#f59e0b" },
    { name: "Support/Resistance", description: "Niveau S/R", color: "#06b6d4" },
    { name: "Price Action", description: "Action des prix", color: "#ec4899" },
    { name: "News", description: "Trade base sur les news", color: "#f97316" }
];

var PIP_VALUES = {
    "XAUUSD": 0.1,
    "EURUSD": 10,
    "GBPUSD": 10,
    "USDJPY": 6.67,
    "BTCUSD": 1,
    "ETHUSD": 1,
    "AUDUSD": 10,
    "USDCAD": 10,
    "NZDUSD": 10,
    "EURJPY": 6.67,
    "GBPJPY": 6.67
};

var DEFAULT_SETTINGS = {
    initialCapital: 10000,
    theme: "light",
    defaultRisk: 2
};

var state = {
    trades: [],
    settings: Object.assign({}, DEFAULT_SETTINGS),
    notes: [],
    checklist: {},
    customTags: [],
    currentSection: "dashboard"
};

var equityChart = null;
var pairChart = null;
var tagWinrateChart = null;
var tagProfitChart = null;
var zoomLevel = 100;
var currentTimeRange = "all";
var currentChartRange = "all";
var selectedTagColor = "#3b82f6";

document.addEventListener("DOMContentLoaded", function() {
    loadData();
    initializeApp();
    setupEventListeners();
    updateUI();
});

// ===== STORAGE =====
function loadData() {
    try {
        state.trades = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADES)) || [];
        state.settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {});
        state.notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
        state.checklist = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST)) || {};
        state.customTags = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_TAGS)) || DEFAULT_TAGS.slice();
    } catch(e) {
        console.error("Error loading data:", e);
        state.customTags = DEFAULT_TAGS.slice();
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(state.trades));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes));
        localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(state.checklist));
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(state.customTags));
    } catch(e) {
        console.error("Error saving data:", e);
    }
}

function initializeApp() {
    document.documentElement.setAttribute("data-theme", state.settings.theme);
    document.getElementById("tradeDate").value = new Date().toISOString().slice(0, 16);
    document.getElementById("initialCapital").value = state.settings.initialCapital;

    var themeBtn = document.getElementById("themeToggle");
    if(state.settings.theme === "dark") {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i><span>Mode Clair</span>';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i><span>Mode Sombre</span>';
    }

    initCharts();
    renderChecklist();
    renderNotes();
    renderTradeTags();
    renderFilterTags();
    initLotCalculator();
    initTradingTools();
    initTagsManager();
    initSurveillance();
    
    // Setup authentication
    setupAuth();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-item").forEach(function(item) {
        item.addEventListener("click", handleNavigation);
    });

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    // Mobile menu
    document.getElementById("menuToggle").addEventListener("click", function() {
        document.getElementById("sidebar").classList.toggle("active");
    });

    // Trade form
    document.getElementById("tradeForm").addEventListener("submit", handleTradeSubmit);
    document.getElementById("clearForm").addEventListener("click", clearTradeForm);
    document.getElementById("stopLoss").addEventListener("input", calculateRR);
    document.getElementById("takeProfit").addEventListener("input", calculateRR);

    // Filters
    document.getElementById("filterPair").addEventListener("change", filterTrades);
    document.getElementById("filterType").addEventListener("change", filterTrades);
    document.getElementById("filterResult").addEventListener("change", filterTrades);
    document.getElementById("filterDate").addEventListener("change", filterTrades);
    document.getElementById("filterTag").addEventListener("change", filterTrades);
    document.getElementById("clearFilters").addEventListener("click", clearFilters);

    // Export
    document.getElementById("exportCSV").addEventListener("click", exportCSV);
    document.getElementById("exportPDF").addEventListener("click", exportPDF);

    // Time range
    document.querySelectorAll(".time-btn").forEach(function(btn) {
        btn.addEventListener("click", handleTimeRange);
    });

    // Chart range
    document.querySelectorAll(".chart-btn").forEach(function(btn) {
        btn.addEventListener("click", handleChartRange);
    });

    // Settings
    document.getElementById("saveCapital").addEventListener("click", saveCapital);
    document.getElementById("exportAllData").addEventListener("click", exportAllData);
    document.getElementById("clearAllData").addEventListener("click", clearAllData);

    // Checklist
    document.getElementById("resetChecklist").addEventListener("click", resetChecklist);
    document.getElementById("saveChecklist").addEventListener("click", saveChecklistState);

    // Notes
    document.getElementById("addNote").addEventListener("click", openNoteModal);
    document.getElementById("addFirstNote").addEventListener("click", openNoteModal);
    document.getElementById("cancelNote").addEventListener("click", closeNoteModal);
    document.getElementById("saveNote").addEventListener("click", saveNote);
    document.getElementById("closeNoteModal").addEventListener("click", closeNoteModal);

    // Image modal
    document.getElementById("closeModal").addEventListener("click", closeImageModal);
    document.getElementById("zoomIn").addEventListener("click", function() { handleZoom(10); });
    document.getElementById("zoomOut").addEventListener("click", function() { handleZoom(-10); });
    document.getElementById("resetZoom").addEventListener("click", resetZoom);
    document.getElementById("imageModal").addEventListener("click", function(e) {
        if (e.target.id === "imageModal") closeImageModal();
    });
    document.getElementById("noteModal").addEventListener("click", function(e) {
        if (e.target.id === "noteModal") closeNoteModal();
    });

    // Tag management
    var manageBtn = document.getElementById("manageTagsBtn");
    if (manageBtn) {
        manageBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            openTagModal();
        });
    }
    document.getElementById("openTagManager").addEventListener("click", function(e) {
        e.preventDefault();
        openTagModal();
    });
    document.getElementById("closeTagModal").addEventListener("click", closeTagModal);
    document.getElementById("addNewTag").addEventListener("click", function(e) {
        e.preventDefault();
        addCustomTag();
    });
    document.getElementById("tagModal").addEventListener("click", function(e) {
        if (e.target.id === "tagModal") closeTagModal();
    });

    // Tag color picker
    document.querySelectorAll(".color-option").forEach(function(opt) {
        opt.addEventListener("click", function() {
            document.querySelectorAll(".color-option").forEach(function(o) { o.classList.remove("active"); });
            opt.classList.add("active");
            selectedTagColor = opt.dataset.color;
            updateTagPreview();
        });
    });

    // Tag preview - live update
    document.getElementById("newTagName").addEventListener("input", updateTagPreview);

    // Lot calculator
    document.getElementById("calculateLot").addEventListener("click", calculateLotSize);
    document.getElementById("calcRiskSlider").addEventListener("input", syncRiskFromSlider);
    document.getElementById("calcRisk").addEventListener("input", syncRiskFromInput);
    document.getElementById("calcBalance").addEventListener("input", calculateLotSize);
    document.getElementById("calcSL").addEventListener("input", calculateLotSize);
    document.getElementById("calcTP").addEventListener("input", calculateLotSize);
    document.getElementById("calcPair").addEventListener("change", calculateLotSize);
    document.getElementById("useConfig").addEventListener("click", useConfigInForm);

    // Risk presets
    document.querySelectorAll(".risk-preset").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var risk = parseFloat(btn.dataset.risk);
            document.querySelectorAll(".risk-preset").forEach(function(b) { b.classList.remove("active"); });
            btn.classList.add("active");
            document.getElementById("calcRisk").value = risk;
            document.getElementById("calcRiskSlider").value = risk;
            state.settings.defaultRisk = risk;
            saveData();
            updateRiskDisplay();
            calculateLotSize();
        });
    });

    // Direction toggle
    document.getElementById("configBuy").addEventListener("click", function() {
        document.getElementById("configBuy").classList.add("active");
        document.getElementById("configSell").classList.remove("active");
    });
    document.getElementById("configSell").addEventListener("click", function() {
        document.getElementById("configSell").classList.add("active");
        document.getElementById("configBuy").classList.remove("active");
    });

    // Enter key on tag name input
    document.getElementById("newTagName").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            addCustomTag();
        }
    });
}

// ===== NAVIGATION =====
function handleNavigation(e) {
    e.preventDefault();
    var target = e.currentTarget.dataset.section;
    if (!target) return;

    document.querySelectorAll(".nav-item").forEach(function(item) {
        item.classList.remove("active");
    });
    e.currentTarget.classList.add("active");

    document.querySelectorAll(".content-section").forEach(function(section) {
        section.classList.remove("active");
    });
    document.getElementById(target).classList.add("active");

    var titles = {
        "dashboard": "Dashboard",
        "lot-calculator": "Calculateur de Lot",
        "trading-tools": "Outils de Trading",
        "tags-manager": "Gestion des Tags",
        "surveillance": "Trade Surveillance",
        "add-trade": "Ajouter un Trade",
        "trades": "Mes Trades",
        "stats": "Statistiques",
        "checklist": "Checklist Avant Trade",
        "notes": "Notes de Marche",
        "settings": "Parametres"
    };
    document.querySelector(".header-title h1").textContent = titles[target] || "Dashboard";

    document.getElementById("sidebar").classList.remove("active");
    state.currentSection = target;

    if (target === "trades") {
        renderTradesTable();
    } else if (target === "stats") {
        updateDetailedStats();
    } else if (target === "lot-calculator") {
        initLotCalculator();
    } else if (target === "trading-tools") {
        initTradingTools();
    } else if (target === "tags-manager") {
        initTagsManager();
    } else if (target === "surveillance") {
        initSurveillance();
    } else if (target === "admin-panel" && isAdmin) {
        loadAdminData();
    }
}

// ===== THEME =====
function toggleTheme() {
    state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.settings.theme);

    var themeBtn = document.getElementById("themeToggle");
    if (state.settings.theme === "dark") {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i><span>Mode Clair</span>';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i><span>Mode Sombre</span>';
    }

    saveData();
    updateCharts();
}

// ===== LOT CALCULATOR =====
function initLotCalculator() {
    var balance = state.settings.initialCapital || 10000;
    var risk = state.settings.defaultRisk || 2;
    document.getElementById("calcBalance").value = balance;
    document.getElementById("calcRisk").value = risk;
    document.getElementById("calcRiskSlider").value = risk;
    updateRiskPresetActive(risk);
    updateRiskDisplay();
}

function updateRiskPresetActive(risk) {
    document.querySelectorAll(".risk-preset").forEach(function(btn) {
        var btnRisk = parseFloat(btn.dataset.risk);
        btn.classList.toggle("active", Math.abs(btnRisk - risk) < 0.01);
    });
}

function syncRiskFromSlider() {
    var val = document.getElementById("calcRiskSlider").value;
    document.getElementById("calcRisk").value = val;
    state.settings.defaultRisk = parseFloat(val);
    saveData();
    updateRiskPresetActive(parseFloat(val));
    updateRiskDisplay();
    calculateLotSize();
}

function syncRiskFromInput() {
    var val = parseFloat(document.getElementById("calcRisk").value) || 2;
    val = Math.max(0.1, Math.min(100, val));
    document.getElementById("calcRiskSlider").value = Math.min(val, 10);
    state.settings.defaultRisk = val;
    saveData();
    updateRiskPresetActive(val);
    updateRiskDisplay();
    calculateLotSize();
}

function updateRiskDisplay() {
    var balance = parseFloat(document.getElementById("calcBalance").value) || 0;
    var risk = parseFloat(document.getElementById("calcRisk").value) || 0;
    var riskAmount = balance * (risk / 100);
    document.getElementById("calcRiskAmount").textContent = "$" + riskAmount.toFixed(2);
}

function calculateLotSize() {
    var balance = parseFloat(document.getElementById("calcBalance").value) || 0;
    var risk = parseFloat(document.getElementById("calcRisk").value) || 0;
    var slPips = parseFloat(document.getElementById("calcSL").value) || 0;
    var tpPips = parseFloat(document.getElementById("calcTP").value) || 0;
    var pair = document.getElementById("calcPair").value;

    updateRiskDisplay();

    if (balance <= 0 || risk <= 0 || slPips <= 0) {
        document.getElementById("resultLotSize").textContent = "0.00";
        document.getElementById("resultRiskAmount").textContent = "$0.00";
        document.getElementById("resultPipValue").textContent = "$0.00";
        document.getElementById("resultRR").textContent = "1:0";
        document.getElementById("resultPotentialProfit").textContent = "$0.00";
        return;
    }

    var riskAmount = balance * (risk / 100);
    var pipValue = PIP_VALUES[pair] || 10;
    var lotSize = riskAmount / (slPips * pipValue);
    lotSize = Math.floor(lotSize * 100) / 100;

    var rr = slPips > 0 ? (tpPips / slPips) : 0;
    var potentialProfit = riskAmount * rr;

    document.getElementById("resultLotSize").textContent = lotSize.toFixed(2);
    document.getElementById("resultRiskAmount").textContent = "$" + riskAmount.toFixed(2);
    document.getElementById("resultPipValue").textContent = "$" + pipValue.toFixed(2);
    document.getElementById("resultRR").textContent = "1:" + rr.toFixed(2);
    document.getElementById("resultPotentialProfit").textContent = "$" + potentialProfit.toFixed(2);

    // Update config summary
    document.getElementById("tradeConfigSummary").style.display = "block";
    document.getElementById("configPair").textContent = pair;
    document.getElementById("configLot").textContent = lotSize.toFixed(2);
    document.getElementById("configSL").textContent = slPips.toFixed(1);
    document.getElementById("configTP").textContent = tpPips > 0 ? tpPips.toFixed(1) : "-";
    document.getElementById("configRisk").textContent = "$" + riskAmount.toFixed(2);
}

function useConfigInForm() {
    var pair = document.getElementById("calcPair").value;
    var lot = document.getElementById("resultLotSize").textContent;
    var sl = document.getElementById("calcSL").value;
    var tp = document.getElementById("calcTP").value;
    var risk = document.getElementById("calcRisk").value;
    var direction = document.getElementById("configSell").classList.contains("active") ? "Sell" : "Buy";

    document.getElementById("pair").value = pair;
    document.getElementById("lotSize").value = lot;
    document.getElementById("stopLoss").value = sl;
    document.getElementById("takeProfit").value = tp;
    document.getElementById("riskPercent").value = risk;
    document.getElementById("tradeType").value = direction;

    calculateRR();

    document.querySelector('[data-section="add-trade"]').click();
    showToast("Configuration transferee!", "success");
}

// ===== CUSTOM TAGS =====
function renderTradeTags() {
    var container = document.getElementById("tradeTagsContainer");
    var html = "";
    state.customTags.forEach(function(tag) {
        var color = tag.color || "#2563eb";
        html += '<label class="tag-checkbox" style="--tag-color:' + color + '">';
        html += '<input type="checkbox" name="tags" value="' + escapeHtml(tag.name) + '">';
        html += '<span>' + escapeHtml(tag.name) + '</span>';
        html += '</label>';
    });
    container.innerHTML = html;
}

function renderFilterTags() {
    var select = document.getElementById("filterTag");
    var currentValue = select.value;
    var html = '<option value="">Tous</option>';
    state.customTags.forEach(function(tag) {
        html += '<option value="' + escapeHtml(tag.name) + '">' + escapeHtml(tag.name) + '</option>';
    });
    select.innerHTML = html;
    select.value = currentValue;
}

function renderExistingTags() {
    var container = document.getElementById("existingTagsList");
    if (state.customTags.length === 0) {
        container.innerHTML = '<h4>Tags existants</h4><p class="text-muted">Aucun tag</p>';
        return;
    }

    var html = '<h4>Tags existants (' + state.customTags.length + ')</h4>';
    state.customTags.forEach(function(tag, index) {
        var color = tag.color || "#2563eb";
        html += '<div class="tag-manager-item">';
        html += '<div class="tag-info">';
        html += '<span class="tag-badge" style="background:' + color + '">' + escapeHtml(tag.name) + '</span>';
        if (tag.description) {
            html += '<span class="tag-desc">' + escapeHtml(tag.description) + '</span>';
        }
        html += '</div>';
        html += '<button class="btn-icon danger" onclick="deleteCustomTag(' + index + ')" title="Supprimer"><i class="fas fa-trash"></i></button>';
        html += '</div>';
    });
    container.innerHTML = html;
}

function renderSettingsTags() {
    var container = document.getElementById("settingsTagsList");
    if (state.customTags.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucun tag personnalise</p>';
        return;
    }
    var html = "";
    state.customTags.forEach(function(tag) {
        var color = tag.color || "#3b82f6";
        html += '<span class="tag-badge" style="background:' + color + '">' + escapeHtml(tag.name) + '</span>';
    });
    container.innerHTML = html;
}

function updateTagPreview() {
    var name = document.getElementById("newTagName").value.trim() || "Nouveau Tag";
    var badge = document.getElementById("tagPreviewBadge");
    badge.textContent = name;
    badge.style.background = selectedTagColor;
}

function addCustomTag() {
    var nameInput = document.getElementById("newTagName");
    var descInput = document.getElementById("newTagDesc");
    var name = nameInput.value.trim();
    var desc = descInput.value.trim();

    if (!name) {
        showToast("Veuillez entrer un nom de tag", "error");
        return;
    }

    var exists = state.customTags.some(function(t) {
        return t.name.toLowerCase() === name.toLowerCase();
    });
    if (exists) {
        showToast("Ce tag existe deja", "error");
        return;
    }

    state.customTags.push({
        name: name,
        description: desc,
        color: selectedTagColor
    });

    saveData();
    nameInput.value = "";
    descInput.value = "";
    renderExistingTags();
    renderTradeTags();
    renderFilterTags();
    renderSettingsTags();
    showToast("Tag \"" + name + "\" cree!", "success");
}

function deleteCustomTag(index) {
    var tagName = state.customTags[index].name;
    if (!confirm("Supprimer le tag \"" + tagName + "\" ?")) return;

    state.customTags.splice(index, 1);
    saveData();
    renderExistingTags();
    renderTradeTags();
    renderFilterTags();
    renderSettingsTags();
    showToast("Tag supprime", "success");
}

function openTagModal() {
    document.getElementById("tagModal").classList.add("active");
    renderExistingTags();
    document.getElementById("newTagName").value = "";
    document.getElementById("newTagDesc").value = "";
    updateTagPreview();
    document.getElementById("newTagName").focus();
}

function closeTagModal() {
    document.getElementById("tagModal").classList.remove("active");
}

// ===== TRADE MANAGEMENT =====
function handleTradeSubmit(e) {
    e.preventDefault();

    var trade = {
        id: Date.now(),
        date: document.getElementById("tradeDate").value,
        pair: document.getElementById("pair").value,
        tradeType: document.getElementById("tradeType").value,
        tradingType: document.getElementById("tradingType").value,
        lotSize: parseFloat(document.getElementById("lotSize").value) || 0,
        riskPercent: parseFloat(document.getElementById("riskPercent").value) || 0,
        stopLoss: parseFloat(document.getElementById("stopLoss").value) || 0,
        takeProfit: parseFloat(document.getElementById("takeProfit").value) || 0,
        rr: calculateRRValue(),
        result: parseFloat(document.getElementById("result").value) || 0,
        resultPercent: parseFloat(document.getElementById("resultPercent").value) || 0,
        tags: getSelectedTags(),
        comment: document.getElementById("comment").value,
        screenshot: null
    };

    var screenshotInput = document.getElementById("screenshot");
    if (screenshotInput.files && screenshotInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(event) {
            trade.screenshot = event.target.result;
            saveTrade(trade);
        };
        reader.readAsDataURL(screenshotInput.files[0]);
    } else {
        saveTrade(trade);
    }
}

function saveTrade(trade) {
    state.trades.push(trade);
    saveData();
    showToast("Trade enregistre!", "success");
    clearTradeForm();
    updateUI();
    document.querySelector('[data-section="trades"]').click();
}

function calculateRRValue() {
    var sl = parseFloat(document.getElementById("stopLoss").value) || 0;
    var tp = parseFloat(document.getElementById("takeProfit").value) || 0;
    return sl > 0 ? (tp / sl).toFixed(2) : "0.00";
}

function calculateRR() {
    var sl = parseFloat(document.getElementById("stopLoss").value) || 0;
    var tp = parseFloat(document.getElementById("takeProfit").value) || 0;

    if (sl > 0 && tp > 0) {
        var rr = tp / sl;
        document.getElementById("rrDisplay").value = "1:" + rr.toFixed(2);
    } else {
        document.getElementById("rrDisplay").value = "1:0";
    }
}

function getSelectedTags() {
    var checkboxes = document.querySelectorAll('input[name="tags"]:checked');
    return Array.from(checkboxes).map(function(cb) { return cb.value; });
}

function clearTradeForm() {
    document.getElementById("tradeForm").reset();
    document.getElementById("tradeDate").value = new Date().toISOString().slice(0, 16);
    document.getElementById("rrDisplay").value = "";
    document.getElementById("result").value = "";
    document.getElementById("resultPercent").value = "";
}

function deleteTrade(tradeId) {
    if (!confirm("Etes-vous sur de vouloir supprimer ce trade?")) return;

    state.trades = state.trades.filter(function(t) { return t.id !== tradeId; });
    saveData();
    updateUI();
    renderTradesTable();
    showToast("Trade supprime", "success");
}

function viewTradeScreenshot(tradeId) {
    var trade = state.trades.find(function(t) { return t.id === tradeId; });
    if (trade && trade.screenshot) {
        document.getElementById("modalImage").src = trade.screenshot;
        document.getElementById("imageModal").classList.add("active");
        resetZoom();
    }
}

function closeImageModal() {
    document.getElementById("imageModal").classList.remove("active");
}

function handleZoom(delta) {
    zoomLevel = Math.max(50, Math.min(200, zoomLevel + delta));
    document.getElementById("zoomLevel").textContent = zoomLevel + "%";
    document.getElementById("modalImage").style.transform = "scale(" + (zoomLevel / 100) + ")";
}

function resetZoom() {
    zoomLevel = 100;
    document.getElementById("zoomLevel").textContent = "100%";
    document.getElementById("modalImage").style.transform = "scale(1)";
}

// ===== FILTERS =====
function filterTrades() {
    renderTradesTable();
}

function clearFilters() {
    document.getElementById("filterPair").value = "";
    document.getElementById("filterType").value = "";
    document.getElementById("filterResult").value = "";
    document.getElementById("filterDate").value = "";
    document.getElementById("filterTag").value = "";
    renderTradesTable();
}

function getFilteredTrades() {
    var pair = document.getElementById("filterPair").value;
    var type = document.getElementById("filterType").value;
    var result = document.getElementById("filterResult").value;
    var date = document.getElementById("filterDate").value;
    var tag = document.getElementById("filterTag").value;

    return state.trades.filter(function(trade) {
        if (pair && trade.pair !== pair) return false;
        if (type && trade.tradeType !== type) return false;
        if (result === "win" && trade.result <= 0) return false;
        if (result === "loss" && trade.result >= 0) return false;
        if (result === "breakeven" && trade.result !== 0) return false;
        if (date && trade.date.slice(0, 10) !== date) return false;
        if (tag && !(trade.tags || []).includes(tag)) return false;
        return true;
    });
}

// ===== STATISTICS =====
function calculateStats(trades) {
    trades = trades || state.trades;

    if (trades.length === 0) {
        return {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            winrate: 0,
            totalProfit: 0,
            grossProfit: 0,
            grossLoss: 0,
            profitFactor: 0,
            avgWin: 0,
            avgLoss: 0,
            maxWin: 0,
            maxLoss: 0,
            drawdown: 0,
            disciplineScore: 0
        };
    }

    var wins = trades.filter(function(t) { return t.result > 0; });
    var losses = trades.filter(function(t) { return t.result < 0; });
    var grossProfit = wins.reduce(function(sum, t) { return sum + t.result; }, 0);
    var grossLoss = Math.abs(losses.reduce(function(sum, t) { return sum + t.result; }, 0));
    var totalProfit = trades.reduce(function(sum, t) { return sum + t.result; }, 0);

    var maxWin = Math.max(0, ...trades.map(function(t) { return t.result; }));
    var maxLoss = Math.min(0, ...trades.map(function(t) { return t.result; }));

    var initialCapital = state.settings.initialCapital;
    var peak = initialCapital;
    var drawdown = 0;

    trades.forEach(function(trade) {
        initialCapital += trade.result;
        if (initialCapital > peak) peak = initialCapital;
        var dd = (peak - initialCapital) / peak * 100;
        if (dd > drawdown) drawdown = dd;
    });

    var disciplineScore = calculateDisciplineScore(trades);

    return {
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winrate: trades.length > 0 ? (wins.length / trades.length * 100).toFixed(1) : 0,
        totalProfit: totalProfit.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        grossLoss: grossLoss.toFixed(2),
        profitFactor: grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? "inf" : "0.00"),
        avgWin: wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : 0,
        avgLoss: losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : 0,
        maxWin: maxWin.toFixed(2),
        maxLoss: maxLoss.toFixed(2),
        drawdown: drawdown.toFixed(1),
        disciplineScore: disciplineScore
    };
}

function calculateDisciplineScore(trades) {
    if (trades.length === 0) return 0;

    var score = 0;
    var goodRR = trades.filter(function(t) { return parseFloat(t.rr) >= 3; }).length;
    score += (goodRR / trades.length) * 40;

    var withComments = trades.filter(function(t) { return t.comment && t.comment.length > 10; }).length;
    score += (withComments / trades.length) * 30;

    var withTags = trades.filter(function(t) { return t.tags && t.tags.length > 0; }).length;
    score += (withTags / trades.length) * 30;

    return Math.round(score);
}

// ===== STATS BY TAG =====
function calculateStatsByTag() {
    var tagStats = {};

    state.trades.forEach(function(trade) {
        var tags = trade.tags || [];
        tags.forEach(function(tag) {
            if (!tagStats[tag]) {
                tagStats[tag] = { trades: 0, wins: 0, profit: 0, loss: 0 };
            }
            tagStats[tag].trades++;
            if (trade.result > 0) {
                tagStats[tag].wins++;
                tagStats[tag].profit += trade.result;
            } else if (trade.result < 0) {
                tagStats[tag].loss += Math.abs(trade.result);
            }
        });
    });

    return tagStats;
}

function updateDetailedStats() {
    var stats = calculateStats();

    document.getElementById("detailWinrate").textContent = stats.winrate + "%";
    document.getElementById("detailProfitFactor").textContent = stats.profitFactor;
    document.getElementById("detailAvgWin").textContent = "$" + stats.avgWin;
    document.getElementById("detailAvgLoss").textContent = "$" + stats.avgLoss;

    var avgRR = state.trades.length > 0
        ? (state.trades.reduce(function(sum, t) { return sum + parseFloat(t.rr || 0); }, 0) / state.trades.length).toFixed(1)
        : 0;
    document.getElementById("detailAvgRR").textContent = "1:" + avgRR;

    var consecutiveWins = 0;
    var consecutiveLosses = 0;
    var currentWins = 0;
    var currentLosses = 0;

    state.trades.forEach(function(trade) {
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

    document.getElementById("detailConsecutiveWins").textContent = consecutiveWins;
    document.getElementById("detailConsecutiveLosses").textContent = consecutiveLosses;
    document.getElementById("detailMaxWin").textContent = "$" + stats.maxWin;

    updateStatsByPair();
    updateStatsByType();
    updateStatsByRR();
    updateTagPerformance();
}

function updateStatsByPair() {
    var container = document.getElementById("statsByPair");
    var pairStats = {};

    state.trades.forEach(function(trade) {
        if (!pairStats[trade.pair]) {
            pairStats[trade.pair] = { trades: 0, wins: 0, profit: 0 };
        }
        pairStats[trade.pair].trades++;
        if (trade.result > 0) pairStats[trade.pair].wins++;
        pairStats[trade.pair].profit += trade.result;
    });

    if (Object.keys(pairStats).length === 0) {
        container.innerHTML = '<div class="empty-state small"><p>Aucune donnee</p></div>';
        return;
    }

    var html = "";
    for (var pair in pairStats) {
        var s = pairStats[pair];
        var winrate = ((s.wins / s.trades) * 100).toFixed(0);
        var profitClass = s.profit >= 0 ? "positive" : "negative";
        html += '<div class="breakdown-item">';
        html += '<span class="breakdown-pair">' + pair + '</span>';
        html += '<span class="breakdown-value ' + profitClass + '">$' + s.profit.toFixed(2) + ' (' + winrate + '%)</span>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function updateStatsByType() {
    var container = document.getElementById("statsByType");
    var typeStats = {};

    state.trades.forEach(function(trade) {
        if (!typeStats[trade.tradingType]) {
            typeStats[trade.tradingType] = { trades: 0, wins: 0, profit: 0 };
        }
        typeStats[trade.tradingType].trades++;
        if (trade.result > 0) typeStats[trade.tradingType].wins++;
        typeStats[trade.tradingType].profit += trade.result;
    });

    if (Object.keys(typeStats).length === 0) {
        container.innerHTML = '<div class="empty-state small"><p>Aucune donnee</p></div>';
        return;
    }

    var html = "";
    for (var type in typeStats) {
        var s = typeStats[type];
        var winrate = ((s.wins / s.trades) * 100).toFixed(0);
        var profitClass = s.profit >= 0 ? "positive" : "negative";
        html += '<div class="breakdown-item">';
        html += '<span class="breakdown-pair">' + type + '</span>';
        html += '<span class="breakdown-value ' + profitClass + '">$' + s.profit.toFixed(2) + ' (' + winrate + '%)</span>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function updateStatsByRR() {
    var container = document.getElementById("statsByRR");
    var rrStats = {
        "<1:1": { trades: 0, wins: 0, profit: 0 },
        "1:1-1:2": { trades: 0, wins: 0, profit: 0 },
        "1:2-1:3": { trades: 0, wins: 0, profit: 0 },
        ">1:3": { trades: 0, wins: 0, profit: 0 }
    };

    state.trades.forEach(function(trade) {
        var rr = parseFloat(trade.rr) || 0;
        var category;
        if (rr < 1) category = "<1:1";
        else if (rr < 2) category = "1:1-1:2";
        else if (rr < 3) category = "1:2-1:3";
        else category = ">1:3";

        rrStats[category].trades++;
        if (trade.result > 0) rrStats[category].wins++;
        rrStats[category].profit += trade.result;
    });

    var hasData = Object.values(rrStats).some(function(s) { return s.trades > 0; });
    if (!hasData) {
        container.innerHTML = '<div class="empty-state small"><p>Aucune donnee</p></div>';
        return;
    }

    var html = "";
    for (var rr in rrStats) {
        var s = rrStats[rr];
        var winrate = s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(0) : 0;
        var profitClass = s.profit >= 0 ? "positive" : "negative";
        html += '<div class="breakdown-item">';
        html += '<span class="breakdown-pair">' + rr + '</span>';
        html += '<span class="breakdown-value ' + profitClass + '">$' + s.profit.toFixed(2) + ' (' + winrate + '%)</span>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function updateTagPerformance() {
    var tagStats = calculateStatsByTag();
    var tbody = document.getElementById("tagStatsBody");
    var emptyState = document.getElementById("emptyTagStats");

    var tagNames = Object.keys(tagStats);

    if (tagNames.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.style.display = "flex";
        updateTagCharts({});
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    var html = "";
    tagNames.forEach(function(tagName) {
        var s = tagStats[tagName];
        var winrate = s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(1) : "0.0";
        var net = s.profit - s.loss;
        var ratio = s.loss > 0 ? (s.profit / s.loss).toFixed(2) : (s.profit > 0 ? "inf" : "0.00");
        var netClass = net >= 0 ? "positive" : "negative";

        var tagColor = "#2563eb";
        var tagObj = state.customTags.find(function(t) { return t.name === tagName; });
        if (tagObj && tagObj.color) tagColor = tagObj.color;

        html += '<tr>';
        html += '<td><span class="tag-badge" style="background:' + tagColor + '">' + escapeHtml(tagName) + '</span></td>';
        html += '<td>' + s.trades + '</td>';
        html += '<td>' + winrate + '%</td>';
        html += '<td class="positive">+$' + s.profit.toFixed(2) + '</td>';
        html += '<td class="negative">-$' + s.loss.toFixed(2) + '</td>';
        html += '<td class="' + netClass + '">' + (net >= 0 ? "+" : "") + '$' + net.toFixed(2) + '</td>';
        html += '<td>' + ratio + '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
    updateTagCharts(tagStats);
}

function updateTagCharts(tagStats) {
    var tagNames = Object.keys(tagStats);
    var colors = tagNames.map(function(name) {
        var tag = state.customTags.find(function(t) { return t.name === name; });
        return tag && tag.color ? tag.color : "#2563eb";
    });

    // Winrate chart
    var winrates = tagNames.map(function(name) {
        var s = tagStats[name];
        return s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(1) : 0;
    });

    if (tagWinrateChart) {
        tagWinrateChart.data.labels = tagNames;
        tagWinrateChart.data.datasets[0].data = winrates;
        tagWinrateChart.data.datasets[0].backgroundColor = colors;
        tagWinrateChart.update();
    }

    // Profit chart
    var profits = tagNames.map(function(name) {
        var s = tagStats[name];
        return (s.profit - s.loss).toFixed(2);
    });

    if (tagProfitChart) {
        tagProfitChart.data.labels = tagNames;
        tagProfitChart.data.datasets[0].data = profits;
        tagProfitChart.data.datasets[0].backgroundColor = colors.map(function(c) {
            return c + "cc";
        });
        tagProfitChart.update();
    }
}

// ===== TIME RANGE =====
function handleTimeRange(e) {
    var range = e.target.dataset.time || e.target.dataset.range;
    if (!range) return;

    document.querySelectorAll(".time-btn").forEach(function(btn) {
        btn.classList.remove("active");
    });
    e.target.classList.add("active");

    currentTimeRange = range;
    updateStatsByTimeRange();
}

function updateStatsByTimeRange() {
    var filteredTrades = getTradesByTimeRange();
    var stats = calculateStats(filteredTrades);

    document.getElementById("statTotalTrades").textContent = stats.totalTrades;
    document.getElementById("statWinrate").textContent = stats.winrate + "%";
    document.getElementById("statProfit").textContent = (stats.totalProfit >= 0 ? "+" : "") + "$" + stats.totalProfit;
    document.getElementById("statProfitFactor").textContent = stats.profitFactor;
    document.getElementById("statDiscipline").textContent = stats.disciplineScore + "/100";
    document.getElementById("statDrawdown").textContent = stats.drawdown + "%";
}

function getTradesByTimeRange() {
    if (currentTimeRange === "all") return state.trades;

    var now = new Date();
    var startDate = new Date();

    switch(currentTimeRange) {
        case "today":
        case "day":
            startDate.setHours(0, 0, 0, 0);
            break;
        case "week":
            startDate.setDate(now.getDate() - 7);
            break;
        case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
    }

    return state.trades.filter(function(trade) {
        var tradeDate = new Date(trade.date);
        return tradeDate >= startDate;
    });
}

// ===== CHARTS =====
function initCharts() {
    initEquityChart();
    initPairChart();
    initTagCharts();
    updateCharts();
}

function initEquityChart() {
    var ctx = document.getElementById("equityChart").getContext("2d");
    equityChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Capital",
                data: [],
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
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
                    mode: "index",
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return "$" + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    grid: { color: "rgba(0, 0, 0, 0.05)" },
                    ticks: {
                        callback: function(value) {
                            return "$" + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

function initPairChart() {
    var ctx = document.getElementById("pairChart").getContext("2d");
    pairChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

function initTagCharts() {
    // Tag Winrate Chart
    var ctx1 = document.getElementById("tagWinrateChart");
    if (ctx1) {
        tagWinrateChart = new Chart(ctx1.getContext("2d"), {
            type: "bar",
            data: {
                labels: [],
                datasets: [{
                    label: "Winrate %",
                    data: [],
                    backgroundColor: [],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + "% winrate";
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) { return value + "%"; }
                        }
                    }
                }
            }
        });
    }

    // Tag Profit Chart
    var ctx2 = document.getElementById("tagProfitChart");
    if (ctx2) {
        tagProfitChart = new Chart(ctx2.getContext("2d"), {
            type: "bar",
            data: {
                labels: [],
                datasets: [{
                    label: "Net P/L",
                    data: [],
                    backgroundColor: [],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return "$" + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        ticks: {
                            callback: function(value) { return "$" + value; }
                        }
                    }
                }
            }
        });
    }
}

function handleChartRange(e) {
    var range = e.target.dataset.range;
    if (!range) return;

    document.querySelectorAll(".chart-btn").forEach(function(btn) {
        btn.classList.remove("active");
    });
    e.target.classList.add("active");

    currentChartRange = range;
    updateCharts();
}

function updateCharts() {
    updateEquityChart();
    updatePairChart();
}

function updateEquityChart() {
    var trades = getTradesByChartRange();
    var initialCapital = state.settings.initialCapital;
    var labels = [];
    var data = [];
    var capital = initialCapital;

    trades.forEach(function(trade) {
        capital += trade.result;
        labels.push(new Date(trade.date).toLocaleDateString("fr-FR"));
        data.push(capital);
    });

    if (equityChart) {
        equityChart.data.labels = labels;
        equityChart.data.datasets[0].data = data;

        var isDark = state.settings.theme === "dark";
        equityChart.data.datasets[0].borderColor = "#2563eb";
        equityChart.data.datasets[0].backgroundColor = "rgba(37, 99, 235, 0.1)";
        equityChart.options.scales.y.grid.color = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

        equityChart.update();
    }
}

function updatePairChart() {
    var pairCounts = {};

    state.trades.forEach(function(trade) {
        if (!pairCounts[trade.pair]) {
            pairCounts[trade.pair] = 0;
        }
        pairCounts[trade.pair]++;
    });

    var labels = Object.keys(pairCounts);
    var data = Object.values(pairCounts);

    if (pairChart) {
        pairChart.data.labels = labels;
        pairChart.data.datasets[0].data = data;
        pairChart.update();
    }
}

function getTradesByChartRange() {
    if (currentChartRange === "all") return state.trades;

    var now = new Date();
    var startDate = new Date();

    switch(currentChartRange) {
        case "day":
            startDate.setHours(0, 0, 0, 0);
            break;
        case "week":
            startDate.setDate(now.getDate() - 7);
            break;
        case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
    }

    return state.trades.filter(function(trade) {
        var tradeDate = new Date(trade.date);
        return tradeDate >= startDate;
    });
}

// ===== UI UPDATES =====
function updateUI() {
    var stats = calculateStats();

    // Dashboard stats
    document.getElementById("statWinrate").textContent = stats.winrate + "%";
    document.getElementById("statTotalTrades").textContent = stats.totalTrades;
    document.getElementById("statProfit").textContent = (parseFloat(stats.totalProfit) >= 0 ? "+" : "") + "$" + stats.totalProfit;
    document.getElementById("statProfitFactor").textContent = stats.profitFactor;
    document.getElementById("statDiscipline").textContent = stats.disciplineScore + "/100";
    document.getElementById("statDrawdown").textContent = stats.drawdown + "%";

    // Update capital display
    var currentCapital = state.settings.initialCapital + parseFloat(stats.totalProfit || 0);
    document.getElementById("displayCapital").textContent = "$" + currentCapital.toFixed(2);

    renderRecentTrades();
    renderTradeTags();
    renderFilterTags();
    renderSettingsTags();
    updateCharts();
}

function renderTradesTable() {
    var trades = getFilteredTrades();
    var tbody = document.getElementById("tradesTableBody");

    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state" style="text-align:center;padding:2rem;color:var(--text-muted);">Aucun trade trouve</td></tr>';
        return;
    }

    trades.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    var html = "";
    trades.forEach(function(trade) {
        var resultClass = trade.result > 0 ? "positive" : (trade.result < 0 ? "negative" : "");
        var resultPrefix = trade.result > 0 ? "+" : "";

        html += '<tr>';
        html += '<td>' + new Date(trade.date).toLocaleDateString("fr-FR") + '</td>';
        html += '<td><span class="pair-badge">' + trade.pair + '</span></td>';
        html += '<td><span class="type-' + trade.tradeType.toLowerCase() + '">' + trade.tradeType + '</span></td>';
        html += '<td>' + trade.tradingType + '</td>';
        html += '<td>' + trade.lotSize + '</td>';
        html += '<td>' + trade.stopLoss + '</td>';
        html += '<td>' + trade.takeProfit + '</td>';
        html += '<td>1:' + trade.rr + '</td>';
        html += '<td class="' + resultClass + '">' + resultPrefix + '$' + trade.result.toFixed(2) + '</td>';
        html += '<td>';
        if (trade.tags && trade.tags.length > 0) {
            trade.tags.forEach(function(tag) {
                var tagObj = state.customTags.find(function(t) { return t.name === tag; });
                var color = tagObj && tagObj.color ? tagObj.color : "#2563eb";
                html += '<span class="tag-badge small" style="background:' + color + '">' + escapeHtml(tag) + '</span>';
            });
        }
        if (trade.screenshot) {
            html += '<button class="btn-icon" onclick="viewTradeScreenshot(' + trade.id + ')" title="Voir capture"><i class="fas fa-image"></i></button>';
        }
        html += '<button class="btn-icon danger" onclick="deleteTrade(' + trade.id + ')" title="Supprimer"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

function renderRecentTrades() {
    var recentTrades = state.trades.slice(-5).reverse();
    var container = document.getElementById("recentTrades");

    if (recentTrades.length === 0) {
        container.innerHTML = '<div class="empty-state small"><p>Aucun trade recent</p></div>';
        return;
    }

    var html = "";
    recentTrades.forEach(function(trade) {
        var resultClass = trade.result > 0 ? "positive" : (trade.result < 0 ? "negative" : "");

        html += '<div class="recent-trade-item">';
        html += '<div class="recent-trade-info">';
        html += '<span class="pair-badge small">' + trade.pair + '</span>';
        html += '<span class="type-' + trade.tradeType.toLowerCase() + ' small">' + trade.tradeType + '</span>';
        html += '</div>';
        html += '<div class="recent-trade-result ' + resultClass + '">';
        html += (trade.result > 0 ? "+" : "") + '$' + trade.result.toFixed(2);
html += '</div>';
        html += '</div>';
    });

    grid.innerHTML = html;
}

// ========================================
// AUTHENTICATION
// ========================================

function setupAuth() {
    // Initialiser Firebase
    if (typeof firebase !== 'undefined') {
        initFirebase();
    }
    
    //Toggle login/signup
    document.getElementById("showSignup").addEventListener("click", function() {
        document.getElementById("loginForm").classList.add("hidden");
        document.getElementById("signupForm").classList.remove("hidden");
        document.getElementById("authError").classList.remove("show");
    });
    
    document.getElementById("showLogin").addEventListener("click", function() {
        document.getElementById("signupForm").classList.add("hidden");
        document.getElementById("loginForm").classList.remove("hidden");
        document.getElementById("authError").classList.remove("show");
    });
    
    // Login
    document.getElementById("loginBtn").addEventListener("click", handleLogin);
    document.getElementById("loginPassword").addEventListener("keypress", function(e) {
        if (e.key === "Enter") handleLogin();
    });
    
    // Signup
    document.getElementById("signupBtn").addEventListener("click", handleSignup);
    document.getElementById("signupConfirm").addEventListener("keypress", function(e) {
        if (e.key === "Enter") handleSignup();
    });
    
    // Logout
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

function handleLogin() {
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;
    var errorEl = document.getElementById("authError");
    
    if (!email || !password) {
        errorEl.textContent = "Veuillez entrer email et mot de passe";
        errorEl.classList.add("show");
        return;
    }
    
    if (typeof firebase === 'undefined') {
        errorEl.textContent = "Firebase non configuré. Vérifiez firebase-config.js";
        errorEl.classList.add("show");
        return;
    }
    
    signIn(email, password)
        .then(function() {
            // Succès - handleAuthChange sera appelé
        })
        .catch(function(error) {
            errorEl.textContent = getErrorMessage(error.code);
            errorEl.classList.add("show");
        });
}

function handleSignup() {
    var email = document.getElementById("signupEmail").value.trim();
    var password = document.getElementById("signupPassword").value;
    var confirm = document.getElementById("signupConfirm").value;
    var errorEl = document.getElementById("authError");
    
    if (!email || !password) {
        errorEl.textContent = "Veuillez entrer email et mot de passe";
        errorEl.classList.add("show");
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = "Le mot de passe doit avoir au moins 6 caractères";
        errorEl.classList.add("show");
        return;
    }
    
    if (password !== confirm) {
        errorEl.textContent = "Les mots de passe ne correspondent pas";
        errorEl.classList.add("show");
        return;
    }
    
    if (typeof firebase === 'undefined') {
        errorEl.textContent = "Firebase non configuré. Vérifiez firebase-config.js";
        errorEl.classList.add("show");
        return;
    }
    
    signUp(email, password)
        .then(function() {
            showToast("Compte créé avec succès!", "success");
        })
        .catch(function(error) {
            errorEl.textContent = getErrorMessage(error.code);
            errorEl.classList.add("show");
        });
}

function handleLogout() {
    if (typeof firebase !== 'undefined') {
        signOut().then(function() {
            showToast("Déconnexion réussie", "success");
        });
    }
}

function getErrorMessage(code) {
    var messages = {
        "auth/email-already-in-use": "Cet email est déjà utilisé",
        "auth/invalid-email": "Email invalide",
        "auth/operation-not-allowed": "Opération non autorisée",
        "auth/weak-password": "Mot de passe trop faible",
        "auth/user-disabled": "Compte désactivé",
        "auth/user-not-found": "Aucun compte avec cet email",
        "auth/wrong-password": "Mot de passe incorrect",
        "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard",
        "auth/invalid-api-key": "Clé API invalide",
        "auth/network-request-failed": "Erreur réseau"
    };
    return messages[code] || "Erreur: " + code;
}

function showLoginScreen() {
    document.getElementById("authScreen").classList.remove("hidden");
    document.getElementById("appContainer").classList.add("hidden");
}

function hideLoginScreen() {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
}

function showMainApp() {
    hideLoginScreen();
    
    // Update user info
    if (currentUser) {
        document.getElementById("currentUserEmail").textContent = currentUser.email;
    }
    
    // Show/hide admin panel
    var adminNav = document.getElementById("adminNavItem");
    if (isAdmin) {
        adminNav.classList.remove("hidden");
    } else {
        adminNav.classList.add("hidden");
    }
    
    // Load user data
    loadUserData();
}

function loadUserData() {
    if (!currentUser) return;
    
    // Charger les settings
    loadUserSettings(function(settings) {
        if (settings) {
            state.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
            document.getElementById("initialCapital").value = state.settings.initialCapital;
        }
    });
    
    // Charger les trades
    loadUserTrades(function(trades) {
        state.trades = trades;
        updateUI();
    });
}

// Admin functions
function renderAdminUsers(users) {
    var tbody = document.getElementById("usersTableBody");
    document.getElementById("adminTotalUsers").textContent = users.length;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Aucun utilisateur</td></tr>';
        return;
    }
    
    var html = "";
    users.forEach(function(user) {
        var date = user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString("fr-FR") : "-";
        html += '<tr>';
        html += '<td>' + escapeHtml(user.email) + '</td>';
        html += '<td>$' + (user.initialCapital || 10000) + '</td>';
        html += '<td>' + date + '</td>';
        html += '<td class="user-actions">';
        html += '<button class="btn-secondary" onclick="editUser(\'' + user.id + '\')"><i class="fas fa-edit"></i></button>';
        html += '<button class="btn-danger" onclick="deleteUserConfirm(\'' + user.id + '\')"><i class="fas fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    });
    
    tbody.innerHTML = html;
}

function renderAdminTrades(trades) {
    var tbody = document.getElementById("adminTradesBody");
    document.getElementById("adminTotalTrades").textContent = trades.length;
    
    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Aucun trade</td></tr>';
        return;
    }
    
    var html = "";
    trades.forEach(function(trade) {
        var date = trade.createdAt ? new Date(trade.createdAt.seconds * 1000).toLocaleDateString("fr-FR") : "-";
        var resultClass = trade.result > 0 ? "positive" : (trade.result < 0 ? "negative" : "");
        
        html += '<tr>';
        html += '<td>' + date + '</td>';
        html += '<td>' + (trade.userEmail || "-") + '</td>';
        html += '<td>' + trade.pair + '</td>';
        html += '<td>' + trade.tradeType + '</td>';
        html += '<td>' + trade.lotSize + '</td>';
        html += '<td class="' + resultClass + '">$' + trade.result.toFixed(2) + '</td>';
        html += '</tr>';
    });
    
    tbody.innerHTML = html;
}

function editUser(userId) {
    var newCapital = prompt("Nouveau capital initial:");
    if (newCapital) {
        updateUser(userId, { initialCapital: parseFloat(newCapital) })
            .then(function() {
                showToast("Utilisateur mis à jour", "success");
            })
            .catch(function(error) {
                showToast("Erreur: " + error.message, "error");
            });
    }
}

function deleteUserConfirm(userId) {
    if (confirm("Êtes-vous sûr? Cela supprimera tous leurs trades.")) {
        deleteUser(userId)
            .then(function() {
                showToast("Utilisateur supprimé", "success");
                loadAdminData();
            })
            .catch(function(error) {
                showToast("Erreur: " + error.message, "error");
            });
    }
}

function loadAdminData() {
    loadAllUsers(renderAdminUsers);
    loadAllTrades(renderAdminTrades);
}

// ========================================
// TRADE SURVEILLANCE / SETUP SYSTEM
// ========================================

var state = Object.assign(state, {
    setups: [],
    currentSetup: null,
    editingConfirmation: null
});

function initSurveillance() {
    loadSetups();
    setupSurveillanceListeners();
    renderSetupList();
}

function loadSetups() {
    try {
        state.setups = JSON.parse(localStorage.getItem("protrade_setups")) || [];
    } catch(e) {
        state.setups = [];
    }
}

function saveSetups() {
    try {
        localStorage.setItem("protrade_setups", JSON.stringify(state.setups));
    } catch(e) {}
}

function setupSurveillanceListeners() {
    document.getElementById("newSetupBtn").addEventListener("click", showNewSetupForm);
    document.getElementById("createFirstSetup").addEventListener("click", showNewSetupForm);
    document.getElementById("backToList").addEventListener("click", showSetupList);
    document.getElementById("backToListFromDetail").addEventListener("click", showSetupList);
    
    document.getElementById("setupBuy").addEventListener("click", function() {
        document.getElementById("setupBuy").classList.add("active");
        document.getElementById("setupSell").classList.remove("active");
    });
    
    document.getElementById("setupSell").addEventListener("click", function() {
        document.getElementById("setupSell").classList.add("active");
        document.getElementById("setupBuy").classList.remove("active");
    });
    
    document.getElementById("addConfirmation").addEventListener("click", showAddConfirmationModal);
    document.getElementById("closeConfirmationModal").addEventListener("click", hideConfirmationModal);
    document.getElementById("cancelConfirmation").addEventListener("click", hideConfirmationModal);
    document.getElementById("saveConfirmation").addEventListener("click", saveConfirmation);
    
    document.getElementById("skipChecklist").addEventListener("click", goToLotCalculator);
    document.getElementById("takeTrade").addEventListener("click", goToLotCalculator);
    document.getElementById("takeTradeFromDetail").addEventListener("click", goToLotCalculator);
    
    document.getElementById("deleteSetup").addEventListener("click", deleteCurrentSetup);
    document.getElementById("editSetup").addEventListener("click", editCurrentSetup);
    
    document.querySelectorAll(".star-rating .star").forEach(function(btn) {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".star-rating .star").forEach(function(b) {
                b.classList.remove("active");
            });
            btn.classList.add("active");
        });
    });
}

function showNewSetupForm() {
    state.currentSetup = null;
    document.getElementById("setupPair").value = "EURUSD";
    document.getElementById("setupNotes").value = "";
    document.getElementById("setupBuy").classList.add("active");
    document.getElementById("setupSell").classList.remove("active");
    document.getElementById("confirmationsList").innerHTML = "";
    updateProgress();
    showView("setupFormContainer");
}

function showSetupList() {
    state.currentSetup = null;
    renderSetupList();
    showView("setupList");
}

function showSetupDetail(setupId) {
    var setup = state.setups.find(function(s) {
        return s.id === setupId;
    });
    
    if (!setup) return;
    state.currentSetup = setup;
    document.getElementById("detailPair").textContent = setup.pair;
    document.getElementById("detailType").textContent = setup.type;
    document.getElementById("detailType").className = "setup-type-badge " + setup.type.toLowerCase();
    document.getElementById("detailNotes").textContent = setup.notes || "-";
    
    var completion = calculateCompletion(setup);
    document.getElementById("detailProgress").textContent = completion + "%";
    document.getElementById("readyAlert").classList.toggle("hidden", completion < 85);
    renderConfirmationsInDetail(setup.confirmations || []);
    showView("setupDetailContainer");
}

function showView(viewId) {
    var views = ["setupList", "setupFormContainer", "setupDetailContainer"];
    views.forEach(function(v) {
        var el = document.getElementById(v);
        if (el) el.classList.add("hidden");
    });
    if (viewId) document.getElementById(viewId).classList.remove("hidden");
}

function renderSetupList() {
    var container = document.getElementById("setupList");
    var empty = document.getElementById("emptySetups");
    
    if (state.setups.length === 0) {
        container.innerHTML = "";
        if (empty) empty.style.display = "flex";
        return;
    }
    
    if (empty) empty.style.display = "none";
    
    var sorted = state.setups.slice().sort(function(a, b) {
        return calculateCompletion(b) - calculateCompletion(a);
    });
    
    var html = "";
    sorted.forEach(function(setup) {
        var completion = calculateCompletion(setup);
        var statusClass = completion >= 85 ? "ready" : (completion >= 50 ? "medium" : "low");
        var statusText = completion >= 85 ? "Prêt" : (completion >= 50 ? "En cours" : "En attente");
        
        html += '<div class="setup-card" onclick="showSetupDetail(' + setup.id + ')">';
        html += '<div class="setup-card-info">';
        html += '<span class="setup-card-pair">' + setup.pair + '</span>';
        html += '<span class="setup-card-type ' + setup.type.toLowerCase() + '">' + setup.type + '</span>';
        html += '</div>';
        html += '<div class="setup-card-progress">';
        html += '<div class="progress-mini"><div class="progress-fill-mini ' + (completion >= 85 ? "ready" : "") + '" style="width:' + completion + '%"></div></div>';
        html += '<span class="progress-percent">' + completion + '%</span>';
        html += '</div>';
        html += '<span class="setup-card-status ' + statusClass + '">' + statusText + '</span>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function calculateCompletion(setup) {
    var confirmations = setup.confirmations || [];
    if (confirmations.length === 0) return 0;
    
    var totalWeight = 0, completedWeight = 0;
    confirmations.forEach(function(conf) {
        totalWeight += conf.stars || 1;
        if (conf.completed) completedWeight += conf.stars || 1;
    });
    
    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

function updateProgress() {
    if (!state.currentSetup) {
        var completion = calculateCompletion({ confirmations: getConfirmationsFromDOM() });
        var fill = document.getElementById("progressFill");
        var status = document.querySelector(".status-badge");
        
        if (fill) fill.style.width = completion + "%";
        document.getElementById("setupProgress").textContent = completion + "%";
        
        if (completion >= 85) {
            fill.classList.add("ready");
            status.classList.add("ready");
            status.textContent = "Prêt!";
        } else {
            fill.classList.remove("ready");
            status.classList.remove("ready");
            status.textContent = completion >= 50 ? "Almost ready" : "En attente";
        }
    }
}

function renderConfirmations(confirmations) {
    var container = document.getElementById("confirmationsList");
    var html = "";
    
    confirmations.forEach(function(conf, index) {
        var stars = "";
        for (var i = 0; i < (conf.stars || 1); i++) stars += '<i class="fas fa-star"></i>';
        
        html += '<div class="confirmation-item ' + (conf.completed ? "completed" : "") + '">';
        html += '<div class="confirmation-checkbox ' + (conf.completed ? "checked" : "") + '" onclick="toggleConfirmation(' + index + ')">';
        if (conf.completed) html += '<i class="fas fa-check"></i>';
        html += '</div>';
        html += '<div class="confirmation-info"><div class="confirmation-title">' + escapeHtml(conf.title) + '</div>';
        if (conf.description) html += '<div class="confirmation-desc">' + escapeHtml(conf.description) + '</div>';
        html += '</div>';
        html += '<div class="confirmation-stars">' + stars + '</div>';
        html += '<div class="confirmation-actions">';
        html += '<button class="btn-icon" onclick="editConfirmation(' + index + ')"><i class="fas fa-edit"></i></button>';
        html += '<button class="btn-icon danger" onclick="deleteConfirmation(' + index + ')"><i class="fas fa-trash"></i></button>';
        html += '</div></div>';
    });
    
    container.innerHTML = html;
}

function renderConfirmationsInDetail(confirmations) {
    var container = document.getElementById("detailConfirmationsList");
    var html = "";
    
    confirmations.forEach(function(conf) {
        var stars = "";
        for (var i = 0; i < (conf.stars || 1); i++) stars += '<i class="fas fa-star"></i>';
        
        html += '<div class="confirmation-item ' + (conf.completed ? "completed" : "") + '">';
        html += '<div class="confirmation-checkbox ' + (conf.completed ? "checked" : "") + '">';
        if (conf.completed) html += '<i class="fas fa-check"></i>';
        html += '</div>';
        html += '<div class="confirmation-info"><div class="confirmation-title">' + escapeHtml(conf.title) + '</div>';
        if (conf.description) html += '<div class="confirmation-desc">' + escapeHtml(conf.description) + '</div>';
        html += '</div>';
        html += '<div class="confirmation-stars">' + stars + '</div></div>';
    });
    
    container.innerHTML = html;
}

function getConfirmationsFromDOM() {
    var items = document.querySelectorAll("#confirmationsList .confirmation-item");
    var confirmations = [];
    
    items.forEach(function(item) {
        var checkbox = item.querySelector(".confirmation-checkbox");
        var title = item.querySelector(".confirmation-title").textContent;
        var desc = item.querySelector(".confirmation-desc");
        var stars = item.querySelectorAll(".confirmation-stars .fa-star").length;
        
        confirmations.push({
            title: title,
            description: desc ? desc.textContent : "",
            stars: stars || 1,
            completed: checkbox.classList.contains("checked")
        });
    });
    
    return confirmations;
}

function showAddConfirmationModal() {
    document.getElementById("confTitle").value = "";
    document.getElementById("confDesc").value = "";
    document.querySelectorAll(".star-rating .star").forEach(function(b) {
        b.classList.remove("active");
    });
    document.querySelector(".star-rating .star[data-star='3']").classList.add("active");
    document.getElementById("confTitle").focus();
    document.getElementById("confirmationModal").classList.add("active");
}

function hideConfirmationModal() {
    document.getElementById("confirmationModal").classList.remove("active");
}

function saveConfirmation() {
    var title = document.getElementById("confTitle").value.trim();
    var desc = document.getElementById("confDesc").value.trim();
    var stars = parseInt(document.querySelector(".star-rating .star.active").dataset.star) || 1;
    
    if (!title) {
        showToast("Veuillez entrer un titre", "error");
        return;
    }
    
    var confirmations = getConfirmationsFromDOM();
    
    if (state.editingConfirmation !== null) {
        confirmations[state.editingConfirmation] = {
            title: title,
            description: desc,
            stars: stars,
            completed: confirmations[state.editingConfirmation].completed
        };
        state.editingConfirmation = null;
    } else {
        confirmations.push({ title: title, description: desc, stars: stars, completed: false });
    }
    
    renderConfirmations(confirmations);
    updateProgress();
    hideConfirmationModal();
    showToast("Confirmation ajoutée", "success");
}

function toggleConfirmation(index) {
    var confirmations = getConfirmationsFromDOM();
    confirmations[index].completed = !confirmations[index].completed;
    renderConfirmations(confirmations);
    updateProgress();
    
    if (calculateCompletion({ confirmations: confirmations }) >= 85) {
        showToast("Trade prêt à prendre!", "success");
    }
}

function editConfirmation(index) {
    var confirmations = getConfirmationsFromDOM();
    var conf = confirmations[index];
    
    state.editingConfirmation = index;
    document.getElementById("confTitle").value = conf.title;
    document.getElementById("confDesc").value = conf.description || "";
    
    document.querySelectorAll(".star-rating .star").forEach(function(b) {
        b.classList.remove("active");
    });
    document.querySelector(".star-rating .star[data-star='" + conf.stars + "']").classList.add("active");
    document.getElementById("confirmationModal").classList.add("active");
}

function deleteConfirmation(index) {
    var confirmations = getConfirmationsFromDOM();
    confirmations.splice(index, 1);
    renderConfirmations(confirmations);
    updateProgress();
    showToast("Confirmation supprimée", "success");
}

function saveSetup() {
    var pair = document.getElementById("setupPair").value;
    var type = document.getElementById("setupBuy").classList.contains("active") ? "Buy" : "Sell";
    var notes = document.getElementById("setupNotes").value.trim();
    var confirmations = getConfirmationsFromDOM();
    
    if (!state.currentSetup) {
        state.setups.push({
            id: Date.now(),
            pair: pair,
            type: type,
            notes: notes,
            confirmations: confirmations,
            createdAt: new Date().toISOString()
        });
    } else {
        state.currentSetup.pair = pair;
        state.currentSetup.type = type;
        state.currentSetup.notes = notes;
        state.currentSetup.confirmations = confirmations;
    }
    
    saveSetups();
    renderSetupList();
    showToast("Setup enregistrée!", "success");
}

function deleteCurrentSetup() {
    if (!state.currentSetup) return;
    if (confirm("Supprimer cette setup?")) {
        state.setups = state.setups.filter(function(s) {
            return s.id !== state.currentSetup.id;
        });
        saveSetups();
        showSetupList();
        showToast("Setup supprimée", "success");
    }
}

function editCurrentSetup() {
    if (!state.currentSetup) return;
    document.getElementById("setupPair").value = state.currentSetup.pair;
    if (state.currentSetup.type === "Buy") {
        document.getElementById("setupBuy").classList.add("active");
        document.getElementById("setupSell").classList.remove("active");
    } else {
        document.getElementById("setupSell").classList.add("active");
        document.getElementById("setupBuy").classList.remove("active");
    }
    document.getElementById("setupNotes").value = state.currentSetup.notes || "";
    renderConfirmations(state.currentSetup.confirmations || []);
    updateProgress();
    showView("setupFormContainer");
}

function goToLotCalculator() {
    if (state.currentSetup) saveSetup();
    document.querySelector('[data-section="lot-calculator"]').click();
}

// ===== CHECKLIST =====
function renderChecklist() {
    var checklistItems = document.querySelectorAll(".checklist-item input");
    var savedState = state.checklist || {};

    checklistItems.forEach(function(item) {
        var id = item.id;
        item.checked = savedState[id] || false;
    });
}

function saveChecklistState() {
    var checklistItems = document.querySelectorAll(".checklist-item input");
    var savedState = {};

    checklistItems.forEach(function(item) {
        savedState[item.id] = item.checked;
    });

    state.checklist = savedState;
    saveData();
    showToast("Checklist sauvegardee!", "success");
}

function resetChecklist() {
    var checklistItems = document.querySelectorAll(".checklist-item input");
    checklistItems.forEach(function(item) {
        item.checked = false;
    });
    state.checklist = {};
    saveData();
    showToast("Checklist reinitalisee", "success");
}

// ===== NOTES =====
function renderNotes() {
    var container = document.getElementById("notesContainer");
    var emptyState = document.getElementById("emptyNotes");

    if (state.notes.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    state.notes.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    var html = "";
    state.notes.forEach(function(note) {
        html += '<div class="note-card">';
        html += '<div class="note-header">';
        html += '<div>';
        if (note.title) {
            html += '<div class="note-title">' + escapeHtml(note.title) + '</div>';
        }
        html += '<span class="note-date">' + new Date(note.date).toLocaleDateString("fr-FR") + '</span>';
        html += '</div>';
        html += '<div class="note-actions">';
        html += '<button class="note-btn delete" onclick="deleteNote(' + note.id + ')"><i class="fas fa-trash"></i></button>';
        html += '</div>';
        html += '</div>';
        html += '<div class="note-content">' + escapeHtml(note.content) + '</div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

function openNoteModal() {
    document.getElementById("noteModal").classList.add("active");
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
}

function closeNoteModal() {
    document.getElementById("noteModal").classList.remove("active");
}

function saveNote() {
    var title = document.getElementById("noteTitle").value.trim();
    var content = document.getElementById("noteContent").value.trim();
    if (!content) {
        showToast("Veuillez entrer du contenu", "error");
        return;
    }

    var note = {
        id: Date.now(),
        date: new Date().toISOString(),
        title: title,
        content: content
    };

    state.notes.push(note);
    saveData();
    closeNoteModal();
    renderNotes();
    showToast("Note sauvegardee!", "success");
}

function deleteNote(noteId) {
    if (!confirm("Etes-vous sur de vouloir supprimer cette note?")) return;

    state.notes = state.notes.filter(function(n) { return n.id !== noteId; });
    saveData();
    renderNotes();
    showToast("Note supprimee", "success");
}

// ===== SETTINGS =====
function saveCapital() {
    var capital = parseFloat(document.getElementById("initialCapital").value);
    if (isNaN(capital) || capital <= 0) {
        showToast("Veuillez entrer un capital valide", "error");
        return;
    }

    state.settings.initialCapital = capital;
    saveData();
    updateUI();
    showToast("Capital mis a jour!", "success");
}

function exportAllData() {
    var data = {
        trades: state.trades,
        settings: state.settings,
        notes: state.notes,
        checklist: state.checklist,
        customTags: state.customTags,
        exportDate: new Date().toISOString()
    };

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "protrade_backup_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Donnees exportees!", "success");
}

function clearAllData() {
    if (!confirm("Etes-vous sur de vouloir effacer toutes les donnees? Cette action est irreversible!")) return;

    state.trades = [];
    state.notes = [];
    state.checklist = {};
    state.customTags = DEFAULT_TAGS.slice();
    state.settings = Object.assign({}, DEFAULT_SETTINGS);
    saveData();
    updateUI();
    renderTradeTags();
    renderFilterTags();
    renderSettingsTags();
    initLotCalculator();
    showToast("Toutes les donnees ont ete effacees", "success");
}

// ===== EXPORT =====
function exportCSV() {
    var trades = getFilteredTrades();
    if (trades.length === 0) {
        showToast("Aucune donnee a exporter", "error");
        return;
    }

    var csv = "Date,Paire,Type,Type Trading,Lot,Risque %,Stop Loss,Take Profit,RR,Resultat,Tags,Commentaire\n";

    trades.forEach(function(trade) {
        var row = [
            trade.date,
            trade.pair,
            trade.tradeType,
            trade.tradingType,
            trade.lotSize,
            trade.riskPercent,
            trade.stopLoss,
            trade.takeProfit,
            trade.rr,
            trade.result,
            '"' + (trade.tags || []).join("; ") + '"',
            '"' + (trade.comment || "").replace(/"/g, '""') + '"'
        ];
        csv += row.join(",") + "\n";
    });

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "protrade_trades_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export CSV termine!", "success");
}

function exportPDF() {
    var trades = getFilteredTrades();
    if (trades.length === 0) {
        showToast("Aucune donnee a exporter", "error");
        return;
    }

    var stats = calculateStats(trades);

    var content = "PROTRADING JOURNAL - RAPPORT\n";
    content += "=====================================\n\n";
    content += "Date: " + new Date().toLocaleDateString("fr-FR") + "\n\n";
    content += "STATISTIQUES GLOBALES\n";
    content += "---------------------------------------\n";
    content += "Total Trades: " + stats.totalTrades + "\n";
    content += "Winrate: " + stats.winrate + "%\n";
    content += "Profit Total: $" + stats.totalProfit + "\n";
    content += "Profit Factor: " + stats.profitFactor + "\n";
    content += "Score Discipline: " + stats.disciplineScore + "/100\n\n";

    // Tag stats
    var tagStats = calculateStatsByTag();
    var tagNames = Object.keys(tagStats);
    if (tagNames.length > 0) {
        content += "PERFORMANCE PAR TAG\n";
        content += "---------------------------------------\n";
        tagNames.forEach(function(tag) {
            var s = tagStats[tag];
            var wr = s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(1) : "0";
            content += tag + ": " + s.trades + " trades, " + wr + "% WR, Net: $" + (s.profit - s.loss).toFixed(2) + "\n";
        });
        content += "\n";
    }

    content += "LISTE DES TRADES\n";
    content += "---------------------------------------\n";

    trades.forEach(function(trade, index) {
        content += (index + 1) + ". " + trade.pair + " - " + trade.tradeType + " - $" + trade.result.toFixed(2) + "\n";
        content += "   Date: " + new Date(trade.date).toLocaleDateString("fr-FR") + "\n";
        content += "   RR: 1:" + trade.rr + "\n";
        if (trade.tags && trade.tags.length) content += "   Tags: " + trade.tags.join(", ") + "\n";
        if (trade.comment) content += "   Commentaire: " + trade.comment + "\n";
        content += "\n";
    });

    var blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "protrade_rapport_" + new Date().toISOString().slice(0, 10) + ".txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export termine!", "success");
}

// ===== TOAST =====
function showToast(message, type) {
    var container = document.getElementById("toastContainer");
    var toast = document.createElement("div");
    toast.className = "toast toast-" + type;

    var icons = { success: "check-circle", error: "exclamation-circle", warning: "exclamation-triangle" };
    toast.innerHTML = '<div class="toast-icon"><i class="fas fa-' + (icons[type] || "info-circle") + '"></i></div><span class="toast-message">' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// ===== UTILITIES =====
function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ===== TRADING TOOLS =====
function initTradingTools() {
    // RR Calculator
    document.getElementById("rrEntry").addEventListener("input", calculateRR);
    document.getElementById("rrStopLoss").addEventListener("input", calculateRR);
    document.getElementById("rrTakeProfit").addEventListener("input", calculateRR);

    // Position Calculator
    document.getElementById("posBalance").addEventListener("input", calculatePositionSize);
    document.getElementById("posRisk").addEventListener("input", calculatePositionSize);
    document.getElementById("posPair").addEventListener("change", calculatePositionSize);
    document.getElementById("posEntry").addEventListener("input", calculatePositionSize);
    document.getElementById("posSL").addEventListener("input", calculatePositionSize);

    // Session Tracker
    document.querySelectorAll(".session-btn").forEach(function(btn) {
        btn.addEventListener("click", selectSession);
    });

    // Reset Tools
    document.getElementById("resetTools").addEventListener("click", resetTradingTools);

    // Initial position preview
    calculatePositionSize();
    updateSessionStatus();
}

function calculateRR() {
    var entry = parseFloat(document.getElementById("rrEntry").value) || 0;
    var sl = parseFloat(document.getElementById("rrStopLoss").value) || 0;
    var tp = parseFloat(document.getElementById("rrTakeProfit").value) || 0;

    if (entry <= 0 || sl <= 0) {
        document.getElementById("rrResult").textContent = "1:0";
        document.getElementById("rrQuality").textContent = "-";
        document.getElementById("rrQuality").className = "result-quality";
        document.getElementById("potentialLoss").textContent = "$0.00";
        document.getElementById("potentialProfit").textContent = "$0.00";
        return;
    }

    var risk = Math.abs(entry - sl);
    var reward = Math.abs(tp - entry);

    if (tp > 0 && sl > 0) {
        var rr = reward / risk;
        document.getElementById("rrResult").textContent = "1:" + rr.toFixed(2);

        var qualityEl = document.getElementById("rrQuality");
        if (rr >= 3) {
            qualityEl.textContent = "Excellent";
            qualityEl.className = "result-quality good";
        } else if (rr >= 2) {
            qualityEl.textContent = "Bon";
            qualityEl.className = "result-quality good";
        } else if (rr >= 1) {
            qualityEl.textContent = "Acceptable";
            qualityEl.className = "result-quality mediocre";
        } else {
            qualityEl.textContent = "Faible";
            qualityEl.className = "result-quality bad";
        }

        // Calculate potential profit/loss using a standard lot size (0.10 lot = 1 unit per pip for forex)
        var balance = state.settings.initialCapital || 10000;
        var riskAmount = balance * 0.02;
        var lotSize = riskAmount / risk;
        var pipValue = PIP_VALUES[document.getElementById("calcPair").value] || 10;

        var potentialLoss = lotSize * risk * pipValue;
        var potentialProfit = potentialLoss * rr;

        document.getElementById("potentialLoss").textContent = "-$" + potentialLoss.toFixed(2);
        document.getElementById("potentialProfit").textContent = "+$" + potentialProfit.toFixed(2);
    } else {
        document.getElementById("rrResult").textContent = "1:0";
        document.getElementById("rrQuality").textContent = "-";
        document.getElementById("rrQuality").className = "result-quality";
    }
}

function calculatePositionSize() {
    var balance = parseFloat(document.getElementById("posBalance").value) || state.settings.initialCapital || 10000;
    var risk = parseFloat(document.getElementById("posRisk").value) || 2;
    var pair = document.getElementById("posPair").value;
    var entry = parseFloat(document.getElementById("posEntry").value) || 0;
    var sl = parseFloat(document.getElementById("posSL").value) || 0;

    if (entry <= 0 || sl <= 0 || balance <= 0) {
        document.getElementById("posLotSize").textContent = "0.00";
        document.getElementById("posRiskAmount").textContent = "$0.00";
        return;
    }

    var riskAmount = balance * (risk / 100);
    var slDistance = Math.abs(entry - sl);

    // For crypto (BTC, ETH) use point value, for forex use pip value
    var valuePerPoint = (pair === "XAUUSD" || pair === "BTCUSD" || pair === "ETHUSD") ? 1 : 10;
    var lotSize = riskAmount / (slDistance * valuePerPoint);

    document.getElementById("posLotSize").textContent = lotSize.toFixed(2);
    document.getElementById("posRiskAmount").textContent = "$" + riskAmount.toFixed(2);
}

function selectSession(e) {
    var btn = e.currentTarget;
    var session = btn.dataset.session;

    document.querySelectorAll(".session-btn").forEach(function(b) {
        b.classList.remove("active");
    });
    btn.classList.add("active");

    var names = { london: "London", newyork: "New York", asia: "Tokyo/Asia" };
    document.getElementById("activeSessionName").textContent = names[session] || "-";

    // Save to settings
    state.settings.lastSession = session;
    saveData();
}

function updateSessionStatus() {
    var now = new Date();
    var hours = now.getUTCHours();

    var session = "";
    var statusEl = document.getElementById("sessionStatus");
    var statusText = document.getElementById("sessionStatusText");

    if (hours >= 8 && hours < 17) {
        session = "London";
        statusEl.className = "status-dot active";
        statusText.textContent = "Session London active";
    } else if (hours >= 13 && hours < 21) {
        session = "New York";
        statusEl.className = "status-dot active";
        statusText.textContent = "Session New York active";
    } else if (hours >= 0 && hours < 9) {
        session = "Asia";
        statusEl.className = "status-dot active";
        statusText.textContent = "Session Asia active";
    } else {
        statusEl.className = "status-dot";
        statusText.textContent = "Aucune session majeure";
    }
}

function resetTradingTools() {
    document.getElementById("rrEntry").value = "";
    document.getElementById("rrStopLoss").value = "";
    document.getElementById("rrTakeProfit").value = "";
    document.getElementById("rrResult").textContent = "1:0";
    document.getElementById("rrQuality").textContent = "-";
    document.getElementById("rrQuality").className = "result-quality";
    document.getElementById("potentialLoss").textContent = "$0.00";
    document.getElementById("potentialProfit").textContent = "$0.00";

    document.getElementById("posBalance").value = state.settings.initialCapital;
    document.getElementById("posRisk").value = 2;
    document.getElementById("posEntry").value = "";
    document.getElementById("posSL").value = "";
    document.getElementById("posLotSize").textContent = "0.00";
    document.getElementById("posRiskAmount").textContent = "$0.00";

    document.querySelectorAll(".session-btn").forEach(function(b) {
        b.classList.remove("active");
    });
    document.getElementById("activeSessionName").textContent = "-";
}

// ===== TAGS MANAGER =====
var newTagColor = "#3b82f6";

function initTagsManager() {
    document.getElementById("addNewTagBtn").addEventListener("click", function() {
        document.getElementById("tagNameInput").focus();
    });

    document.getElementById("tagNameInput").addEventListener("input", updateTagPreview);
    document.getElementById("createTagBtn").addEventListener("click", createTagFromManager);

    document.querySelectorAll(".color-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".color-btn").forEach(function(b) {
                b.classList.remove("active");
            });
            btn.classList.add("active");
            newTagColor = btn.dataset.color;
            updateTagPreview();
        });
    });

    document.getElementById("resetTools").addEventListener("click", function() {
        // Also reset tools
    });

    renderTagsGrid();
    renderTagStats();
}

function updateTagPreview() {
    var name = document.getElementById("tagNameInput").value.trim() || "Nouveau";
    var preview = document.getElementById("tagCreatePreview");
    if (preview) {
        preview.textContent = name;
        preview.style.background = newTagColor;
    }
}

function createTagFromManager() {
    var nameInput = document.getElementById("tagNameInput");
    var descInput = document.getElementById("tagDescInput");

    var name = nameInput.value.trim();
    var desc = descInput.value.trim();

    if (!name) {
        showToast("Veuillez entrer un nom de tag", "error");
        return;
    }

    var exists = state.customTags.some(function(t) {
        return t.name.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
        showToast("Ce tag existe déjà", "error");
        return;
    }

    state.customTags.push({
        name: name,
        description: desc,
        color: newTagColor
    });

    saveData();
    renderTagsGrid();
    renderTagStats();
    renderTradeTags();
    renderFilterTags();
    renderSettingsTags();

    nameInput.value = "";
    descInput.value = "";

    showToast("Tag créé!", "success");
}

function renderTagsGrid() {
    var grid = document.getElementById("tagsGrid");
    var empty = document.getElementById("emptyTags");

    if (state.customTags.length === 0) {
        grid.innerHTML = "";
        if (empty) empty.style.display = "flex";
        return;
    }

    if (empty) empty.style.display = "none";

    var html = "";
    state.customTags.forEach(function(tag, index) {
        var color = tag.color || "#3b82f6";
        html += '<div class="tag-card">';
        html += '<div class="tag-card-info">';
        html += '<span class="tag-card-name" style="color:' + color + '">' + escapeHtml(tag.name) + '</span>';
        if (tag.description) {
            html += '<span class="tag-card-desc">' + escapeHtml(tag.description) + '</span>';
        }
        html += '</div>';
        html += '<div class="tag-card-actions">';
        html += '<button class="btn-icon" onclick="editTag(' + index + ')" title="Modifier"><i class="fas fa-edit"></i></button>';
        html += '<button class="btn-icon danger" onclick="deleteTag(' + index + ')" title="Supprimer"><i class="fas fa-trash"></i></button>';
        html += '</div>';
        html += '</div>';
    });

    grid.innerHTML = html;
}

function renderTagStats() {
    var grid = document.getElementById("tagStatsGrid");
    var tagStats = calculateStatsByTag();
    var tagNames = Object.keys(tagStats);

    if (tagNames.length === 0) {
        grid.innerHTML = '<p class="text-muted">Aucune statistique disponible</p>';
        return;
    }

    var html = "";
    tagNames.forEach(function(tagName) {
        var s = tagStats[tagName];
        var winrate = s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(1) : "0";
        var net = s.profit - s.loss;

        var tag = state.customTags.find(function(t) {
            return t.name === tagName;
        });
        var color = (tag && tag.color) || "#3b82f6";

        html += '<div class="tag-stat-item">';
        html += '<div class="tag-stat-header">';
        html += '<span class="tag-badge" style="background:' + color + '">' + escapeHtml(tagName) + '</span>';
        html += '</div>';
        html += '<div class="tag-stat-values">';
        html += '<span>Trades:</span><span>' + s.trades + '</span>';
        html += '<span>Winrate:</span><span>' + winrate + '%</span>';
        html += '<span>Net:</span><span class="' + (net >= 0 ? "positive" : "negative") + '">' + (net >= 0 ? "+" : "") + '$' + net.toFixed(2) + '</span>';
        html += '</div>';
        html += '</div>';
    });

    grid.innerHTML = html;
}
