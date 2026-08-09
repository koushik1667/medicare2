import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  console.warn(
    '[MediCareAI] Supabase URL not configured. ' +
    'Set VITE_SUPABASE_URL in frontend/.env to enable Google Sign-In.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn(
    '[MediCareAI] Supabase Anon Key not configured. ' +
    'Set VITE_SUPABASE_ANON_KEY in frontend/.env to enable Google Sign-In.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    !!supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
};
