const API = 'http://localhost:4000/api';

export type Summary = {
  vehiculesActifs: number;
  entretiensAVenir: number;
  panneauxAlerte: number;
};

export type Weekly = {
  jours: { jour: string; date: string; total: number }[];
  total: number;
  variationPct: number | null;
  haut: number;
  bas: number;
};

export type Vehicle = {
  id: number;
  nom: string;
  kilometrage: number;
  statut: 'ok' | 'entretien' | 'panne';
  derniere_revision: string | null;
  created_at: string;
};

export type Maintenance = {
  id: number;
  vehicle_id: number;
  description: string;
  date_prevue: string;
  date_effectuee: string | null;
  cout: number;
  statut: 'a_venir' | 'en_retard' | 'fait';
  vehicule?: string;
  created_at: string;
};

export type Revenue = {
  id: number;
  vehicle_id: number | null;
  montant: number;
  type: 'recette' | 'depense';
  description: string | null;
  date_transaction: string;
  vehicule?: string | null;
  created_at: string;
};

export type AuthUser = {
  id?: number;
  nom: string;
  email?: string;
  role: string;
};

export const getToken = () => localStorage.getItem('token');
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) logout();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export const getMe = () => request<AuthUser>('/auth/me');

export const getSummary = () => request<Summary>('/dashboard/summary');
export const getWeekly = () => request<Weekly>('/revenues/weekly');
export const getVehicles = (q = '') =>
  request<Vehicle[]>(`/vehicles${q ? `?q=${encodeURIComponent(q)}` : ''}`);

export const createVehicle = (data: { nom: string; kilometrage?: number; statut?: 'ok' | 'entretien' | 'panne'; derniere_revision?: string | null }) =>
  request<{ id: number }>('/vehicles', { method: 'POST', body: JSON.stringify(data) });

export const updateVehicle = (id: number, data: Partial<Vehicle>) =>
  request<{ ok: boolean }>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteVehicle = (id: number) =>
  request<{ ok: boolean }>(`/vehicles/${id}`, { method: 'DELETE' });

export const getMaintenances = () => request<Maintenance[]>('/maintenances');

export const createMaintenance = (data: { vehicle_id: number; description: string; date_prevue: string; cout?: number }) =>
  request<{ id: number }>('/maintenances', { method: 'POST', body: JSON.stringify(data) });

export const completeMaintenance = (id: number, cout?: number) =>
  request<{ ok: boolean }>(`/maintenances/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ cout }) });

export const getRevenues = () => request<Revenue[]>('/revenues');
