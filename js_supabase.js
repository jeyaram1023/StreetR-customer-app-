//js&supabase.js
const SUPABASE_URL = 'https://rnjvqxdrvplgilqzwnpl.supabase.co'; // YOUR_SUPABASE_URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuanZxeGRy dnBsZ2lscXp3bnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDU4NjYsImV4cCI6MjA2NDUy MTYyNn0.IOAxp8ULZgccX8hKtlDQzwdrW7xp1CcXVSdJ59UEruA'; // YOUR_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
    alert("Application is not configured correctly. Supabase credentials missing in js/js_supabase.js");
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose supabase client globally
window.supabase = supabase;
