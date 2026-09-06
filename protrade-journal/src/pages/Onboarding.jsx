import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './Onboarding.css';

const STEPS = [
  { id: 'welcome', title: 'Bienvenue', subtitle: 'Configurons votre journal de trading' },
  { id: 'device', title: 'Appareil', subtitle: 'Comment allez-vous utiliser l\'application ?' },
  { id: 'currency', title: 'Devise', subtitle: 'Choisissez votre devise principale' },
  { id: 'capital', title: 'Capital Initial', subtitle: 'Définissez votre balance de départ' },
  { id: 'language', title: 'Langue', subtitle: 'Choisissez votre langue préférée' },
  { id: 'theme', title: 'Apparence', subtitle: 'Sélectionnez votre thème' },
  { id: 'risk', title: 'Gestion du Risque', subtitle: 'Configurez votre risque par défaut' },
  { id: 'complete', title: 'C\'est parti !', subtitle: 'Votre journal est prêt' }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [capital, setCapital] = useState(10000);
  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [defaultRisk, setDefaultRisk] = useState(2);
  const [device, setDevice] = useState('desktop');
  const [currency, setCurrency] = useState('EUR');
  const { updateSettings, settings } = useApp();
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (settings.initialCapital && settings.initialCapital !== 10000) {
      setCapital(settings.initialCapital);
    }
  }, [settings]);

  const next = () => {
    if (currentStep === STEPS.length - 2) {
      saveSettings();
    }
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
  };

  const saveSettings = async () => {
    await updateSettings({
      initialCapital: capital,
      theme,
      defaultRisk,
      language,
      device,
      currency
    });
  };

  const finish = () => {
    saveSettings();
    completeOnboarding();
    navigate('/');
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="onboarding-page">
      <div className="onboarding-background">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>

      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M7 16l4-8 4 4 6-8"/>
            </svg>
          </div>
          <h1>ProTrade Journal</h1>
        </div>

        <div className="onboarding-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-steps">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`progress-dot ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="onboarding-card">
          <div className="onboarding-step-header">
            <h2>{step.title}</h2>
            <p>{step.subtitle}</p>
          </div>

          <div className="onboarding-content">
            {currentStep === 0 && (
              <div className="onboarding-welcome">
                <div className="welcome-icon">📊</div>
                <h3>Bienvenue {user?.email?.split('@')[0] || 'Trader'} !</h3>
                <p>ProTrade Journal vous aide à suivre vos trades, analyser vos performances et améliorer votre stratégie.</p>
                <div className="welcome-features">
                  <div className="feature">
                    <span className="feature-icon">📝</span>
                    <span>Journal de trades</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">📈</span>
                    <span>Statistiques avancées</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🔍</span>
                    <span>Surveillance de setups</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🧮</span>
                    <span>Calculateur de position</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="onboarding-device">
                <div className="device-options">
                  {[
                    { id: 'mobile', label: 'Mobile', icon: '📱', desc: 'Smartphone / Petite tablette' },
                    { id: 'tablet', label: 'Tablette', icon: '📲', desc: 'iPad / Tablette Android' },
                    { id: 'desktop', label: 'Desktop', icon: '🖥️', desc: 'Ordinateur / MacBook' }
                  ].map(d => (
                    <button
                      key={d.id}
                      className={`device-card ${device === d.id ? 'active' : ''}`}
                      onClick={() => setDevice(d.id)}
                    >
                      <span className="device-icon">{d.icon}</span>
                      <span className="device-label">{d.label}</span>
                      <span className="device-desc">{d.desc}</span>
                      {device === d.id && <span className="check-icon">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="onboarding-currency">
                <div className="currency-options">
                  {[
                    { code: 'USD', symbol: '$', label: 'Dollar US', flag: '🇺🇸' },
                    { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
                    { code: 'GBP', symbol: '£', label: 'Livre Sterling', flag: '🇬🇧' },
                    { code: 'CHF', symbol: 'Fr', label: 'Franc Suisse', flag: '🇨🇭' },
                    { code: 'CAD', symbol: 'C$', label: 'Dollar Canadien', flag: '🇨🇦' },
                    { code: 'AUD', symbol: 'A$', label: 'Dollar Australien', flag: '🇦🇺' },
                    { code: 'JPY', symbol: '¥', label: 'Yen Japonais', flag: '🇯🇵' }
                  ].map(c => (
                    <button
                      key={c.code}
                      className={`currency-card ${currency === c.code ? 'active' : ''}`}
                      onClick={() => setCurrency(c.code)}
                    >
                      <span className="currency-flag">{c.flag}</span>
                      <span className="currency-symbol">{c.symbol}</span>
                      <span className="currency-label">{c.label}</span>
                      {currency === c.code && <span className="check-icon">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="onboarding-capital">
                <div className="capital-display">
                  <span className="currency">{currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : currency === 'CHF' ? 'Fr' : currency === 'CAD' ? 'C$' : currency === 'AUD' ? 'A$' : '€'}</span>
                  <span className="amount">{capital.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000000"
                  step="100"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="capital-slider"
                />
                <div className="capital-presets">
                  {[1000, 5000, 10000, 25000, 50000, 100000].map(preset => (
                    <button
                      key={preset}
                      className={`preset-btn ${capital === preset ? 'active' : ''}`}
                      onClick={() => setCapital(preset)}
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}{currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '€'}
                    </button>
                  ))}
                </div>
                <p className="capital-hint">C'est votre capital de départ. Vous pourrez le modifier dans les paramètres.</p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="onboarding-language">
                <div className="language-options">
                  {[
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'en', label: 'English', flag: '🇬🇧' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      className={`language-card ${language === lang.code ? 'active' : ''}`}
                      onClick={() => setLanguage(lang.code)}
                    >
                      <span className="language-flag">{lang.flag}</span>
                      <span className="language-label">{lang.label}</span>
                      {language === lang.code && <span className="check-icon">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="onboarding-theme">
                <div className="theme-options">
                  {[
                    { id: 'dark', label: 'Sombre', icon: '🌙', desc: 'Confortable pour les yeux' },
                    { id: 'light', label: 'Clair', icon: '☀️', desc: 'Lumineux et propre' }
                  ].map(t => (
                    <button
                      key={t.id}
                      className={`theme-card ${theme === t.id ? 'active' : ''}`}
                      onClick={() => setTheme(t.id)}
                    >
                      <span className="theme-icon">{t.icon}</span>
                      <span className="theme-label">{t.label}</span>
                      <span className="theme-desc">{t.desc}</span>
                      {theme === t.id && <span className="check-icon">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="onboarding-risk">
                <div className="risk-display">
                  <span className="risk-value">{defaultRisk}%</span>
                  <span className="risk-label">risque par trade</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={defaultRisk}
                  onChange={(e) => setDefaultRisk(Number(e.target.value))}
                  className="risk-slider"
                />
                <div className="risk-presets">
                  {[0.5, 1, 2, 3, 5].map(risk => (
                    <button
                      key={risk}
                      className={`preset-btn ${defaultRisk === risk ? 'active' : ''}`}
                      onClick={() => setDefaultRisk(risk)}
                    >
                      {risk}%
                    </button>
                  ))}
                </div>
                <p className="risk-hint">
                  Nous recommandons 1-2% par trade. Le calculateur utilisera cette valeur par défaut.
                </p>
              </div>
            )}

            {currentStep === 7 && (
              <div className="onboarding-complete">
                <div className="complete-icon">🚀</div>
                <h3>Tout est prêt !</h3>
                <p>Votre journal de trading est configuré. Vous pouvez commencer à enregistrer vos trades immédiatement.</p>
                <div className="complete-summary">
                  <div className="summary-item">
                    <span className="summary-label">Appareil</span>
                    <span className="summary-value">{device === 'mobile' ? '📱 Mobile' : device === 'tablet' ? '📲 Tablette' : '🖥️ Desktop'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Devise</span>
                    <span className="summary-value">{currency}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Capital</span>
                    <span className="summary-value">{capital.toLocaleString()}{currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '€'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Langue</span>
                    <span className="summary-value">{language === 'fr' ? 'Français' : 'English'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Thème</span>
                    <span className="summary-value">{theme === 'dark' ? 'Sombre' : 'Clair'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Risque</span>
                    <span className="summary-value">{defaultRisk}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="onboarding-actions">
            {currentStep > 0 && currentStep < STEPS.length - 1 && (
              <button className="onboarding-btn secondary" onClick={prev}>
                ← Retour
              </button>
            )}
            <div className="spacer"></div>
            {currentStep < STEPS.length - 1 ? (
              <button className="onboarding-btn primary" onClick={next}>
                {currentStep === STEPS.length - 2 ? 'Terminer' : 'Continuer →'}
              </button>
            ) : (
              <button className="onboarding-btn primary" onClick={finish}>
                Accéder au journal →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
