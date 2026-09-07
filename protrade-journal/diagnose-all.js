import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lrjdhtfvbhfxhahvbixs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SD4cVgufLR0CPXUlEkhUZA_5LMXz80T';
const API_URL = 'https://protrade-journal-api.onrender.com/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseTables() {
  console.log('🔍 Testing Supabase table access with anon key...\n');
  const tables = ['settings', 'trades', 'notes', 'tags', 'surveillances', 'surveillance_confirmations', 'surveillance_screenshots'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`✅ ${table}: accessible, columns: ${data && data[0] ? Object.keys(data[0]).join(', ') : 'empty'}`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function testBackendEndpoints() {
  console.log('\n🔍 Testing backend API endpoints...\n');
  
  // Try to get a session token first
  let token = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
    if (!token) {
      console.log('⚠️  No active session, some endpoints may return 401');
    }
  } catch (err) {
    console.log('⚠️  Could not get session:', err.message);
  }

  const endpoints = [
    { method: 'GET', path: '/settings', auth: true },
    { method: 'GET', path: '/trades', auth: true },
    { method: 'GET', path: '/notes', auth: true },
    { method: 'GET', path: '/tags', auth: true },
    { method: 'GET', path: '/surveillances', auth: true },
  ];

  for (const ep of endpoints) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (ep.auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_URL}${ep.path}`, { method: ep.method, headers });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* ignore parse error */ }
      
      if (res.ok) {
        console.log(`✅ ${ep.method} ${ep.path}: ${res.status} OK`);
      } else {
        console.log(`❌ ${ep.method} ${ep.path}: ${res.status} - ${json?.error || text.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`❌ ${ep.method} ${ep.path}: ${err.message}`);
    }
  }

  // Test settings PUT with camelCase mapping
  if (token) {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ initialCapital: 10000, theme: 'dark', defaultRisk: 2, device: 'desktop', currency: 'EUR', language: 'fr' })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`✅ PUT /settings: ${res.status} OK`);
      } else {
        console.log(`❌ PUT /settings: ${res.status} - ${json?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.log(`❌ PUT /settings: ${err.message}`);
    }
  }
}

async function main() {
  await testSupabaseTables();
  await testBackendEndpoints();
  console.log('\n✅ Diagnosis complete');
}

main();
