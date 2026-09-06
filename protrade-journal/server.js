import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

function getUserId(req) {
  return req.user ? req.user.id : null;
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback` }
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ session: data.session });
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/session', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ user: null });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  res.json({ user: user || null });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password`
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Trades
app.get('/api/trades', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/trades', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('trades')
    .insert({ ...req.body, user_id: userId })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/trades/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (error) return res.status(404).json({ error: 'Trade not found' });
  res.json(data);
});

app.put('/api/trades/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('trades')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/trades/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Notes
app.get('/api/notes', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...req.body, user_id: userId })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/notes/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (error) return res.status(404).json({ error: 'Note not found' });
  res.json(data);
});

app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('notes')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Tags
app.get('/api/tags', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/tags', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('tags')
    .insert({ ...req.body, user_id: userId })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/tags/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (error) return res.status(404).json({ error: 'Tag not found' });
  res.json(data);
});

app.put('/api/tags/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('tags')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/tags/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Surveillances
app.get('/api/surveillances', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('surveillances')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/surveillances', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('surveillances')
    .insert({ ...req.body, user_id: userId })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.get('/api/surveillances/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('surveillances')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (error) return res.status(404).json({ error: 'Surveillance not found' });
  res.json(data);
});

app.put('/api/surveillances/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('surveillances')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/surveillances/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { error } = await supabase
    .from('surveillances')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/surveillances/:id/confirmations', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { data, error } = await supabase
    .from('surveillance_confirmations')
    .select('*')
    .eq('surveillance_id', req.params.id)
    .order('created_at');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/surveillances/:id/confirmations', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { data, error } = await supabase
    .from('surveillance_confirmations')
    .insert({ ...req.body, surveillance_id: req.params.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put('/api/surveillances/:id/confirmations/:confirmationId', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { data, error } = await supabase
    .from('surveillance_confirmations')
    .update(req.body)
    .eq('id', req.params.confirmationId)
    .eq('surveillance_id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/surveillances/:id/confirmations/:confirmationId', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { error } = await supabase
    .from('surveillance_confirmations')
    .delete()
    .eq('id', req.params.confirmationId)
    .eq('surveillance_id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/surveillances/:id/screenshots', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { data, error } = await supabase
    .from('surveillance_screenshots')
    .select('*')
    .eq('surveillance_id', req.params.id)
    .order('created_at');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/surveillances/:id/screenshots', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { data, error } = await supabase
    .from('surveillance_screenshots')
    .insert({ ...req.body, surveillance_id: req.params.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/surveillances/:id/screenshots/:screenshotId', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data: surv, error: survError } = await supabase
    .from('surveillances')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (survError || !surv) return res.status(404).json({ error: 'Surveillance not found' });
  const { error } = await supabase
    .from('surveillance_screenshots')
    .delete()
    .eq('id', req.params.screenshotId)
    .eq('surveillance_id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Settings
app.get('/api/settings', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  let { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code === 'PGRST116') {
    const { data: newData, error: insertError } = await supabase
      .from('settings')
      .insert({ user_id: userId, initial_capital: 10000, theme: 'dark', default_risk: 2 })
      .select()
      .single();
    if (insertError) return res.status(400).json({ error: insertError.message });
    data = newData;
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from('settings')
    .update(req.body)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
