import { useEffect, useState, type FormEvent } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle,
  Calendar,
  DollarSign,
  Car,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getMaintenances,
  getVehicles,
  createMaintenance,
  completeMaintenance,
  type Maintenance,
  type Vehicle,
  type AuthUser,
} from '../api';
import { cn } from '../utils';

interface MaintenancePageProps {
  user: AuthUser | null;
}

export default function MaintenancePage({ user }: MaintenancePageProps) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'a_venir' | 'fait'>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [cout, setCout] = useState<number>(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isGestionnaire = user?.role === 'gestionnaire' || user?.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [maintData, vehData] = await Promise.all([
        getMaintenances(),
        getVehicles(),
      ]);
      setMaintenances(maintData);
      setVehicles(vehData);
      if (vehData.length > 0 && selectedVehicleId === 0) {
        setSelectedVehicleId(vehData[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de charger les entretiens');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    setDescription('');
    setDatePrevue(new Date().toISOString().slice(0, 10));
    setCout(0);
    setFormError(null);
    if (vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
    setIsModalOpen(true);
  };

  const handleCreateMaintenance = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setFormError('Veuillez sélectionner un véhicule.');
      return;
    }
    setFormError(null);
    setFormSubmitting(true);

    try {
      await createMaintenance({
        vehicle_id: selectedVehicleId,
        description,
        date_prevue: datePrevue,
        cout: Number(cout) || 0,
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Erreur lors de la création de l'entretien");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleComplete = async (maint: Maintenance) => {
    const costInput = window.prompt(
      `Confirmer la réalisation de l'entretien "${maint.description}" ? Coût final en $ :`,
      maint.cout.toString()
    );
    if (costInput === null) return;

    try {
      const finalCost = Number(costInput) || maint.cout;
      await completeMaintenance(maint.id, finalCost);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Erreur lors de la mise à jour');
      }
    }
  };

  const filteredMaintenances = maintenances.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'fait') return m.statut === 'fait' || m.date_effectuee !== null;
    return m.statut !== 'fait' && m.date_effectuee === null;
  });

  const pendingCount = maintenances.filter((m) => !m.date_effectuee).length;
  const completedCount = maintenances.filter((m) => !!m.date_effectuee).length;
  const totalCost = maintenances.reduce((acc, m) => acc + Number(m.cout || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1120] text-slate-100 p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
              Entretiens & Révisions
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Planification, suivi technique et contrôle des coûts d'intervention
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isGestionnaire && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              <span>Planifier un entretien</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-amber-400')} />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              En attente / Prévus
            </span>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{pendingCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Terminés
            </span>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{completedCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Coûts totaux déclarés
            </span>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {totalCost.toLocaleString('fr-FR')} $
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2">
        {(['all', 'a_venir', 'fait'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-semibold transition',
              filter === tab
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'border border-slate-800 bg-[#162032] text-slate-400 hover:text-white'
            )}
          >
            {tab === 'all' && 'Tous les entretiens'}
            {tab === 'a_venir' && 'À venir / En cours'}
            {tab === 'fait' && 'Terminés'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Maintenances Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#162032] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Description de l'intervention</th>
                <th className="px-6 py-4">Date prévue</th>
                <th className="px-6 py-4">Date effectuée</th>
                <th className="px-6 py-4">Coût ($)</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredMaintenances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    {loading ? 'Chargement des entretiens...' : 'Aucun entretien enregistré.'}
                  </td>
                </tr>
              ) : (
                filteredMaintenances.map((maint) => {
                  const isDone = maint.statut === 'fait' || !!maint.date_effectuee;
                  return (
                    <tr key={maint.id} className="transition hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <Car className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>{maint.vehicule || `Véhicule #${maint.vehicle_id}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{maint.description}</td>
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{maint.date_prevue}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {maint.date_effectuee ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>{maint.date_effectuee}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-white">
                        {Number(maint.cout).toLocaleString('fr-FR')} $
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            isDone
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          )}
                        >
                          {isDone ? 'Terminé' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isDone && isGestionnaire ? (
                          <button
                            type="button"
                            onClick={() => handleComplete(maint)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Marquer fait</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#162032] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Planifier un nouvel entretien</h3>
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

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Véhicule concerné *
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom} (#{v.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Description de l'intervention *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vidange moteur, freins, révision annuelle..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Date prévue *
                </label>
                <input
                  type="date"
                  required
                  value={datePrevue}
                  onChange={(e) => setDatePrevue(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Estimation du coût ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cout}
                  onChange={(e) => setCout(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-3.5 text-sm text-white focus:border-amber-500 focus:outline-none"
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
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Enregistrer l'entretien</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
