const SUPABASE_URL = 'https://ukfmgugnvvytppxrvrzx.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZm1ndWdudnZ5dHBweHJ2cnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTE4MjAsImV4cCI6MjEwNDk2NzgyMH0.v7EcW6j68Vuw_XK5VQZ0-xBmHzWEuAJz51LdFyJeKYw';

const db = (typeof window !== 'undefined' && window.supabase)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

if (typeof window !== 'undefined') {
    window.db = db;
}

// Temporary connection test
async function testConnection() {
    const { data, error } = await db
        .from('courses')
        .select('code, title');

    if (error) {
        console.log("Supabase connection failed:", error);
    } else {
        console.log("Supabase connection successful!", data);
    }
}

testConnection();
