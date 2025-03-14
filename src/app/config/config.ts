import env from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

env.config({ path: envPath });

console.log('Environment variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});

export const config = {
  port: Number(process.env.PORT) || 5001,
  market_check_api: process.env.MARKET_CHECK_API_KEY,
  market_check_secret: process.env.MARKET_CHECK_API_SECRET,
  market_check_base_url: process.env.MARKET_CHECK_BASE_URL,
  market_check_base_url_1: process.env.MARKET_CHECK_BASE_URL_1,
  // Supabase configuration
  supabase_url: process.env.SUPABASE_URL,
  supabase_anon_key: process.env.SUPABASE_ANON_KEY,
  supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

console.log('Config loaded:', {
  port: config.port,
});

export const API_URLS = {
  API_BASE: 'https://mc-api.marketcheck.com/oauth2',
  API_BASE_1: 'https://mc-api.marketcheck.com/oauth/v2',
} as const;

export const { API_BASE, API_BASE_1 } = API_URLS;
