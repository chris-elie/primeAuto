import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Configuration Supabase manquante. Vérifiez les variables du fichier .env.');
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
