import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, api } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        if (session?.access_token) {
          api.setToken(session.access_token);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.access_token) {
        api.setToken(session.access_token);
      } else {
        api.setToken(null);
      }
      setLoading(false);
    });

    initAuth();
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) {
      setError(error.message);
      return { error: error.message };
    }
    setMessage('Vérifiez votre email pour confirmer votre compte');
    return { user: data.user };
  };

  const handleCallback = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      if (session?.access_token) {
        api.setToken(session.access_token);
      }
    } catch (e) {
      console.error('Auth callback error:', e);
    }
    setLoading(false);
  };

  const completeOnboarding = () => {
    localStorage.setItem('protrade_onboarding_completed', 'true');
  };

  const hasCompletedOnboarding = () => {
    return localStorage.getItem('protrade_onboarding_completed') === 'true';
  };

  const signIn = async (email, password) => {
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return { error: error.message };
    }
    if (data.session?.access_token) {
      api.setToken(data.session.access_token);
    }
    return { session: data.session };
  };

  const signOut = async () => {
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      return { error: error.message };
    }
    api.setToken(null);
    return { success: true };
  };

  const resetPassword = async (email) => {
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    if (error) {
      setError(error.message);
      return { error: error.message };
    }
    setMessage('Vérifiez votre email pour réinitialiser votre mot de passe');
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
      return { error: error.message };
    }
    setMessage('Mot de passe mis à jour');
    return { success: true };
  };

  const value = {
    user, session, loading, error, message,
    signUp, signIn, signOut, resetPassword, updatePassword, handleCallback, completeOnboarding, hasCompletedOnboarding,
    setError, setMessage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
