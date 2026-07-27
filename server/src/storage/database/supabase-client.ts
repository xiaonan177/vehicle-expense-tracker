import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(token?: string): SupabaseClient {
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('COZE_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    throw new Error('COZE_SUPABASE_ANON_KEY is not set');
  }

  let key = anonKey;
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  if (!token && serviceRoleKey) {
    key = serviceRoleKey;
  }

  const globalOptions: Record<string, any> = {};
  if (token) {
    globalOptions.headers = { Authorization: `Bearer ${token}` };
  }

  return createClient(url, key, {
    global: globalOptions,
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { getSupabaseClient };
