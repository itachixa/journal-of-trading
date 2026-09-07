import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../lib/api';

const AppContext = createContext();

export const PAIRS = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD','EURGBP','EURJPY','GBPJPY','AUDJPY','CHFJPY','EURCHF','AUDNZD'];
export const SETUP_PAIRS = ['EURUSD','GBPUSD','USDJPY','GBPJPY','AUDUSD','USDCAD'];

const DEFAULT_TAGS = [
  { name: 'BOS', color: '#3b82f6' },
  { name: 'FVG', color: '#8b5cf6' },
  { name: 'Liquidity Grab', color: '#ef4444' }
];

const DEFAULT_SETTINGS = { initialCapital: 10000, theme: 'dark', defaultRisk: 2 };

export function AppProvider({ children }) {
  const [trades, setTrades] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [surveillances, setSurveillances] = useState([]);
  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tradesRes, notesRes, tagsRes, survRes, settingsRes] = await Promise.all([
        api.getTrades(), api.getNotes(), api.getTags(), api.getSurveillances(), api.getSettings()
      ]);
      setTrades(tradesRes);
      setNotes(notesRes || []);
      setTags(tagsRes.length > 0 ? tagsRes : DEFAULT_TAGS);
      setSurveillances(survRes || []);
      if (settingsRes && Object.keys(settingsRes).length > 0) {
        setSettings({
          initialCapital: settingsRes.initial_capital ?? settingsRes.initialCapital ?? 10000,
          theme: settingsRes.theme || 'dark',
          defaultRisk: settingsRes.default_risk ?? settingsRes.defaultRisk ?? 2,
          device: settingsRes.device || 'desktop',
          currency: settingsRes.currency || 'EUR',
          language: settingsRes.language || 'fr'
        });
        if (settingsRes.language) {
          setLanguage(settingsRes.language);
          localStorage.setItem('protrade_language', settingsRes.language);
        }
        if (settingsRes.theme) {
          setTheme(settingsRes.theme);
          localStorage.setItem('protrade_theme', settingsRes.theme);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const loadPrefs = () => {
    setLanguage(localStorage.getItem('protrade_language') || 'fr');
    setTheme(localStorage.getItem('protrade_theme') || 'dark');
  };

  useEffect(() => { loadData(); loadPrefs(); }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const accountBalance = useMemo(() =>
    (settings.initialCapital || 10000) + trades.reduce((s, t) => s + (parseFloat(t.result) || 0), 0),
    [settings.initialCapital, trades]
  );

  const calculateLotSize = useCallback((balance, riskPercent, stopLoss, pair) => {
    const risk = riskPercent || settings.defaultRisk || 2;
    const riskAmount = (balance * risk) / 100;
    const sl = Math.abs(parseFloat(stopLoss) || 0);
    const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
    const pipCount = sl / (pair.includes('JPY') ? 100 : 10000);
    if (!pipCount || !pair) {
      return { lotSize: 0, riskAmount: 0, pipValue };
    }
    const lotSize = parseFloat((riskAmount / (pipCount * 10)).toFixed(2));
    return { lotSize, riskAmount: parseFloat(riskAmount.toFixed(2)), pipValue };
  }, [settings]);

  const t = k => {
    const dict = {
      fr: {
        dashboard: 'Tableau de Bord', trades: 'Trades', addTrade: 'Ajouter Trade', calculator: 'Calculateur',
        stats: 'Statistiques', notes: 'Notes', tags: 'Tags', settings: 'Paramètres', capital: 'Capital',
        darkMode: 'Mode Sombre', lightMode: 'Mode Clair', pair: 'Paire', direction: 'Direction',
        device: 'Appareil', currency: 'Devise',
        lotSize: 'Taille du Lot', stopLoss: 'Stop Loss', takeProfit: 'Take Profit', result: 'Résultat',
        saveTrade: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', save: 'Enregistrer', add: 'Ajouter',
        newNote: 'Nouvelle Note', category: 'Catégorie', content: 'Contenu', allCategories: 'Toutes catégories',
        noNotes: 'Aucune note', calculate: 'Calculer', balance: 'Balance', risk: 'Risque',
        recommendedLot: 'Taille du Lot', noTrades: 'Aucun trade', recentTrades: 'Trades Récents',
        winrate: 'Taux de Réussite', totalTrades: 'Total Trades', totalProfit: 'Profit Total',
        profitFactor: 'Profit Factor', equityCurve: 'Courbe de Capital', byPair: 'Par Paire',
        seeAll: 'Voir tout', allPairs: 'Toutes les paires', allTypes: 'Tous les types',
        allResults: 'Tous les résultats', win: 'Gagnant', loss: 'Perdant', clear: 'Effacer',
        my: 'Mes', style: 'Style', dateTime: 'Date/Heure', screenshot: 'Capture', newTrade: 'Nouveau Trade',
        lotCalculator: 'Calculateur de Lot', formula: 'Formule', accountParams: 'Paramètres du Compte',
        riskAmount: 'Montant Risqué', pipValue: 'Valeur Pip', riskReward: 'R/R', potentialProfit: 'Profit Potentiel',
        takeTheTrade: 'Prendre le Trade', tradeParams: 'Paramètres du Trade', statistics: 'Statistiques',
        bestTrade: 'Meilleur Trade', worstTrade: 'Pire Trade', winLoss: 'Gagnants/Perdants',
        marketNotes: 'Notes de Marché', tagManager: 'Gestionnaire de Tags', createTag: 'Créer un Tag',
        tagName: 'Nom du Tag', description: 'Description', color: 'Couleur', create: 'Créer',
        existingTags: 'Tags Existants', capitalSettings: 'Paramètres du Capital', initialCapital: 'Capital Initial',
        exportData: 'Exporter les Données', exportAll: 'Tout Exporter', dangerZone: 'Zone de Danger',
        clearAllData: 'Supprimer Toutes les Données', surveillance: 'Surveillance', screenshots: 'Captures',
        completion: 'Achèvement', edit: 'Modifier', uploadImage: 'Télécharger Image',
        comment: 'Commentaire', trade: 'Trade', analysis: 'Analyse',
        journal: 'Journal', mistakes: 'Erreurs', login: 'Connexion', signup: 'Inscription',
        email: 'Email', password: 'Mot de passe', logout: 'Déconnexion', noAccount: "Pas encore de compte ?",
        hasAccount: 'Déjà un compte ?', resetPassword: 'Réinitialiser le mot de passe',
        sendResetLink: 'Envoyer le lien', backToLogin: 'Retour à la connexion'
      },
      en: {
        dashboard: 'Dashboard', trades: 'Trades', addTrade: 'Add Trade', calculator: 'Calculator',
        stats: 'Statistics', notes: 'Notes', tags: 'Tags', settings: 'Settings', capital: 'Capital',
        darkMode: 'Dark Mode', lightMode: 'Light Mode', pair: 'Pair', direction: 'Direction',
        device: 'Device', currency: 'Currency',
        lotSize: 'Lot Size', stopLoss: 'Stop Loss', takeProfit: 'Take Profit', result: 'Result',
        saveTrade: 'Save Trade', cancel: 'Cancel', delete: 'Delete', save: 'Save', add: 'Add',
        newNote: 'New Note', category: 'Category', content: 'Content', allCategories: 'All Categories',
        noNotes: 'No notes', calculate: 'Calculate', balance: 'Balance', risk: 'Risk',
        recommendedLot: 'Lot Size', noTrades: 'No trades', recentTrades: 'Recent Trades',
        winrate: 'Winrate', totalTrades: 'Total Trades', totalProfit: 'Total Profit',
        profitFactor: 'Profit Factor', equityCurve: 'Equity Curve', byPair: 'By Pair',
        seeAll: 'See all', allPairs: 'All pairs', allTypes: 'All types', allResults: 'All results',
        win: 'Win', loss: 'Loss', clear: 'Clear', my: 'My', style: 'Style', dateTime: 'Date/Time',
        screenshot: 'Screenshot', newTrade: 'New Trade', lotCalculator: 'Lot Calculator',
        formula: 'Formula', accountParams: 'Account Params', riskAmount: 'Risk Amount',
        pipValue: 'Pip Value', riskReward: 'R/R', potentialProfit: 'Potential Profit',
        takeTheTrade: 'Take the Trade', tradeParams: 'Trade Params', statistics: 'Statistics',
        bestTrade: 'Best Trade', worstTrade: 'Worst Trade', winLoss: 'Win/Loss',
        marketNotes: 'Market Notes', tagManager: 'Tag Manager', createTag: 'Create Tag',
        tagName: 'Tag Name', description: 'Description', color: 'Color', create: 'Create',
        existingTags: 'Existing Tags', capitalSettings: 'Capital Settings', initialCapital: 'Initial Capital',
        exportData: 'Export Data', exportAll: 'Export All', dangerZone: 'Danger Zone',
        clearAllData: 'Clear All Data', surveillance: 'Surveillance', screenshots: 'Screenshots',
        completion: 'Completion', edit: 'Edit', uploadImage: 'Upload Image',
        comment: 'Comment', trade: 'Trade', analysis: 'Analysis',
        journal: 'Journal', mistakes: 'Mistakes', login: 'Login', signup: 'Sign Up',
        email: 'Email', password: 'Password', logout: 'Logout', noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?', resetPassword: 'Reset Password',
        sendResetLink: 'Send Reset Link', backToLogin: 'Back to Login'
      }
    };
    return dict[language][k] || k;
  };

  const value = {
    trades, settings, notes, tags, surveillances, language, theme, isLoading, accountBalance, PAIRS, SETUP_PAIRS,
    toggleLanguage: () => setLanguage(p => { const n = p === 'fr' ? 'en' : 'fr'; localStorage.setItem('protrade_language', n); return n; }),
    toggleTheme: () => setTheme(p => { const n = p === 'dark' ? 'light' : 'dark'; localStorage.setItem('protrade_theme', n); return n; }),
    t,
    calculateLotSize,
    updateSettings: async (newSettings) => {
      const r = await api.updateSettings(newSettings);
      setSettings(r);
    },
    addTrade: async (tradeData) => { const r = await api.createTrade({ ...tradeData, date: tradeData.date || new Date().toISOString() }); setTrades(p => [r, ...p]); },
    updateTrade: async (id, tradeData) => { const r = await api.updateTrade(id, tradeData); setTrades(p => p.map(x => x.id === id ? r : x)); },
    deleteTrade: async (id) => { await api.deleteTrade(id); setTrades(p => p.filter(x => x.id !== id)); },
    addNote: async (noteData) => { const r = await api.createNote(noteData); setNotes(p => [r, ...p]); },
    updateNote: async (id, noteData) => { const r = await api.updateNote(id, noteData); setNotes(p => p.map(x => x.id === id ? r : x)); },
    deleteNote: async (id) => { await api.deleteNote(id); setNotes(p => p.filter(x => x.id !== id)); },
    addTag: async (tagData) => { const r = await api.createTag(tagData); setTags(p => [...p, r]); },
    updateTag: async (id, tagData) => { const r = await api.updateTag(id, tagData); setTags(p => p.map(x => x.id === id ? r : x)); },
    deleteTag: async (id) => { await api.deleteTag(id); setTags(p => p.filter(x => x.id !== id)); },
    addSurveillance: async (survData) => { const r = await api.createSurveillance({ ...survData, created_at: new Date().toISOString() }); setSurveillances(p => [...p, r]); },
    updateSurveillance: async (id, survData) => { const r = await api.updateSurveillance(id, survData); setSurveillances(p => p.map(x => x.id === id ? r : x)); },
    deleteSurveillance: async (id) => { await api.deleteSurveillance(id); setSurveillances(p => p.filter(x => x.id !== id)); },
    calculateStats: (ts = trades) => {
      if (ts.length === 0) return { totalTrades: 0, wins: 0, losses: 0, winrate: 0, totalProfit: 0, profitFactor: 0, maxWin: 0, maxLoss: 0 };
      const wins = ts.filter(t => t.result > 0);
      const losses = ts.filter(t => t.result < 0);
      const gp = wins.reduce((s, t) => s + t.result, 0);
      const gl = Math.abs(losses.reduce((s, t) => s + t.result, 0));
      const maxWin = wins.length > 0 ? Math.max(...wins.map(t => t.result)) : 0;
      const maxLoss = losses.length > 0 ? Math.min(...losses.map(t => t.result)) : 0;
      return {
        totalTrades: ts.length, wins: wins.length, losses: ts.length - wins.length,
        winrate: ((wins.length / ts.length) * 100).toFixed(1),
        totalProfit: ts.reduce((s, t) => s + t.result, 0).toFixed(2),
        profitFactor: gl > 0 ? (gp / gl).toFixed(2) : 'inf',
        maxWin: maxWin.toFixed(2),
        maxLoss: maxLoss.toFixed(2)
      };
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
