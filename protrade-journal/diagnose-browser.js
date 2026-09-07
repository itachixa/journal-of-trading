// Browser console diagnostic for ProTrade Journal
// Run this in the browser console when logged into the app

(async function diagnoseApp() {
  console.log('🔍 ProTrade Journal - Browser Console Diagnostic\n');
  
  // Check if we're in the app
  if (!document.getElementById('root')) {
    console.log('❌ App root not found');
    return;
  }
  
  // Try to get auth state from Supabase
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    const supabaseUrl = 'https://lrjdhtfvbhfxhahvbixs.supabase.co';
    const supabaseAnonKey = 'sb_publishable_SD4cVgufLR0CPXUlEkhUZA_5LMXz80T';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔑 Auth session:', session ? '✅ Active' : '❌ None');
    if (session) {
      console.log('   User:', session.user?.email || session.user?.id);
      console.log('   Token expires:', new Date(session.expires_at * 1000).toLocaleString());
    }
    
    // Test settings via Supabase direct
    console.log('\n📊 Testing Supabase direct access...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ Settings error:', settingsError.message);
    } else {
      console.log('✅ Settings accessible:', settings);
    }
    
    // Test backend if we have a token
    if (session?.access_token) {
      console.log('\n🌐 Testing backend API...');
      const apiUrl = 'https://protrade-journal-api.onrender.com/api';
      
      const testEndpoint = async (path, method = 'GET', body = null) => {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          };
          const options = { method, headers };
          if (body) options.body = JSON.stringify(body);
          
          const res = await fetch(`${apiUrl}${path}`, options);
          const text = await res.text();
          let json = null;
          try { json = JSON.parse(text); } catch { /* ignore parse error */ }
          
          return { status: res.status, data: json, text: text.slice(0, 200) };
        } catch (err) {
          return { status: 0, error: err.message };
        }
      };
      
      const settingsTest = await testEndpoint('/settings');
      console.log('GET /settings:', settingsTest.status, settingsTest.status === 200 ? '✅' : '❌', settingsTest.data || settingsTest.text);
      
      const putTest = await testEndpoint('/settings', 'PUT', {
        initialCapital: 10000,
        theme: 'dark',
        defaultRisk: 2,
        device: 'desktop',
        currency: 'EUR',
        language: 'fr'
      });
      console.log('PUT /settings:', putTest.status, putTest.status === 200 ? '✅' : '❌', putTest.data || putTest.text);
      
      const tradesTest = await testEndpoint('/trades');
      console.log('GET /trades:', tradesTest.status, tradesTest.status === 200 ? '✅' : '❌', tradesTest.data || tradesTest.text);
    }
    
  } catch (err) {
    console.log('❌ Diagnostic error:', err.message);
  }
  
  console.log('\n✅ Diagnostic complete');
})();
