import { createClient } from '@supabase/supabase-js';
import { config } from './config';

if (!config.supabase_url || !config.supabase_anon_key) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(
  config.supabase_url,
  config.supabase_anon_key,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'Database operation failed');
};

// Helper function to handle Supabase responses
export const handleSupabaseResponse = (data: any, error: any) => {
  if (error) {
    handleSupabaseError(error);
  }
  return data;
}; 
