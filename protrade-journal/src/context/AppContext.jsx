import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const DEFAULT_TAGS = [
  { name: 'BOS', description: 'Break of Structure', color: '#3b82f6' },
  { name: 'FVG', description: 'Fair Value Gap', color: '#8b5cf6' },
  { name: 'Liquidity Grab', description: 'Chasse aux liquidites', color: '#ef4444' },
  { name: 'Trendline', description: 'Cassure de tendance', color: '#10b981' },
  { name: 'Fibo', description: 'Fibonacci', color: '#f59e0b' },
  { name: 'Support/Resistance', description: 'Niveau S/R', color: '#06b6d4' },
  { name: 'Price Action', description: 'Action des prix', color: '#ec4899' },
  { name: 'News', description: 'Trade base sur les news', color: '#f97316' }
];

const DEFAULT_SETTINGS = {
  initialCapital: 10000,
  theme: 'dark',
  defaultRisk: 2
};

const defaultConfirmations = [
  { title: 'Trend confirmed', stars: 3 },
  { title: 'Key levels identified', stars: 2 },
  { title: 'Confluence found', stars: 3 },
  { title: 'Risk < 2%', stars: 3 },
  { title: 'RR >= 1:3', stars: 2 }
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
  const [user, setUser] = useState(null);

  const accountBalance = useMemo(() => {
    const initialCapital = settings.initialCapital || 10000;
    const totalProfit = trades.reduce((sum, trade) => sum + (parseFloat(trade.result) || 0), 0);
    return initialCapital + totalProfit;
  }, [settings.initialCapital, trades]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
      const savedLanguage = localStorage.getItem('protrade_language') || 'fr';
      const savedTheme = localStorage.getItem('protrade_theme') || 'dark';
      setLanguage(savedLanguage);
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isLoading, user]);

  const loadData = async () => {
    try {
      const [settingsRes, tradesRes, notesRes, tagsRes, surveillancesRes] = await Promise.all([
        supabase.from('settings').select('*').single(),
        supabase.from('trades').select('*').order('date', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('tags').select('*').order('name'),
        supabase.from('surveillances').select(`*, confirmations:surveillance_confirmations(*), screenshots:surveillance_screenshots(*)`).order('created_at', { ascending: false })
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (tradesRes.data) setTrades(tradesRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (tagsRes.data) setTags(tagsRes.data);
      if (surveillancesRes.data) setSurveillances(surveillancesRes.data);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key) => translations[language][key] || key;

  const addTrade = async (trade) => {
    const newTrade = {
      ...trade,
      user_id: user?.id,
      date: trade.date || new Date().toISOString()
    };
    const { data, error } = await supabase.from('trades').insert([newTrade]).select().single();
    if (error) throw error;
    setTrades(prev => [data, ...prev]);
  };

  const updateTrade = async (id, updatedTrade) => {
    const { data, error } = await supabase.from('trades').update(updatedTrade).eq('id', id).select().single();
    if (error) throw error;
    setTrades(prev => prev.map(t => t.id === id ? data : t));
  };

  const deleteTrade = async (id) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (error) throw error;
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const addNote = async (note) => {
    const newNote = {
      ...note,
      user_id: user?.id,
      createdAt: new Date().toISOString()
    };
    const { data, error } = await supabase.from('notes').insert([newNote]).select().single();
    if (error) throw error;
    setNotes(prev => [data, ...prev]);
  };

  const updateNote = async (id, updatedNote) => {
    const { data, error } = await supabase.from('notes').update(updatedNote).eq('id', id).select().single();
    if (error) throw error;
    setNotes(prev => prev.map(n => n.id === id ? data : n));
  };

  const deleteNote = async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addTag = async (tag) => {
    const newTag = { ...tag, user_id: user?.id };
    const { data, error } = await supabase.from('tags').insert([newTag]).select().single();
    if (error) throw error;
    setTags(prev => [...prev, data]);
  };

  const updateTag = async (id, updatedTag) => {
    const { data, error } = await supabase.from('tags').update(updatedTag).eq('id', id).select().single();
    if (error) throw error;
    setTags(prev => prev.map(t => t.id === id ? data : t));
  };

  const deleteTag = async (id) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const addSurveillance = async (surveillance) => {
    const newSurveillance = {
      ...surveillance,
      user_id: user?.id,
      createdAt: new Date().toISOString(),
      confirmations: surveillance.confirmations || [],
      screenshots: surveillance.screenshots || [],
      customConfirmations: surveillance.customConfirmations || []
    };
    
    const { data: survData, error: survError } = await supabase.from('surveillances').insert([{
      user_id: user?.id,
      pair: surveillance.pair,
      direction: surveillance.direction,
      notes: surveillance.notes
    }]).select().single();
    
    if (survError) throw survError;
    
    const confs = surveillance.confirmations?.map(c => ({
      surveillance_id: survData.id,
      title: c.title,
      stars: c.stars,
      checked: c.checked || false
    })) || [];
    
    if (confs.length > 0) {
      const { error: confError } = await supabase.from('surveillance_confirmations').insert(confs);
      if (confError) throw confError;
    }
    
    setSurveillances(prev => [...prev, survData]);
    return survData;
  };

  const updateSurveillance = async (id, updatedSurveillance) => {
    const { data, error } = await supabase.from('surveillances').update(updatedSurveillance).eq('id', id).select().single();
    if (error) throw error;
    setSurveillances(prev => prev.map(s => s.id === id ? data : s));
  };

  const deleteSurveillance = async (id) => {
    const { error } = await supabase.from('surveillances').delete().eq('id', id);
    if (error) throw error;
    setSurveillances(prev => prev.filter(s => s.id !== id));
  };

  const updateSettings = async (newSettings) => {
    if (user) {
      const { data, error } = await supabase.from('settings').upsert({ 
        user_id: user.id, 
        ...newSettings 
      }).select().single();
      if (error) throw error;
      setSettings(prev => ({ ...prev, ...data }));
    } else {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
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
    accountBalance,
    user,
    toggleLanguage: () => {
      if (user) return;
      setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
      localStorage.setItem('protrade_language', language === 'fr' ? 'en' : 'fr');
    },
    toggleTheme: () => {
      if (user) return;
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      localStorage.setItem('protrade_theme', theme === 'dark' ? 'light' : 'dark');
    },
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