// js_supabase.js
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Same URL as your seller app
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Same Key as your seller app

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
    alert("Application is not configured correctly. Supabase credentials missing in js/js_supabase.js");
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose supabase client globally
window.supabase = supabase;
