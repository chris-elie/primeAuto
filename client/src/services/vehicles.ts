import { supabase } from '../lib/supabase';
import type { Vehicle, VehicleStatus } from '../types/database';

export type NewVehicle = Pick<Vehicle, 'nom'> & {
  kilometrage?: number;
  statut?: VehicleStatus;
  derniere_revision?: string | null;
};
export type VehicleChanges = Partial<NewVehicle>;

export async function getVehicles(query = ''): Promise<Vehicle[]> {
  let request = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  if (query.trim()) request = request.ilike('nom', `%${query.trim()}%`);
  const { data, error } = await request;
  if (error) throw new Error(`Impossible de charger les véhicules : ${error.message}`);
  return data;
}

export async function createVehicle(vehicle: NewVehicle): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').insert(vehicle).select().single();
  if (error) throw new Error(`Impossible d'ajouter le véhicule : ${error.message}`);
  return data;
}

export async function updateVehicle(id: string, changes: VehicleChanges): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').update(changes).eq('id', id).select().single();
  if (error) throw new Error(`Impossible de modifier le véhicule : ${error.message}`);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(`Impossible de supprimer le véhicule : ${error.message}`);
}
