import { useEffect, useState } from 'react';
import { getToken, logout, getMe, type AuthUser } from './api';
import Login from './components/Login';
import Sidebar, { type TabKey } from './components/Sidebar';
import DashboardPrimeAuto from './components/DashboardPrimeAuto';
import FleetPage from './components/FleetPage';
import MaintenancePage from './components/MaintenancePage';
import StatsPage from './components/StatsPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Try restoring session
    getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b1120] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Chargement de PrimeAuto...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1120] font-sans text-slate-100">
      {/* Dynamic Sidebar with Tabs & User Info */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area based on currentTab */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {currentTab === 'dashboard' && (
          <DashboardPrimeAuto
            onNavigateToFleet={() => setCurrentTab('fleet')}
            onNavigateToMaintenance={() => setCurrentTab('maintenances')}
          />
        )}
        {currentTab === 'fleet' && <FleetPage user={user} />}
        {currentTab === 'maintenances' && <MaintenancePage user={user} />}
        {currentTab === 'stats' && <StatsPage />}
      </main>
    </div>
  );
}
