import { createClient } from '@supabase/supabase-js';

// Safely access environment variables with optional chaining
// This prevents the "Cannot read properties of undefined" crash
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase Environment Variables are missing! Please check your .env file or Vercel Project Settings.');
}

// Initialize Supabase with fallback values to prevent app crash on startup
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);