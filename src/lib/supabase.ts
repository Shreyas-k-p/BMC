import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(url: string | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  cleaned = cleaned.replace(/\/(rest|auth|realtime)(\/v1)?\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
