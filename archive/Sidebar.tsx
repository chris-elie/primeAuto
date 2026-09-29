// Fichier : src/components/Sidebar.tsx

"use client"
import * as React from "react"
import {
  LayoutDashboard,
  Car,
  Wrench,
  DollarSign,
  Settings,
  HelpCircle,
  ChevronsRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  selected?: string
  onSelect?: (title: string) => void
}

const mainItems = [
  { title: "Tableau de bord", Icon: LayoutDashboard },
  { title: "Véhicules", Icon: Car },
  { title: "Entretien", Icon: Wrench },
  { title: "Finances", Icon: DollarSign },
]

const accountItems = [
  { title: "Paramètres", Icon: Settings },
  { title: "Aide", Icon: HelpCircle },
]

function Logo() {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-navy-900 to-navy-500 shadow-sm">
      <Car className="h-5 w-5 text-white" />
    </div>
  )
}

function TitleSection({ open }: { open: boolean }) {
  return (
    <div className="mb-6 border-b border-gray-100 pb-4">
      <div className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-50">
        <Logo />
        {open && (
          <div className="flex items-center gap-2">
            <div>
              <span className="block text-sm font-semibold text-navy-900">primeAuto</span>
              <span className="block text-xs text-gray-400">Gestion de flotte</span>
            </div>
          </div>
        )}
        {open && <ChevronDown className="ml-auto h-4 w-4 text-gray-300" />}
      </div>
    </div>
  )
}

function Option({
  Icon,
  title,
  selected,
  onSelect,
  open,
  notifs,
}: {
  Icon: React.ElementType
  title: string
  selected: string
  onSelect: (t: string) => void
  open: boolean
  notifs?: number
}) {
  const isSelected = selected === title
  return (
    <button
      onClick={() => onSelect(title)}
      className={cn(
        "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
        isSelected
          ? "border-l-2 border-navy-900 bg-navy-900/5 text-navy-900 shadow-sm"
          : "text-gray-500 hover:bg-gray-50 hover:text-navy-900"
      )}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>
      {open && <span className="text-sm font-medium">{title}</span>}
      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">
          {notifs}
        </span>
      )}
    </button>
  )
}

function ToggleClose({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-100 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={cn("h-4 w-4 text-gray-400 transition-transform duration-300", open && "rotate-180")}
          />
        </div>
        {open && <span className="text-sm font-medium text-gray-500">Réduire</span>}
      </div>
    </button>
  )
}

export default function Sidebar({ selected = "Tableau de bord", onSelect = () => {} }: SidebarProps) {
  const [open, setOpen] = React.useState(true)

  return (
    <nav
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r border-gray-100 bg-white p-2 shadow-sm transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-16"
      )}
    >
      <TitleSection open={open} />

      <div className="mb-8 space-y-1">
        {mainItems.map((item) => (
          <Option
            key={item.title}
            Icon={item.Icon}
            title={item.title}
            selected={selected}
            onSelect={onSelect}
            open={open}
            notifs={item.title === "Entretien" ? 2 : undefined}
          />
        ))}
      </div>

      {open && (
        <div className="space-y-1 border-t border-gray-100 pt-4">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">Compte</div>
          {accountItems.map((item) => (
            <Option
              key={item.title}
              Icon={item.Icon}
              title={item.title}
              selected={selected}
              onSelect={onSelect}
              open={open}
            />
          ))}
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  )
}
