import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const { signIn, signUp, resetPassword, error, message, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (showReset) {
      result = await resetPassword(email);
      if (!result.error) {
        setTimeout(() => navigate('/login'), 3000);
      }
      return;
    }
    if (isLogin) {
      result = await signIn(email, password);
    } else {
      result = await signUp(email, password);
    }
    if (!result.error && !showReset) {
      navigate('/');
    }
  };

  if (showReset) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Réinitialisation du mot de passe</h1>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
          <button className="auth-link" onClick={() => setShowReset(false)}>
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Connexion' : 'Inscription'}</h1>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>
        <button className="auth-link" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
        {isLogin && (
          <button className="auth-link" onClick={() => setShowReset(true)}>
            Mot de passe oublié ?
          </button>
        )}
      </div>
    </div>
  );
}
