import { useEffect, useState, type FormEvent } from 'react';
import {
  Car,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type AuthUser,
} from '../api';
import { StatusBadge } from './DashboardPrimeAuto';
import { cn } from '../utils';

interface FleetPageProps {
  user: AuthUser | null;
}

export default function FleetPage({ user }: FleetPageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'entretien' | 'panne'>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formNom, setFormNom] = useState('');
  const [formKm, setFormKm] = useState(0);
  const [formStatut, setFormStatut] = useState<'ok' | 'entretien' | 'panne'>('ok');
  const [formRevision, setFormRevision] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isGestionnaire = user?.role === 'gestionnaire' || user?.role === 'admin';

  const loadVehicles = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVehicles(query);
      setVehicles(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de charger les véhicules');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles(search);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormNom('');
    setFormKm(0);
    setFormStatut('ok');
    setFormRevision('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormNom(vehicle.nom);
    setFormKm(vehicle.kilometrage);
    setFormStatut(vehicle.statut);
    setFormRevision(vehicle.derniere_revision || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          nom: formNom,
          kilometrage: Number(formKm),
          statut: formStatut,
          derniere_revision: formRevision || null,
        });
      } else {
        await createVehicle({
          nom: formNom,
          kilometrage: Number(formKm),
          statut: formStatut,
          derniere_revision: formRevision || null,
        });
      }
      setIsModalOpen(false);
      await loadVehicles(search);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Erreur lors de l'enregistrement du véhicule");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: number, nom: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le véhicule "${nom}" ?`)) return;

    try {
      await deleteVehicle(id);
      await loadVehicles(search);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter === 'all') return true;
    return v.statut === statusFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1120] text-slate-100 p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <Car className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
              Flotte de véhicules
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Gestion du parc automobile, états, kilométrages et révisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isGestionnaire && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau véhicule</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadVehicles(search)}
            disabled={loading}
            className="flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-blue-400')} />
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#162032] p-4 shadow-lg">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de véhicule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pr-4 pl-10 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/60 p-1 text-xs font-medium">
          {(['all', 'ok', 'entretien', 'panne'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'rounded-lg px-3 py-1.5 transition capitalize',
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {st === 'all' ? 'Tous' : st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Vehicles Table Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#162032] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Kilométrage</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Dernière révision</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    {loading ? 'Chargement des véhicules...' : 'Aucun véhicule correspondant.'}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="transition hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-blue-400">
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <span>{vehicle.nom}</span>
                          <span className="block text-[11px] font-normal text-slate-500">
                            ID #{vehicle.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                      {vehicle.kilometrage.toLocaleString('fr-FR')} km
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={vehicle.statut} />
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{vehicle.derniere_revision || 'Non renseignée'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isGestionnaire ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(vehicle)}
                            title="Modifier"
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(vehicle.id, vehicle.nom)}
                            title="Supprimer"
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Lecture seule</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#162032] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nom du véhicule *
                </label>
                <input
                  type="text"
                  required
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  placeholder="Ex: Suzuki Alto, Toyota Corolla..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Kilométrage (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formKm}
                  onChange={(e) => setFormKm(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Statut
                </label>
                <select
                  value={formStatut}
                  onChange={(e) => setFormStatut(e.target.value as 'ok' | 'entretien' | 'panne')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ok">OK (Opérationnel)</option>
                  <option value="entretien">Entretien à prévoir</option>
                  <option value="panne">Alerte panne</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Dernière révision (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={formRevision}
                  onChange={(e) => setFormRevision(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingVehicle ? 'Mettre à jour' : 'Créer le véhicule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
