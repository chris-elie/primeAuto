import { supabase } from '../lib/supabase';
import type { Revenue } from '../types/database';

export type NewRevenue = Pick<Revenue, 'montant' | 'type'> & {
  vehicle_id?: string | null;
  description?: string | null;
  date_transaction?: string;
};
export type WeeklyRevenue = {
  jours: { jour: string; date: string; total: number }[];
  total: number;
  variationPct: number | null;
  haut: number;
  bas: number;
};
export type RevenueWithVehicle = Revenue & { vehicule?: string | null };

export async function getRevenues(): Promise<RevenueWithVehicle[]> {
  const [{ data, error }, { data: vehicles, error: vehiclesError }] = await Promise.all([
    supabase.from('revenues').select('*').order('date_transaction', { ascending: false }),
    supabase.from('vehicles').select('id, nom'),
  ]);
  if (error) throw new Error(`Impossible de charger les revenus : ${error.message}`);
  if (vehiclesError) throw new Error(`Impossible de charger les véhicules associés : ${vehiclesError.message}`);
  const names = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.nom]));
  return data.map((revenue) => ({ ...revenue, vehicule: revenue.vehicle_id ? names.get(revenue.vehicle_id) ?? null : null }));
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getWeeklyRevenue(): Promise<WeeklyRevenue> {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const previousMonday = new Date(monday);
  previousMonday.setDate(monday.getDate() - 7);
  const start = dateKey(previousMonday);
  const end = dateKey(nextMonday);

  const { data, error } = await supabase.from('revenues').select('montant, date_transaction, type')
    .eq('type', 'recette').gte('date_transaction', start).lt('date_transaction', end);
  if (error) throw new Error(`Impossible de calculer les recettes de la semaine : ${error.message}`);

  const totals = new Map<string, number>();
  for (const revenue of data) {
    totals.set(revenue.date_transaction, (totals.get(revenue.date_transaction) ?? 0) + Number(revenue.montant));
  }
  const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const jours = labels.map((jour, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = dateKey(date);
    return { jour, date: key, total: totals.get(key) ?? 0 };
  });
  const total = jours.reduce((sum, day) => sum + day.total, 0);
  const previousTotal = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(previousMonday);
    date.setDate(previousMonday.getDate() + index);
    return totals.get(dateKey(date)) ?? 0;
  }).reduce((sum, value) => sum + value, 0);
  const values = jours.map((day) => day.total);
  return {
    jours,
    total,
    variationPct: previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 1000) / 10 : null,
    haut: Math.max(...values),
    bas: Math.min(...values),
  };
}

export async function createRevenue(revenue: NewRevenue): Promise<Revenue> {
  const { data, error } = await supabase.from('revenues').insert(revenue).select().single();
  if (error) throw new Error(`Impossible d'ajouter le revenu : ${error.message}`);
  return data;
}
