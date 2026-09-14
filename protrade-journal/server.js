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

function mapToSupabase(table, body) {
  if (table === 'trades') {
    const mapped = { ...body }
    if (mapped.tradeType) {
      mapped.direction = mapped.tradeType.toLowerCase()
      delete mapped.tradeType
    }
    if (mapped.tradingType) {
      mapped.style = mapped.tradingType
      delete mapped.tradingType
    }
    if (mapped.lotSize !== undefined) {
      mapped.lot_size = mapped.lotSize
      delete mapped.lotSize
    }
    if (mapped.stopLoss !== undefined) {
      mapped.stop_loss = mapped.stopLoss
      delete mapped.stopLoss
    }
    if (mapped.takeProfit !== undefined) {
      mapped.take_profit = mapped.takeProfit
      delete mapped.takeProfit
    }
    if (mapped.screenshot) {
      mapped.screenshot_url = mapped.screenshot
      delete mapped.screenshot
    }
    if (mapped.result === '' || mapped.result === null || mapped.result === undefined) {
      mapped.result = 0
    }
    if (mapped.date) {
      mapped.date = new Date(mapped.date).toISOString()
    }
    return mapped
  }
  if (table === 'notes') {
    return body
  }
  if (table === 'tags') {
    return body
  }
  if (table === 'notes') {
    const mapped = { ...body }
    delete mapped.pair
    return mapped
  }
  if (table === 'surveillances') {
    const mapped = { ...body }
    if (mapped.direction) {
      mapped.direction = mapped.direction.toLowerCase()
    }
    if (mapped.note) {
      mapped.notes = mapped.note
      delete mapped.note
    }
    if (mapped.date) {
      mapped.date = new Date(mapped.date).toISOString()
    }
    delete mapped.conditions
    delete mapped.screenshots
    return mapped
  }
  if (table === 'settings') {
    const mapped = {}
    if (body.initialCapital !== undefined) mapped.initial_capital = body.initialCapital
    if (body.theme !== undefined) mapped.theme = body.theme
    if (body.defaultRisk !== undefined) mapped.default_risk = body.defaultRisk
    if (body.device !== undefined) mapped.device = body.device
    if (body.currency !== undefined) mapped.currency = body.currency
    if (body.language !== undefined) mapped.language = body.language
    return mapped
  }
  if (table === 'surveillance_confirmations') {
    return body
  }
  return body
}

function mapFromSupabase(table, item) {
  if (!item || typeof item !== 'object') return item
  if (table === 'trades') {
    const mapped = { ...item }
    if ('direction' in mapped) { mapped.tradeType = mapped.direction.charAt(0).toUpperCase() + mapped.direction.slice(1); delete mapped.direction }
    if ('style' in mapped) { mapped.tradingType = mapped.style; delete mapped.style }
    if ('lot_size' in mapped) { mapped.lotSize = mapped.lot_size; delete mapped.lot_size }
    if ('stop_loss' in mapped) { mapped.stopLoss = mapped.stop_loss; delete mapped.stop_loss }
    if ('take_profit' in mapped) { mapped.takeProfit = mapped.take_profit; delete mapped.take_profit }
    if ('screenshot_url' in mapped) { mapped.screenshot = mapped.screenshot_url; delete mapped.screenshot_url }
    return mapped
  }
  if (table === 'surveillances') {
    const mapped = { ...item }
    if ('notes' in mapped) { mapped.note = mapped.notes; delete mapped.notes }
    return mapped
  }
  if (table === 'settings') {
    const mapped = { ...item }
    if ('initial_capital' in mapped) { mapped.initialCapital = mapped.initial_capital; delete mapped.initial_capital }
    if ('default_risk' in mapped) { mapped.defaultRisk = mapped.default_risk; delete mapped.default_risk }
    return mapped
  }
  if (table === 'surveillance_confirmations') {
    const mapped = { ...item }
    const surveillanceId = mapped.surveillance_id
    if ('surveillance_id' in mapped) { delete mapped.surveillance_id }
    return { ...mapped, _surveillanceId: surveillanceId }
  }
  if (table === 'surveillance_screenshots') {
    const mapped = { ...item }
    const surveillanceId = mapped.surveillance_id
    if ('surveillance_id' in mapped) { delete mapped.surveillance_id }
    return { ...mapped, _surveillanceId: surveillanceId }
  }
  return item
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
  res.json((data || []).map(item => mapFromSupabase('trades', item)));
});

app.post('/api/trades', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('trades', { ...req.body, user_id: userId })
  const { data, error } = await supabase
    .from('trades')
    .insert(mapped)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('trades', data));
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
  res.json(mapFromSupabase('trades', data));
});

app.put('/api/trades/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('trades', req.body)
  const { data, error } = await supabase
    .from('trades')
    .update(mapped)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('trades', data));
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
  res.json((data || []).map(item => mapFromSupabase('notes', item)));
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('notes', { ...req.body, user_id: userId })
  const { data, error } = await supabase
    .from('notes')
    .insert(mapped)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('notes', data));
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
  res.json(mapFromSupabase('notes', data));
});

app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('notes', req.body)
  const { data, error } = await supabase
    .from('notes')
    .update(mapped)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('notes', data));
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
  res.json((data || []).map(item => mapFromSupabase('tags', item)));
});

app.post('/api/tags', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('tags', { ...req.body, user_id: userId })
  const { data, error } = await supabase
    .from('tags')
    .insert(mapped)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('tags', data));
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
  res.json(mapFromSupabase('tags', data));
});

app.put('/api/tags/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('tags', req.body)
  const { data, error } = await supabase
    .from('tags')
    .update(mapped)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('tags', data));
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

  const surveillances = (data || []).map(item => mapFromSupabase('surveillances', item));

  // Fetch confirmations for all surveillances
  if (surveillances.length > 0) {
    const ids = surveillances.map(s => s.id);
    const { data: confirmations, error: confError } = await supabase
      .from('surveillance_confirmations')
      .select('*')
      .in('surveillance_id', ids)
      .order('created_at');
    if (!confError && confirmations) {
      const confBySurv = {};
      confirmations.forEach(c => {
        const mapped = mapFromSupabase('surveillance_confirmations', c);
        if (!confBySurv[mapped._surveillanceId]) confBySurv[mapped._surveillanceId] = [];
        confBySurv[mapped._surveillanceId].push(mapped);
      });
      surveillances.forEach(s => {
        s.conditions = confBySurv[s.id] || [];
      });
    }
  }

  res.json(surveillances);
});

app.post('/api/surveillances', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const conditions = req.body.conditions || [];
  const mapped = mapToSupabase('surveillances', { ...req.body, user_id: userId })
  const { data, error } = await supabase
    .from('surveillances')
    .insert(mapped)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  const surveillance = mapFromSupabase('surveillances', data);

  // Insert conditions
  if (conditions.length > 0) {
    const confs = conditions.map((c, idx) => ({
      surveillance_id: surveillance.id,
      title: c.title,
      stars: c.stars || 3,
      checked: c.checked || false,
      created_at: new Date(Date.now() + idx).toISOString()
    }));
    await supabase.from('surveillance_confirmations').insert(confs);
    surveillance.conditions = confs.map(c => mapFromSupabase('surveillance_confirmations', c));
  } else {
    surveillance.conditions = [];
  }

  res.json(surveillance);
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

  const surveillance = mapFromSupabase('surveillances', data);

  // Fetch confirmations
  const { data: confirmations, error: confError } = await supabase
    .from('surveillance_confirmations')
    .select('*')
    .eq('surveillance_id', req.params.id)
    .order('created_at');
  if (!confError && confirmations) {
    surveillance.conditions = confirmations.map(c => mapFromSupabase('surveillance_confirmations', c));
  } else {
    surveillance.conditions = [];
  }

  res.json(surveillance);
});

app.put('/api/surveillances/:id', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const conditions = req.body.conditions || [];
  const mapped = mapToSupabase('surveillances', req.body)
  const { data, error } = await supabase
    .from('surveillances')
    .update(mapped)
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  const surveillance = mapFromSupabase('surveillances', data);

  // Sync conditions: delete existing and insert new
  await supabase.from('surveillance_confirmations').delete().eq('surveillance_id', req.params.id);
  if (conditions.length > 0) {
    const confs = conditions.map((c, idx) => ({
      surveillance_id: surveillance.id,
      title: c.title,
      stars: c.stars || 3,
      checked: c.checked || false,
      created_at: new Date(Date.now() + idx).toISOString()
    }));
    await supabase.from('surveillance_confirmations').insert(confs);
    surveillance.conditions = confs.map(c => mapFromSupabase('surveillance_confirmations', c));
  } else {
    surveillance.conditions = [];
  }

  res.json(surveillance);
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
  res.json((data || []).map(item => mapFromSupabase('surveillance_confirmations', item)));
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
  const mapped = mapToSupabase('surveillance_confirmations', { ...req.body, surveillance_id: req.params.id })
  const { data, error } = await supabase
    .from('surveillance_confirmations')
    .insert(mapped)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('surveillance_confirmations', data));
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
  const mapped = mapToSupabase('surveillance_confirmations', req.body)
  const { data, error } = await supabase
    .from('surveillance_confirmations')
    .update(mapped)
    .eq('id', req.params.confirmationId)
    .eq('surveillance_id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('surveillance_confirmations', data));
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
  res.json((data || []).map(item => mapFromSupabase('surveillance_screenshots', item)));
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
  const mapped = mapToSupabase('surveillance_screenshots', { ...req.body, surveillance_id: req.params.id })
  const { data, error } = await supabase
    .from('surveillance_screenshots')
    .insert(mapped)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(mapFromSupabase('surveillance_screenshots', data));
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
const ALLOWED_SETTINGS_COLUMNS = ['initial_capital', 'theme', 'default_risk', 'device', 'currency', 'language'];

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
  res.json(mapFromSupabase('settings', data || {}));
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const mapped = mapToSupabase('settings', req.body)
  const updateData = {};
  for (const key of Object.keys(mapped)) {
    if (ALLOWED_SETTINGS_COLUMNS.includes(key)) {
      updateData[key] = mapped[key];
    }
  }
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid settings fields provided' });
  }
  const { data, error } = await supabase
    .from('settings')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('settings')
        .insert({ user_id: userId, initial_capital: 10000, theme: 'dark', default_risk: 2, ...updateData })
        .select()
        .single();
      if (insertError) return res.status(400).json({ error: insertError.message });
      return res.json(mapFromSupabase('settings', newData));
    }
    return res.status(400).json({ error: error.message });
  }
  res.json(mapFromSupabase('settings', data));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
