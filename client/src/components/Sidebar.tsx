import {
  LayoutDashboard,
  Car,
  Wrench,
  BarChart3,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import type { AppUser } from '../types/database';
import { cn } from '../utils';

export type TabKey = 'dashboard' | 'fleet' | 'maintenances' | 'stats';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  user: AppUser | null;
  onLogout: () => void;
  alertCount?: number;
  maintenanceCount?: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  maintenanceCount = 0,
}: SidebarProps) {
  const navItems: { key: TabKey; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { key: 'fleet', label: 'Flotte de véhicules', icon: Car },
    { key: 'maintenances', label: 'Entretiens', icon: Wrench, badge: maintenanceCount },
    { key: 'stats', label: 'Statistiques & revenus', icon: BarChart3 },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-800 bg-[#162032] p-4 text-slate-100">
      <div>
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-600/30">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              prime<span className="text-blue-500">Auto</span>
            </span>
            <span className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase">
              Flotte & Logistique
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Navigation principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectTab(item.key)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                      active ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/50 p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate text-xs">
              <p className="font-semibold text-white truncate">{user?.nom || 'Utilisateur'}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span className="capitalize">{user?.role || 'gestionnaire'}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 py-2.5 text-xs font-medium text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
