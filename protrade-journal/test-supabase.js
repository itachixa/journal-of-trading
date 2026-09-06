import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lrjdhtfvbhfxhahvbixs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SD4cVgufLR0CPXUlEkhUZA_5LMXz80T';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnectivity() {
  console.log('🔍 Testing Supabase connectivity with new project...\n');

  try {
    const { data, error } = await supabase.from('trades').select('count').limit(1);
    if (error) {
      console.log('❌ Trades table query failed:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Trades table: accessible');
      console.log('   Data:', data);
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }

  try {
    const { data, error } = await supabase.from('settings').select('count').limit(1);
    if (error) {
      console.log('❌ Settings table query failed:', error.message);
    } else {
      console.log('✅ Settings table: accessible');
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

testConnectivity();
