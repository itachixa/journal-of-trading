import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PAIRS } from '../context/AppContext';
import './Auth.css';

const DEVICE_OPTIONS = [
  { id: 'mobile', label: 'Mobile', icon: '📱', desc: 'Smartphone / Petite tablette' },
  { id: 'tablet', label: 'Tablette', icon: '📲', desc: 'iPad / Tablette Android' },
  { id: 'desktop', label: 'Desktop', icon: '🖥️', desc: 'Ordinateur / MacBook' }
];

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [capital, setCapital] = useState(10000);
  const { signIn, signUp, resetPassword, error, message, loading, setError, setMessage } = useAuth();
  const navigate = useNavigate();

  const switchMode = useCallback((newMode) => {
    setMode(newMode);
    setMessage(null);
    setError(null);
  }, [setMode, setMessage, setError]);

  useEffect(() => {
    if (message && mode === 'signup' && message.includes('email')) {
      switchMode('verify');
    }
  }, [message, mode, switchMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'reset') {
      await resetPassword(email);
      setResetSent(true);
      return;
    }
    if (mode === 'signup') {
      if (password !== confirmPassword || password.length < 6) {
        return;
      }
      await signUp(email, password, { device, initialCapital: capital });
      return;
    }
    if (mode === 'login') {
      const result = await signIn(email, password);
      if (!result.error) {
        navigate('/');
      }
    }
  };

  if (showReset) {
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="auth-orb auth-orb-1"></div>
          <div className="auth-orb auth-orb-2"></div>
          <div className="auth-orb auth-orb-3"></div>
        </div>
        <div className="auth-card">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M7 16l4-8 4 4 6-8"/>
            </svg>
          </div>
          <h1>Réinitialisation du mot de passe</h1>
          <p className="auth-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}
          {resetSent && (
            <div className="auth-success-card">
              <div className="auth-success-icon">✉️</div>
              <p>Lien envoyé ! Vérifiez votre boîte mail.</p>
            </div>
          )}
          {!resetSent && (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading || resetSent}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          )}
          <button className="auth-link" onClick={() => { setShowReset(false); setResetSent(false); switchMode('login'); }}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="auth-orb auth-orb-1"></div>
          <div className="auth-orb auth-orb-2"></div>
          <div className="auth-orb auth-orb-3"></div>
        </div>
        <div className="auth-card auth-verify-card">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M7 16l4-8 4 4 6-8"/>
            </svg>
          </div>
          <div className="verify-icon">📧</div>
          <h1>Vérifiez votre email</h1>
          <p className="auth-subtitle">
            Nous avons envoyé un lien de confirmation à<br/>
            <strong>{email}</strong>
          </p>
          <div className="auth-success-card">
            <div className="auth-success-icon">✅</div>
            <p>Cliquez sur le lien dans l'email pour activer votre compte.</p>
          </div>
          <div className="verify-steps">
            <div className="verify-step">
              <span className="verify-step-num">1</span>
              <span>Ouvrez votre boîte mail</span>
            </div>
            <div className="verify-step">
              <span className="verify-step-num">2</span>
              <span>Cherchez l'email de ProTrade Journal</span>
            </div>
            <div className="verify-step">
              <span className="verify-step-num">3</span>
              <span>Cliquez sur le lien de confirmation</span>
            </div>
          </div>
          <button className="auth-link" onClick={() => switchMode('login')}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M7 16l4-8 4 4 6-8"/>
          </svg>
        </div>
        <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Content de vous revoir ! Connectez-vous à votre journal.'
            : 'Rejoignez ProTrade Journal et maîtrisez votre trading.'}
        </p>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {mode === 'signup' && (
            <>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <span className="input-error">Les mots de passe ne correspondent pas</span>
                )}
              </div>
              <div className="input-group">
                <label>Appareil</label>
                <div className="device-options">
                  {DEVICE_OPTIONS.map(d => (
                    <button
                      key={d.id}
                      className={`device-btn ${device === d.id ? 'active' : ''}`}
                      type="button"
                      onClick={() => setDevice(d.id)}
                    >
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                      <span className="device-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label>Capital initial ($)</label>
                <input
                  type="number"
                  id="capital"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                  min="5"
                  step="100"
                  required
                />
                <span className="input-hint">Minimum 5$</span>
              </div>
            </>
          )}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>
        <div className="auth-footer">
          <button className="auth-link" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login'
              ? "Pas encore de compte ? S'inscrire"
              : 'Déjà un compte ? Se connecter'}
          </button>
          {mode === 'login' && (
            <button className="auth-link auth-link-secondary" onClick={() => { setShowReset(true); setResetSent(false); switchMode('reset'); }}>
              Mot de passe oublié ?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
