// Fichier : src/components/DashboardPrimeAuto.tsx

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  AlertTriangle,
  Wrench,
  DollarSign,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VehicleStatus = "ok" | "entretien" | "panne"

interface Vehicle {
  id: string
  nom: string
  kilometrage: number
  statut: VehicleStatus
  derniereRevision: string
  benefiseNet: number
}

interface RevenuePoint {
  jour: string
  recette: number
}

// ---------------------------------------------------------------------------
// Données de démonstration (à remplacer par ton API /server plus tard)
// ---------------------------------------------------------------------------

const revenueData: RevenuePoint[] = [
  { jour: "Lun", recette: 3200 },
  { jour: "Mar", recette: 2850 },
  { jour: "Mer", recette: 4100 },
  { jour: "Jeu", recette: 3950 },
  { jour: "Ven", recette: 3100 },
  { jour: "Sam", recette: 4600 },
  { jour: "Dim", recette: 4847 },
]

const vehicles: Vehicle[] = [
  {
    id: "v1",
    nom: "Suzuki Alto",
    kilometrage: 48210,
    statut: "ok",
    derniereRevision: "12 août 2026",
    benefiseNet: 1240,
  },
  {
    id: "v2",
    nom: "Toyota Corolla",
    kilometrage: 92450,
    statut: "entretien",
    derniereRevision: "02 juin 2026",
    benefiseNet: 860,
  },
  {
    id: "v3",
    nom: "Honda Civic",
    kilometrage: 130800,
    statut: "panne",
    derniereRevision: "18 avril 2026",
    benefiseNet: -320,
  },
  {
    id: "v4",
    nom: "Suzuki Alto",
    kilometrage: 15600,
    statut: "ok",
    derniereRevision: "29 août 2026",
    benefiseNet: 1580,
  },
]

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatusBadge({ statut }: { statut: VehicleStatus }) {
  const config: Record<VehicleStatus, { label: string; className: string }> = {
    ok: { label: "OK", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    entretien: {
      label: "Entretien à venir",
      className: "bg-orange-50 text-orange-600 border-orange-200",
    },
    panne: { label: "Alerte panne", className: "bg-red-50 text-red-600 border-red-200" },
  }
  const { label, className } = config[statut]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {statut === "panne" && <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string
  trend?: { value: string; positive: boolean }
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="rounded-lg bg-navy-900/5 p-2">
          <Icon className="h-4 w-4 text-navy-900" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-bold text-navy-900">{value}</span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trend.positive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend.positive ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}

function RevenueChartCard() {
  const current = revenueData[revenueData.length - 1].recette
  const high = Math.max(...revenueData.map((d) => d.recette))
  const low = Math.min(...revenueData.map((d) => d.recette))

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Recette de la semaine</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-3xl font-bold text-navy-900">
              {current.toLocaleString("fr-CA")} $
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              +12.7%
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="rounded-lg bg-navy-900/5 px-3 py-1.5 text-xs font-medium text-navy-900">
            Haut : {high.toLocaleString("fr-CA")} $
          </span>
          <span className="rounded-lg bg-navy-900/5 px-3 py-1.5 text-xs font-medium text-navy-900">
            Bas : {low.toLocaleString("fr-CA")} $
          </span>
        </div>
      </div>

      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="recetteGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F5" />
            <XAxis
              dataKey="jour"
              tick={{ fontSize: 12, fill: "#8A94A6" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#8A94A6" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}k $`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString("fr-CA")} $`, "Recette"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #EEF1F5",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="recette"
              stroke="#F97316"
              strokeWidth={2.5}
              fill="url(#recetteGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function VehicleTable() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-navy-900">Véhicules de la flotte</h3>
        <span className="text-xs text-gray-400">{vehicles.length} véhicules</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="pb-3 pr-4 font-medium">Véhicule</th>
              <th className="pb-3 pr-4 font-medium">Kilométrage</th>
              <th className="pb-3 pr-4 font-medium">Statut</th>
              <th className="pb-3 pr-4 font-medium">Dernière révision</th>
              <th className="pb-3 pr-4 font-medium text-right">Bénéfice net</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr
                key={v.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
              >
                <td className="py-3 pr-4 font-medium text-navy-900">{v.nom}</td>
                <td className="py-3 pr-4 text-gray-600">
                  {v.kilometrage.toLocaleString("fr-CA")} km
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge statut={v.statut} />
                </td>
                <td className="py-3 pr-4 text-gray-600">{v.derniereRevision}</td>
                <td
                  className={cn(
                    "py-3 pr-4 text-right font-semibold",
                    v.benefiseNet >= 0 ? "text-emerald-600" : "text-red-500"
                  )}
                >
                  {v.benefiseNet >= 0 ? "+" : ""}
                  {v.benefiseNet.toLocaleString("fr-CA")} $
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function DashboardPrimeAuto() {
  const alertesCount = vehicles.filter((v) => v.statut === "panne").length
  const entretienCount = vehicles.filter((v) => v.statut === "entretien").length
  const beneficeTotal = vehicles.reduce((acc, v) => acc + v.benefiseNet, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble de votre flotte primeAuto</p>
      </header>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Gauge}
          label="Véhicules actifs"
          value={vehicles.length.toString()}
        />
        <KpiCard
          icon={Wrench}
          label="Entretiens à venir"
          value={entretienCount.toString()}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertes pannes"
          value={alertesCount.toString()}
        />
        <KpiCard
          icon={DollarSign}
          label="Bénéfice net total"
          value={`${beneficeTotal.toLocaleString("fr-CA")} $`}
          trend={{ value: "8%", positive: beneficeTotal >= 0 }}
        />
      </div>

      {/* Graphique + tableau */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChartCard />
        </div>
        <div className="xl:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-navy-900">Répartition statuts</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> OK
                </span>
                <span className="font-semibold text-navy-900">
                  {vehicles.filter((v) => v.statut === "ok").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Entretien à venir
                </span>
                <span className="font-semibold text-navy-900">{entretienCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Alerte panne
                </span>
                <span className="font-semibold text-navy-900">{alertesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <VehicleTable />
      </div>
    </div>
  )
}
