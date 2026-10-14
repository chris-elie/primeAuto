import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Car,
  RefreshCw,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { getWeeklyRevenue, getRevenues, type WeeklyRevenue, type RevenueWithVehicle } from '../services/revenues';
import { getVehicles } from '../services/vehicles';
import { getMaintenances } from '../services/maintenances';
import { cn } from '../utils';
import ExportMenu from './ExportMenu';
import { exportToExcel, exportToPdf, formatExportCurrency, formatExportDate, formatExportStatus, type ExportColumn, type ExportRow, type ExportSheet } from '../utils/export';

export default function StatsPage() {
  const [weekly, setWeekly] = useState<WeeklyRevenue | null>(null);
  const [revenues, setRevenues] = useState<RevenueWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'recette' | 'depense'>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [weekData, revData] = await Promise.all([
        getWeeklyRevenue(),
        getRevenues(),
      ]);
      setWeekly(weekData);
      setRevenues(revData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de charger les statistiques financières');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRecettes = revenues
    .filter((r) => r.type === 'recette')
    .reduce((acc, r) => acc + Number(r.montant || 0), 0);

  const totalDepenses = revenues
    .filter((r) => r.type === 'depense')
    .reduce((acc, r) => acc + Number(r.montant || 0), 0);

  const resultatNet = totalRecettes - totalDepenses;

  const filteredRevenues = revenues.filter((r) => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const exportColumns: ExportColumn[] = [
    { header: 'Véhicule', dataKey: 'vehicule' },
    { header: 'Montant', dataKey: 'montant' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Date', dataKey: 'date' },
  ];
  const selectedRevenueTotal = filteredRevenues.reduce((sum, revenue) => sum + Number(revenue.montant), 0);
  const revenueRows: ExportRow[] = filteredRevenues.map((revenue) => ({
    vehicule: revenue.vehicule ?? '—',
    montant: formatExportCurrency(Number(revenue.montant)),
    type: formatExportStatus(revenue.type),
    description: revenue.description ?? '—',
    date: formatExportDate(revenue.date_transaction),
  }));
  const exportRevenueRows: ExportRow[] = revenueRows.length > 0
    ? [...revenueRows, {
        vehicule: '',
        montant: formatExportCurrency(selectedRevenueTotal),
        type: 'TOTAL',
        description: `${filteredRevenues.length} transaction(s)`,
        date: '',
      }]
    : [];

  const exportAllData = async () => {
    const [allVehicles, allMaintenances, allRevenues] = await Promise.all([
      getVehicles(),
      getMaintenances(),
      getRevenues(),
    ]);
    if (allVehicles.length + allMaintenances.length + allRevenues.length === 0) {
      throw new Error('Aucune donnée à exporter.');
    }
    const vehicleRows: ExportRow[] = allVehicles.map((vehicle) => ({
      Véhicule: vehicle.nom,
      Kilométrage: `${vehicle.kilometrage.toLocaleString('fr-CA')} km`,
      Statut: formatExportStatus(vehicle.statut),
      'Dernière révision': formatExportDate(vehicle.derniere_revision),
    }));
    const maintenanceRows: ExportRow[] = allMaintenances.map((maintenance) => ({
      Véhicule: allVehicles.find((vehicle) => vehicle.id === maintenance.vehicle_id)?.nom ?? `Véhicule #${maintenance.vehicle_id}`,
      Description: maintenance.description,
      'Date prévue': formatExportDate(maintenance.date_prevue),
      'Date effectuée': formatExportDate(maintenance.date_effectuee),
      Coût: formatExportCurrency(Number(maintenance.cout)),
      Statut: formatExportStatus(maintenance.date_effectuee ? 'fait' : maintenance.statut),
    }));
    const revenueTotal = allRevenues.reduce((sum, revenue) => sum + Number(revenue.montant), 0);
    const allRevenueRows: ExportRow[] = allRevenues.map((revenue) => ({
      Véhicule: revenue.vehicule ?? '—',
      Montant: formatExportCurrency(Number(revenue.montant)),
      Type: formatExportStatus(revenue.type),
      Description: revenue.description ?? '—',
      Date: formatExportDate(revenue.date_transaction),
    }));
    if (allRevenueRows.length > 0) {
      allRevenueRows.push({ Véhicule: '', Montant: formatExportCurrency(revenueTotal), Type: 'TOTAL', Description: `${allRevenues.length} transaction(s)`, Date: '' });
    }
    const sheets: ExportSheet[] = [
      { nom: 'Véhicules', lignes: vehicleRows, colonnes: ['Véhicule', 'Kilométrage', 'Statut', 'Dernière révision'] },
      { nom: 'Entretiens', lignes: maintenanceRows, colonnes: ['Véhicule', 'Description', 'Date prévue', 'Date effectuée', 'Coût', 'Statut'] },
      { nom: 'Revenus', lignes: allRevenueRows, colonnes: ['Véhicule', 'Montant', 'Type', 'Description', 'Date'] },
    ];
    await exportToExcel('primeauto_tout', sheets);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1120] text-slate-100 p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
              Statistiques & Revenus
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Analyse des recettes, des dépenses opérationnelles et de la rentabilité
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu
            onPdf={() => exportToPdf('Statistiques et revenus', exportColumns, exportRevenueRows, 'revenus')}
            onExcel={() => exportToExcel('revenus', [{ nom: 'Revenus', lignes: exportRevenueRows }])}
            onExportAllExcel={exportAllData}
            pdfDisabled={loading || exportRevenueRows.length === 0}
            excelDisabled={loading || exportRevenueRows.length === 0}
            exportAllDisabled={loading}
          />
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-indigo-400')} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Financial KPIs */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total des Recettes
            </span>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">
            +{totalRecettes.toLocaleString('fr-FR')} $
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total des Dépenses
            </span>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-red-400">
            -{totalDepenses.toLocaleString('fr-FR')} $
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#162032] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Résultat Net Global
            </span>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p
            className={cn(
              'mt-2 text-3xl font-extrabold',
              resultatNet >= 0 ? 'text-white' : 'text-red-400'
            )}
          >
            {resultatNet >= 0 ? '+' : ''}
            {resultatNet.toLocaleString('fr-FR')} $
          </p>
        </div>
      </section>

      {/* Weekly Revenue Evolution Chart */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-[#162032] p-6 shadow-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Évolution hebdomadaire des recettes
            </h3>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">
                {weekly ? `${weekly.total.toLocaleString('fr-FR')} $` : '0 $'}
              </span>
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
            <div className="flex gap-2">
              <span className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                Pic : <strong className="text-emerald-400">{weekly.haut} $</strong>
              </span>
              <span className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                Creux : <strong className="text-slate-400">{weekly.bas} $</strong>
              </span>
            </div>
          )}
        </div>

        <div className="h-64 w-full">
          {weekly && weekly.jours.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly.jours} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="jour" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} $`}
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
                          <p className="text-sm font-bold text-indigo-400">
                            {data.total.toLocaleString('fr-FR')} $
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Aucune donnée hebdomadaire
            </div>
          )}
        </div>
      </section>

      {/* Transactions List */}
      <div className="rounded-2xl border border-slate-800 bg-[#162032] shadow-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 p-5 gap-3">
          <h3 className="text-sm font-semibold text-white">Journal des transactions</h3>

          {/* Filter Type */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1 text-xs font-medium">
            {(['all', 'recette', 'depense'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={cn(
                  'rounded-lg px-3 py-1.5 transition capitalize',
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {type === 'all' ? 'Toutes' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Véhicule associé</th>
                <th className="px-6 py-4 text-right">Date transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRevenues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    {loading ? 'Chargement des transactions...' : 'Aucune transaction enregistrée.'}
                  </td>
                </tr>
              ) : (
                filteredRevenues.map((rev) => {
                  const isRecette = rev.type === 'recette';
                  return (
                    <tr key={rev.id} className="transition hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
                            isRecette
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-red-500/30 bg-red-500/10 text-red-400'
                          )}
                        >
                          {isRecette ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {rev.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        <span className={isRecette ? 'text-emerald-400' : 'text-red-400'}>
                          {isRecette ? '+' : '-'}
                          {Number(rev.montant).toLocaleString('fr-FR')} $
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {rev.description || 'Sans description'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {rev.vehicule ? (
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5 text-slate-500" />
                            <span>{rev.vehicule}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{rev.date_transaction}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
