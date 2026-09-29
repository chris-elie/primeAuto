// Fichier : src/components/DashboardPrimeAuto.tsx

"use client"
import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  Gauge,
  AlertTriangle,
  Wrench,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Plus,
  Bell,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Sidebar from "./Sidebar"

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
  { id: "v1", nom: "Suzuki Alto", kilometrage: 48210, statut: "ok", derniereRevision: "12 août 2026", benefiseNet: 1240 },
  { id: "v2", nom: "Toyota Corolla", kilometrage: 92450, statut: "entretien", derniereRevision: "02 juin 2026", benefiseNet: 860 },
  { id: "v3", nom: "Honda Civic", kilometrage: 130800, statut: "panne", derniereRevision: "18 avril 2026", benefiseNet: -320 },
  { id: "v4", nom: "Suzuki Alto", kilometrage: 15600, statut: "ok", derniereRevision: "29 août 2026", benefiseNet: 1580 },
]

const STATUS_COLORS: Record<VehicleStatus, string> = {
  ok: "#10B981",
  entretien: "#F97316",
  panne: "#EF4444",
}

const periodOptions = ["Semaine", "Mois", "Année"] as const
type Period = (typeof periodOptions)[number]

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function DashboardHeader({ alertesCount }: { alertesCount: number }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Tableau de bord</h1>
        <p className="mt-1 text-gray-500">Vue d'ensemble de votre flotte primeAuto</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </button>
        <button className="relative rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 transition hover:text-navy-900">
          <Bell className="h-5 w-5" />
          {alertesCount > 0 && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
          )}
        </button>
        <button className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 transition hover:text-navy-900">
          <User className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-composants métier
// ---------------------------------------------------------------------------

function StatusBadge({ statut }: { statut: VehicleStatus }) {
  const config: Record<VehicleStatus, { label: string; className: string }> = {
    ok: { label: "OK", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    entretien: { label: "Entretien à venir", className: "bg-orange-50 text-orange-600 border-orange-200" },
    panne: { label: "Alerte panne", className: "bg-red-50 text-red-600 border-red-200" },
  }
  const { label, className } = config[statut]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
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
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: string
  trend?: { value: string; positive: boolean }
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-white p-6 text-left shadow-sm transition hover:shadow-md",
        active ? "border-navy-900 ring-2 ring-navy-900/10" : "border-gray-200"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-lg bg-navy-900/5 p-2">
          <Icon className="h-5 w-5 text-navy-900" />
        </div>
        {trend && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trend.positive ? "text-emerald-500" : "text-red-500")}>
            {trend.positive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <h3 className="mb-1 font-medium text-gray-500">{label}</h3>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
    </button>
  )
}

function RevenueChartCard() {
  const [period, setPeriod] = React.useState<Period>("Semaine")
  const current = revenueData[revenueData.length - 1].recette
  const high = Math.max(...revenueData.map((d) => d.recette))
  const low = Math.min(...revenueData.map((d) => d.recette))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Recette</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-3xl font-bold text-navy-900">{current.toLocaleString("fr-CA")} $</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              +12.7%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  period === p ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-navy-900"
                )}
              >
                {p}
              </button>
            ))}
          </div>
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
            <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "#8A94A6" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#8A94A6" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k $`} />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString("fr-CA")} $`, "Recette"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #EEF1F5", fontSize: 13 }}
              cursor={{ stroke: "#F97316", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area type="monotone" dataKey="recette" stroke="#F97316" strokeWidth={2.5} fill="url(#recetteGradient)" activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatusDonutCard({
  filterStatus,
  onSelectStatus,
}: {
  filterStatus: VehicleStatus | null
  onSelectStatus: (s: VehicleStatus | null) => void
}) {
  const data = (["ok", "entretien", "panne"] as VehicleStatus[]).map((s) => ({
    name: s,
    value: vehicles.filter((v) => v.statut === s).length,
  }))
  const labels: Record<VehicleStatus, string> = { ok: "OK", entretien: "Entretien à venir", panne: "Alerte panne" }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-navy-900">Répartition des statuts</h3>
      <div className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              onClick={(entry) => onSelectStatus(filterStatus === entry.name ? null : (entry.name as VehicleStatus))}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name as VehicleStatus]}
                  opacity={filterStatus && filterStatus !== entry.name ? 0.3 : 1}
                  cursor="pointer"
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [value, labels[name as VehicleStatus]]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-navy-900">{vehicles.length}</span>
          <span className="text-xs text-gray-400">véhicules</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data.map((d) => (
          <button
            key={d.name}
            onClick={() => onSelectStatus(filterStatus === d.name ? null : (d.name as VehicleStatus))}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition",
              filterStatus === d.name ? "bg-gray-50" : "hover:bg-gray-50"
            )}
          >
            <span className="flex items-center gap-2 text-gray-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name as VehicleStatus] }} />
              {labels[d.name as VehicleStatus]}
            </span>
            <span className="font-semibold text-navy-900">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function VehicleTable({ filterStatus }: { filterStatus: VehicleStatus | null }) {
  const [search, setSearch] = React.useState("")
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)

  const filtered = vehicles.filter((v) => {
    const matchStatus = filterStatus ? v.statut === filterStatus : true
    const matchSearch = v.nom.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-navy-900">Véhicules de la flotte</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un véhicule..."
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400"
          />
          <span className="text-xs text-gray-400">{filtered.length} résultat(s)</span>
        </div>
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
              <th className="pb-3 pl-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                <td className="py-3 pr-4 font-medium text-navy-900">{v.nom}</td>
                <td className="py-3 pr-4 text-gray-600">{v.kilometrage.toLocaleString("fr-CA")} km</td>
                <td className="py-3 pr-4">
                  <StatusBadge statut={v.statut} />
                </td>
                <td className="py-3 pr-4 text-gray-600">{v.derniereRevision}</td>
                <td className={cn("py-3 pr-4 text-right font-semibold", v.benefiseNet >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {v.benefiseNet >= 0 ? "+" : ""}
                  {v.benefiseNet.toLocaleString("fr-CA")} $
                </td>
                <td className="relative py-3 pl-4 text-right">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                    className="rounded-md px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-navy-900"
                  >
                    •••
                  </button>
                  {openMenuId === v.id && (
                    <div className="absolute right-4 top-9 z-10 w-40 rounded-lg border border-gray-100 bg-white py-1 text-left shadow-lg">
                      <button className="block w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Voir la fiche</button>
                      <button className="block w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Modifier</button>
                      <button className="block w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50">Supprimer</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                  Aucun véhicule ne correspond à ta recherche.
                </td>
              </tr>
            )}
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
  const [selectedNav, setSelectedNav] = React.useState("Tableau de bord")
  const [filterStatus, setFilterStatus] = React.useState<VehicleStatus | null>(null)

  const alertesCount = vehicles.filter((v) => v.statut === "panne").length
  const entretienCount = vehicles.filter((v) => v.statut === "entretien").length
  const beneficeTotal = vehicles.reduce((acc, v) => acc + v.benefiseNet, 0)

  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <Sidebar selected={selectedNav} onSelect={setSelectedNav} />

      <div className="flex-1 overflow-auto p-6 md:p-10">
        <DashboardHeader alertesCount={alertesCount} />

        {/* KPIs cliquables pour filtrer */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Gauge} label="Véhicules actifs" value={vehicles.length.toString()} active={filterStatus === null} onClick={() => setFilterStatus(null)} />
          <KpiCard icon={Wrench} label="Entretiens à venir" value={entretienCount.toString()} active={filterStatus === "entretien"} onClick={() => setFilterStatus(filterStatus === "entretien" ? null : "entretien")} />
          <KpiCard icon={AlertTriangle} label="Alertes pannes" value={alertesCount.toString()} active={filterStatus === "panne"} onClick={() => setFilterStatus(filterStatus === "panne" ? null : "panne")} />
          <KpiCard icon={DollarSign} label="Bénéfice net total" value={`${beneficeTotal.toLocaleString("fr-CA")} $`} trend={{ value: "8%", positive: beneficeTotal >= 0 }} />
        </div>

        {/* Graphique + donut */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChartCard />
          </div>
          <div className="lg:col-span-1">
            <StatusDonutCard filterStatus={filterStatus} onSelectStatus={setFilterStatus} />
          </div>
        </div>

        <VehicleTable filterStatus={filterStatus} />
      </div>
    </div>
  )
}
