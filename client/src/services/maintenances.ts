import { supabase } from '../lib/supabase';
import type { Maintenance } from '../types/database';

export type NewMaintenance = Pick<Maintenance, 'vehicle_id' | 'description' | 'date_prevue'> & {
  cout?: number;
};
export type MaintenanceChanges = Partial<Pick<Maintenance, 'vehicle_id' | 'description' | 'date_prevue' | 'date_effectuee' | 'cout' | 'statut'>>;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getMaintenances(): Promise<Maintenance[]> {
  const { data, error } = await supabase.from('maintenances').select('*').order('date_prevue', { ascending: false });
  if (error) throw new Error(`Impossible de charger les entretiens : ${error.message}`);
  return data;
}

export async function getUpcomingMaintenances(): Promise<Maintenance[]> {
  const today = localDateKey(new Date());
  const { data, error } = await supabase.from('maintenances').select('*')
    .is('date_effectuee', null).gte('date_prevue', today).order('date_prevue');
  if (error) throw new Error(`Impossible de charger les entretiens à venir : ${error.message}`);
  return data;
}

export async function createMaintenance(maintenance: NewMaintenance): Promise<Maintenance> {
  const { data, error } = await supabase.from('maintenances').insert(maintenance).select().single();
  if (error) throw new Error(`Impossible d'ajouter l'entretien : ${error.message}`);
  return data;
}

export async function updateMaintenance(id: string, changes: MaintenanceChanges): Promise<Maintenance> {
  const { data, error } = await supabase.from('maintenances').update(changes).eq('id', id).select().single();
  if (error) throw new Error(`Impossible de modifier l'entretien : ${error.message}`);
  return data;
}

export async function deleteMaintenance(id: string): Promise<void> {
  const { error } = await supabase.from('maintenances').delete().eq('id', id);
  if (error) throw new Error(`Impossible de supprimer l'entretien : ${error.message}`);
}
