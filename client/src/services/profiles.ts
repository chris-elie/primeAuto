import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export async function getCurrentProfile(): Promise<Profile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(`Impossible de récupérer l'utilisateur connecté${userError ? ` : ${userError.message}` : '.'}`);
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
  if (error) throw new Error(`Impossible de charger le profil : ${error.message}`);
  return data;
}
