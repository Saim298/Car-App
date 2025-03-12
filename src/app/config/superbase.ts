import env from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
env.config({ path: envPath });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key are required in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized successfully');

// Example usage of Supabase
export async function fetchDataFromSupabase() {
  const { data, error } = await supabase
    .from('your_table_name') // Replace with your table name
    .select('*');

  if (error) {
    console.error('Error fetching data from Supabase:', error);
    return null;
  }

  return data;
}
