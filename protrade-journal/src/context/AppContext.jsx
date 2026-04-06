import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const STORAGE_KEYS = {
  TRADES: 'protrade_trades',
  SETTINGS: 'protrade_settings',
  NOTES: 'protrade_notes',
  TAGS: 'protrade_tags',
  SURVEILLANCE: 'protrade_surveillance',
  LANGUAGE: 'protrade_language',
  THEME: 'protrade_theme'
};

const DEFAULT_TAGS = [
  { id: '1', name: 'BOS', description: 'Break of Structure', color: '#3b82f6' },
  { id: '2', name: 'FVG', description: 'Fair Value Gap', color: '#8b5cf6' },
  { id: '3', name: 'Liquidity Grab', description: 'Chasse aux liquidites', color: '#ef4444' },
  { id: '4', name: 'Trendline', description: 'Cassure de tendance', color: '#10b981' },
  { id: '5', name: 'Fibo', description: 'Fibonacci', color: '#f59e0b' },
  { id: '6', name: 'Support/Resistance', description: 'Niveau S/R', color: '#06b6d4' },
  { id: '7', name: 'Price Action', description: 'Action des prix', color: '#ec4899' },
  { id: '8', name: 'News', description: 'Trade base sur les news', color: '#f97316' }
];

const DEFAULT_SETTINGS = {
  initialCapital: 10000,
  theme: 'dark',
  defaultRisk: 2
};

const defaultConfirmations = [
  { id: '1', title: 'Trend confirmed', stars: 3 },
  { id: '2', title: 'Key levels identified', stars: 2 },
  { id: '3', title: 'Confluence found', stars: 3 },
  { id: '4', title: 'Risk < 2%', stars: 3 },
  { id: '5', title: 'RR >= 1:3', stars: 2 }
];

const translations = {
  fr: {
    dashboard: 'Dashboard',
    trades: 'Trades',
    surveillance: 'Surveillance',
    addTrade: 'Ajouter Trade',
    calculator: 'Calculateur',
    stats: 'Statistiques',
    checklist: 'Checklist',
    notes: 'Notes',
    tags: 'Tags',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    capital: 'Capital',
    winrate: 'Winrate',
    totalTrades: 'Total Trades',
    totalProfit: 'Profit Total',
    profitFactor: 'Profit Factor',
    equityCurve: 'Courbe d\'Équité',
    all: 'Tout',
    month: 'Mois',
    week: 'Semaine',
    recentTrades: 'Trades Récents',
    seeAll: 'Voir tout',
    noTrades: 'Aucun trade',
    byPair: 'Par Paire',
    my: 'Mes',
    allPairs: 'Toutes les paires',
    allTypes: 'Tous les types',
    allResults: 'Tous résultats',
    clear: 'Effacer',
    trade: 'Trade',
    newTrade: 'Nouveau Trade',
    dateTime: 'Date & Heure',
    pair: 'Paire',
    direction: 'Direction',
    style: 'Type',
    lotSize: 'Taille du Lot',
    stopLoss: 'Stop Loss (pips)',
    takeProfit: 'Take Profit (pips)',
    result: 'Résultat ($)',
    tags: 'Tags',
    comment: 'Commentaire',
    screenshot: 'Screenshot',
    uploadImage: 'Télécharger une image',
    removeImage: 'Supprimer',
    saveTrade: 'Enregistrer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    newNote: 'Nouvelle Note',
    category: 'Catégorie',
    content: 'Contenu',
    analysis: 'Analyse',
    journal: 'Journal',
    mistakes: 'Erreurs',
    allCategories: 'Toutes catégories',
    noNotes: 'Aucune note',
    tagManager: 'Gestion des Tags',
    newTag: 'Nouveau Tag',
    createTag: 'Créer un Tag',
    tagName: 'Nom du tag',
    description: 'Description',
    color: 'Couleur',
    create: 'Créer',
    existingTags: 'Tags Existants',
    capitalSettings: 'Capital',
    initialCapital: 'Capital Initial ($)',
    exportData: 'Exporter les données',
    exportAll: 'Tout exporter',
    dangerZone: 'Zone Dangereuse',
    clearAllData: 'Effacer toutes les données',
    lotCalculator: 'Calculateur de Lot',
    formula: 'Formule',
    accountParams: 'Paramètres du Compte',
    balance: 'Balance ($)',
    risk: 'Risque (%)',
    riskAmount: 'Montant risqué',
    tradeParams: 'Paramètres du Trade',
    calculate: 'Calculer',
    recommendedLot: 'Taille du Lot',
    pipValue: 'Valeur du Pip',
    potentialProfit: 'Profit Potentiel',
    statistics: 'Statistiques',
    bestTrade: 'Meilleur Trade',
    worstTrade: 'Pire Trade',
    winLoss: 'Win / Loss',
    riskManagement: 'Gestion du Risque',
    psychology: 'Psychologie',
    riskReward: 'Risk/Reward',
    takeTheTrade: 'Prendre le Trade',
    completion: 'Completion',
    win: 'Gagnant',
    loss: 'Perdant',
    breakeven: 'Break Even',
    newSurveillance: 'Nouvelle Surveillance',
    screenshots: 'Captures (3 max)',
    addScreenshot: 'Ajouter capture',
    confirmations: 'Confirmations',
    addConfirmation: 'Ajouter confirmation',
    title: 'Titre',
    importance: 'Importance',
    preTradeChecklist: 'Checklist Avant Trade',
    marketNotes: 'Notes de Marché',
    addNote: 'Ajouter Note',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    theme: 'Thème'
  },
  en: {
    dashboard: 'Dashboard',
    trades: 'Trades',
    surveillance: 'Surveillance',
    addTrade: 'Add Trade',
    calculator: 'Calculator',
    stats: 'Statistics',
    checklist: 'Checklist',
    notes: 'Notes',
    tags: 'Tags',
    settings: 'Settings',
    logout: 'Logout',
    capital: 'Capital',
    winrate: 'Winrate',
    totalTrades: 'Total Trades',
    totalProfit: 'Total Profit',
    profitFactor: 'Profit Factor',
    equityCurve: 'Equity Curve',
    all: 'All',
    month: 'Month',
    week: 'Week',
    recentTrades: 'Recent Trades',
    seeAll: 'See All',
    noTrades: 'No trades',
    byPair: 'By Pair',
    my: 'My',
    allPairs: 'All pairs',
    allTypes: 'All types',
    allResults: 'All results',
    clear: 'Clear',
    trade: 'Trade',
    newTrade: 'New Trade',
    dateTime: 'Date & Time',
    pair: 'Pair',
    direction: 'Direction',
    style: 'Style',
    lotSize: 'Lot Size',
    stopLoss: 'Stop Loss (pips)',
    takeProfit: 'Take Profit (pips)',
    result: 'Result ($)',
    tags: 'Tags',
    comment: 'Comment',
    screenshot: 'Screenshot',
    uploadImage: 'Upload image',
    removeImage: 'Remove',
    saveTrade: 'Save',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    newNote: 'New Note',
    category: 'Category',
    content: 'Content',
    analysis: 'Analysis',
    journal: 'Journal',
    mistakes: 'Mistakes',
    allCategories: 'All categories',
    noNotes: 'No notes',
    tagManager: 'Tag Manager',
    newTag: 'New Tag',
    createTag: 'Create a Tag',
    tagName: 'Tag name',
    description: 'Description',
    color: 'Color',
    create: 'Create',
    existingTags: 'Existing Tags',
    capitalSettings: 'Capital',
    initialCapital: 'Initial Capital ($)',
    exportData: 'Export Data',
    exportAll: 'Export All',
    dangerZone: 'Danger Zone',
    clearAllData: 'Clear All Data',
    lotCalculator: 'Lot Calculator',
    formula: 'Formula',
    accountParams: 'Account Parameters',
    balance: 'Balance ($)',
    risk: 'Risk (%)',
    riskAmount: 'Risk Amount',
    tradeParams: 'Trade Parameters',
    calculate: 'Calculate',
    recommendedLot: 'Lot Size',
    pipValue: 'Pip Value',
    potentialProfit: 'Potential Profit',
    statistics: 'Statistics',
    bestTrade: 'Best Trade',
    worstTrade: 'Worst Trade',
    winLoss: 'Win / Loss',
    riskManagement: 'Risk Management',
    psychology: 'Psychology',
    riskReward: 'Risk/Reward',
    takeTheTrade: 'Take Trade',
    completion: 'Completion',
    win: 'Win',
    loss: 'Loss',
    breakeven: 'Break Even',
    newSurveillance: 'New Surveillance',
    screenshots: 'Screenshots (3 max)',
    addScreenshot: 'Add screenshot',
    confirmations: 'Confirmations',
    addConfirmation: 'Add confirmation',
    title: 'Title',
    importance: 'Importance',
    preTradeChecklist: 'Pre-Trade Checklist',
    marketNotes: 'Market Notes',
    addNote: 'Add Note',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    theme: 'Theme'
  }
};

const PIP_VALUES = {
  XAUUSD: 0.1,
  EURUSD: 10,
  GBPUSD: 10,
  USDJPY: 6.67,
  BTCUSD: 1,
  ETHUSD: 1,
  AUDUSD: 10,
  USDCAD: 10,
  NZDUSD: 10,
  EURJPY: 6.67,
  GBPJPY: 6.67
};

export const PAIRS = [
  { value: 'XAUUSD', label: 'XAUUSD (Or)' },
  { value: 'EURUSD', label: 'EURUSD' },
  { value: 'BTCUSD', label: 'BTCUSD' },
  { value: 'GBPUSD', label: 'GBPUSD' },
  { value: 'USDJPY', label: 'USDJPY' },
  { value: 'ETHUSD', label: 'ETHUSD' },
  { value: 'OTHER', label: 'Other' }
];

export const SETUP_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSDT', 'ETHUSDT', 'USDJPY'];

export function AppProvider({ children }) {
  const [trades, setTrades] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [surveillances, setSurveillances] = useState([]);
  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isLoading]);

  const loadData = () => {
    try {
      const storedTrades = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADES)) || [];
      const storedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
      const storedNotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
      const storedTags = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS)) || DEFAULT_TAGS;
      const storedSurveillances = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEILLANCE)) || [];
      const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'fr';
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';

      setTrades(storedTrades);
      setSettings(storedSettings);
      setNotes(storedNotes);
      setTags(storedTags);
      setSurveillances(storedSurveillances);
      setLanguage(storedLanguage);
      setTheme(storedTheme);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      localStorage.setItem(STORAGE_KEYS.SURVEILLANCE, JSON.stringify(surveillances));
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [trades, settings, notes, tags, surveillances, language, theme]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const t = (key) => translations[language][key] || key;

  const addTrade = (trade) => {
    const newTrade = {
      ...trade,
      id: Date.now(),
      date: trade.date || new Date().toISOString()
    };
    setTrades(prev => [...prev, newTrade]);
  };

  const updateTrade = (id, updatedTrade) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updatedTrade } : t));
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const addNote = (note) => {
    const newNote = {
      ...note,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNote = (id, updatedNote) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updatedNote } : n));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addTag = (tag) => {
    const newTag = {
      ...tag,
      id: Date.now().toString()
    };
    setTags(prev => [...prev, newTag]);
  };

  const updateTag = (id, updatedTag) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...updatedTag } : t));
  };

  const deleteTag = (id) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const addSurveillance = (surveillance) => {
    const newSurveillance = {
      ...surveillance,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      confirmations: surveillance.confirmations || [],
      screenshots: surveillance.screenshots || [],
      customConfirmations: surveillance.customConfirmations || []
    };
    setSurveillances(prev => [...prev, newSurveillance]);
  };

  const updateSurveillance = (id, updatedSurveillance) => {
    setSurveillances(prev => prev.map(s => s.id === id ? { ...s, ...updatedSurveillance } : s));
  };

  const deleteSurveillance = (id) => {
    setSurveillances(prev => prev.filter(s => s.id !== id));
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const calculateStats = (tradesToCalculate = trades) => {
    if (tradesToCalculate.length === 0) {
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
        maxLoss: 0
      };
    }

    const wins = tradesToCalculate.filter(t => t.result > 0);
    const losses = tradesToCalculate.filter(t => t.result < 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.result, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.result, 0));
    const totalProfit = tradesToCalculate.reduce((sum, t) => sum + t.result, 0);
    const maxWin = Math.max(0, ...tradesToCalculate.map(t => t.result));
    const maxLoss = Math.min(0, ...tradesToCalculate.map(t => t.result));

    return {
      totalTrades: tradesToCalculate.length,
      wins: wins.length,
      losses: losses.length,
      winrate: tradesToCalculate.length > 0 ? (wins.length / tradesToCalculate.length * 100).toFixed(1) : 0,
      totalProfit: totalProfit.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossLoss: grossLoss.toFixed(2),
      profitFactor: grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'inf' : '0.00'),
      avgWin: wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : 0,
      avgLoss: losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : 0,
      maxWin: maxWin.toFixed(2),
      maxLoss: maxLoss.toFixed(2)
    };
  };

  const calculateLotSize = (balance, riskPercent, slPips, pair) => {
    if (balance <= 0 || riskPercent <= 0 || slPips <= 0) {
      return { lotSize: 0, riskAmount: 0, pipValue: 0 };
    }

    const riskAmount = balance * (riskPercent / 100);
    const pipValue = PIP_VALUES[pair] || 10;
    const lotSize = riskAmount / (slPips * pipValue);

    return {
      lotSize: Math.floor(lotSize * 100) / 100,
      riskAmount,
      pipValue
    };
  };

  const value = {
    trades,
    settings,
    notes,
    tags,
    surveillances,
    language,
    theme,
    isLoading,
    toggleLanguage,
    toggleTheme,
    t,
    addTrade,
    updateTrade,
    deleteTrade,
    addNote,
    updateNote,
    deleteNote,
    addTag,
    updateTag,
    deleteTag,
    addSurveillance,
    updateSurveillance,
    deleteSurveillance,
    updateSettings,
    calculateStats,
    calculateLotSize,
    PIP_VALUES,
    PAIRS,
    SETUP_PAIRS,
    defaultConfirmations
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}