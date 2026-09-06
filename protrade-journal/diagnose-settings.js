import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lrjdhtfvbhfxhahvbixs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SD4cVgufLR0CPXUlEkhUZA_5LMXz80T';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  console.log('🔍 Diagnosing Supabase settings table with anon key...\n');

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error querying settings:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      return;
    }

    console.log('✅ Settings table accessible');
    console.log('   Columns:', data && data[0] ? Object.keys(data[0]) : 'No data');
    console.log('   Sample:', data && data[0] ? JSON.stringify(data[0], null, 2) : 'No data');
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

diagnose();
