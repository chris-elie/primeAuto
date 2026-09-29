import { useEffect, useState, type ReactNode } from 'react';
import {
  Gauge,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Car,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  getSummary,
  getWeekly,
  getVehicles,
  type Summary,
  type Weekly,
  type Vehicle,
} from '../api';
import { cn } from '../utils';

interface DashboardProps {
  onNavigateToFleet?: () => void;
  onNavigateToMaintenance?: () => void;
}

export default function DashboardPrimeAuto({
  onNavigateToFleet,
  onNavigateToMaintenance,
}: DashboardProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [weekly, setWeekly] = useState<Weekly | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, weekData, vehData] = await Promise.all([
        getSummary(),
        getWeekly(),
        getVehicles(),
      ]);
      setSummary(sumData);
      setWeekly(weekData);
      setVehicles(vehData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de charger les données du tableau de bord');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVehicles = vehicles.filter((v) =>
    v.nom.toLowerCase().includes(search.toLowerCase())
  );

  const statusCount = {
    ok: vehicles.filter((v) => v.statut === 'ok').length,
    entretien: vehicles.filter((v) => v.statut === 'entretien').length,
    panne: vehicles.filter((v) => v.statut === 'panne').length,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1120] text-slate-100 p-6 lg:p-8">
      {/* Top Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Vue d'ensemble en temps réel de votre flotte et de vos performances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un véhicule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pr-3 pl-9 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none lg:w-64"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            title="Rafraîchir les données"
            className="flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-blue-400')} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* 3 KPI Cards */}
      <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <KpiCard
          label="Véhicules actifs"
          value={summary ? summary.vehiculesActifs.toString() : '—'}
          icon={<Gauge className="h-5 w-5 text-emerald-400" />}
          badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          onClick={onNavigateToFleet}
          subtitle="Statut opérationnel OK"
        />

        <KpiCard
          label="Entretiens à venir"
          value={summary ? summary.entretiensAVenir.toString() : '—'}
          icon={<Wrench className="h-5 w-5 text-amber-400" />}
          badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
          onClick={onNavigateToMaintenance}
          subtitle="Non effectués & dates >= aujourd'hui"
        />

        <KpiCard
          label="Panneaux d'alerte"
          value={summary ? summary.panneauxAlerte.toString() : '—'}
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
          badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
          onClick={onNavigateToFleet}
          subtitle="Véhicules déclarés en panne"
        />
      </section>

      {/* Revenue Graph Card */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-[#162032] p-6 shadow-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recette de la semaine
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <h2 className="text-3xl font-extrabold text-white">
                {weekly ? `${weekly.total.toLocaleString('fr-FR')} $` : '0 $'}
              </h2>

              {/* Affiche variationPct seulement s'il n'est pas null */}
              {weekly && weekly.variationPct !== null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    weekly.variationPct >= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  )}
                >
                  {weekly.variationPct >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {weekly.variationPct >= 0 ? `+${weekly.variationPct}%` : `${weekly.variationPct}%`}
                </span>
              )}
            </div>
          </div>

          {weekly && (
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300">
                Haut : <strong className="text-white">{weekly.haut.toLocaleString('fr-FR')} $</strong>
              </span>
              <span className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300">
                Bas : <strong className="text-white">{weekly.bas.toLocaleString('fr-FR')} $</strong>
              </span>
            </div>
          )}
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full">
          {weekly && weekly.jours.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly.jours} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="primeRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="jour"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} $`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { jour: string; date: string; total: number };
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
                          <p className="text-xs text-slate-400">
                            {data.jour} ({data.date})
                          </p>
                          <p className="text-sm font-bold text-blue-400">
                            {data.total.toLocaleString('fr-FR')} $
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#primeRevenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Aucune transaction enregistrée cette semaine
            </div>
          )}
        </div>
      </section>

      {/* Grid: Statuts de répartition + Véhicules de la flotte */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statuts de répartition */}
        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-6 shadow-xl">
          <h3 className="mb-5 text-sm font-semibold text-slate-200">Répartition des statuts</h3>
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-slate-700 border-t-emerald-500 border-r-amber-500 border-b-red-500">
              <div className="text-center">
                <span className="text-2xl font-extrabold text-white">{vehicles.length}</span>
                <span className="block text-[11px] font-medium text-slate-400 uppercase">Total</span>
              </div>
            </div>

            <div className="w-full space-y-2.5 pt-2 text-xs">
              <StatusRow
                color="bg-emerald-500"
                label="OK (Opérationnels)"
                value={statusCount.ok.toString()}
              />
              <StatusRow
                color="bg-amber-500"
                label="En entretien"
                value={statusCount.entretien.toString()}
              />
              <StatusRow
                color="bg-red-500"
                label="Alertes pannes"
                value={statusCount.panne.toString()}
              />
            </div>
          </div>
        </div>

        {/* Véhicules de la flotte */}
        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-6 shadow-xl lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Véhicules de la flotte ({filteredVehicles.length})
            </h3>
            {onNavigateToFleet && (
              <button
                type="button"
                onClick={onNavigateToFleet}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Voir tout →
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Véhicule</th>
                  <th className="pb-3">Kilométrage</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3">Dernière révision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-500">
                      Aucun véhicule trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.slice(0, 5).map((vehicle) => (
                    <tr key={vehicle.id} className="transition hover:bg-slate-800/40">
                      <td className="py-3.5 font-medium text-white flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-400 shrink-0" />
                        <span>{vehicle.nom}</span>
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {vehicle.kilometrage.toLocaleString('fr-FR')} km
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={vehicle.statut} />
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {vehicle.derniere_revision || 'Non renseignée'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  badgeColor,
  subtitle,
  onClick,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  badgeColor: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg transition-all duration-200 hover:border-slate-700 hover:bg-[#1a2538]',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <h3 className="mt-1 text-3xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
            {value}
          </h3>
        </div>
        <div className={cn('rounded-xl border p-2.5 transition-transform group-hover:scale-105', badgeColor)}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatusRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-300">
      <span className="flex items-center gap-2">
        <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
        {label}
      </span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: 'ok' | 'entretien' | 'panne' }) {
  const config = {
    ok: {
      label: 'OK',
      icon: CheckCircle2,
      style: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
    entretien: {
      label: 'Entretien',
      icon: Clock,
      style: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    panne: {
      label: 'Alerte Panne',
      icon: AlertTriangle,
      style: 'border-red-500/30 bg-red-500/10 text-red-400',
    },
  }[status] || {
    label: status,
    icon: CheckCircle2,
    style: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.style
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
