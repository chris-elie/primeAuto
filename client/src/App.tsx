import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import Login from './components/Login';
import Sidebar, { type TabKey } from './components/Sidebar';
import DashboardPrimeAuto from './components/DashboardPrimeAuto';
import FleetPage from './components/FleetPage';
import MaintenancePage from './components/MaintenancePage';
import StatsPage from './components/StatsPage';

export default function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b1120] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chargement de PrimeAuto...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0b1120] p-6 text-center text-slate-100">
        <p>Impossible de charger votre profil. Vérifiez que votre profil existe dans Supabase.</p>
        <button className="rounded-lg bg-blue-600 px-4 py-2" onClick={() => void signOut()}>Se déconnecter</button>
      </div>
    );
  }

  const appUser = { nom: profile.nom, role: profile.role, email: user.email ?? undefined };
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1120] font-sans text-slate-100">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} user={appUser} onLogout={() => void signOut()} />
      <main className="flex flex-1 flex-col overflow-hidden">
        {currentTab === 'dashboard' && (
          <DashboardPrimeAuto
            onNavigateToFleet={() => setCurrentTab('fleet')}
            onNavigateToMaintenance={() => setCurrentTab('maintenances')}
          />
        )}
        {currentTab === 'fleet' && <FleetPage user={appUser} />}
        {currentTab === 'maintenances' && <MaintenancePage user={appUser} />}
        {currentTab === 'stats' && <StatsPage />}
      </main>
    </div>
  );
}
